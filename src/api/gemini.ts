import { GenerateRequest, GenerateResponse, BrandVoice, UserProfile } from '../types';
import { buildSystemPrompt, buildUserPrompt } from './openai';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Gemini Model Selection
const DEFAULT_MODEL = 'gemini-2.5-flash'; // Fast and efficient (1M context)
const FALLBACK_MODEL = 'gemini-2.5-flash-lite'; // Ultra fast and cheapest

export async function generateWithGemini(
  request: GenerateRequest,
  apiKey: string,
  brandVoice: BrandVoice,
  targetProfile?: UserProfile,
  preferredModel?: string
): Promise<GenerateResponse> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Gemini API key is missing or invalid');
  }

  // Gemini has no separate system role on generateContent - prepend it.
  const systemPrompt = buildSystemPrompt(brandVoice, targetProfile, request.toneAdjustment);
  const userPrompt = `${systemPrompt}\n\nUser Request:\n${buildUserPrompt(request)}`;
  const requestedModel = preferredModel || DEFAULT_MODEL;

  async function requestWithModel(modelName: string): Promise<GenerateResponse> {
    // Gemini 2.5 pays for thinking out of maxOutputTokens, so an un-tuned 300 budget
    // gets spent reasoning and returns MAX_TOKENS with no text. Disable thinking where
    // allowed; 2.5 Pro has a hard floor of 128, so give it room instead.
    // ponytail: model sniffed by name - move to a flag in constants/models.ts if the
    // Gemini lineup grows past pro/flash/flash-lite.
    const isPro = modelName.includes('-pro');
    const response = await fetch(`${GEMINI_API_URL}/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: isPro ? 1024 : 300,
          thinkingConfig: { thinkingBudget: isPro ? 128 : 0 },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error?.message || `Gemini API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = String(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();

    if (!content) {
      throw new Error('Gemini API returned empty content. Please try again.');
    }

    return {
      content,
      tokenUsage: data.usageMetadata?.totalTokenCount || 0,
      provider: 'gemini',
    };
  }

  try {
    return await requestWithModel(requestedModel);
  } catch (error) {
    console.error('Gemini generation failed:', error);

    if (requestedModel !== FALLBACK_MODEL) {
      try {
        console.log('Attempting fallback to', FALLBACK_MODEL);
        return await requestWithModel(FALLBACK_MODEL);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }

    throw error;
  }
}

export async function analyzeTwitterProfileWithGemini(
  tweets: string[],
  apiKey: string
): Promise<{ avgLength: number; commonPhrases: string[]; tone: any }> {
  const prompt = `Analyze the writing style, tone, and patterns from these tweets. Return ONLY a valid JSON object with the following structure:
{
  "avgLength": <number>,
  "commonPhrases": [<array of strings>],
  "tone": {
    "formality": <number 0-100>,
    "humor": <number 0-100>,
    "technicality": <number 0-100>
  }
}

Tweets to analyze:
${tweets.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}/${FALLBACK_MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Profile analysis failed');
    }

    const data = await response.json();
    const jsonText = String(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
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
