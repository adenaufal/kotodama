# Kotodama Quick Reference Card

One-page cheatsheet for working on Kotodama v1.3.0. Updated: 2025-10-18.

---

## Panel Overview

- **Sparkle button (✨)** appears on every compose or reply box.
- **Header controls**
  - 🌗 Theme toggle (light ↔ dark)
  - ⚙️ Settings dashboard (brand voices, defaults, rerun onboarding)
  - ✖ Close panel
- **Context card** (reply mode) displays the original tweet and author handle.
- **Reply templates** populate the prompt with pre-written intents (supportive, analytical, humorous, etc.).
- **Thread toggle** switches between single tweets and numbered threads (2–10 items).
- **Insert to X** posts the generated text back into Twitter/X.

---

## Generation Payload (Service Worker)

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

- **Mandatory:** `prompt`, `brandVoiceId`.
- **Threads:** set `isThread = true` and `threadLength` (default 5).
- **Fast mode:** `fastMode = true` uses `gpt-4o-mini`. `fastMode = 'ultra'` is accepted but currently maps to the same mini model.
- **Reasoning:** `reasoning = true` routes to `o1-2024-12-17` (temperature is forced to 1).
- **Coding:** `coding = true` keeps `gpt-4o-2024-11-20` but adjusts prompts to favour structured output.
- **Target profiles** are stored as IndexedDB records and enrich the system prompt with common phrases and average tweet length.

> The UI currently sends only `prompt`, `brandVoiceId`, `isThread`, and `threadLength`. Additional flags can be exercised from devtools or future UI iterations.

---

## Model Mapping (OpenAI)

| Scenario                           | Model ID                 | Notes                                                |
|-----------------------------------|--------------------------|------------------------------------------------------|
| Default quality                   | `gpt-4o-2024-11-20`      | Primary path                                         |
| Alternate quality (`defaultModel`) | `gpt-4o-2024-08-06`      | Available via settings override                      |
| Fast mode (`fastMode = true`)     | `gpt-4o-mini`            | Faster + cheaper                                     |
| Fast fallback                     | `gpt-4o-mini-2024-07-18` | Triggered when mini path fails                       |
| Reasoning (`reasoning = true`)    | `o1-2024-12-17`          | Temperature forced to 1 by the OpenAI API            |

Automatic fallback removes the `temperature` parameter if the API complains about fixed-temperature models.

---

## Brand Voice Essentials

- **Stored fields:** name, description, optional guidelines, tone sliders (formality/humor/technicality), example tweets.
- **Creation paths:**
  1. Onboarding wizard (tweet URL auto-fetch + Markdown import).
  2. Settings → Brand Voice Manager (create, edit, delete, add/remove examples).
- **Defaults:** Onboarding sets a single voice and marks it as the default; settings lets you change or clear the default later.
- **Storage:** IndexedDB via Dexie (`brandVoices` table). Deletions and edits update timestamps for auditing.

---

## Reply Workflow Cheatsheet

1. Reply compose box triggers context capture through the content script.
2. Panel shows **Replying to @handle** + original tweet text.
3. Prompt is blank by default — choose a template to kick-start tone or type your own instructions.
4. Service worker augments the prompt with context and sends to OpenAI.
5. Button inserts the response at the cursor; panel remains open so you can tweak and re-insert.

---

## Settings Dashboard Shortcuts

- **API key management:** update OpenAI key; blank values remove it.
- **Default model:** choose between the available GPT-4o variants (populated from `OPENAI_MODELS`).
- **Theme toggle:** persists to `settings.ui.theme` (`light`, `dark`, or `auto` → treated as light in UI).
- **Brand Voice Manager:** modal with create/edit/delete, example tweet add/remove, tone slider adjustments.
- **Rerun onboarding:** opens `src/onboarding/index.html?skipRedirect=1` for a fresh setup pass.

---

## Handy Dev Commands

```bash
npm run build        # Production build + static asset copy
npm run dev          # Watch mode (rebuild on change)
npm run type-check   # TypeScript noEmit check
npm run lint         # ESLint over src/
npm test             # Vitest suite
```

Reload the unpacked extension after each build to exercise the latest bundle.

---

## Troubleshooting at Speed

- **Panel fails to open:** check DevTools console for `[Kotodama]` logs; ensure `dist/` HTML files exist.
- **Reply context missing:** verify selectors in `src/content/content-script.ts` still match Twitter’s markup.
- **Generation errors:** inspect service worker logs; temperature removal fallback typically resolves OpenAI fixed-temperature errors.
- **Icons look blurry:** convert SVG placeholders to PNG before shipping to the Chrome Web Store.
