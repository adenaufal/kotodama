# Kotodama API Reference

Complete reference for all AI provider integrations in Kotodama.

---

## Table of Contents

1. [OpenAI Integration](#openai-integration)
2. [Google Gemini Integration](#google-gemini-integration)
3. [Anthropic Claude Integration](#anthropic-claude-integration)
4. [Common Interfaces](#common-interfaces)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

---

## OpenAI Integration

### Configuration

```typescript
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o';
const FAST_MODEL = 'gpt-4o-mini';
```

### Models

| Model | Use Case | Context | Speed | Cost |
|-------|----------|---------|-------|------|
| `gpt-4o` | Default generation | 128K tokens | Medium | High |
| `gpt-4o-mini` | Fast mode, analysis | 128K tokens | Fast | Low |

### Functions

#### `generateWithOpenAI(request, apiKey, brandVoice, targetProfile?)`

Generates tweets or threads using OpenAI's GPT models.

**Parameters:**
- `request: GenerateRequest` - Generation request parameters
- `apiKey: string` - OpenAI API key
- `brandVoice: BrandVoice` - Brand voice configuration
- `targetProfile?: UserProfile` - Optional target user profile

**Returns:** `Promise<GenerateResponse>`

**Example:**
```typescript
const response = await generateWithOpenAI(
  {
    prompt: "Tweet about AI in 2025",
    brandVoiceId: "voice-123",
    isThread: false,
    fastMode: false
  },
  apiKey,
  brandVoice
);

console.log(response.content); // Generated tweet
console.log(response.tokenUsage); // Tokens used
console.log(response.provider); // "openai"
```

#### `analyzeTwitterProfile(tweets, apiKey)`

Analyzes a Twitter profile's writing style.

**Parameters:**
- `tweets: string[]` - Array of tweets to analyze
- `apiKey: string` - OpenAI API key

**Returns:** `Promise<{ avgLength: number; commonPhrases: string[]; tone: ToneAttributes }>`

**Example:**
```typescript
const analysis = await analyzeTwitterProfile(
  ["Tweet 1", "Tweet 2", "Tweet 3"],
  apiKey
);

console.log(analysis.avgLength); // Average tweet length
console.log(analysis.commonPhrases); // Common phrases used
console.log(analysis.tone); // Tone attributes
```

---

## Google Gemini Integration

### Configuration

```typescript
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-pro';
const FAST_MODEL = 'gemini-2.5-flash';
```

### Models

| Model | Use Case | Context | Speed | Cost |
|-------|----------|---------|-------|------|
| `gemini-2.5-pro` | Complex reasoning, large context | 2M tokens | Medium | Medium |
| `gemini-2.5-flash` | Speed and efficiency | 1M tokens | Very Fast | Very Low |

### Functions

#### `generateWithGemini(request, apiKey, brandVoice, targetProfile?)`

Generates tweets or threads using Google's Gemini models.

**Parameters:**
- `request: GenerateRequest` - Generation request parameters
- `apiKey: string` - Gemini API key
- `brandVoice: BrandVoice` - Brand voice configuration
- `targetProfile?: UserProfile` - Optional target user profile

**Returns:** `Promise<GenerateResponse>`

**Example:**
```typescript
const response = await generateWithGemini(
  {
    prompt: "Create a thread about ML engineering",
    brandVoiceId: "voice-123",
    isThread: true,
    threadLength: 5,
    fastMode: true // Uses gemini-2.5-flash
  },
  apiKey,
  brandVoice
);

console.log(response.content); // Array of tweets
console.log(response.tokenUsage); // Tokens used
console.log(response.provider); // "gemini"
```

#### `analyzeTwitterProfileWithGemini(tweets, apiKey)`

Analyzes a Twitter profile's writing style using Gemini.

**Parameters:**
- `tweets: string[]` - Array of tweets to analyze
- `apiKey: string` - Gemini API key

**Returns:** `Promise<{ avgLength: number; commonPhrases: string[]; tone: ToneAttributes }>`

**Note:** Automatically uses `gemini-2.5-flash` for cost efficiency.

---

## Anthropic Claude Integration

### Configuration

```typescript
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';
const CLAUDE_VERSION = '2023-06-01';
```

### Models

| Model | Use Case | Context | Speed | Cost |
|-------|----------|---------|-------|------|
| `claude-3-5-sonnet-20241022` | Balanced performance | 200K tokens | Medium | Medium |

### Functions

#### `generateWithClaude(request, apiKey, brandVoice, targetProfile?)`

Generates tweets or threads using Anthropic's Claude models.

**Parameters:**
- `request: GenerateRequest` - Generation request parameters
- `apiKey: string` - Claude API key
- `brandVoice: BrandVoice` - Brand voice configuration
- `targetProfile?: UserProfile` - Optional target user profile

**Returns:** `Promise<GenerateResponse>`

**Example:**
```typescript
const response = await generateWithClaude(
  {
    prompt: "Reply to a tweet about React 19",
    brandVoiceId: "voice-123",
    targetProfileId: "profile-456",
    isThread: false
  },
  apiKey,
  brandVoice,
  targetProfile
);

console.log(response.content); // Generated reply
console.log(response.tokenUsage); // Input + output tokens
console.log(response.provider); // "claude"
```

#### `analyzeTwitterProfileWithClaude(tweets, apiKey)`

Analyzes a Twitter profile's writing style using Claude.

**Parameters:**
- `tweets: string[]` - Array of tweets to analyze
- `apiKey: string` - Claude API key

**Returns:** `Promise<{ avgLength: number; commonPhrases: string[]; tone: ToneAttributes }>`

---

## Common Interfaces

### GenerateRequest

```typescript
interface GenerateRequest {
  prompt: string;              // User's generation prompt
  brandVoiceId: string;        // ID of brand voice to use
  targetProfileId?: string;    // Optional target user profile
  isThread?: boolean;          // Generate thread vs. single tweet
  threadLength?: number;       // Number of tweets (2-10)
  toneAdjustment?: Partial<ToneAttributes>; // Fine-tune tone
  provider?: AIProvider;       // 'openai' | 'gemini' | 'claude'
  fastMode?: boolean;          // Use faster/cheaper models
}
```

### GenerateResponse

```typescript
interface GenerateResponse {
  content: string | string[];  // Single tweet or array for threads
  tokenUsage: number;          // Total tokens consumed
  provider: AIProvider;        // Which provider was used
}
```

### BrandVoice

```typescript
interface BrandVoice {
  id: string;
  name: string;
  description?: string;
  exampleTweets: string[];
  guidelines?: string;
  toneAttributes: {
    formality: number;      // 0-100
    humor: number;          // 0-100
    technicality: number;   // 0-100
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### UserProfile

```typescript
interface UserProfile {
  id: string;
  username: string;
  analyzedTweets: {
    tweetId: string;
    content: string;
    timestamp: Date;
  }[];
  styleAttributes: {
    avgLength: number;
    commonPhrases: string[];
    toneProfile: ToneAttributes;
  };
  lastAnalyzed: Date;
}
```

---

## Error Handling

All API functions throw errors that should be caught and handled:

```typescript
try {
  const response = await generateWithOpenAI(request, apiKey, brandVoice);
  // Success
} catch (error) {
  console.error('Generation failed:', error);
  // Handle error:
  // - Show user-friendly message
  // - Try fallback provider
  // - Log for debugging
}
```

### Common Error Types

1. **API Key Invalid/Missing**
   - Message: "Invalid API key" or "API key required"
   - Solution: Verify API key is correct and active

2. **Rate Limit Exceeded**
   - Message: "Rate limit exceeded"
   - Solution: Implement exponential backoff, use different provider

3. **Model Not Available**
   - Message: "Model not found"
   - Solution: Update model name or use fallback model

4. **Content Policy Violation**
   - Message: "Content violates policy"
   - Solution: Modify prompt or system instructions

5. **Network Error**
   - Message: "Network request failed"
   - Solution: Check internet connection, retry with backoff

---

## Best Practices

### 1. Provider Selection

```typescript
// Choose based on requirements:

// For best quality and complex tasks:
provider: 'openai'  // gpt-4o

// For large context (long threads, analysis):
provider: 'gemini'  // gemini-2.5-pro (2M context)

// For balanced performance:
provider: 'claude'  // claude-3-5-sonnet

// For speed and cost:
fastMode: true  // Uses cheaper models
```

### 2. Token Management

```typescript
// Track token usage
const response = await generateWithOpenAI(request, apiKey, brandVoice);
console.log(`Tokens used: ${response.tokenUsage}`);

// Estimate costs:
// OpenAI gpt-4o: ~$2.50/1M input, ~$10/1M output
// OpenAI gpt-4o-mini: ~$0.15/1M input, ~$0.60/1M output
// Gemini 2.5 Pro: ~$1.25/1M input, ~$5/1M output
// Gemini 2.5 Flash: ~$0.075/1M input, ~$0.30/1M output
// Claude 3.5 Sonnet: ~$3/1M input, ~$15/1M output
```

### 3. Error Handling & Fallback

```typescript
async function generateWithFallback(
  request: GenerateRequest,
  settings: UserSettings,
  brandVoice: BrandVoice
): Promise<GenerateResponse> {
  const providers: AIProvider[] = ['openai', 'gemini', 'claude'];

  for (const provider of providers) {
    const apiKey = settings.apiKeys[provider];
    if (!apiKey) continue;

    try {
      switch (provider) {
        case 'openai':
          return await generateWithOpenAI(request, apiKey, brandVoice);
        case 'gemini':
          return await generateWithGemini(request, apiKey, brandVoice);
        case 'claude':
          return await generateWithClaude(request, apiKey, brandVoice);
      }
    } catch (error) {
      console.warn(`${provider} failed, trying next provider:`, error);
      continue;
    }
  }

  throw new Error('All providers failed');
}
```

### 4. System Prompt Optimization

The system prompt structure is consistent across providers:

```typescript
// Includes:
1. Brand voice description
2. Example tweets
3. Tone attributes (formality, humor, technicality)
4. Target profile adaptation (if replying)
5. Important rules (280 char limit, natural tone, etc.)
```

### 5. Thread Generation

```typescript
// Best practices for threads:
const request: GenerateRequest = {
  prompt: "Explain React 19 features",
  brandVoiceId: "tech-voice",
  isThread: true,
  threadLength: 5,  // 2-10 tweets
  provider: 'gemini',  // Best for threads (2M context)
};

// Response will be array of tweets:
const response = await generateWithGemini(request, apiKey, brandVoice);
response.content.forEach((tweet, i) => {
  console.log(`Tweet ${i + 1}:`, tweet);
});
```

---

## Rate Limits (Approximate)

| Provider | Tier | Requests/Min | Tokens/Min |
|----------|------|--------------|------------|
| OpenAI (Free) | - | 3 | 200,000 |
| OpenAI (Tier 1) | $5+ spent | 500 | 10M |
| Gemini (Free) | - | 15 | - |
| Gemini (Paid) | - | 1,000 | - |
| Claude (Free) | - | 5 | 20,000 |
| Claude (Tier 1) | $5+ spent | 50 | 40,000 |

**Note:** Rates vary by plan and may change. Check official documentation.

---

## Security Considerations

1. **API Key Storage**
   - Always encrypt API keys before storing
   - Use Web Crypto API for encryption
   - Never log or expose keys in UI

2. **API Key Validation**
   - Validate keys on first use
   - Handle invalid key errors gracefully
   - Prompt user to update keys

3. **Content Security**
   - Never send sensitive information in prompts
   - Sanitize user inputs
   - Follow each provider's content policies

---

## Getting API Keys

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy and save key securely

### Google Gemini
1. Go to https://ai.google.dev/gemini-api/docs/api-key
2. Sign in with Google account
3. Click "Get API Key"
4. Create project if needed
5. Copy API key

### Anthropic Claude
1. Go to https://console.anthropic.com/
2. Sign in or create account
3. Navigate to API Keys
4. Click "Create Key"
5. Copy and save key securely

---

**Last Updated:** October 17, 2025
**API Versions:**
- OpenAI: Latest (gpt-4o, gpt-4o-mini)
- Gemini: v1beta (gemini-2.5-pro, gemini-2.5-flash)
- Claude: 2023-06-01 (claude-3-5-sonnet-20241022)
