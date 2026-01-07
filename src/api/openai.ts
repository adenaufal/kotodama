import { GenerateRequest, GenerateResponse, BrandVoice, UserProfile } from '../types';
import { ModelPriority } from '../constants/models';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Model Selection Strategy - Using GPT-5 and GPT-4o models
// Premium tier models (1M free tokens/day, 250K for tier 1-2)
const DEFAULT_MODEL = 'gpt-5-2025-08-07'; // Latest GPT-5 for best quality
const QUALITY_MODEL = 'gpt-4o-2024-11-20'; // GPT-4o as alternative

// Mini tier models (10M free tokens/day, 2.5M for tier 1-2)
const FAST_MODEL = 'gpt-5-mini-2025-08-07'; // GPT-5 Mini for speed
const NANO_MODEL = 'gpt-5-nano-2025-08-07'; // GPT-5 Nano for ultra fast
const FALLBACK_MODEL = 'gpt-4o-mini-2024-07-18'; // GPT-4o Mini as stable fallback

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const FIXED_TEMPERATURE_MODEL_PREFIXES = ['o1']; // Reasoning models require the default temperature
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

/**
 * Select optimal model based on user's priority strategy and request type.
 * This helps maximize free token usage from OpenAI's data sharing program.
 * 
 * Token quotas (requires data sharing opt-in):
 * - Premium tier (gpt-5, gpt-4o): 1M tokens/day (250K for tier 1-2)
 * - Mini tier (gpt-5-mini, gpt-5-nano, gpt-4o-mini): 10M tokens/day (2.5M for tier 1-2)
 */
function selectOptimalModel(
  request: GenerateRequest,
  modelPriority: ModelPriority = 'maximize-free',
  preferredModel?: string
): string {
  // If user explicitly set a model override, use it
  if (preferredModel) {
    return preferredModel;
  }

  // Fast mode uses mini models
  if (request.fastMode === true) {
    return FAST_MODEL;
  }

  if (request.fastMode === 'ultra') {
    return NANO_MODEL; // Ultra fast mode uses nano
  }

  // Apply model priority strategy
  switch (modelPriority) {
    case 'always-quality':
      return DEFAULT_MODEL; // GPT-5 (1M free tokens/day)

    case 'always-mini':
      return FAST_MODEL; // GPT-5 Mini (10M free tokens/day)

    case 'maximize-free':
    default:
      // Use mini tier by default to maximize free usage (10M vs 1M)
      return FAST_MODEL;
  }
}

function buildSystemPrompt(brandVoice: BrandVoice, targetProfile?: UserProfile): string {
  let prompt = `You are a tweet composition assistant. Your task is to write tweets that match the following brand voice:\n\n`;

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
  if (isThread) {
    return `Create a Twitter thread with ${request.threadLength || 5} tweets based on this topic:\n\n${request.prompt}\n\nReturn each tweet on a new line, numbered 1-${request.threadLength || 5}.`;
  }

  return request.prompt;
}

export async function generateWithOpenAI(
  request: GenerateRequest,
  apiKey: string,
  brandVoice: BrandVoice,
  targetProfile?: UserProfile,
  preferredModel?: string,
  modelPriority: ModelPriority = 'maximize-free'
): Promise<GenerateResponse> {
  const isThread = request.isThread || false;

  // Select model using smart selection
  const model = selectOptimalModel(request, modelPriority, preferredModel);

  console.log(`[Kotodama] Using model: ${model} (priority: ${modelPriority})`);

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

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const { message } = await extractOpenAIErrorMessage(response);

      if (includeTemperature && isTemperatureUnsupportedError(message)) {
        modelsRequiringDefaultTemperature.add(modelName);
        return requestWithModel(modelName, false);
      }

      throw new Error(message || 'OpenAI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const tokenUsage = data.usage.total_tokens;

    if (isThread) {
      // Parse thread into individual tweets
      const tweets = content
        .split(/\n(?=\d+[.\/]\s)/)
        .map((tweet: string) => tweet.replace(/^\d+[.\/]\s*/, '').trim())
        .filter((tweet: string) => tweet.length > 0);

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
    return await requestWithModel(model);
  } catch (error) {
    console.error('OpenAI generation failed:', error);

    const fallbackCandidates = [QUALITY_MODEL, FAST_MODEL, FALLBACK_MODEL];
    for (const candidate of fallbackCandidates) {
      if (candidate === model) {
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
