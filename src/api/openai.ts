import { GenerateRequest, GenerateResponse, BrandVoice, UserProfile } from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Default fallback models
const DEFAULT_MODEL = 'gpt-4o-2024-11-20';
const FALLBACK_MODEL = 'gpt-4o-mini-2024-07-18';
const FAST_MODEL = 'gpt-4o-mini-2024-07-18'; // Used for analysis

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const FIXED_TEMPERATURE_MODEL_PREFIXES = ['o1', 'gpt-5']; // Reasoning models and GPT-5 require the default temperature
const modelsRequiringDefaultTemperature = new Set<string>();

function canAdjustTemperature(modelName: string): boolean {
  if (modelsRequiringDefaultTemperature.has(modelName)) {
    return false;
  }

  return !FIXED_TEMPERATURE_MODEL_PREFIXES.some((prefix) => modelName.startsWith(prefix));
}

function isTemperatureUnsupportedError(message?: string): boolean {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();
  const mentionsTemperature = normalized.includes('temperature');
  const indicatesDefaultOnly =
    normalized.includes('default value') ||
    normalized.includes('default (1) value') ||
    normalized.includes('value must be 1') ||
    normalized.includes('set to 1') ||
    normalized.includes('only 1 value') ||
    normalized.includes('only one value') ||
    normalized.includes('fixed at 1');
  const indicatesUnsupported =
    normalized.includes('not support') ||
    normalized.includes('not allowed') ||
    normalized.includes('must be the default') ||
    normalized.includes('cannot be changed') ||
    normalized.includes('please remove') ||
    normalized.includes('remove the temperature') ||
    normalized.includes('unsupported parameter');

  return (
    (mentionsTemperature && indicatesDefaultOnly) ||
    (mentionsTemperature && indicatesUnsupported) ||
    normalized.includes('"temperature" does not support') ||
    normalized.includes('temperature is fixed') ||
    normalized.includes("temperature' is fixed") ||
    normalized.includes('temperature must be the default') ||
    normalized.includes('temperature parameter is not supported') ||
    normalized.includes('temperature parameter is not allowed') ||
    normalized.includes('temperature cannot be changed')
  );
}

async function extractOpenAIErrorMessage(response: Response): Promise<{ message?: string; raw: string }> {
  const raw = await response.text();
  try {
    const parsed = JSON.parse(raw);
    return {
      message: parsed?.error?.message ?? parsed?.message ?? raw,
      raw,
    };
  } catch {
    return { message: raw, raw };
  }
}

function buildSystemPrompt(brandVoice: BrandVoice, targetProfile?: UserProfile): string {
  let prompt = `You are a tweet composition assistant. Your task is to write tweets that match the following brand voice:\n\n`;
  // ... (rest of function unchanged, just ensuring signature matches if I cut it off)
  // Actually I am replacing the top part of the file, so I need to include buildSystemPrompt if I cut it off in TargetContent?
  // No, I'll target up to generateWithOpenAI and keep buildSystemPrompt intact if possible, or include it.
  // The TargetContent used below starts from line 1.

  if (brandVoice.description) {
    prompt += `Brand Voice Description: ${brandVoice.description}\n\n`;
  }

  if (brandVoice.guidelines) {
    prompt += `Guidelines: ${brandVoice.guidelines}\n\n`;
  }

  if (brandVoice.exampleTweets.length > 0) {
    prompt += `Example tweets from this brand voice:\n`;
    brandVoice.exampleTweets.forEach((tweet, i) => {
      prompt += `${i + 1}. ${tweet}\n`;
    });
    prompt += '\n';
  }

  // V2 Fields Support
  if (brandVoice.vocabulary) {
    if (brandVoice.vocabulary.approved && brandVoice.vocabulary.approved.length > 0) {
      prompt += `Vocabulary - Approved Terms (Use these):\n${brandVoice.vocabulary.approved.join(', ')}\n\n`;
    }
    if (brandVoice.vocabulary.avoid && brandVoice.vocabulary.avoid.length > 0) {
      prompt += `Vocabulary - Avoid these Terms:\n${brandVoice.vocabulary.avoid.join(', ')}\n\n`;
    }
  }

  if (brandVoice.dosList && brandVoice.dosList.length > 0) {
    prompt += `Do's:\n${brandVoice.dosList.map(item => `- ${item}`).join('\n')}\n\n`;
  }

  if (brandVoice.dontsList && brandVoice.dontsList.length > 0) {
    prompt += `Don'ts:\n${brandVoice.dontsList.map(item => `- ${item}`).join('\n')}\n\n`;
  }

  // Check for Twitter specific guidelines
  if (brandVoice.platformGuidelines && brandVoice.platformGuidelines.twitter) {
    const twitterRules = brandVoice.platformGuidelines.twitter;
    prompt += `Platform Rules (Twitter):\n`;
    prompt += `- Style: ${twitterRules.style}\n`;
    prompt += `- Format: ${twitterRules.format}\n`;
    prompt += `- Emoji Usage: ${twitterRules.emojiUsage}\n`;
    prompt += `- Length target: ${twitterRules.length}\n\n`;
  }

  prompt += `Tone Attributes (adjust your writing style to match these values):\n`;
  prompt += `- Formality: ${brandVoice.toneAttributes.formality}/100 (0=very casual, 100=very professional)\n`;
  prompt += `- Humor: ${brandVoice.toneAttributes.humor}/100 (0=serious, 100=humorous)\n`;
  prompt += `- Technicality: ${brandVoice.toneAttributes.technicality}/100 (0=simple language, 100=technical jargon)\n`;
  prompt += `- Empathy: ${brandVoice.toneAttributes.empathy}/100 (0=direct, 100=empathetic)\n`;
  prompt += `- Energy: ${brandVoice.toneAttributes.energy}/100 (0=calm, 100=energetic)\n`;
  prompt += `- Authenticity: ${brandVoice.toneAttributes.authenticity}/100 (0=reserved, 100=vulnerable/personal)\n\n`;

  if (targetProfile) {
    prompt += `Additionally, adapt your response to match the communication style of the person you're replying to:\n`;
    prompt += `Username: @${targetProfile.username}\n`;
    prompt += `Their typical tweet length: ${targetProfile.styleAttributes.avgLength} characters\n`;
    if (targetProfile.styleAttributes.commonPhrases.length > 0) {
      prompt += `Common phrases they use: ${targetProfile.styleAttributes.commonPhrases.join(', ')}\n`;
    }
    prompt += '\n';
  }

  prompt += `Important rules:\n`;
  prompt += `- Keep tweets under 280 characters\n`;
  prompt += `- Be authentic and natural\n`;
  prompt += `- Match the brand voice while being engaging\n`;
  prompt += `- Do not use hashtags unless specifically requested\n`;
  prompt += `- Write in a conversational tone\n`;

  if (targetProfile) {
    prompt += `- Acknowledge and respond to the specific points in the tweet you're replying to\n`;
  }

  return prompt;
}

function buildUserPrompt(request: GenerateRequest, isThread: boolean): string {
  let prompt = '';

  // 1. Add Context if present
  if (request.replyContext) {
    const ctx = request.replyContext;
    prompt += `[CONTEXT - THE TWEET WE ARE REPLYING TO]\n`;
    prompt += `Author: @${ctx.username}${ctx.displayName ? ` (${ctx.displayName})` : ''}\n`;
    if (ctx.timestamp) prompt += `Time: ${ctx.timestamp}\n`;
    prompt += `Content: "${ctx.text}"\n`;

    if (ctx.images && ctx.images.length > 0) {
      prompt += `Visual Context (Image Alt Text): ${ctx.images.join('; ')}\n`;
    }

    if (ctx.metrics) {
      const m = ctx.metrics;
      const parts = [];
      if (m.replies) parts.push(`${m.replies} replies`);
      if (m.retweets) parts.push(`${m.retweets} retweets`);
      if (m.likes) parts.push(`${m.likes} likes`);
      if (parts.length > 0) prompt += `Metrics: ${parts.join(', ')}\n`;
    }
    prompt += `\n[YOUR TASK]\n`;
    prompt += `Write a reply to the above tweet based on this instruction:\n"${request.prompt}"\n`;
  } else {
    // Standard compose mode
    prompt = request.prompt;

    if (isThread) {
      return `Create a Twitter thread with ${request.threadLength || 5} tweets based on this topic:\n\n${prompt}\n\nReturn each tweet on a new line, numbered 1-${request.threadLength || 5}.`;
    }

    return prompt;
  }

  if (isThread) {
    prompt += `\n\nFormat as a thread of ${request.threadLength || 5} tweets. Return each tweet on a new line, numbered 1-${request.threadLength || 5}.`;
  }

  return prompt;
}

export async function generateWithOpenAI(
  request: GenerateRequest,
  apiKey: string,
  brandVoice: BrandVoice,
  targetProfile?: UserProfile,
  preferredModel?: string,
): Promise<GenerateResponse> {
  const isThread = request.isThread || false;

  // Validate API key
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error('OpenAI API key is missing or invalid');
  }

  if (!apiKey.startsWith('sk-')) {
    console.warn('[Kotodama] API key does not start with "sk-" - this may indicate an invalid key');
  }

  // Use the requested model, or fallback to default
  // Allow the request to pass 'modelId' if it was added to the type, otherwise use preferredModel or default
  const requestedModel = (request as any).modelId || preferredModel || DEFAULT_MODEL;

  console.log(`[Kotodama] Using model: ${requestedModel}`);
  console.log(`[Kotodama] Request details:`, {
    isThread,
    threadLength: request.threadLength,
    fastMode: request.fastMode,
    promptLength: request.prompt?.length || 0,
    brandVoice: brandVoice.name
  });

  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: buildSystemPrompt(brandVoice, targetProfile),
    },
    {
      role: 'user',
      content: buildUserPrompt(request, isThread),
    },
  ];

  async function requestWithModel(modelName: string, allowCustomTemperature = true): Promise<GenerateResponse> {
    const includeTemperature = allowCustomTemperature && canAdjustTemperature(modelName);
    const requestBody: Record<string, unknown> = {
      model: modelName,
      messages,
      max_completion_tokens: isThread ? 1500 : 300,
    };

    if (includeTemperature) {
      requestBody.temperature = 0.7;
    }

    console.log(`[Kotodama] Sending request to OpenAI API...`, {
      model: modelName,
      temperature: includeTemperature ? 0.7 : 'default',
      maxTokens: requestBody.max_completion_tokens
    });

    let response: Response;
    try {
      response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });
    } catch (fetchError: any) {
      console.error('[Kotodama] Network error calling OpenAI API:', fetchError);
      throw new Error(`Network error: ${fetchError.message || 'Failed to connect to OpenAI API'}`);
    }

    console.log(`[Kotodama] OpenAI API response status: ${response.status}`);

    if (!response.ok) {
      const { message } = await extractOpenAIErrorMessage(response);
      console.error('[Kotodama] OpenAI API error:', {
        status: response.status,
        message,
        model: modelName
      });

      if (includeTemperature && isTemperatureUnsupportedError(message)) {
        modelsRequiringDefaultTemperature.add(modelName);
        console.log('[Kotodama] Retrying without temperature parameter...');
        return requestWithModel(modelName, false);
      }

      throw new Error(message || `OpenAI API request failed with status ${response.status}`);
    }

    let data: any;
    try {
      data = await response.json();
    } catch (parseError: any) {
      console.error('[Kotodama] Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Invalid response from OpenAI API');
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[Kotodama] Unexpected OpenAI response structure:', data);
      throw new Error('Unexpected response format from OpenAI API');
    }

    const rawContent = data.choices[0].message.content;
    const tokenUsage = data.usage?.total_tokens || 0;

    // Log raw response for debugging
    console.log('[Kotodama] Raw API response message:', {
      rawContent: rawContent,
      rawContentType: typeof rawContent,
      finishReason: data.choices[0].finish_reason,
      refusal: data.choices[0].message.refusal,
      fullMessage: JSON.stringify(data.choices[0].message)
    });

    // Handle null, undefined, or empty content
    if (rawContent === null || rawContent === undefined) {
      console.error('[Kotodama] API returned null/undefined content. Full response:', JSON.stringify(data, null, 2));

      // Check if there's a refusal
      if (data.choices[0].message.refusal) {
        throw new Error(`Content generation refused: ${data.choices[0].message.refusal}`);
      }

      throw new Error('OpenAI API returned empty content. This may be due to content filtering or model limitations.');
    }

    const content = String(rawContent).trim();

    if (content.length === 0) {
      console.error('[Kotodama] API returned empty string after trim. Full response:', JSON.stringify(data, null, 2));
      throw new Error('OpenAI API returned empty content. Please try again with a different prompt.');
    }

    console.log('[Kotodama] Successfully generated content:', {
      contentLength: content.length,
      tokenUsage,
      isThread,
      preview: content.substring(0, 100)
    });

    if (isThread) {
      // Parse thread into individual tweets
      const tweets = content
        .split(/\n(?=\d+[.\/]\s)/)
        .map((tweet: string) => tweet.replace(/^\d+[.\/]\s*/, '').trim())
        .filter((tweet: string) => tweet.length > 0);

      console.log('[Kotodama] Parsed thread into', tweets.length, 'tweets');

      return {
        content: tweets,
        tokenUsage,
        provider: 'openai',
      };
    }

    return {
      content,
      tokenUsage,
      provider: 'openai',
    };
  }

  try {
    return await requestWithModel(requestedModel);
  } catch (error) {
    console.error('OpenAI generation failed:', error);

    const fallbackCandidates = [DEFAULT_MODEL, FALLBACK_MODEL];
    for (const candidate of fallbackCandidates) {
      if (candidate === requestedModel) {
        continue;
      }

      try {
        console.log('Attempting fallback to', candidate);
        return await requestWithModel(candidate);
      } catch (fallbackError) {
        console.error(`Fallback to ${candidate} failed:`, fallbackError);
      }
    }

    throw error;
  }
}

export async function analyzeTwitterProfile(
  tweets: string[],
  apiKey: string
): Promise<{ avgLength: number; commonPhrases: string[]; tone: any }> {
  try {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are analyzing Twitter profiles. Analyze the writing style, tone, and patterns from the provided tweets. Return a JSON object with avgLength (number), commonPhrases (array of strings), and tone (object with formality, humor, technicality scores 0-100).',
      },
      {
        role: 'user',
        content: `Analyze these tweets:\n\n${tweets.map((t, i) => `${i + 1}. ${t}`).join('\n')}`,
      },
    ];

    async function requestAnalysis(allowCustomTemperature = true): Promise<Response> {
      const includeTemperature = allowCustomTemperature && canAdjustTemperature(FAST_MODEL);
      const body: Record<string, unknown> = {
        model: FAST_MODEL, // Use mini model for analysis
        messages,
        max_completion_tokens: 500,
        response_format: { type: 'json_object' },
      };

      if (includeTemperature) {
        body.temperature = 0.3;
      }

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const { message } = await extractOpenAIErrorMessage(response);

        if (includeTemperature && isTemperatureUnsupportedError(message)) {
          modelsRequiringDefaultTemperature.add(FAST_MODEL);
          return requestAnalysis(false);
        }

        throw new Error(message || 'Profile analysis failed');
      }

      return response;
    }

    const response = await requestAnalysis();

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Profile analysis failed:', error);
    return {
      avgLength: 150,
      commonPhrases: [],
      tone: { formality: 50, humor: 50, technicality: 50 },
    };
  }
}
