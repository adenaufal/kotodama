import { Message, MessageResponse, GenerateRequest, BrandVoice, UserProfile } from '../types';
import { db } from '../storage/db';
import { getSettings, saveSettings } from '../storage/settings';
import { generateWithOpenAI, analyzeTwitterProfile } from '../api/openai';

// Listen for messages from content script and panel
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message)
    .then((response) => sendResponse(response))
    .catch((error) => {
      console.error('Message handling error:', error);
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

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

async function handleGenerate(request: GenerateRequest): Promise<MessageResponse> {
  try {
    const settings = await getSettings();

    if (!settings.apiKeys.openai) {
      throw new Error('OpenAI API key not configured');
    }

    // Get brand voice
    const brandVoice = await db.brandVoices.get(request.brandVoiceId);
    if (!brandVoice) {
      throw new Error('Brand voice not found');
    }

    // Get target profile if specified
    let targetProfile: UserProfile | undefined;
    if (request.targetProfileId) {
      targetProfile = await db.userProfiles.get(request.targetProfileId);
    }

    // Generate content
    const result = await generateWithOpenAI(
      request,
      settings.apiKeys.openai,
      brandVoice,
      targetProfile
    );

    // Save generated tweet to history
    const generatedTweet = {
      id: crypto.randomUUID(),
      prompt: request.prompt,
      generatedContent: Array.isArray(result.content) ? result.content.join('\n\n') : result.content,
      brandVoiceId: request.brandVoiceId,
      targetProfileId: request.targetProfileId,
      isThread: request.isThread || false,
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
    return {
      success: false,
      error: error.message,
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

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Open onboarding page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('onboarding.html'),
    });
  }
});

console.log('Kotodama service worker loaded');
