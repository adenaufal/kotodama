# Kotodama Quick Reference Card

One-page cheatsheet for working on Kotodama. Reply-only product.

---

## Panel Overview

- **Sparkle button (✨)** floats on every Twitter/X page and can be dragged; its position persists in `chrome.storage.local`.
- **Header** shows `Reply to @handle` (or `Kotodama` when no tweet was captured), a settings gear, and a close button.
- **Context card** shows the captured tweet — author, relative time, text, image thumbnails, collapsible preceding thread — plus the AI reading of it (1-3 sentences from the vision pass, with a retry if it fails).
- **Intent box** is where the user types what they want to say back. It is the only required input.
- **Reply templates** pre-fill the intent box with a written-out instruction (encouraging, empathetic, celebrate, …).
- **Tone presets** (`formal`, `casual`, `humor`, `professional`) stack into a single `toneAdjustment` delta on top of the brand voice.
- **Length** is a three-way S / M / L control that appends a length hint to the prompt.
- **Result carousel** holds every draft from this session; each card offers Insert, Copy, and Retry (retry replaces that draft in place).
- **Insert** writes the selected draft into the reply compose box.

No compose-a-new-tweet flow, no thread generation, no thread posting — those were removed in the reply-only pivot.

---

## Generation Payload (Service Worker)

```typescript
interface GenerateRequest {
  prompt: string;                            // user intent + length hint
  brandVoiceId: string;
  targetProfileId?: string;
  replyContext: TweetContext;                // always present — reply-only
  contextSummary?: string;                   // vision reading, when available
  toneAdjustment?: Partial<ToneAttributes>;
  provider?: AIProvider;                     // 'openai' | 'gemini' | 'claude'
}
```

- **Mandatory:** `prompt`, `brandVoiceId`, `replyContext`.
- **`contextSummary`** is omitted when the vision pass failed or is still running; generation proceeds without it.
- **Provider** falls back to `settings.defaultProvider`, then `openai`.
- **Target profiles** are stored as IndexedDB records and enrich the system prompt, but nothing in the current UI creates them.

### Context Payload

```typescript
interface AnalyzeContextRequest {
  context: TweetContext;
  provider?: AIProvider;
}
// → { summary: string; provider: AIProvider; visionFailed?: boolean }
```

---

## Model Mapping

| Provider | Client default | Fallback | Vision pass |
|----------|----------------|----------|-------------|
| OpenAI   | `gpt-4o-2024-11-20` | `gpt-4o-mini-2024-07-18` | `gpt-4o-mini` |
| Gemini   | `gemini-2.5-flash` | `gemini-2.5-flash-lite` | `gemini-2.5-flash-lite` |
| Claude   | `claude-sonnet-5` | `claude-haiku-4-5` | `claude-haiku-4-5` |

A user-selected `defaultModel` only overrides the default when it belongs to the active provider. Note
that onboarding *always* writes one, and for OpenAI it writes `gpt-5-mini-2025-08-07` — so the client
default above rarely runs in practice. See [MODEL_REFERENCE.md](../reference/MODEL_REFERENCE.md).

**Claude ids are bare — never append a date suffix.** `temperature` / `top_p` / `top_k` return HTTP 400 on `claude-opus-5`, `claude-sonnet-5`, and `claude-opus-4-7`/`4-8`; the client omits them for those prefixes.

**OpenAI** drops `temperature` for `o1*` / `gpt-5*` prefixes and retries without it if the API complains.

---

## Brand Voice Essentials

- **Stored fields:** name, description, optional guidelines, six tone sliders (formality, humor, technicality, empathy, energy, authenticity), example tweets, plus optional V2 fields (vocabulary, do's/don'ts, platform guidelines).
- **Creation paths:**
  1. Onboarding wizard (tweet URL auto-fetch + Markdown import).
  2. Settings → Brand Voices (create, edit, delete, add/remove examples).
- **Defaults:** Onboarding sets a single voice and marks it as the default; settings lets you change or clear the default later.
- **Storage:** IndexedDB via Dexie (`brandVoices` table).

---

## Reply Workflow Cheatsheet

1. User opens a tweet or a reply composer and clicks the floating button.
2. The content script picks the tweet article immediately preceding the compose box (scoped to the reply dialog when it is a modal) and extracts text, author, images, metrics, and up to 10 preceding thread entries.
3. Everything extracted is sanitized before it leaves the page.
4. The panel fires `analyze-context`; the vision model returns 1-3 plain sentences describing what the tweet is about, including its images.
5. The user types an intent, optionally picks a template, tone presets, and length.
6. `generate` builds the prompt from brand voice + context + summary + intent and calls the provider.
7. Insert writes the draft into the compose box; the panel stays open.

---

## Settings Dashboard Shortcuts

- **API key management:** one key per provider; blank values remove it.
- **Default provider & model:** model list comes from `src/constants/models.ts`, filtered to the active provider.
- **Brand Voices:** dedicated sidebar page with create/edit/delete and example tweet management.
- **Rerun onboarding:** opens `src/onboarding/index.html?skipRedirect=1` for a fresh setup pass.

---

## Handy Dev Commands

```bash
npm run build        # Two Vite passes + static asset copy
npm run dev          # Watch mode (rebuild on change)
npm run type-check   # TypeScript noEmit check
npm run lint         # ESLint over src/
npm test             # Vitest suite
```

Reload the unpacked extension after each build to exercise the latest bundle.

---

## Troubleshooting at Speed

- **Panel shows "No tweet in view":** context extraction returned `null`. Check the selectors in `src/content/content-script.tsx` against Twitter's current markup.
- **Panel fails to open:** check the page DevTools console for `[Kotodama]` logs; the panel lives in `#kotodama-host`'s shadow root, so it logs to the page console.
- **Context card stuck on the error state:** the vision call failed. Generation still works without it — hit retry, or check the provider key.
- **Generation errors:** inspect the service worker console; the temperature-removal fallback usually resolves fixed-temperature model errors.
- **"Extension was reloaded" overlay:** the runtime was invalidated by a rebuild. Refresh the page.
