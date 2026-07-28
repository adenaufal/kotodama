import { GenerateRequest, GenerateResponse, BrandVoice, UserProfile } from '../types';
import { buildSystemPrompt, buildUserPrompt } from './openai';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_VERSION = '2023-06-01';

// Current model ids. These are COMPLETE as-is - never append a date suffix.
const DEFAULT_MODEL = 'claude-sonnet-5'; // balanced
const FAST_MODEL = 'claude-haiku-4-5'; // fast/cheap, also the fallback

// Anthropic gates browser-origin calls behind this header. Required from an
// extension service worker or every request fails.
function claudeHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': CLAUDE_VERSION,
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

// temperature / top_p / top_k are REMOVED on the 5-series and on opus-4-7/4-8:
// sending any of them returns HTTP 400. Everything older still accepts them.
const FIXED_TEMPERATURE_MODEL_PREFIXES = [
  'claude-opus-5',
  'claude-sonnet-5',
  'claude-fable-5',
  'claude-mythos-5',
  'claude-opus-4-7',
  'claude-opus-4-8',
];
const modelsRequiringDefaultTemperature = new Set<string>();

function canAdjustTemperature(modelName: string): boolean {
  if (modelsRequiringDefaultTemperature.has(modelName)) {
    return false;
  }

  return !FIXED_TEMPERATURE_MODEL_PREFIXES.some((prefix) => modelName.startsWith(prefix));
}

function isSamplingUnsupportedError(message?: string): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes('temperature') ||
    normalized.includes('top_p') ||
    normalized.includes('top_k')
  );
}

async function extractClaudeErrorMessage(response: Response): Promise<string | undefined> {
  const raw = await response.text();
  try {
    const parsed = JSON.parse(raw);
    return parsed?.error?.message ?? raw;
  } catch {
    return raw;
  }
}

export async function generateWithClaude(
  request: GenerateRequest,
  apiKey: string,
  brandVoice: BrandVoice,
  targetProfile?: UserProfile,
  preferredModel?: string
): Promise<GenerateResponse> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Claude API key is missing or invalid');
  }

  const systemPrompt = buildSystemPrompt(brandVoice, targetProfile, request.toneAdjustment);
  const userPrompt = buildUserPrompt(request);
  const requestedModel = preferredModel || DEFAULT_MODEL;

  async function requestWithModel(
    modelName: string,
    allowCustomTemperature = true
  ): Promise<GenerateResponse> {
    const includeTemperature = allowCustomTemperature && canAdjustTemperature(modelName);
    const body: Record<string, unknown> = {
      model: modelName,
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    };

    if (includeTemperature) {
      body.temperature = 0.7;
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: claudeHeaders(apiKey),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await extractClaudeErrorMessage(response);

      if (includeTemperature && isSamplingUnsupportedError(message)) {
        modelsRequiringDefaultTemperature.add(modelName);
        console.log('[Kotodama] Retrying Claude request without temperature...');
        return requestWithModel(modelName, false);
      }

      throw new Error(message || `Claude API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = String(data?.content?.[0]?.text ?? '').trim();

    if (!content) {
      throw new Error('Claude API returned empty content. Please try again.');
    }

    return {
      content,
      tokenUsage: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      provider: 'claude',
    };
  }

  try {
    return await requestWithModel(requestedModel);
  } catch (error) {
    console.error('Claude generation failed:', error);

    if (requestedModel !== FAST_MODEL) {
      try {
        console.log('Attempting fallback to', FAST_MODEL);
        return await requestWithModel(FAST_MODEL);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }

    throw error;
  }
}

export async function analyzeTwitterProfileWithClaude(
  tweets: string[],
  apiKey: string
): Promise<{ avgLength: number; commonPhrases: string[]; tone: any }> {
  const systemPrompt =
    'You are analyzing Twitter profiles. Analyze the writing style, tone, and patterns from the provided tweets. Return ONLY a valid JSON object with avgLength (number), commonPhrases (array of strings), and tone (object with formality, humor, technicality scores 0-100).';
  const userPrompt = `Analyze these tweets:\n\n${tweets.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

  try {
    const body: Record<string, unknown> = {
      model: FAST_MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    };

    if (canAdjustTemperature(FAST_MODEL)) {
      body.temperature = 0.3;
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: claudeHeaders(apiKey),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Profile analysis failed');
    }

    const data = await response.json();
    const jsonText = String(data?.content?.[0]?.text ?? '').trim();
    // Remove markdown code blocks if present
    const cleanJson = jsonText.replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Profile analysis failed:', error);
    // Return defaults if analysis fails
    return {
      avgLength: 150,
      commonPhrases: [],
      tone: { formality: 50, humor: 50, technicality: 50 },
    };
  }
}
