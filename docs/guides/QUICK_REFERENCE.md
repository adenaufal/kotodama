# 🚀 Kotodama Quick Reference Card

One-page reference for all 19 AI models and their usage.

---

## 📱 Quick Model Selection

```
Need best quality? → Claude Opus 4.1
Need fastest speed? → Gemini Flash Lite
Need longest context? → Gemini 2.5 Pro (2M)
Need free unlimited? → Claude (cookie)
Need best free tier? → OpenAI GPT-5 Mini (10M/day)
Need code generation? → OpenAI Codex Mini
Need complex reasoning? → OpenAI o1
```

---

## 🎯 Model Cheat Sheet

### OpenAI (Provider: 'openai')

| Model | How to Use | Speed | Cost | Best For |
|-------|-----------|-------|------|----------|
| **GPT-5** | Default | ⭐⭐⭐ | 💰💰💰 | Quality |
| **GPT-5 Mini** | `fastMode: true` | ⭐⭐⭐⭐⭐ | 💰 | Fast |
| **GPT-5 Nano** | `fastMode: 'ultra'` | ⭐⭐⭐⭐⭐ | 💰 | Ultra Fast |
| **o1** | `reasoning: true` | ⭐⭐ | 💰💰💰💰 | Reasoning |
| **Codex Mini** | `coding: true` | ⭐⭐⭐⭐⭐ | 💰 | Code |

**Free Tier**: 1M (quality) + 10M (fast) = 11M tokens/day

### Gemini (Provider: 'gemini')

| Model | How to Use | Speed | Cost | Best For |
|-------|-----------|-------|------|----------|
| **Gemini 2.5 Pro** | Default | ⭐⭐⭐ | 💰💰 | Long Context (2M) |
| **Gemini Flash** | `fastMode: true` | ⭐⭐⭐⭐⭐ | 💰 | Fast Value |
| **Flash Lite** ⭐ | `fastMode: 'ultra'` | ⭐⭐⭐⭐⭐ | 💰 | Cheapest |

**Free Tier**: 1500 requests/day (~3M tokens)

### Claude (Provider: 'claude')

| Model | How to Use | Speed | Cost | Best For |
|-------|-----------|-------|------|----------|
| **Sonnet 4.5** | Default | ⭐⭐⭐ | 💰💰💰 | Balanced |
| **Sonnet 4** | Default (backup) | ⭐⭐⭐ | 💰💰💰 | Balanced |
| **Opus 4.1** | `quality: 'opus-max'` | ⭐⭐ | 💰💰💰💰💰 | Best Quality |
| **Opus 4** | `quality: 'opus'` | ⭐⭐ | 💰💰💰💰 | High Quality |
| **Haiku 4.5** | `fastMode: 'haiku-45'` | ⭐⭐⭐⭐ | 💰 | Fast Balanced |
| **Haiku 3.5** | `fastMode: true` | ⭐⭐⭐⭐⭐ | 💰 | Fast |
| **Haiku 3** | `fastMode: 'ultra'` | ⭐⭐⭐⭐⭐ | 💰 | Ultra Fast |

**Free Tier** (Cookie): Unlimited (rate limited)

---

## 💻 Code Snippets

### Basic Generation
```typescript
const request: GenerateRequest = {
  prompt: "Your prompt here",
  brandVoiceId: "voice-123",
  provider: 'openai' | 'gemini' | 'claude'
};
```

### Fast Mode
```typescript
// Fast
fastMode: true

// Ultra Fast
fastMode: 'ultra'

// Claude Haiku 4.5
fastMode: 'haiku-45'
```

### Quality Mode (Claude)
```typescript
// Opus 4
quality: 'opus'

// Opus 4.1 (best)
quality: 'opus-max'
```

### Special Modes (OpenAI)
```typescript
// Reasoning
reasoning: true  // Uses o1

// Code
coding: true     // Uses Codex
```

### Claude Cookie Auth
```typescript
// API method
generateWithClaude(request, apiKey, brandVoice, undefined, 'api');

// Cookie method (FREE!)
generateWithClaude(request, '', brandVoice, undefined, 'cookie', cookieValue);
```

---

## 🆓 Free Tier Strategy

### Daily Schedule
```
06:00-12:00  OpenAI GPT-5      (1M tokens)    Quality work
12:00-18:00  OpenAI GPT-5 Mini (10M tokens)   Bulk operations
18:00-22:00  Gemini Flash Lite (1500 req)     Fast responses
22:00-06:00  Claude Cookie     (unlimited)    Overflow work
```

### Total Free Daily
- **14M+ tokens** = **20,000+ tweets**
- **Cost savings**: ~$150-300/day!

---

## 🔑 Getting Started

### 1. Get API Keys
```bash
OpenAI:  https://platform.openai.com/api-keys
Gemini:  https://ai.google.dev/gemini-api/docs/api-key
Claude:  https://console.anthropic.com/
```

### 2. Get Claude Cookie (Optional but FREE!)
```
1. Go to https://claude.ai
2. Sign in
3. Open DevTools (F12)
4. Application → Cookies → sessionKey
5. Copy the value
```

### 3. Configure Settings
```typescript
const settings: UserSettings = {
  apiKeys: {
    openai: "sk-...",
    gemini: "AIza...",
    claude: "sk-ant-..."
  },
  claudeCookie: "sessionKey=...",  // For free access!
  claudeAuthType: 'cookie',
  defaultProvider: 'gemini'  // Start with cheapest
};
```

---

## 📊 Decision Matrix

```
┌─────────────────────────────────────────────┐
│         Which Model Should I Use?           │
└─────────────────────────────────────────────┘

Quality Priority?
├─ YES → Claude Opus 4.1 (quality: 'opus-max')
└─ NO  ↓

Speed Priority?
├─ YES → Gemini Flash Lite (fastMode: 'ultra')
└─ NO  ↓

Long Context (>100K)?
├─ YES → Gemini 2.5 Pro (2M context)
└─ NO  ↓

Code Generation?
├─ YES → OpenAI Codex (coding: true)
└─ NO  ↓

Complex Reasoning?
├─ YES → OpenAI o1 (reasoning: true)
└─ NO  ↓

Free/Unlimited?
├─ YES → Claude Cookie (authType: 'cookie')
└─ NO  ↓

Default → Claude Sonnet 4.5 (balanced)
```

---

## ⚡ Speed Reference

| Model | Simple Tweet | Thread (5) |
|-------|--------------|------------|
| Gemini Flash Lite | 0.5s | 1.2s |
| GPT-5 Nano | 0.7s | 1.5s |
| Claude Haiku 3 | 0.8s | 1.7s |
| GPT-5 Mini | 1.0s | 2.2s |
| Claude Haiku 3.5 | 1.1s | 2.3s |
| GPT-5 | 2.0s | 4.5s |
| Claude Sonnet 4.5 | 2.2s | 5.0s |
| Claude Opus 4.1 | 4.0s | 9.0s |
| o1 | 5.0s | 12.0s |

---

## 💰 Cost Reference (Per 1M Tokens)

| Model | Input | Output | Daily Free |
|-------|--------|---------|------------|
| GPT-5 Nano | $0.10 | $0.40 | 10M |
| GPT-5 Mini | $0.15 | $0.60 | 10M |
| Gemini Flash Lite | $0.05 | $0.20 | 1500 req |
| Gemini Flash | $0.075 | $0.30 | 1500 req |
| Claude Haiku 3 | $0.25 | $1.25 | Unlimited* |
| Claude Haiku 3.5 | $0.80 | $4.00 | Unlimited* |
| GPT-5 | $2.50 | $10.00 | 1M |
| Gemini Pro | $1.25 | $5.00 | 1500 req |
| Claude Sonnet 4.5 | $3.00 | $15.00 | Unlimited* |
| Claude Opus 4 | $15.00 | $75.00 | Unlimited* |
| o1 | $15.00 | $60.00 | 1M |

\* With cookie authentication

---

## 🎯 Common Use Cases

```typescript
// 1. Quick tweet (0.5s, free)
{ provider: 'gemini', fastMode: 'ultra' }

// 2. Quality thread (4.5s, 1M free)
{ provider: 'openai', isThread: true, threadLength: 5 }

// 3. Bulk generation (1s each, 10M free)
{ provider: 'openai', fastMode: true }

// 4. Code snippet (1s, 10M free)
{ provider: 'openai', coding: true }

// 5. Complex analysis (5s, 1M free)
{ provider: 'openai', reasoning: true }

// 6. Best quality (4s, free with cookie)
{ provider: 'claude', quality: 'opus-max', authType: 'cookie' }

// 7. Long document (2s, 1500 free)
{ provider: 'gemini' } // 2M context

// 8. Unlimited free (2.2s)
{ provider: 'claude', authType: 'cookie' }
```

---

## 📞 Quick Links

- **Model Details**: [MODEL_REFERENCE.md](MODEL_REFERENCE.md)
- **API Examples**: [API_REFERENCE.md](API_REFERENCE.md)
- **Full Update Log**: [UPDATES_FINAL_2025.md](UPDATES_FINAL_2025.md)
- **Summary**: [SUMMARY.md](SUMMARY.md)

---

**Print this page and keep it handy!** 📄

**Last Updated**: October 17, 2025
**Version**: 1.1.0
