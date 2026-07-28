# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## Project Overview

Kotodama (言霊) is a Chrome/Edge extension for **replying** on Twitter/X. It is reply-only: the user opens a tweet, Kotodama reads it (text + preceding thread + attached images, via a cheap vision model), shows that reading back, the user types a short intent, and a reply is drafted in their brand voice. Brand voices and settings are stored locally with encrypted API keys.

There is no compose-a-new-tweet flow and no thread generation or thread posting. If a doc, comment, or test mentions those, it is stale — delete it, do not restore the feature.

## Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Build in watch mode |
| `npm run build` | Production build — two Vite passes + asset copy (see Build System) |
| `npm run type-check` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest |

**After finishing EVERY task or significant change you MUST run `npm run build`**, so `dist/` stays loadable. Then reload the unpacked extension at `chrome://extensions/` and refresh Twitter/X.

## Traps

These break silently. Check them before editing the file in question.

1. **Target tweet = the article immediately preceding the compose box**, not `articles[0]`. Taking the first article replies to the wrong tweet inside a thread. When the composer is a modal, scope lookups to `[role="dialog"]` or background timeline tweets leak into the context.
2. **Claude model ids are bare — never append a date suffix.** `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5`. Dated ids like `claude-3-5-sonnet-20241022` are retired and 404.
3. **Claude rejects `temperature`/`top_p`/`top_k` with HTTP 400** on `claude-opus-5`, `claude-sonnet-5`, `claude-opus-4-7`/`4-8`. The client omits them for those prefixes and self-heals by retrying without them.
4. **Gemini needs `thinkingConfig.thinkingBudget: 0`** on non-Pro models, or the 300-token output budget is spent thinking and the response comes back empty.
5. **The content script is built twice.** Pass 2 overwrites `dist/content.js` with a self-contained IIFE — a content script cannot use ES module imports. Editing only `vite.config.ts` will not affect what ships.
6. **Never hardcode `zinc-*`/`pink-*`.** Use the semantic Tailwind utilities (see Theming) or the element stops following the theme.
7. **Sanitizers are the trust boundary.** Everything scraped from the page is attacker-controlled text headed for a model prompt. Keep `sanitizeTweetContext`/`sanitizePrompt` on the path.
8. **Do not bump versions by hand.** `release-please` owns `package.json`; the build stamps that version into the manifest.

## Architecture

Manifest V3 extension, three execution contexts:

1. **Service worker** ([src/background/service-worker.ts](src/background/service-worker.ts)) — handles every message, dispatches provider calls, runs the vision pass, owns Dexie access, decrypts keys, rate limits. Declared as `background.js`.
2. **Content script** ([src/content/content-script.tsx](src/content/content-script.tsx)) — injected into twitter.com/x.com at `document_end`. Creates one host `<div id="kotodama-host">`, attaches a **shadow root**, mounts React into it (no iframe). Renders the draggable sparkle button (position in `chrome.storage.local` under `buttonPosition`), extracts + sanitizes the reply context on click, and inserts the chosen reply.
3. **React UIs** — **Panel** ([src/panel/Panel.tsx](src/panel/Panel.tsx)) is the reply composer and is *not* a standalone page; the content script mounts it into the shadow root. **Onboarding** ([src/onboarding/](src/onboarding/)) and **Settings** ([src/settings/](src/settings/)) each own an HTML page. React 19 + TypeScript + Tailwind 4.

### Data flow: drafting a reply

```
sparkle click
  → content script finds the tweet article immediately preceding the composer
    (dialog-scoped for modals), extracts text/author/timestamp/metrics/images
    + up to 10 preceding thread entries, sanitizes all of it
  → Panel mounts in the shadow root with that context
  → 'analyze-context' → src/api/vision.ts reads tweet + up to 4 images with a
    fixed cheap vision model, returns 1-3 plain sentences for the ContextCard.
    Any failure degrades to text-only; it never blocks generation.
  → user types intent, picks voice / tone presets / length
  → 'generate' → brand voice from Dexie, key decrypted from Chrome storage,
    selected provider called, draft saved to history if features.rememberHistory
  → draft lands in the result carousel (retry replaces one draft in place)
  → Insert → onInsert prop → content script writes into the contenteditable
```

### Build system

`npm run build` = three steps:

1. `vite build` ([vite.config.ts](vite.config.ts)) — entries: `background`, `content`, `onboarding`, `settings`. Custom filename sanitization strips leading underscores from Rollup outputs; without it Chrome refuses to load the extension.
2. `vite build -c vite.content.config.ts` — rebuilds the content script alone as one IIFE (`inlineDynamicImports`, `emptyOutDir: false`) and **overwrites `dist/content.js`**. This is what the manifest loads.
3. `node scripts/build.js` — copies icons and static config into `dist/`, and writes `dist/manifest.json` with the version taken from `package.json` (so the manifest can never drift from the released version).

### Message passing

`chrome.runtime.onMessage` with typed messages ([src/types/index.ts](src/types/index.ts)): `generate`, `analyze-context`, `analyze-profile` (handler exists, no UI sends it), `get-settings`/`save-settings`, `get-brand-voice`/`save-brand-voice`/`list-brand-voices`/`delete-brand-voice`, `open-settings`.

Panel messages go through [src/utils/runtime.ts](src/utils/runtime.ts) (`sendRuntimeMessage`), which retries and detects extension-context invalidation.

**There is no `window.postMessage` channel.** The panel lives in the content script's shadow root and talks to the page through React props (`initialContext`, `onInsert`, `onClose`).

### Storage

- **IndexedDB via Dexie** ([src/storage/db.ts](src/storage/db.ts)) — brand voices, reply history, and a `userProfiles` table nothing currently writes. Schema v2 adds `category`/`tags`/`isTemplate` and backfills newer tone attributes.
- **Chrome Storage** ([src/storage/settings.ts](src/storage/settings.ts)) — settings, button position, rate-limiter window, and API keys **encrypted** via Web Crypto ([src/storage/encryption.ts](src/storage/encryption.ts)) on save / decrypted on read.

### AI integration

The service worker resolves `request.provider ?? settings.defaultProvider ?? 'openai'` and dispatches through the `GENERATORS` map; a missing key for the chosen provider throws a user-facing error.

| Provider | Client `DEFAULT_MODEL` | Fallback | Notes |
|----------|------------------------|----------|-------|
| [OpenAI](src/api/openai.ts) | `gpt-4o-2024-11-20` | `gpt-4o-mini-2024-07-18` | Owns the shared `buildSystemPrompt`/`buildUserPrompt` that Gemini and Claude reuse. Omits `temperature` for `o1*`/`gpt-5*`, retries without it if rejected. |
| [Gemini](src/api/gemini.ts) | `gemini-2.5-flash` | `gemini-2.5-flash-lite` | See trap 4. |
| [Claude](src/api/claude.ts) | `claude-sonnet-5` | `claude-haiku-4-5` | See traps 2 and 3. |

**Two different "defaults" exist and they disagree for OpenAI.** `getDefaultModelForProvider` in [src/constants/models.ts](src/constants/models.ts) returns `gpt-5-mini-2025-08-07` and is what onboarding and Settings write into `settings.defaultModel`; the service worker passes that down as `preferredModel`. The client `DEFAULT_MODEL` above only applies when nothing is stored. So a fresh install actually writes with `gpt-5-mini-2025-08-07`, not `gpt-4o-2024-11-20`. Reconcile the two before trusting either as "the default".

**Vision pass** ([src/api/vision.ts](src/api/vision.ts)) uses its own fixed cheap vision-capable model per provider (`gpt-4o-mini`, `gemini-2.5-flash-lite`, `claude-haiku-4-5`), because the model picked for *writing* may have no vision at all. Images are fetched from `pbs.twimg.com`, inlined as base64, capped at 4.

### Twitter DOM integration

Capture depends on these selectors, which are fragile and may break on any Twitter UI change: `article[data-testid="tweet"]`, `[data-testid="tweetText"]`, `[data-testid="User-Name"]`, `[data-testid="tweetPhoto"] img`, `[data-testid="tweetTextarea_0"]`, `[role="textbox"][contenteditable="true"]`. Detection runs on button click — there is no MutationObserver.

`insertTweetContent` tries a synthetic `paste` event with a `DataTransfer` payload, falls back to `execCommand('insertText')`, then to setting `textContent`, and dispatches `input` + `change` so Twitter's counter and Post button update.

## Conventions

### Layout & visual style

- **Panel**: three zones — fixed header, one scrolling middle (context card + result carousel), pinned composer at the bottom.
- **Settings**: flat 224px sidebar (General, Brand voices, About) + left-aligned `max-w-2xl` column, inline in [src/settings/App.tsx](src/settings/App.tsx).
- **Onboarding**: single centred `max-w-[34rem]` column with a two-segment progress rule, inline in [src/onboarding/Onboarding.tsx](src/onboarding/Onboarding.tsx).
- There is **no shared layout component** — two pages with two shapes did not justify one. Do not reintroduce a `PageLayout`.
- Flat surfaces, hairline borders, one radius (`--koto-r`), no shadows outside the floating panel, no glass/blur/gradients. Sakura pink is a *marker* only (active nav, focus ring, selected draft) — never a button fill; primary buttons are ink-on-canvas inverted.

### Theming

[src/styles/design-system.css](src/styles/design-system.css) is the **only** token file. Every token is a single `light-dark()` pair, so `color-scheme` alone decides the scheme and "follow the OS" needs no JavaScript.

- Tokens live on `:root, :host` — `:host` because `:root` matches nothing inside the panel's shadow root.
- An explicit choice pins the scheme via `data-theme="light" | "dark"`; `auto` means the attribute is absent. [src/utils/theme.ts](src/utils/theme.ts) (`applyTheme`) is the only writer — `document.documentElement` on the two pages, the shadow **host** in the content script.
- The content script reads `user_settings.ui.theme` straight from `chrome.storage.local` (theme is not encrypted) and re-syncs on `chrome.storage.onChanged`, so the toggle repaints already-open X tabs.
- `@theme inline` maps tokens to utilities: `bg-canvas`, `bg-surface`, `bg-raise`, `border-line`, `border-line-strong`, `text-ink`, `text-muted`, `text-faint`, `text-accent-text`, `bg-accent`, `text-ok`, `text-danger`, `rounded-koto`. See trap 6.
- Repeated shapes live in four classes: `.koto-field`, `.koto-btn` (+`-primary`/`-secondary`/`-ghost`), `.koto-label`, `.koto-rule`.

### Code organisation

- One file per provider in `src/api/`, plus `vision.ts` for the reading pass.
- All shared types in [src/types/index.ts](src/types/index.ts). `GenerateRequest.replyContext` is always present (reply-only).
- Storage concerns stay split: `db` / `encryption` / `settings`.
- Tests colocate in `__tests__` subdirectories.
- TypeScript is strict; Chrome and Node types are included.

## Release process

Versioning is automated by `release-please` via GitHub Actions from Conventional Commit messages (`feat:` → minor, `fix:` → patch, `BREAKING CHANGE:` footer → major). Do not bump versions by hand or run semantic-release locally — `release-please` writes `package.json`, and `scripts/build.js` stamps that version into the built manifest.

## Agent workflows

Pre-defined in `.agent/workflows/`: `/changelog-update`, `/claude-update`, `/docs-update`, `/readme-update`, `/safeguard` (types + lint + test + build).

## Known issues

1. **Twitter DOM selectors** may break on any Twitter UI update. Symptom: context extraction returns `null` and the panel shows "No tweet in view".
2. **Thread context is capped** at the 10 most recent preceding tweets to bound prompt and vision cost, so long threads lose their opening.
3. **Profile analysis is a dead path** — `analyze-profile` and `analyzeTwitterProfile` exist, but no UI sends the message and nothing populates `userProfiles`, so `targetProfile` is always undefined.
4. **Service worker shows "inactive"** when idle in chrome://extensions. Normal MV3 behaviour; it wakes on message.
5. **Multi-language output** depends on the model. Responses may default to English unless the intent says otherwise.
6. **The reply-only build has never been manually tested in a browser.** See [docs/testing/TESTING.md](docs/testing/TESTING.md).

## Documentation

- [Full index](docs/README.md)
- [Development Guide](docs/development/DEVELOPMENT.md) — setup, workflows, conventions
- [Testing Guide](docs/testing/TESTING.md) — manual test plan for the reply flow
- [API Reference](docs/reference/API_REFERENCE.md) — provider client signatures and shapes
- [Model Reference](docs/reference/MODEL_REFERENCE.md) — models and per-provider caveats
- [Quick Reference](docs/guides/QUICK_REFERENCE.md) — common tasks
- [Project Map](docs/project/PROJECT_MAP.md) — codebase architecture
- [TODO](docs/project/TODO.md) — prioritised backlog
