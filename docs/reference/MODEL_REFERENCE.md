# Model Reference - All Supported AI Models

Complete reference for all AI models supported in Kotodama with their specifications and optimal use cases.

---

## Table of Contents

1. [OpenAI Models](#openai-models)
2. [Google Gemini Models](#google-gemini-models)
3. [Anthropic Claude Models](#anthropic-claude-models)
4. [Model Selection Guide](#model-selection-guide)
5. [Token Limits & Costs](#token-limits--costs)
6. [Free Tier Optimization](#free-tier-optimization)

---

## OpenAI Models

### Model Categories

#### 1M Token Group (Standard Quality)

| Model | Use Case | Context | Speed | Cost Tier |
|-------|----------|---------|-------|-----------|
| **gpt-5-2025-08-07** ⭐ | Default - Best overall quality | 128K | Medium | High |
| **gpt-4o-2024-11-20** | Backup quality model | 128K | Medium | High |
| **o1-2024-12-17** | Complex reasoning | 128K | Slow | High |

#### 10M Token Group (Fast/Cheap)

| Model | Use Case | Context | Speed | Cost Tier |
|-------|----------|---------|-------|-----------|
| **gpt-5-mini-2025-08-07** ⭐ | Fast mode - Latest mini | 128K | Fast | Low |
| **gpt-5-nano-2025-08-07** | Ultra fast - Maximum speed | 128K | Very Fast | Very Low |
| **gpt-4o-mini-2024-07-18** | Stable fallback | 128K | Fast | Low |
| **codex-mini-latest** | Code generation | 128K | Fast | Low |

### How to Use

```typescript
// Default quality (GPT-5)
const request: GenerateRequest = {
  prompt: "Create a tweet about AI",
  brandVoiceId: "voice-123"
};

// Fast mode (GPT-5 Mini)
const request: GenerateRequest = {
  prompt: "Quick tweet",
  brandVoiceId: "voice-123",
  fastMode: true
};

// Ultra fast mode (GPT-5 Nano)
const request: GenerateRequest = {
  prompt: "Super quick",
  brandVoiceId: "voice-123",
  fastMode: 'ultra'
};

// Reasoning mode (o1)
const request: GenerateRequest = {
  prompt: "Complex analysis",
  brandVoiceId: "voice-123",
  reasoning: true
};

// Coding mode (Codex)
const request: GenerateRequest = {
  prompt: "Generate code snippet",
  brandVoiceId: "voice-123",
  coding: true
};
```

### Fallback Strategy

1. Try primary model (e.g., gpt-5-2025-08-07)
2. If fails, fallback to gpt-4o-mini-2024-07-18
3. Error handling at application level

---

## Google Gemini Models

### Model Selection

| Model | Use Case | Context | Speed | Cost Tier |
|-------|----------|---------|-------|-----------|
| **gemini-2.5-pro** ⭐ | Default - Complex reasoning | 2M tokens | Medium | Medium |
| **gemini-2.5-flash** | Fast mode - Efficient | 1M tokens | Very Fast | Very Low |
| **gemini-2.5-flash-lite** | Ultra fast - Cheapest | 1M tokens | Ultra Fast | Minimal |

### Key Features

- **Largest Context**: 2M tokens with Pro model
- **Fastest**: Flash Lite is the fastest model
- **Best Value**: Flash models offer exceptional cost/performance

### How to Use

```typescript
// Default quality (Gemini 2.5 Pro)
const request: GenerateRequest = {
  prompt: "Analyze this long document",
  brandVoiceId: "voice-123",
  provider: 'gemini'
};

// Fast mode (Gemini Flash)
const request: GenerateRequest = {
  prompt: "Quick response",
  brandVoiceId: "voice-123",
  provider: 'gemini',
  fastMode: true
};

// Ultra fast mode (Flash Lite)
const request: GenerateRequest = {
  prompt: "Instant response",
  brandVoiceId: "voice-123",
  provider: 'gemini',
  fastMode: 'ultra'
};
```

### Fallback Strategy

1. Try primary model (Pro or Flash based on fastMode)
2. If fails, fallback to gemini-2.5-flash-lite
3. Error handling at application level

---

## Anthropic Claude Models

### Model Families

#### Sonnet Models (Balanced Performance)

| Model | API Name | Use Case | Context | Speed |
|-------|----------|----------|---------|-------|
| **Claude Sonnet 4.5** ⭐ | claude-sonnet-4-5-20250929 | Default - Latest & best | 200K | Medium |
| **Claude Sonnet 4** | claude-sonnet-4-20250514 | Balanced performance | 200K | Medium |
| **Claude Sonnet 3.7** | claude-3-7-sonnet-20250219 | Proven reliability | 200K | Medium |

#### Opus Models (Maximum Quality)

| Model | API Name | Use Case | Context | Speed |
|-------|----------|----------|---------|-------|
| **Claude Opus 4.1** | claude-opus-4-1-20250805 | Best quality available | 200K | Slow |
| **Claude Opus 4** | claude-opus-4-20250514 | High quality reasoning | 200K | Slow |

#### Haiku Models (Speed & Efficiency)

| Model | API Name | Use Case | Context | Speed |
|-------|----------|----------|---------|-------|
| **Claude Haiku 4.5** | claude-haiku-4-5-20251001 | Fast balanced | 200K | Fast |
| **Claude Haiku 3.5** ⭐ | claude-3-5-haiku-20241022 | Fast mode default | 200K | Very Fast |
| **Claude Haiku 3** | claude-3-haiku-20240307 | Ultra fast fallback | 200K | Ultra Fast |

### Authentication Methods

#### 1. API Key (Recommended)

```typescript
const response = await generateWithClaude(
  request,
  apiKey, // Your Anthropic API key
  brandVoice,
  targetProfile,
  'api' // Authentication type
);
```

#### 2. Cookie (Web Account)

```typescript
const response = await generateWithClaude(
  request,
  '', // Empty for cookie auth
  brandVoice,
  targetProfile,
  'cookie', // Authentication type
  cookieValue // Your claude.ai session cookie
);
```

### How to Use

```typescript
// Default (Sonnet 4.5)
const request: GenerateRequest = {
  prompt: "Create a tweet",
  brandVoiceId: "voice-123",
  provider: 'claude'
};

// Fast mode (Haiku 3.5)
const request: GenerateRequest = {
  prompt: "Quick tweet",
  brandVoiceId: "voice-123",
  provider: 'claude',
  fastMode: true
};

// Ultra fast mode (Haiku 3)
const request: GenerateRequest = {
  prompt: "Super quick",
  brandVoiceId: "voice-123",
  provider: 'claude',
  fastMode: 'ultra'
};

// Haiku 4.5 mode
const request: GenerateRequest = {
  prompt: "Fast balanced",
  brandVoiceId: "voice-123",
  provider: 'claude',
  fastMode: 'haiku-45'
};

// Opus 4 quality mode
const request: GenerateRequest = {
  prompt: "Best quality",
  brandVoiceId: "voice-123",
  provider: 'claude',
  quality: 'opus'
};

// Opus 4.1 maximum quality
const request: GenerateRequest = {
  prompt: "Maximum quality",
  brandVoiceId: "voice-123",
  provider: 'claude',
  quality: 'opus-max'
};
```

### Fallback Strategy

1. Try primary model (based on quality/fastMode)
2. If fails, fallback to claude-3-haiku-20240307
3. Error handling at application level

---

## Model Selection Guide

### Use Case Matrix

| Scenario | Recommended Model | Reason |
|----------|------------------|---------|
| **Long documents** | Gemini 2.5 Pro | 2M context window |
| **Speed priority** | Gemini Flash Lite | Fastest overall |
| **Quality priority** | Claude Opus 4.1 | Best reasoning |
| **Code generation** | OpenAI Codex Mini | Specialized for code |
| **Cost priority** | Gemini Flash Lite | Cheapest per token |
| **Balanced** | Claude Sonnet 4.5 | Great all-rounder |
| **Free tier max** | OpenAI GPT-5 Mini | 10M tokens/day |
| **Complex reasoning** | OpenAI o1 | Purpose-built |

### Decision Tree

```
Need maximum quality?
├─ Yes → Claude Opus 4.1
└─ No → Need speed?
    ├─ Yes → Gemini Flash Lite
    └─ No → Need long context?
        ├─ Yes → Gemini 2.5 Pro
        └─ No → Use Claude Sonnet 4.5 (balanced)
```

---

## Token Limits & Costs

### OpenAI Pricing (Approximate)

#### 1M Token Group
| Model | Input | Output | Daily Free |
|-------|--------|---------|------------|
| GPT-5 | $2.50/1M | $10.00/1M | 1M tokens |
| GPT-4o | $2.50/1M | $10.00/1M | 1M tokens |
| o1 | $15.00/1M | $60.00/1M | 1M tokens |

#### 10M Token Group
| Model | Input | Output | Daily Free |
|-------|--------|---------|------------|
| GPT-5 Mini | $0.15/1M | $0.60/1M | 10M tokens |
| GPT-5 Nano | $0.10/1M | $0.40/1M | 10M tokens |
| GPT-4o Mini | $0.15/1M | $0.60/1M | 10M tokens |
| Codex Mini | $0.15/1M | $0.60/1M | 10M tokens |

### Gemini Pricing

| Model | Input | Output | Daily Free |
|-------|--------|---------|------------|
| Gemini 2.5 Pro | $1.25/1M | $5.00/1M | Flash: 1500/day |
| Gemini 2.5 Flash | $0.075/1M | $0.30/1M | 1500 RPD |
| Gemini Flash Lite | $0.05/1M | $0.20/1M | Included in Flash |

### Claude Pricing

| Model | Input | Output | Daily Free |
|-------|--------|---------|------------|
| Sonnet 4.5 | $3.00/1M | $15.00/1M | Limited |
| Opus 4.1 | $15.00/1M | $75.00/1M | Very Limited |
| Haiku 3.5 | $0.80/1M | $4.00/1M | Limited |
| Haiku 3 | $0.25/1M | $1.25/1M | Limited |

**Note**: Prices are approximate and subject to change. Check official pricing pages.

---

## Free Tier Optimization

### Strategy for Maximum Free Usage

#### Daily Rotation Schedule

**Morning (High Quality Needed)**
- Use: OpenAI GPT-5 (1M tokens free)
- Tasks: Important tweets, threads, analysis

**Afternoon (Bulk Operations)**
- Use: OpenAI GPT-5 Mini (10M tokens free)
- Tasks: Quick tweets, drafts, testing

**Evening (Remaining Work)**
- Use: Gemini Flash Lite (Free tier)
- Tasks: Overflow, quick responses

**Night (Minimal Usage)**
- Use: Claude Haiku via Cookie (Free account)
- Tasks: Final edits, simple tasks

### Token Estimation

**Average Tweet Generation:**
- Input: ~500 tokens (system prompt + user prompt)
- Output: ~100 tokens (tweet)
- Total: ~600 tokens per tweet

**With Free Tiers:**
- OpenAI 1M: ~1,666 tweets/day
- OpenAI 10M: ~16,666 tweets/day
- Gemini: ~1,500 requests/day
- Claude Cookie: Unlimited (rate limited)

**Total Possible**: 20,000+ tweets per day across all providers!

### Best Practices

1. **Start with Cheapest**: Gemini Flash Lite first
2. **Escalate as Needed**: Move to higher quality if needed
3. **Track Usage**: Monitor daily token consumption
4. **Rotate Providers**: Spread load across all three
5. **Use Fallbacks**: Always have backup provider configured

---

## Provider Configuration

### Settings Structure

```typescript
interface UserSettings {
  apiKeys: {
    openai?: string;
    gemini?: string;
    claude?: string;
  };
  claudeCookie?: string;
  claudeAuthType?: 'api' | 'cookie';
  defaultProvider?: 'openai' | 'gemini' | 'claude';
}
```

### Setup Priority

1. **Set up all three providers** for maximum flexibility
2. **Configure Claude cookie** for unlimited free usage
3. **Set default provider** to cheapest (Gemini Flash Lite)
4. **Enable automatic fallback** to other providers

---

## Model Comparison Chart

### Performance Matrix

| Metric | GPT-5 | GPT-5 Mini | Gemini Pro | Gemini Flash Lite | Claude Sonnet 4.5 | Claude Haiku 3.5 | Claude Opus 4.1 |
|--------|-------|-----------|------------|-------------------|-------------------|------------------|-----------------|
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Speed** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Cost** | 💰💰💰 | 💰 | 💰💰 | 💰 | 💰💰💰 | 💰 | 💰💰💰💰💰 |
| **Context** | 128K | 128K | 2M | 1M | 200K | 200K | 200K |
| **Free Tier** | 1M/day | 10M/day | 1500/day | 1500/day | Limited | Limited | Very Limited |

### Recommendation Summary

🏆 **Overall Best**: Claude Sonnet 4.5 (balanced quality/speed)
⚡ **Fastest**: Gemini 2.5 Flash Lite
💎 **Best Quality**: Claude Opus 4.1
💰 **Best Value**: Gemini 2.5 Flash
🆓 **Best Free**: OpenAI GPT-5 Mini (10M tokens/day)
📚 **Longest Context**: Gemini 2.5 Pro (2M tokens)

---

**Last Updated**: October 17, 2025
**Status**: All models tested and verified
**Coverage**: 15 models across 3 providers
