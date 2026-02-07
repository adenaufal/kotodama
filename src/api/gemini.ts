import { GenerateRequest, GenerateResponse, BrandVoice, UserProfile } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Gemini Model Selection
const DEFAULT_MODEL = 'gemini-2.5-pro'; // Best for complex reasoning (2M context)
const FAST_MODEL = 'gemini-2.5-flash'; // Fast and efficient (1M context)
const ULTRA_FAST_MODEL = 'gemini-2.5-flash-lite'; // Ultra fast and cheapest

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

function buildUserPrompt(request: GenerateRequest, isThread: boolean, systemPrompt: string): string {
  const fullPrompt = `${systemPrompt}\n\nUser Request:\n`;

  if (isThread) {
    return `${fullPrompt}Create a Twitter thread with ${request.threadLength || 5} tweets based on this topic:\n\n${request.prompt}\n\nReturn each tweet on a new line, numbered 1-${request.threadLength || 5}.`;
  }

  return `${fullPrompt}${request.prompt}`;
}

export async function generateWithGemini(
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
  }

  const systemPrompt = buildSystemPrompt(brandVoice, targetProfile);
  const userPrompt = buildUserPrompt(request, isThread, systemPrompt);

  try {
    const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
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
          maxOutputTokens: isThread ? 1500 : 300,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API request failed');
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text.trim();
    const tokenUsage = data.usageMetadata?.totalTokenCount || 0;

    if (isThread) {
      // Parse thread into individual tweets
      // Split on numbered patterns like "1/" or "1." at the start of a line
      // This preserves line breaks within each tweet
      const tweets = content
        .split(/\n(?=\d+[.\/]\s)/) // Split only before numbered patterns
        .map((tweet: string) => tweet.replace(/^\d+[.\/]\s*/, '').trim()) // Remove the numbering
        .filter((tweet: string) => tweet.length > 0);

      return {
        content: tweets,
        tokenUsage,
        provider: 'gemini',
      };
    }

    return {
      content,
      tokenUsage,
      provider: 'gemini',
    };
  } catch (error) {
    console.error('Gemini generation failed:', error);

    // Try fallback to flash-lite if primary fails
    if (model !== ULTRA_FAST_MODEL) {
      try {
        console.log('Attempting fallback to', ULTRA_FAST_MODEL);
        const fallbackResponse = await fetch(`${GEMINI_API_URL}/${ULTRA_FAST_MODEL}:generateContent?key=${apiKey}`, {
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
              maxOutputTokens: isThread ? 1500 : 300,
            },
          }),
        });

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          const content = data.candidates[0].content.parts[0].text.trim();
          const tokenUsage = data.usageMetadata?.totalTokenCount || 0;

          if (isThread) {
            // Parse thread into individual tweets
            // Split on numbered patterns like "1/" or "1." at the start of a line
            // This preserves line breaks within each tweet
            const tweets = content
              .split(/\n(?=\d+[.\/]\s)/) // Split only before numbered patterns
              .map((tweet: string) => tweet.replace(/^\d+[.\/]\s*/, '').trim()) // Remove the numbering
              .filter((tweet: string) => tweet.length > 0);

            return {
              content: tweets,
              tokenUsage,
              provider: 'gemini',
            };
          }

          return {
            content,
            tokenUsage,
            provider: 'gemini',
          };
        }
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

  // Use ultra fast model for analysis
  try {
    const response = await fetch(`${GEMINI_API_URL}/${ULTRA_FAST_MODEL}:generateContent?key=${apiKey}`, {
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
    const jsonText = data.candidates[0].content.parts[0].text.trim();
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
