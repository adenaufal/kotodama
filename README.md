# Kotodama

> 言霊 (Kotodama) — "the spirit of language"

A Chrome/Edge extension for **replying** on Twitter/X. Open a tweet, and Kotodama reads it — the text,
the thread above it, and any attached images via a vision model — shows you that reading, then drafts a
reply in a brand voice you defined.

Kotodama is reply-only. There is no compose-a-new-tweet flow and no thread generation.

## How it works

1. Open a tweet or its reply composer. A draggable sparkle button (✨) floats on the page.
2. Click it. The panel reads the tweet being replied to and shows a plain-language summary of what it
   found — including what is in the images.
3. Type what you want to say back, or pick one of 27 reply templates.
4. Optionally stack tone presets and choose a length (S / M / L).
5. Generate. Drafts land in a carousel; retry any one in place, then insert it into the reply box.

Everything is stored locally. API keys are encrypted with the Web Crypto API and never leave your
machine except to call the provider you chose.

## Install

Requires Node.js 20+ and Chrome or Edge (latest stable).

```bash
npm install
npm run build
```

Then load the `dist/` folder at `chrome://extensions/` with Developer mode enabled.

On first run, onboarding asks for **one** API key — OpenAI, Gemini, or Claude, your pick — and one
brand voice (a name plus at least one example tweet). The other providers can be added later in
Settings.

## Providers

All three are wired end-to-end and selectable in Settings.

| Provider | Model a new install selects | Fallback | Reading (vision) model |
|----------|-----------------------------|----------|------------------------|
| OpenAI   | `gpt-5-mini-2025-08-07`     | `gpt-4o-mini-2024-07-18` | `gpt-4o-mini` |
| Gemini   | `gemini-2.5-flash`          | `gemini-2.5-flash-lite`  | `gemini-2.5-flash-lite` |
| Claude   | `claude-sonnet-5`           | `claude-haiku-4-5`       | `claude-haiku-4-5` |

Change the model anytime in Settings. The first column is what onboarding stores as your default; if no
model is stored at all, the OpenAI client falls back to its own built-in default of `gpt-4o-2024-11-20`.

The reading pass always uses its own cheap vision-capable model, because the model you picked for
writing may have no vision at all. If reading fails, it degrades to a text-only summary and never
blocks generation.

Caveats per provider (Claude's bare model ids, Gemini's thinking budget, OpenAI's temperature rules)
are documented in [docs/reference/MODEL_REFERENCE.md](docs/reference/MODEL_REFERENCE.md).

## Architecture

Three execution contexts:

- **Content script** ([src/content/content-script.tsx](src/content/content-script.tsx)) — injected into
  twitter.com and x.com. Extracts the tweet being replied to, sanitizes it, and mounts the panel React
  tree into a **shadow root** on the page. No iframe.
- **Service worker** ([src/background/service-worker.ts](src/background/service-worker.ts)) — routes all
  provider calls, runs the vision pass, decrypts keys, and owns the rate limiter.
- **React UIs** — the panel (mounted in the shadow root by the content script), plus onboarding and
  settings as their own extension pages.

Storage is split between IndexedDB via Dexie (brand voices, draft history) and Chrome Storage
(settings, encrypted keys, button position).

```
src/
├── api/          # One client per provider + vision.ts for the reading pass
├── background/   # MV3 service worker
├── content/      # Twitter/X DOM integration + panel mounting
├── onboarding/   # First-run wizard (own page)
├── panel/        # Reply composer (mounted into the shadow root)
├── settings/     # Settings + brand voice manager (own page)
├── storage/      # Dexie schema, encryption, settings
├── styles/       # design-system.css is the only token file
└── types/        # Shared TypeScript contracts
```

Full map: [docs/project/PROJECT_MAP.md](docs/project/PROJECT_MAP.md).

## Development

```bash
npm run dev         # watch mode
npm run type-check  # tsc --noEmit
npm run lint        # eslint
npm test            # vitest
npm run build       # production build
```

`npm run build` runs two Vite passes plus an asset copy. The second pass rebuilds the content script
on its own as a self-contained IIFE and overwrites `dist/content.js` — a content script cannot use ES
module imports, so that pass is what the manifest actually loads. The build also stamps
`package.json`'s version into the copied manifest, so the two can't drift.

Reload the unpacked extension and refresh Twitter/X after each rebuild.

**Tech stack:** React 19, TypeScript 5.9 (strict), Vite 7, Tailwind CSS 4, Dexie 4, Web Crypto.

## Security

Everything extracted from the page is attacker-controlled text that ends up in a model prompt.
`sanitizeTweetContext` / `sanitizePrompt` ([src/utils/sanitize.ts](src/utils/sanitize.ts)) are the trust
boundary and are covered by prompt-injection tests. Generation is rate limited in the service worker.

No telemetry, no analytics, no data collection. Permissions are limited to `storage` and `activeTab`,
plus host access to twitter.com, x.com, `*.twimg.com` (image fetches for the reading pass), and the
three provider APIs.

## Known limitations

- **Twitter DOM selectors are fragile** and may break when Twitter ships UI changes. The symptom is the
  panel showing its "No tweet in view" empty state.
- **Thread context is capped** at the 10 most recent preceding tweets, so long threads lose their opening.
- **The reply-only build has not had a manual browser test pass.** See
  [docs/testing/TESTING.md](docs/testing/TESTING.md).
- **Profile analysis is a dead path** — the handler exists but no UI reaches it.

## Documentation

- [Quick Start](docs/guides/QUICKSTART.md) — install through first reply
- [Quick Reference](docs/guides/QUICK_REFERENCE.md) — common tasks at a glance
- [Development Guide](docs/development/DEVELOPMENT.md) — setup, workflows, conventions
- [Testing Guide](docs/testing/TESTING.md) — manual test plan for the reply flow
- [API Reference](docs/reference/API_REFERENCE.md) — provider client signatures and shapes
- [Model Reference](docs/reference/MODEL_REFERENCE.md) — models and per-provider caveats
- [Project Map](docs/project/PROJECT_MAP.md) — codebase architecture
- [TODO](docs/project/TODO.md) — prioritised backlog
- [Full index](docs/README.md)

## Releases

Versioning is automated by `release-please` from Conventional Commit messages — do not bump versions by
hand. See [docs/project/README_RELEASES.md](docs/project/README_RELEASES.md) and
[CHANGELOG.md](CHANGELOG.md).

## License

ISC — see [LICENSE](LICENSE).
