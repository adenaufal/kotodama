# Model Reference (v1.6.0)

Updated 2026-02-08 — aligns with the shipping Kotodama codebase.

Kotodama currently routes all AI generation through OpenAI’s GPT-4o family. Gemini and Claude clients exist in `src/api/`, but the service worker still targets OpenAI exclusively. This reference documents what is live today and what’s ready for the next integration step.

---

## 1. OpenAI Models in Use

| ID | Friendly Name | Typical Use | Notes |
|----|---------------|-------------|-------|
| `gpt-5-2025-08-07` | GPT-5 (Latest) | Default path for tweets, threads, replies | Configurable as the default model in settings |
| `gpt-4o-2024-11-20` | GPT-4o Quality | High-quality alternative | Preferred model for non-reasoning tasks |
| `gpt-5-mini-2025-08-07` | GPT-5 Mini | Fast mode (`fastMode = true`) | High speed, 10M free tokens/day |
| `gpt-5-nano-2025-08-07` | GPT-5 Nano | Ultra fast mode (`fastMode = 'ultra'`) | Direct ultra-low-latency generation |
| `gpt-4o-mini-2024-07-18` | GPT-4o Mini | Fallback | Auto-retry when the latest models fail |
| `o1-2024-12-17` | OpenAI o1 | Reasoning (`reasoning = true`) | Temperature removed automatically |

All OpenAI requests hit `https://api.openai.com/v1/chat/completions`. Thread requests cap `max_completion_tokens` at 1500; single tweets use 300.

### Token & Cost Reference (check [OpenAI pricing](https://openai.com/pricing) for updates)

| Model | Context Window | Approx. Input / Output Cost (per 1M tokens) |
|-------|----------------|---------------------------------------------|
| `gpt-4o-2024-11-20` | 128K tokens | $5.00 / $15.00 |
| `gpt-4o-mini` | 128K tokens | $0.15 / $0.60 |
| `o1-2024-12-17` | 128K tokens | $15.00 / $60.00 |

> Costs are indicative; always confirm the latest pricing before budgeting usage.

---

## 2. Request Flags & Behaviour

```typescript
interface GenerateRequest {
  prompt: string;
  brandVoiceId: string;
  targetProfileId?: string;
  isThread?: boolean;
  threadLength?: number;
  fastMode?: boolean | 'ultra';
  reasoning?: boolean;
  coding?: boolean;
}
```

- **`fastMode = true`** → `gpt-5-mini-2025-08-07`
- **`fastMode = 'ultra'`** → `gpt-5-nano-2025-08-07`
- **`reasoning = true`** → `o1-2024-12-17`
- **`coding = true`** → stays on GPT-4o but frames prompts for structured/code output
- **Threads**: `isThread = true` transforms the UI response into an array of tweets after stripping numbering
- **Fallback logic**:
  - Mini requests retry with `gpt-4o-mini-2024-07-18`
  - Reasoning requests remove the `temperature` parameter when the API raises an error about fixed-temperature models

---

## 3. Brand Voice Influence

Every request builds a system prompt that includes:

- Brand voice description and guidelines
- Example tweets (numbered)
- Tone sliders (formality, humor, technicality)
- Optional target profile data (average length, common phrases)

For replies, the user prompt is prefixed with the original tweet text and username to ensure context-aware responses.

---

## 4. Preparing for Gemini & Claude

The following pieces are already in the repository and can be activated once multi-provider selection is introduced:

| Provider | File | Status |
|----------|------|--------|
| Google Gemini | `src/api/gemini.ts` | Generates content, supports Pro/Flash/Flash-Lite, auto-fallback |
| Anthropic Claude | `src/api/claude.ts` | Supports API-key and cookie auth; handles Sonnet, Opus, Haiku variants |
| Model metadata | `src/constants/models.ts` | Currently OpenAI-only; extend with Gemini/Claude entries |

To complete the integration:
1. Add provider selection UI in the panel and settings.
2. Teach the service worker to branch on `request.provider` and pull the right credentials.
3. Persist any new secret types (Gemini key, Claude key/cookie) with encryption.
4. Update documentation, tests, and telemetry once real usage is confirmed.

---

## 5. Testing Tips

- **OpenAI requests**: Inspect the service worker console for `[Kotodama Performance]` logs to confirm model selection and timing.
- **Thread parsing**: For debugging, log the raw string returned before the newline split to verify numbering.
- **Reasoning mode**: Expect longer response times; keep prompts concise to stay within token limits.
- **Fallback verification**: Temporarily force an invalid temperature on `o1` to watch the retry logic remove it.

---

## 6. Quick Reference Snippets

```typescript
// Standard tweet
await generateWithOpenAI({ prompt, brandVoiceId }, openaiKey, voice);

// Fast mode from devtools
await chrome.runtime.sendMessage({
  type: 'generate',
  payload: { prompt, brandVoiceId, fastMode: true }
});

// Thread (5 tweets)
await chrome.runtime.sendMessage({
  type: 'generate',
  payload: { prompt, brandVoiceId, isThread: true, threadLength: 5 }
});
```

---

Need more detail? Pair this document with `docs/reference/API_REFERENCE.md` for function signatures and `docs/guides/QUICK_REFERENCE.md` for UI-centric shortcuts.
