# Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Build for development (watch mode)
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

`npm run build` runs Vite twice: the main config builds the service worker, onboarding, and
settings, then `vite.content.config.ts` rebuilds the content script alone and overwrites
`dist/content.js` with a single self-contained IIFE. Content scripts cannot use ES module
imports, so that second pass is the bundle the manifest actually loads.

## Project Architecture

### Extension Components

1. **Content Script** ([src/content/content-script.tsx](src/content/content-script.tsx))
   - Runs on Twitter/X pages
   - Mounts a React app into a shadow root on a single injected host element (no iframe)
   - Renders the draggable floating sparkle button
   - Captures the tweet being replied to and sanitizes it
   - Handles content insertion into the compose box

2. **Background Service Worker** ([src/background/service-worker.ts](src/background/service-worker.ts))
   - Processes messages from the panel and content script
   - Makes API calls to OpenAI, Gemini, and Claude (all three are wired)
   - Runs the vision context-reading pass ([src/api/vision.ts](src/api/vision.ts))
   - Manages data storage (IndexedDB)
   - Handles encryption/decryption

3. **Panel** ([src/panel/Panel.tsx](src/panel/Panel.tsx))
   - React reply composer, mounted by the content script into its shadow root
   - Shows the captured tweet plus the AI reading of it (context card)
   - Reply templates, tone presets, and a length control feed the prompt
   - Drafts appear in a carousel; Insert calls back through the `onInsert` prop

4. **Onboarding** ([src/onboarding/](src/onboarding/))
   - First-time setup wizard
   - API key configuration (encrypted locally)
   - Brand voice creation with markdown import and tweet URL helpers

### Data Layer

#### IndexedDB (via Dexie)
- **brandVoices**: User-defined writing styles
- **userProfiles**: Analyzed Twitter user profiles
- **generatedTweets**: History of generated content (only persisted when `rememberHistory` is enabled in settings)

#### Chrome Storage
- **user_settings**: Encrypted API keys, UI preferences (theme, panel width, button position), feature flags, and default voice/model selections

### Message Flow

```
┌──────────────────────────────┐          ┌──────────────────┐
│ Content script (shadow root) │          │  Background SW   │
│                              │          │                  │
│   ┌──────────────────────┐   │ chrome.  │                  │
│   │  Panel (React)       │───┼─runtime.─►                  │
│   └──────────▲───────────┘   │ sendMsg  └────────┬─────────┘
│              │ React props   │                   │
│   onInsert / onClose         │                   ▼
└──────────────────────────────┘          ┌──────────────────┐
                                          │ OpenAI / Gemini  │
                                          │ / Claude APIs    │
                                          └──────────────────┘
```

The panel is a component inside the content script's shadow root, so it talks to
the page through React props — there is no `window.postMessage` channel.

## Key Technologies

- **React 19**: UI components
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Tailwind CSS 4**: Styling
- **Dexie.js**: IndexedDB wrapper
- **Web Crypto API**: Encryption

## Testing in Development

### Loading the Extension

1. Build: `npm run build`
2. Open Chrome: `chrome://extensions/`
3. Enable Developer Mode
4. Click "Load unpacked"
5. Select the `dist` folder

### Reloading After Changes

1. Run `npm run dev` (watch mode)
2. After changes, go to `chrome://extensions/`
3. Click refresh icon on Kotodama extension
4. Refresh Twitter/X page

### Debugging

#### Content Script
- Open DevTools on Twitter/X page
- Console will show content script logs
- Check "Console" tab for errors

#### Background Service Worker
- Go to `chrome://extensions/`
- Click "Service worker" link under Kotodama
- Opens DevTools for background context

#### Panel
- The panel runs inside the page, in the content script's shadow root
- Use the same Twitter/X DevTools window — panel logs and errors land in the page console
- Expand `#kotodama-host` → `#shadow-root` in the Elements tab to inspect its DOM

## Agent Workflows

Kotodama uses agent workflows in `.agent/workflows/` to automate repetitive maintenance tasks. Use these slash commands when working with an agent:

- **`/safeguard`**: Runs the complete quality check suite (`type-check`, `lint`, `test`, `build`). Always run this before submitting changes.
- **`/changelog-update`**: Summarizes recent changes and prepends them to `CHANGELOG.md` under an `[Unreleased]` section.
- **`/docs-update`**: Helps identify and update relevant documentation in the `docs/` folder.
- **`/readme-update`**: Keeps `README.md` synced with the latest version, features, and roadmap.
- **`/claude-update`**: Updates `CLAUDE.md` to ensure the agent maintains an accurate understanding of the project structure and conventions.

## Common Issues

### TypeScript Errors

Run type check:
```bash
npm run type-check
```

### Build Errors

Clean build:
```bash
rm -rf dist node_modules
npm install
npm run build
```

### Extension Not Loading

- Check manifest.json is in dist/
- Verify all files copied correctly
- Check console for errors

### Content Script Not Injecting

- Verify Twitter/X URL matches manifest patterns
- Check content script loaded in DevTools
- Ensure DOM selectors match current Twitter UI

## Adding New Features

### Adding a Provider

1. Add a client in `src/api/` exporting `generate*(request, apiKey, brandVoice, targetProfile?, model?)`. Reuse `buildSystemPrompt` / `buildUserPrompt` from `src/api/openai.ts` — one prompt, three transports.
2. Register it in the `GENERATORS` map and `PROVIDER_LABELS` in `src/background/service-worker.ts`.
3. Add the provider to `AIProvider` and `UserSettings.apiKeys` in `src/types/index.ts`.
4. Add its models to `src/constants/models.ts` and a vision model to `VISION_MODELS` in `src/api/vision.ts`.
5. Add the API host to `host_permissions` in `public/manifest.json`.

### Adding New UI Component

1. Create component in `src/panel/components/` (grouped by zone: `Context/`, `Input/`, `Output/`, `Layout/`, `Shared/`)
2. Import and use in `Panel.tsx`
3. Add necessary types
4. Style with Tailwind classes

### Extending Storage

1. Update schema in `src/storage/db.ts`
2. Increment version number
3. Add upgrade handler if needed
4. Update types in `src/types/index.ts`

## Code Style

- Use TypeScript strict mode
- Follow React hooks best practices
- Use functional components
- Prefer async/await over promises
- Add JSDoc comments for complex functions

## Security Checklist

- [ ] Never log API keys
- [ ] Always encrypt sensitive data
- [ ] Validate all user inputs
- [ ] Sanitize content before insertion
- [ ] Use CSP headers
- [ ] Minimize permissions

## Performance Tips

- Debounce user inputs
- Cache API responses when appropriate
- Use IndexedDB for large data
- Lazy load components
- Optimize bundle size

## Release Process

1. Merge the automated `release-please` PR — it bumps `package.json`, updates `CHANGELOG.md`, and tags the release.
2. Run `npm run build` locally (or rely on the CI artifact) to produce `dist/`.
3. Test thoroughly in clean browser profile
4. Create release notes
5. Package `dist` folder as ZIP
6. Submit to Chrome Web Store

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

## Need Help?

- Check [README.md](../../README.md) for basic setup
- Review [PROJECT_MAP.md](../project/PROJECT_MAP.md) for the architecture overview
- Open an issue on GitHub
