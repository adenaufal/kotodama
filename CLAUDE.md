# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kotodama (言霊) is a Chrome/Edge browser extension that helps users compose tweets and replies using AI while maintaining their unique brand voice. The extension injects into Twitter/X pages, provides a side panel UI for tweet generation, and stores brand voices and settings locally with encrypted API keys.

## Common Commands

### Development
- `npm run dev` - Build in watch mode (rebuilds on file changes)
- `npm run build` - Production build (runs prebuild script + vite build)
- `npm run type-check` - Run TypeScript type checking without emitting files
- `npm run lint` - Lint the codebase with ESLint
- `npm test` - Run all tests with Vitest

### Testing Extension
After building, load the `dist/` folder as an unpacked extension in Chrome/Edge at `chrome://extensions/` with Developer mode enabled. Reload the extension and refresh Twitter/X pages after each rebuild.

## Architecture

### Chrome Extension Structure

This is a Manifest V3 Chrome extension with three main execution contexts:

1. **Background Service Worker** ([src/background/service-worker.ts](src/background/service-worker.ts))
   - Message handler for all extension operations
   - Orchestrates API calls to OpenAI/Gemini/Claude
   - Manages IndexedDB operations via Dexie
   - Handles settings encryption/decryption
   - Entry point defined in [public/manifest.json](public/manifest.json) as `background.js`

2. **Content Script** ([src/content/content-script.ts](src/content/content-script.ts))
   - Injected into twitter.com and x.com pages
   - Detects compose boxes using MutationObserver
   - Injects floating AI button (sparkle icon)
   - Creates and manages the side panel iframe
   - Handles message passing between page ↔ panel ↔ background
   - Inserts generated tweets into Twitter's contenteditable divs

3. **React UIs** (two separate apps)
   - **Panel UI** ([src/panel/](src/panel/)): Side panel for tweet composition
   - **Onboarding UI** ([src/onboarding/](src/onboarding/)): First-run setup wizard
   - Both are built with React 19 + TypeScript + Tailwind CSS

### Build System

Vite builds multiple entry points defined in [vite.config.ts](vite.config.ts):
- `panel` → HTML page for side panel
- `background` → Service worker script
- `content` → Content script for Twitter injection
- `onboarding` → HTML page for setup wizard

**Critical Build Detail**: The build uses custom filename sanitization to strip leading underscores from Rollup outputs, which prevents Chrome extension loading errors. See [vite.config.ts:5-26](vite.config.ts#L5-L26).

The [scripts/build.js](scripts/build.js) post-build script copies `manifest.json` and icon files from `public/` to `dist/`.

### Data Flow: Tweet Generation

```
1. User clicks AI button in Twitter compose box
   ↓
2. Content script opens side panel iframe
   ↓
3. Panel UI sends 'generate' message to background
   ↓
4. Background service worker:
   - Retrieves brand voice from IndexedDB (Dexie)
   - Decrypts API key from Chrome storage
   - Calls AI API (OpenAI/Gemini/Claude)
   - Saves generated tweet to history
   ↓
5. Returns generated content to panel
   ↓
6. User clicks "Insert to Twitter"
   ↓
7. Panel posts message to content script
   ↓
8. Content script inserts text into Twitter's contenteditable div
```

### Storage Architecture

Two storage mechanisms are used:

1. **IndexedDB via Dexie** ([src/storage/db.ts](src/storage/db.ts))
   - Brand voices with tone attributes
   - User profile analyses (for reply targeting)
   - Generated tweet history
   - Schema version 1 with three tables

2. **Chrome Storage API** ([src/storage/settings.ts](src/storage/settings.ts))
   - User settings (UI preferences, feature flags)
   - **Encrypted** API keys using Web Crypto API ([src/storage/encryption.ts](src/storage/encryption.ts))
   - Keys are encrypted before saving, decrypted on retrieval

### Message Passing

All cross-context communication uses `chrome.runtime.onMessage` with typed messages ([src/types/index.ts](src/types/index.ts)):
- `generate` - Request tweet generation
- `analyze-profile` - Analyze a Twitter user's style
- `get-settings` / `save-settings` - Settings management
- `get-brand-voice` / `save-brand-voice` / `list-brand-voices` - Brand voice CRUD

Between content script and panel, `window.postMessage` is used:
- `context` - Send reply context to panel
- `insert-tweet` - Request tweet insertion
- `close-panel` - Close the side panel

### AI Integration

The extension supports three providers ([src/api/](src/api/)):

**OpenAI** ([src/api/openai.ts](src/api/openai.ts)) - Primary provider with model fallback chain:
- Default: `gpt-5-2025-08-07` (latest GPT-5)
- Fast mode: `gpt-5-mini-2025-08-07` or `gpt-5-nano-2025-08-07`
- Reasoning mode: `o1-2024-12-17`
- Coding mode: `codex-mini-latest`
- Fallback: `gpt-4o-2024-11-20` → `gpt-4o-mini-2024-07-18`

The `generateWithOpenAI` function builds a system prompt from brand voice attributes (tone, guidelines, example tweets) and optional target profile (for reply adaptation). It automatically retries with fallback models on API errors.

**Gemini** ([src/api/gemini.ts](src/api/gemini.ts)) - Future support (v1.1 planned)

**Claude** ([src/api/claude.ts](src/api/claude.ts)) - Future support (v1.2 planned)

### Type System

All TypeScript types are centralized in [src/types/index.ts](src/types/index.ts):
- `BrandVoice` - User's writing style with tone attributes (formality, humor, technicality)
- `UserProfile` - Analyzed Twitter users for reply targeting
- `GeneratedTweet` - Tweet history with token usage tracking
- `GenerateRequest`/`GenerateResponse` - API request/response shapes
- `UserSettings` - All user preferences and encrypted API keys
- `Message`/`MessageResponse` - Message passing contracts

### Twitter DOM Integration

The content script detects Twitter compose boxes using selectors ([src/content/content-script.ts:28-31](src/content/content-script.ts#L28-L31)):
- `[data-testid="tweetTextarea_0"]`
- `[role="textbox"][contenteditable="true"]`

**Important**: These selectors are fragile and may break when Twitter updates their UI. The MutationObserver continuously monitors for new compose boxes appearing dynamically.

Tweet insertion ([src/content/content-script.ts:225-261](src/content/content-script.ts#L225-L261)) sets `textContent` on the contenteditable div and dispatches an `input` event to trigger Twitter's character counter.

## Key Conventions

### File Organization
- Entry points for each context have corresponding HTML files in their directories
- API clients are in `src/api/` with one file per provider
- Storage utilities are in `src/storage/` with separation of concerns (db, encryption, settings)
- Tests are colocated in `__tests__` subdirectories

### TypeScript Configuration
- Strict mode enabled
- Target ES2020 with DOM APIs
- Bundler module resolution
- Chrome and Node types included

### Extension Manifest
The [public/manifest.json](public/manifest.json) declares:
- `manifest_version: 3` (required for new Chrome extensions)
- Host permissions limited to `twitter.com` and `x.com`
- Minimal permissions: `storage` and `activeTab`
- Service worker as `background.js` with `type: "module"`

## Release Process

Versioning is automated by `release-please` via GitHub Actions. Do not manually update version numbers or run semantic-release locally. The `_releasePleaseNote` in [package.json](package.json#L52) documents this.

Commit messages must follow Conventional Commits format:
- `feat:` triggers minor version bump
- `fix:` triggers patch version bump
- `BREAKING CHANGE:` in footer triggers major version bump

## Known Issues

1. **SVG Icons**: Icon files are currently SVG placeholders. Chrome requires PNG for production extensions.
2. **Twitter DOM Selectors**: May break with Twitter UI updates. Monitor for compose box detection failures.
3. **Profile Tweet Scraping**: Not yet implemented. The `fetchUserTweets` function ([src/content/content-script.ts:263](src/content/content-script.ts#L263)) returns empty array as placeholder.
4. **Service Worker Status**: The background service worker may show as "inactive" in chrome://extensions when idle, but it activates automatically when messages are sent. This is normal Chrome MV3 behavior for event-based service workers.
5. **Multi-language Generation**: Language support depends on the AI model's capabilities. GPT-4 and GPT-5 models support multiple languages well, but responses may default to English if the prompt isn't explicit about language requirements.

## Documentation

All project documentation is organized in the [docs/](docs/) directory:

- **[Development Guide](docs/development/DEVELOPMENT.md)** - Development setup, workflows, and conventions
- **[Testing Guide](docs/testing/TESTING.md)** - Comprehensive testing documentation
- **[Testing Recommendations](docs/testing/TESTING-RECOMMENDATIONS.md)** - Best practices for testing
- **[Testing Checklist](docs/testing/tested-checklist-18102025.md)** - Current testing status
- **[API Reference](docs/reference/API_REFERENCE.md)** - API endpoints and usage
- **[Model Reference](docs/reference/MODEL_REFERENCE.md)** - AI model configurations
- **[Quick Reference](docs/guides/QUICK_REFERENCE.md)** - Common tasks and commands
- **[Project Map](docs/project/PROJECT_MAP.md)** - Codebase architecture overview
- **[Full Documentation Index](docs/README.md)** - Complete documentation structure

For the latest testing status, refer to [docs/testing/tested-checklist-18102025.md](docs/testing/tested-checklist-18102025.md).
