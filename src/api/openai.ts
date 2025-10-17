import { GenerateRequest, GenerateResponse, BrandVoice, UserProfile } from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Model Selection Strategy for Maximum Free Token Usage
// 1M token group - Use for standard quality
const DEFAULT_MODEL = 'gpt-5-2025-08-07'; // Latest GPT-5 for best quality
const QUALITY_MODEL = 'gpt-4o-2024-11-20'; // Latest GPT-4o as backup

// 10M token group - Use for fast/cheap operations
const FAST_MODEL = 'gpt-5-mini-2025-08-07'; // Latest mini for speed
const ULTRA_FAST_MODEL = 'gpt-5-nano-2025-08-07'; // Nano for maximum speed
const FALLBACK_MODEL = 'gpt-4o-mini-2024-07-18'; // Stable fallback

// Reasoning models (1M group)
const REASONING_MODEL = 'o1-2024-12-17'; // Latest o1 for complex reasoning

// Coding models (10M group)
const CODING_MODEL = 'codex-mini-latest'; // For code generation tasks

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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

  prompt += `Tone Attributes:\n`;
  prompt += `- Formality: ${brandVoice.toneAttributes.formality}/100\n`;
  prompt += `- Humor: ${brandVoice.toneAttributes.humor}/100\n`;
  prompt += `- Technicality: ${brandVoice.toneAttributes.technicality}/100\n\n`;

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
  targetProfile?: UserProfile
): Promise<GenerateResponse> {
  const isThread = request.isThread || false;

  // Select model based on request parameters
  let model = DEFAULT_MODEL;
  if (request.fastMode === true) {
    model = FAST_MODEL;
  } else if (request.fastMode === 'ultra') {
    model = ULTRA_FAST_MODEL;
  } else if (request.reasoning === true) {
    model = REASONING_MODEL;
  } else if (request.coding === true) {
    model = CODING_MODEL;
  }

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

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: isThread ? 1500 : 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const tokenUsage = data.usage.total_tokens;

    if (isThread) {
      // Parse thread into individual tweets
      const tweets = content
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
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
  } catch (error) {
    console.error('OpenAI generation failed:', error);

    // Try fallback models if primary fails
    if (model !== FALLBACK_MODEL) {
      try {
        console.log('Attempting fallback to', FALLBACK_MODEL);
        const fallbackResponse = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: FALLBACK_MODEL,
            messages,
            max_tokens: isThread ? 1500 : 300,
            temperature: 0.7,
          }),
        });

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          const content = data.choices[0].message.content.trim();
          const tokenUsage = data.usage.total_tokens;

          if (isThread) {
            const tweets = content
              .split('\n')
              .filter((line: string) => line.trim())
              .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
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
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }

    throw error;
  }
}

export async function analyzeTwitterProfile(
  tweets: string[],
  apiKey: string
): Promise<{ avgLength: number; commonPhrases: string[]; tone: any }> {
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

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: FAST_MODEL, // Use faster, cheaper model for analysis
        messages,
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error('Profile analysis failed');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
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
