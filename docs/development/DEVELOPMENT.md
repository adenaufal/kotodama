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

## Project Architecture

### Extension Components

1. **Content Script** ([src/content/content-script.ts](src/content/content-script.ts))
   - Runs on Twitter/X pages
   - Injects floating AI button into compose boxes
   - Manages panel iframe
   - Handles content insertion

2. **Background Service Worker** ([src/background/service-worker.ts](src/background/service-worker.ts))
   - Processes messages from content script and panel
   - Makes API calls to OpenAI
   - Manages data storage (IndexedDB)
   - Handles encryption/decryption

3. **Panel UI** ([src/panel/](src/panel/))
   - React-based side panel
   - Tweet composition interface
   - Shows generated content
   - Allows editing before insertion

4. **Onboarding** ([src/onboarding/](src/onboarding/))
   - First-time setup wizard
   - API key configuration
   - Brand voice creation

### Data Layer

#### IndexedDB (via Dexie)
- **brandVoices**: User-defined writing styles
- **userProfiles**: Analyzed Twitter user profiles
- **generatedTweets**: History of generated content

#### Chrome Storage
- **user_settings**: Configuration and encrypted API keys

### Message Flow

```
┌─────────────┐                ┌──────────────────┐
│   Content   │◄──────────────►│  Background SW   │
│   Script    │   chrome.      │                  │
│             │   runtime.     │                  │
│             │   sendMessage  │                  │
└──────┬──────┘                └────────┬─────────┘
       │                                │
       │ window.postMessage             │
       │                                │
       ▼                                ▼
┌─────────────┐                ┌──────────────────┐
│  Panel UI   │                │   OpenAI API     │
│  (iframe)   │                │                  │
└─────────────┘                └──────────────────┘
```

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

#### Panel UI
- Right-click in panel area
- Select "Inspect" (or "Inspect frame")
- Opens DevTools for iframe context

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

### Adding API Provider (e.g., Gemini)

1. Create `src/api/gemini.ts`
2. Implement generation function matching OpenAI pattern
3. Update `src/background/service-worker.ts` to handle new provider
4. Add UI toggle in panel
5. Update types in `src/types/index.ts`

### Adding New UI Component

1. Create component in `src/panel/components/`
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

1. Update version in `manifest.json` and `package.json`
2. Run `npm run build`
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

- Check [README.md](README.md) for basic setup
- Review [prd.md](prd.md) for feature specifications
- Open an issue on GitHub
