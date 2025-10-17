import { GenerateRequest, GenerateResponse, BrandVoice, UserProfile } from '../types';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_WEB_URL = 'https://claude.ai/api/organizations';
const CLAUDE_VERSION = '2023-06-01';

// Claude Model Selection
// Sonnet models - Best for balanced performance
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'; // Claude Sonnet 4.5 (latest)
const SONNET_4_MODEL = 'claude-sonnet-4-20250514'; // Claude Sonnet 4
const SONNET_37_MODEL = 'claude-3-7-sonnet-20250219'; // Claude Sonnet 3.7

// Opus models - Best for quality and complex reasoning
const OPUS_4_MODEL = 'claude-opus-4-20250514'; // Claude Opus 4
const OPUS_41_MODEL = 'claude-opus-4-1-20250805'; // Claude Opus 4.1

// Haiku models - Best for speed and efficiency
const FAST_MODEL = 'claude-3-5-haiku-20241022'; // Claude Haiku 3.5 (fast)
const HAIKU_45_MODEL = 'claude-haiku-4-5-20251001'; // Claude Haiku 4.5
const HAIKU_3_MODEL = 'claude-3-haiku-20240307'; // Claude Haiku 3 (ultra fast)

type ClaudeAuthType = 'api' | 'cookie';

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

// Claude Web (cookie-based) generation
async function generateWithClaudeWeb(
  userPrompt: string,
  systemPrompt: string,
  cookie: string,
  model: string,
  isThread: boolean
): Promise<GenerateResponse> {
  try {
    // First, get organization ID from cookie
    const orgResponse = await fetch(CLAUDE_WEB_URL, {
      headers: {
        'Cookie': cookie,
        'Content-Type': 'application/json',
      },
    });

    if (!orgResponse.ok) {
      throw new Error('Failed to fetch organization');
    }

    const orgData = await orgResponse.json();
    const orgId = orgData[0]?.uuid;

    if (!orgId) {
      throw new Error('No organization found');
    }

    // Create a conversation
    const conversationResponse = await fetch(
      `${CLAUDE_WEB_URL}/${orgId}/chat_conversations`,
      {
        method: 'POST',
        headers: {
          'Cookie': cookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid: crypto.randomUUID(),
          name: 'Tweet Generation',
        }),
      }
    );

    if (!conversationResponse.ok) {
      throw new Error('Failed to create conversation');
    }

    const conversationData = await conversationResponse.json();
    const conversationId = conversationData.uuid;

    // Send message with system prompt embedded
    const fullPrompt = `${systemPrompt}\n\nUser Request:\n${userPrompt}`;

    const messageResponse = await fetch(
      `${CLAUDE_WEB_URL}/${orgId}/chat_conversations/${conversationId}/completion`,
      {
        method: 'POST',
        headers: {
          'Cookie': cookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          model: model,
          timezone: 'UTC',
        }),
      }
    );

    if (!messageResponse.ok) {
      throw new Error('Failed to generate message');
    }

    // Stream response
    const reader = messageResponse.body?.getReader();
    const decoder = new TextDecoder();
    let content = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.completion) {
                content = data.completion;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    }

    const tokenUsage = Math.ceil(content.length / 4); // Rough estimate

    if (isThread) {
      const tweets = content
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((tweet: string) => tweet.length > 0);

      return {
        content: tweets,
        tokenUsage,
        provider: 'claude',
      };
    }

    return {
      content: content.trim(),
      tokenUsage,
      provider: 'claude',
    };
  } catch (error) {
    console.error('Claude Web generation failed:', error);
    throw error;
  }
}

export async function generateWithClaude(
  request: GenerateRequest,
  apiKey: string,
  brandVoice: BrandVoice,
  targetProfile?: UserProfile,
  authType: ClaudeAuthType = 'api',
  cookie?: string
): Promise<GenerateResponse> {
  const isThread = request.isThread || false;
  const systemPrompt = buildSystemPrompt(brandVoice, targetProfile);
  const userPrompt = buildUserPrompt(request, isThread);

  // Select model based on request parameters
  let model = DEFAULT_MODEL;
  if (request.quality === 'opus') {
    model = OPUS_4_MODEL;
  } else if (request.quality === 'opus-max') {
    model = OPUS_41_MODEL;
  } else if (request.fastMode === true) {
    model = FAST_MODEL;
  } else if (request.fastMode === 'ultra') {
    model = HAIKU_3_MODEL;
  } else if (request.fastMode === 'haiku-45') {
    model = HAIKU_45_MODEL;
  }

  // Route to appropriate authentication method
  if (authType === 'cookie' && cookie) {
    return generateWithClaudeWeb(
      userPrompt,
      systemPrompt,
      cookie,
      model,
      isThread
    );
  }

  // API-based generation
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': CLAUDE_VERSION,
      },
      body: JSON.stringify({
        model: model,
        max_tokens: isThread ? 1500 : 300,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Claude API request failed');
    }

    const data = await response.json();
    const content = data.content[0].text.trim();
    const tokenUsage = data.usage.input_tokens + data.usage.output_tokens;

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
        provider: 'claude',
      };
    }

    return {
      content,
      tokenUsage,
      provider: 'claude',
    };
  } catch (error) {
    console.error('Claude generation failed:', error);

    // Try fallback to Haiku 3 if primary fails
    if (model !== HAIKU_3_MODEL && authType === 'api') {
      try {
        console.log('Attempting fallback to', HAIKU_3_MODEL);
        const fallbackResponse = await fetch(CLAUDE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': CLAUDE_VERSION,
          },
          body: JSON.stringify({
            model: HAIKU_3_MODEL,
            max_tokens: isThread ? 1500 : 300,
            temperature: 0.7,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: userPrompt,
              },
            ],
          }),
        });

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          const content = data.content[0].text.trim();
          const tokenUsage = data.usage.input_tokens + data.usage.output_tokens;

          if (isThread) {
            const tweets = content
              .split('\n')
              .filter((line: string) => line.trim())
              .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
              .filter((tweet: string) => tweet.length > 0);

            return {
              content: tweets,
              tokenUsage,
              provider: 'claude',
            };
          }

          return {
            content,
            tokenUsage,
            provider: 'claude',
          };
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }

    throw error;
  }
}

export async function analyzeTwitterProfileWithClaude(
  tweets: string[],
  apiKey: string,
  authType: ClaudeAuthType = 'api',
  cookie?: string
): Promise<{ avgLength: number; commonPhrases: string[]; tone: any }> {
  const systemPrompt = 'You are analyzing Twitter profiles. Analyze the writing style, tone, and patterns from the provided tweets. Return ONLY a valid JSON object with avgLength (number), commonPhrases (array of strings), and tone (object with formality, humor, technicality scores 0-100).';
  const userPrompt = `Analyze these tweets:\n\n${tweets.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

  // Use fast model for analysis
  const model = FAST_MODEL;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': CLAUDE_VERSION,
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 500,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Profile analysis failed');
    }

    const data = await response.json();
    const jsonText = data.content[0].text.trim();
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
