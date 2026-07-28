# Model Reference

Aligned with the shipping reply-only codebase.

All three providers are wired through the service worker. The user picks a default provider and
model in Settings; a saved model is only used when it belongs to the active provider, otherwise
each client falls back to its own default.

Two separate model choices exist per request:

1. **The writing model** — the user's selection, used to draft the reply.
2. **The reading model** — a fixed cheap vision-capable model per provider, used by
   [src/api/vision.ts](../../src/api/vision.ts) to read the tweet and its images. The writing model
   may have no vision at all, so this one is not user-configurable.

---

## 1. Defaults and Fallbacks

| Provider | Client default | Client fallback | Vision (reading) model |
|----------|----------------|-----------------|------------------------|
| OpenAI | `gpt-4o-2024-11-20` | `gpt-4o-mini-2024-07-18` | `gpt-4o-mini` |
| Gemini | `gemini-2.5-flash` | `gemini-2.5-flash-lite` | `gemini-2.5-flash-lite` |
| Claude | `claude-sonnet-5` | `claude-haiku-4-5` | `claude-haiku-4-5` |

`getDefaultModelForProvider()` in [src/constants/models.ts](../../src/constants/models.ts) supplies
the *settings UI* default when a saved model doesn't match the selected provider
(`gpt-5-mini-2025-08-07`, `gemini-2.5-flash`, `claude-sonnet-5`). The per-client constants above are
what run when no model is passed down at all.

**Token budgets:** replies cap at 300 output tokens; context summaries at 200.

---

## 2. Selectable Models

The full list shown in Settings lives in `OPENAI_MODELS`, `GEMINI_MODELS`, and `CLAUDE_MODELS` in
[src/constants/models.ts](../../src/constants/models.ts). Users can also add custom model ids, which
stay available across providers.

### Claude

> ⚠️ **These ids are complete as-is — never append a date suffix.**

| ID | Friendly name | Category |
|----|---------------|----------|
| `claude-opus-5` | Claude Opus 5 | Flagship, deepest reasoning |
| `claude-sonnet-5` | Claude Sonnet 5 | Balanced speed and quality (default) |
| `claude-haiku-4-5` | Claude Haiku 4.5 | Fastest and cheapest |

**Retired — these return 404:** `claude-opus-4-20250514`, `claude-3-5-sonnet-20241022`,
`claude-3-5-haiku-20241022`, `claude-3-haiku-20240307`. `claude-opus-4-1-20250805` retires
2026-08-05.

**`temperature`, `top_p`, and `top_k` are rejected with HTTP 400** on `claude-opus-5`,
`claude-sonnet-5`, and `claude-opus-4-7` / `claude-opus-4-8`. [src/api/claude.ts](../../src/api/claude.ts)
omits them for those prefixes and, for anything not on the list, retries once without them when the
API complains. Older Claude models still accept them.

### Gemini

| ID | Notes |
|----|-------|
| `gemini-2.5-pro` | 2M context. Gets `maxOutputTokens: 1024` and `thinkingBudget: 128` (Pro has a hard floor) |
| `gemini-2.5-flash` | Default. `thinkingBudget: 0`, 300 output tokens |
| `gemini-2.5-flash-lite` | Fallback + vision pass |

Leaving thinking enabled on a 300-token budget makes Gemini 2.5 spend the whole budget reasoning and
return `MAX_TOKENS` with empty text — that's why the budget is pinned to 0 for non-Pro models.

### OpenAI

Selectable ids span the GPT-5 and GPT-4.1/4o families plus dated snapshots. Two behaviours matter:

- `o1*` and `gpt-5*` prefixes only accept the default temperature, so the client omits `temperature` for them.
- If any other model reports a fixed-temperature error, the client remembers it for the session and retries without the parameter.

---

## 3. Request Shape

```typescript
interface GenerateRequest {
  prompt: string;                            // user intent (+ length hint)
  brandVoiceId: string;
  targetProfileId?: string;
  replyContext: TweetContext;                // always present — reply-only
  contextSummary?: string;                   // vision reading, when available
  toneAdjustment?: Partial<ToneAttributes>;
  provider?: AIProvider;
}
```

There are no `isThread`, `threadLength`, `fastMode`, `reasoning`, or `coding` flags — those belonged
to the pre-pivot compose product and were removed with it. Speed/quality is expressed by choosing a
model in Settings.

---

## 4. Brand Voice Influence

Every request builds a system prompt that includes:

- Brand voice description and guidelines
- Example tweets (numbered)
- V2 fields when present: approved/avoided vocabulary, do's and don'ts, Twitter platform rules
- Six tone sliders (formality, humor, technicality, empathy, energy, authenticity) with the panel's
  tone presets applied as a delta and clamped to 0-100
- Optional target profile data (average length, common phrases)

The user prompt then carries the thread, the tweet being replied to, the vision summary, and the
user's intent as separately labelled blocks.

---

## 5. Testing Tips

- **Provider routing:** the service worker logs the resolved provider and model on every generation. Check the service worker console.
- **Vision pass:** look for `Context analysis complete: { visionFailed: ... }`. `true` means images could not be read and the summary is text-only — generation still works.
- **Claude 400s:** if a request fails with a `temperature` complaint, the model is missing from `FIXED_TEMPERATURE_MODEL_PREFIXES`; the retry path covers it, but add the prefix so the first attempt succeeds.
- **Empty Gemini responses:** almost always the thinking budget. Verify `thinkingConfig` for the model you're testing.

---

## 6. Quick Reference Snippets

```typescript
// Draft a reply through the service worker
await chrome.runtime.sendMessage({
  type: 'generate',
  payload: {
    prompt: 'Agree, then add one concrete example.',
    brandVoiceId,
    replyContext,          // captured by the content script
    contextSummary,        // optional
    provider: 'claude',    // optional; falls back to settings.defaultProvider
  },
});

// Read the tweet in view (text + images)
await chrome.runtime.sendMessage({
  type: 'analyze-context',
  payload: { context: replyContext },
});
```

---

Need more detail? Pair this document with `docs/reference/API_REFERENCE.md` for function signatures
and `docs/guides/QUICK_REFERENCE.md` for UI-centric shortcuts.
