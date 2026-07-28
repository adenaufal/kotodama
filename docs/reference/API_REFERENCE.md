# Kotodama API Reference

Complete reference for all AI provider integrations in Kotodama.

Kotodama is reply-only. Every generation call carries the tweet being replied to; there is no
compose-a-new-tweet or thread-generation path.

---

## Table of Contents

1. [Shared Prompt Builders](#shared-prompt-builders)
2. [Context Reading (Vision)](#context-reading-vision)
3. [OpenAI Integration](#openai-integration)
4. [Google Gemini Integration](#google-gemini-integration)
5. [Anthropic Claude Integration](#anthropic-claude-integration)
6. [Common Interfaces](#common-interfaces)
7. [Provider Dispatch](#provider-dispatch)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

---

## Shared Prompt Builders

Both live in [src/api/openai.ts](../../src/api/openai.ts) and are reused by all three clients — one prompt, three transports.

#### `buildSystemPrompt(brandVoice, targetProfile?, toneAdjustment?)`

Builds the reply-assistant system prompt from the brand voice: description, guidelines, example
tweets, V2 fields (vocabulary, do's/don'ts, Twitter platform rules), the six tone attributes with
`toneAdjustment` applied and clamped to 0-100, and optional target-profile adaptation.

#### `buildUserPrompt(request)`

Renders the reply context into labelled blocks: `[EARLIER IN THE THREAD]`, `[CONTEXT - THE TWEET WE
ARE REPLYING TO]` (author, time, content, image alt text, metrics), `[WHAT THIS TWEET IS SAYING]`
(the vision summary, when present), and `[YOUR TASK]` (the user's intent).

---

## Context Reading (Vision)

[src/api/vision.ts](../../src/api/vision.ts) — a separate pass that runs before generation.

The model the user picked for *writing* may have no vision at all, so the reading is always done by
a fixed cheap vision-capable model per provider and handed downstream as plain text.

| Provider | Vision model |
|----------|--------------|
| OpenAI | `gpt-4o-mini` |
| Gemini | `gemini-2.5-flash-lite` |
| Claude | `claude-haiku-4-5` |

#### `analyzeContext(request, apiKey, provider)`

**Parameters:**
- `request: AnalyzeContextRequest` - the captured `TweetContext`
- `apiKey: string`
- `provider: AIProvider`

**Returns:** `Promise<AnalyzeContextResponse>`

**Behaviour highlights:**
- Fetches up to **4** images from `pbs.twimg.com` (normalized to the `small` variant) and inlines them as base64.
- Caps the summary at 200 tokens and asks for 1-3 plain sentences.
- **Never throws for image problems.** Any fetch or vision failure retries text-only and returns `visionFailed: true`; the caller still gets a usable summary.
- Claude requests put image blocks before the text block, per Anthropic's guidance.

---

## OpenAI Integration

### Configuration

```typescript
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-2024-11-20';
const FALLBACK_MODEL = 'gpt-4o-mini-2024-07-18';
const FAST_MODEL = 'gpt-4o-mini-2024-07-18'; // profile analysis
```

### Models

| Model | Use Case | Notes |
|-------|----------|-------|
| `gpt-4o-2024-11-20` | Default generation | Used when no provider-matching `defaultModel` is set |
| `gpt-4o-mini-2024-07-18` | Fallback + profile analysis | Retried automatically when the requested model fails |

The full selectable list lives in `OPENAI_MODELS` in [src/constants/models.ts](../../src/constants/models.ts).

### Functions

#### `generateWithOpenAI(request, apiKey, brandVoice, targetProfile?, preferredModel?)`

Drafts a reply using OpenAI chat completions.

**Parameters:**
- `request: GenerateRequest` - generation request parameters
- `apiKey: string` - OpenAI API key
- `brandVoice: BrandVoice` - brand voice configuration
- `targetProfile?: UserProfile` - optional target user profile
- `preferredModel?: string` - model id, when the saved default belongs to this provider

**Returns:** `Promise<GenerateResponse>`

**Behaviour highlights:**
- `max_completion_tokens: 300`.
- Omits `temperature` for `o1*` and `gpt-5*` prefixes, and retries without it when the API reports a fixed-temperature error (the model is then remembered for the session).
- On failure, retries `gpt-4o-2024-11-20` then `gpt-4o-mini-2024-07-18`, skipping whichever was already tried.

**Example:**
```typescript
const response = await generateWithOpenAI(
  {
    prompt: "Agree with them and add one concrete example.",
    brandVoiceId: "voice-123",
    replyContext: tweetContext,
    contextSummary: "The author is celebrating passing 1,100 followers.",
  },
  apiKey,
  brandVoice
);

console.log(response.content);    // Generated reply
console.log(response.tokenUsage); // Tokens used
console.log(response.provider);   // "openai"
```

#### `analyzeTwitterProfile(tweets, apiKey)`

Analyzes a Twitter profile's writing style.

**Parameters:**
- `tweets: string[]` - array of tweets to analyze
- `apiKey: string` - OpenAI API key

**Returns:** `Promise<{ avgLength: number; commonPhrases: string[]; tone: ToneAttributes }>`

> No UI currently sends `analyze-profile`, so this path is reachable only by hand. It swallows errors and returns neutral defaults rather than throwing.

---

## Google Gemini Integration

### Configuration

```typescript
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';
```

### Models

| Model | Use Case | Context | Notes |
|-------|----------|---------|-------|
| `gemini-2.5-flash` | Default generation | 1M tokens | |
| `gemini-2.5-flash-lite` | Fallback + vision pass | 1M tokens | Fastest and cheapest |
| `gemini-2.5-pro` | Selectable in settings | 2M tokens | Gets a larger output budget (see below) |

### Functions

#### `generateWithGemini(request, apiKey, brandVoice, targetProfile?, preferredModel?)`

Drafts a reply using Google's Gemini models.

**Returns:** `Promise<GenerateResponse>`

**Behaviour highlights:**
- `generateContent` has no separate system role, so the system prompt is prepended to the user prompt.
- **Thinking budget matters.** Gemini 2.5 pays for thinking out of `maxOutputTokens`; an untuned 300-token budget gets spent reasoning and returns `MAX_TOKENS` with no text. Non-Pro models run with `thinkingBudget: 0` and 300 output tokens; Pro has a hard floor of 128, so it gets 1024 output tokens instead.
- Falls back to `gemini-2.5-flash-lite` when the requested model fails.

#### `analyzeTwitterProfileWithGemini(tweets, apiKey)`

Analyzes a Twitter profile's writing style using `gemini-2.5-flash-lite`. Returns neutral defaults on failure.

---

## Anthropic Claude Integration

### Configuration

```typescript
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-5';
const FAST_MODEL = 'claude-haiku-4-5'; // fallback + profile analysis
```

Requests from an extension service worker are browser-origin, so every call must send
`anthropic-dangerous-direct-browser-access: true` alongside `x-api-key` and `anthropic-version`.

### Models

> ⚠️ **Current Claude model ids are bare — never append a date suffix.** Dated ids such as
> `claude-opus-4-20250514`, `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, and
> `claude-3-haiku-20240307` are retired and return **404**. `claude-opus-4-1-20250805` retires
> 2026-08-05.

| Model | Use Case | Context | Notes |
|-------|----------|---------|-------|
| `claude-opus-5` | Highest quality | 1M tokens | Selectable in settings |
| `claude-sonnet-5` | Default balanced model | 1M tokens | `DEFAULT_MODEL` |
| `claude-haiku-4-5` | Fast + cheap | 200K tokens | Fallback, profile analysis, and the vision pass |

### Sampling parameters return HTTP 400 on the 5-series

`temperature`, `top_p`, and `top_k` were **removed** on `claude-opus-5`, `claude-sonnet-5`, and
`claude-opus-4-7` / `claude-opus-4-8`. Sending any of them returns `400 invalid_request_error`.
This is a live footgun: code that sets `temperature: 0.7` unconditionally will fail every request
on the default model.

[src/api/claude.ts](../../src/api/claude.ts) handles it two ways:

1. A prefix allowlist (`FIXED_TEMPERATURE_MODEL_PREFIXES`) omits the parameter up front for known models.
2. If an unlisted model rejects the request with an error mentioning `temperature` / `top_p` / `top_k`, the model is remembered for the session and the request is retried without it.

Older models (Sonnet 4.5 and earlier) still accept sampling parameters.

### Functions

#### `generateWithClaude(request, apiKey, brandVoice, targetProfile?, preferredModel?)`

Drafts a reply using Anthropic's Messages API.

**Returns:** `Promise<GenerateResponse>`

**Behaviour highlights:**
- `max_tokens: 300`; the system prompt goes in the top-level `system` field.
- `tokenUsage` is `usage.input_tokens + usage.output_tokens`.
- Falls back to `claude-haiku-4-5` when the requested model fails.

**Example:**
```typescript
const response = await generateWithClaude(
  {
    prompt: "Push back politely and ask for their benchmark.",
    brandVoiceId: "voice-123",
    replyContext: tweetContext,
  },
  apiKey,
  brandVoice
);

console.log(response.content);    // Generated reply
console.log(response.tokenUsage); // Input + output tokens
console.log(response.provider);   // "claude"
```

#### `analyzeTwitterProfileWithClaude(tweets, apiKey)`

Analyzes a Twitter profile's writing style using `claude-haiku-4-5`. Returns neutral defaults on failure.

---

## Common Interfaces

Authoritative definitions live in [src/types/index.ts](../../src/types/index.ts).

### GenerateRequest

```typescript
interface GenerateRequest {
  prompt: string;                            // What the user wants to say back
  brandVoiceId: string;
  targetProfileId?: string;
  replyContext: TweetContext;                // Reply-only: always present
  contextSummary?: string;                   // Plain-language reading from the vision pass
  toneAdjustment?: Partial<ToneAttributes>;
  provider?: AIProvider;                     // 'openai' | 'gemini' | 'claude'
}
```

### GenerateResponse

```typescript
interface GenerateResponse {
  content: string;             // A single reply — never an array
  tokenUsage: number;
  provider: AIProvider;
}
```

### TweetContext

```typescript
interface TweetContext {
  text: string;
  username: string;            // @handle
  displayName?: string;
  timestamp?: string;
  images?: { url: string; alt?: string }[];
  metrics?: { replies?: number; retweets?: number; likes?: number };
  thread?: { username: string; displayName?: string; text: string }[]; // oldest first
}
```

### AnalyzeContextRequest / AnalyzeContextResponse

```typescript
interface AnalyzeContextRequest {
  context: TweetContext;
  provider?: AIProvider;
}

interface AnalyzeContextResponse {
  summary: string;
  provider: AIProvider;
  visionFailed?: boolean;      // Images were present but unreadable; summary is text-only
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
    empathy: number;        // 0-100
    energy: number;         // 0-100
    authenticity: number;   // 0-100
  };
  category?: 'professional' | 'casual' | 'technical' | 'creative' | 'educational' | 'personal' | 'custom';
  tags?: string[];
  isTemplate?: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Optional V2 fields: vocabulary, platformGuidelines, characterVoices,
  // coreValues, messagingFramework, dosList, dontsList, version
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

## Provider Dispatch

[src/background/service-worker.ts](../../src/background/service-worker.ts) owns provider selection:

```typescript
const provider = request.provider ?? settings.defaultProvider ?? 'openai';
const apiKey = settings.apiKeys[provider];   // missing → user-facing error, no cross-provider retry
```

- A saved `defaultModel` is only forwarded when `getModelById(defaultModel)?.provider === provider`; otherwise each client uses its own default.
- Generation is rate limited before anything else runs — 20 requests/minute (see [src/utils/rateLimiter.ts](../../src/utils/rateLimiter.ts)).
- Drafts are written to IndexedDB only when `features.rememberHistory` is enabled.
- **There is no automatic failover to a different provider.** Each client falls back to its own cheaper model, and that's it.

---

## Error Handling

All provider functions throw; the service worker catches and rewrites the message for the user:

```typescript
try {
  const response = await generateWithOpenAI(request, apiKey, brandVoice);
} catch (error) {
  // service-worker.ts maps 'API key' / 'rate limit' / '401' / 'network'
  // onto provider-labelled, actionable messages before returning
  // { success: false, error } to the panel.
}
```

### Common Error Types

1. **API Key Invalid/Missing**
   - Message: "…API key not configured" or "Invalid …API key"
   - Solution: add or fix the key for the selected provider in Settings

2. **Rate Limit Exceeded**
   - Message: "Rate limit exceeded" (Kotodama's own limiter) or the provider's 429
   - Solution: wait for the window to clear, or reduce request volume

3. **Model Not Available / 404**
   - Usually a stale model id — for Claude, a date-suffixed id
   - Solution: use the ids in `src/constants/models.ts`

4. **Rejected Parameter (400)**
   - `temperature` / `top_p` / `top_k` on a Claude 5-series model
   - Solution: omit the parameter (the client already does for known prefixes)

5. **Network Error**
   - Message: "Network error. Please check your internet connection…"

---

## Best Practices

### 1. Provider Selection

The user picks a default provider in Settings. When adding logic that chooses on their behalf,
remember the practical differences:

```typescript
provider: 'openai'  // widest model list in the settings UI
provider: 'gemini'  // largest context, cheapest flash-lite tier
provider: 'claude'  // strongest instruction-following for voice matching
```

### 2. Token Management

```typescript
const response = await generateWithOpenAI(request, apiKey, brandVoice);
console.log(`Tokens used: ${response.tokenUsage}`);
```

Replies are capped at 300 output tokens and context summaries at 200, so per-request cost is
dominated by the system prompt (brand voice) and any inlined images.

### 3. Keep the Vision Pass Optional

`contextSummary` is an enhancement, never a gate. Code that awaits it before allowing generation
turns a soft failure into a hard one — the panel deliberately lets the user generate while the
summary is still loading or after it errored.

### 4. System Prompt Optimization

The system prompt structure is identical across providers:

```typescript
1. Brand voice description and guidelines
2. Example tweets
3. Vocabulary / do's / don'ts / platform rules (V2 fields, when present)
4. Six tone attributes, with the panel's tone presets applied
5. Target profile adaptation (when a profile exists)
6. Reply rules (280 char limit, respond to the specific points, no preamble)
```

### 5. Sanitize Before Prompting

Everything in `TweetContext` came off an attacker-controlled page. `sanitizeTweetContext` runs in
the content script before the context leaves the page, and `sanitizePrompt` runs on the user's
intent. Any new field added to the context must go through
[src/utils/sanitize.ts](../../src/utils/sanitize.ts).

---

## Rate Limits

### Kotodama's own limiter ([src/utils/rateLimiter.ts](../../src/utils/rateLimiter.ts))

| Key | Limit | Enforced? |
|-----|-------|-----------|
| `generate` | 20 / minute | ✅ `tryRequest('generate')` checks this **and** the hourly bucket |
| `generateHourly` | 200 / hour | ✅ via the `generate` check |
| `analyzeProfile` | 10 / minute | ❌ configured but never checked — nothing calls it |
| `analyzeContext` | 10 / minute | ❌ configured but never checked — the vision pass rides the same user gesture as `generate` |

### Provider limits (approximate)

| Provider | Tier | Requests/Min |
|----------|------|--------------|
| OpenAI (Free) | - | 3 |
| OpenAI (Tier 1) | $5+ spent | 500 |
| Gemini (Free) | - | 15 |
| Gemini (Paid) | - | 1,000 |
| Claude (Free) | - | 5 |
| Claude (Tier 1) | $5+ spent | 50 |

**Note:** Provider rates vary by plan and change often. Check official documentation.

---

## Security Considerations

1. **API Key Storage**
   - Keys are encrypted with the Web Crypto API before being written to `chrome.storage`
   - Decrypted only inside the service worker; never logged or shown in the UI

2. **Prompt Injection**
   - Page-scraped text is sanitized and length-capped before it reaches a prompt
   - Tweet content is delivered in labelled context blocks, not as instructions

3. **Content Security**
   - Outbound requests are limited to the provider APIs and `pbs.twimg.com` image fetches
   - Host permissions in the manifest are the enforcement point

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

**API Versions:**
- OpenAI: `/v1/chat/completions`
- Gemini: `v1beta` `generateContent`
- Claude: `anthropic-version: 2023-06-01`
