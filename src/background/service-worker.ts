import {
  Message,
  MessageResponse,
  GenerateRequest,
  AnalyzeContextRequest,
  AIProvider,
  BrandVoice,
  UserProfile,
} from '../types';
import { db } from '../storage/db';
import { getSettings, saveSettings } from '../storage/settings';
import { generateWithOpenAI, analyzeTwitterProfile } from '../api/openai';
import { generateWithGemini } from '../api/gemini';
import { generateWithClaude } from '../api/claude';
import { analyzeContext } from '../api/vision';
import { getModelById } from '../constants/models';
import { tryRequest } from '../utils/rateLimiter';
import { logger } from '../utils/logger';

const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'OpenAI',
  gemini: 'Gemini',
  claude: 'Claude',
};

const GENERATORS = {
  openai: generateWithOpenAI,
  gemini: generateWithGemini,
  claude: generateWithClaude,
};

/**
 * Resolves the provider + its API key, or throws a message the user can act on.
 */
async function resolveProvider(
  settings: Awaited<ReturnType<typeof getSettings>>,
  requested?: AIProvider
): Promise<{ provider: AIProvider; apiKey: string }> {
  const provider = requested ?? settings.defaultProvider ?? 'openai';
  const apiKey = settings.apiKeys[provider];

  if (!apiKey) {
    throw new Error(
      `${PROVIDER_LABELS[provider]} API key not configured. Please add your API key in the extension settings.`
    );
  }

  return { provider, apiKey };
}

const ONBOARDING_URL = chrome.runtime.getURL('src/onboarding/index.html');
const SETTINGS_URL = chrome.runtime.getURL('src/settings/index.html');

// Handle extension icon click - open onboarding or settings in new tab
chrome.action.onClicked.addListener(async () => {
  try {
    const settings = await getSettings();
    const hasOpenAiKey = typeof settings.apiKeys.openai === 'string' && settings.apiKeys.openai.trim().length > 0;

    const url = hasOpenAiKey ? SETTINGS_URL : ONBOARDING_URL;

    // Check if tab already exists
    const tabs = await chrome.tabs.query({ url });
    if (tabs.length > 0 && tabs[0].id) {
      // Focus existing tab
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId!, { focused: true });
    } else {
      // Create new tab
      await chrome.tabs.create({ url });
    }
  } catch (error) {
    logger.error('Failed to open extension page', error);
    await chrome.tabs.create({ url: ONBOARDING_URL });
  }
});

// Listen for messages from content script and panel
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message)
    .then((response) => sendResponse(response))
    .catch((error) => {
      logger.error('Message handling error:', error);
      sendResponse({
        success: false,
        error: error.message || 'Unknown error occurred',
      });
    });

  // Return true to indicate we'll send a response asynchronously
  return true;
});

async function handleMessage(message: Message): Promise<MessageResponse> {
  switch (message.type) {
    case 'generate':
      return handleGenerate(message.payload);

    case 'analyze-context':
      return handleAnalyzeContext(message.payload);

    case 'analyze-profile':
      return handleAnalyzeProfile(message.payload);

    case 'get-settings':
      return handleGetSettings();

    case 'save-settings':
      return handleSaveSettings(message.payload);

    case 'get-brand-voice':
      return handleGetBrandVoice(message.payload);

    case 'save-brand-voice':
      return handleSaveBrandVoice(message.payload);
    case 'list-brand-voices':
      return handleListBrandVoices();

    case 'delete-brand-voice':
      return handleDeleteBrandVoice(message.payload);

    case 'open-settings':
      return handleOpenSettings();

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

async function handleGenerate(request: GenerateRequest): Promise<MessageResponse> {
  let providerLabel = 'The AI provider';

  try {
    logger.info('Generation request received:', {
      brandVoiceId: request.brandVoiceId,
      hasPrompt: !!request.prompt,
      hasContextSummary: !!request.contextSummary
    });

    // Check rate limits first
    const rateLimitCheck = await tryRequest('generate');
    if (!rateLimitCheck.allowed) {
      logger.warn('Rate limit exceeded');
      return {
        success: false,
        error: rateLimitCheck.error || 'Rate limit exceeded. Please try again later.',
      };
    }

    const settings = await getSettings();
    const { provider, apiKey } = await resolveProvider(settings, request.provider);
    providerLabel = PROVIDER_LABELS[provider];

    logger.info('Settings retrieved:', {
      provider,
      defaultModel: settings.defaultModel,
      modelPriority: settings.modelPriority
    });

    // Get brand voice
    const brandVoice = await db.brandVoices.get(request.brandVoiceId);
    if (!brandVoice) {
      logger.error('Brand voice not found:', request.brandVoiceId);
      // Check if any brand voices exist
      const allVoices = await db.brandVoices.toArray();
      logger.info('Available brand voices:', allVoices.length);

      if (allVoices.length === 0) {
        throw new Error('No brand voices found. Please create a brand voice in settings first.');
      }

      throw new Error('Selected brand voice not found. Please select a different voice or create a new one.');
    }

    logger.info('Brand voice loaded:', {
      id: brandVoice.id,
      name: brandVoice.name,
      hasExamples: brandVoice.exampleTweets.length > 0
    });

    // Get target profile if specified
    let targetProfile: UserProfile | undefined;
    if (request.targetProfileId) {
      targetProfile = await db.userProfiles.get(request.targetProfileId);
      logger.info('Target profile loaded:', targetProfile?.username);
    }

    // Only pass the saved model when it actually belongs to the chosen provider,
    // otherwise let each provider fall back to its own default.
    const model =
      settings.defaultModel && getModelById(settings.defaultModel)?.provider === provider
        ? settings.defaultModel
        : undefined;

    logger.info(`Starting ${provider} generation...`, { model });
    const result = await GENERATORS[provider](
      request,
      apiKey,
      brandVoice,
      targetProfile,
      model
    );

    logger.info('Generation successful:', {
      provider: result.provider,
      tokenUsage: result.tokenUsage,
      contentLength: result.content.length
    });

    // Save generated tweet to history
    const generatedTweet = {
      id: crypto.randomUUID(),
      prompt: request.prompt,
      generatedContent: result.content,
      brandVoiceId: request.brandVoiceId,
      targetProfileId: request.targetProfileId,
      replyContext: request.replyContext,
      posted: false,
      timestamp: new Date(),
      apiUsed: result.provider,
      tokenUsage: result.tokenUsage,
    };

    if (settings.features.rememberHistory) {
      await db.generatedTweets.add(generatedTweet);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    logger.error('Generation failed:', error);

    // Provide more helpful error messages
    let userMessage = error.message || 'Failed to generate tweet';

    if (error.message?.includes('API key')) {
      userMessage = `${providerLabel} API key is not configured or invalid. Please check your settings.`;
    } else if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      userMessage = `${providerLabel} API rate limit exceeded. Please try again in a few moments.`;
    } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      userMessage = `Invalid ${providerLabel} API key. Please check your API key in settings.`;
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      userMessage = 'Network error. Please check your internet connection and try again.';
    }

    return {
      success: false,
      error: userMessage,
    };
  }
}

/**
 * Reads the tweet (and its images) with a cheap vision model before generation.
 */
async function handleAnalyzeContext(request: AnalyzeContextRequest): Promise<MessageResponse> {
  try {
    // Fires on every panel open, before any generate - gate it on its own bucket.
    const rateLimitCheck = await tryRequest('analyzeContext');
    if (!rateLimitCheck.allowed) {
      logger.warn('Context read rate limit exceeded');
      return {
        success: false,
        error: rateLimitCheck.error || 'Too many tweet reads. Please try again in a moment.',
      };
    }

    const settings = await getSettings();
    const { provider, apiKey } = await resolveProvider(settings, request.provider);

    logger.info('Context analysis requested:', {
      provider,
      images: request.context.images?.length || 0,
      threadEntries: request.context.thread?.length || 0,
    });

    const result = await analyzeContext(request, apiKey, provider);

    logger.info('Context analysis complete:', { visionFailed: !!result.visionFailed });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    logger.error('Context analysis failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to read the tweet',
    };
  }
}

async function handleAnalyzeProfile(payload: {
  username: string;
  tweets: string[];
}): Promise<MessageResponse> {
  try {
    const settings = await getSettings();

    if (!settings.apiKeys.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const analysis = await analyzeTwitterProfile(payload.tweets, settings.apiKeys.openai);

    // Save or update profile
    const profileId = `profile_${payload.username}`;
    const existingProfile = await db.userProfiles.get(profileId);

    const profile: UserProfile = {
      id: profileId,
      username: payload.username,
      analyzedTweets: payload.tweets.map((content, index) => ({
        tweetId: `tweet_${index}`,
        content,
        timestamp: new Date(),
      })),
      styleAttributes: {
        avgLength: analysis.avgLength,
        commonPhrases: analysis.commonPhrases,
        toneProfile: analysis.tone,
      },
      lastAnalyzed: new Date(),
    };

    if (existingProfile) {
      await db.userProfiles.put(profile);
    } else {
      await db.userProfiles.add(profile);
    }

    return {
      success: true,
      data: profile,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function handleGetSettings(): Promise<MessageResponse> {
  try {
    const settings = await getSettings();
    return {
      success: true,
      data: settings,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function handleSaveSettings(settings: any): Promise<MessageResponse> {
  try {
    await saveSettings(settings);
    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function handleGetBrandVoice(payload: { id: string }): Promise<MessageResponse> {
  try {
    const brandVoice = await db.brandVoices.get(payload.id);
    return {
      success: true,
      data: brandVoice,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function handleSaveBrandVoice(brandVoice: BrandVoice): Promise<MessageResponse> {
  try {
    const existing = await db.brandVoices.get(brandVoice.id);

    if (existing) {
      await db.brandVoices.update(brandVoice.id, {
        ...brandVoice,
        updatedAt: new Date(),
      });
    } else {
      await db.brandVoices.add(brandVoice);
    }

    return {
      success: true,
      data: brandVoice,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function handleListBrandVoices(): Promise<MessageResponse> {
  try {
    const voices = await db.brandVoices.toArray();
    return {
      success: true,
      data: voices,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function handleDeleteBrandVoice(payload: { id: string }): Promise<MessageResponse> {
  try {
    await db.brandVoices.delete(payload.id);
    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function handleOpenSettings(): Promise<MessageResponse> {
  try {
    // Check if settings tab already exists
    const tabs = await chrome.tabs.query({ url: SETTINGS_URL });
    if (tabs.length > 0 && tabs[0].id) {
      // Focus existing tab
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId!, { focused: true });
    } else {
      // Create new tab
      await chrome.tabs.create({ url: SETTINGS_URL });
    }
    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open onboarding page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/onboarding/index.html'),
    });
  }
});

logger.info('Service worker loaded');
