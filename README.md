# Kotodama - AI Tweet Composer Extension

> 言霊 (Kotodama) - "The spirit of language" in Japanese

An intelligent Chrome/Edge browser extension that helps you compose tweets and replies that maintain your unique brand voice while adapting to your audience's communication style.

## Highlights (v1.4.0)

- **🎨 Brand Voice Studio**: Create, import (Markdown or tweet links), edit, and delete brand voices with tone controls
- **✨ AI Composer**: Generate tweets or full threads powered by OpenAI’s GPT-4o family with automatic fallback handling
- **💬 Reply Intelligence**: Auto-captures tweet context, surfaces reply templates, and blends in with the original conversation
- **🌓 Premium Settings**: Redesigned dashboard with floating navigation, full-page gradients, and API key visibility toggle
- **📚 Session Memory**: Optionally remember generation history and surface recent drafts for quick reuse
- **🔒 Local-First Security**: API keys encrypted via Web Crypto; no data leaves the browser beyond OpenAI requests

## Prerequisites

- Node.js 20+ (ships with npm 10+)
- OpenAI API key for the GPT-4o family ([create one](https://platform.openai.com/api-keys))
- Chrome or Edge browser (latest stable release)

## Installation

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kotodama
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

   This will create a `dist` folder with the compiled extension.

4. **Load in Chrome/Edge**
   - Open Chrome/Edge and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `dist` folder

### First-Time Setup

1. Click the Kotodama extension icon in your browser toolbar
2. Follow the onboarding wizard:
   - **Step 1**: Securely add your OpenAI API key (encrypted before storage)
   - **Step 2**: Define your brand voice — paste example tweets, drop tweet URLs to auto-fetch text, or import a Markdown file
3. Navigate to Twitter/X and start composing!

## Usage

### Composing Tweets

1. Go to Twitter/X and click on the tweet compose box
2. A sparkle button (✨) will appear in the top-right corner
3. Click the button to open the AI panel
4. Enter your prompt (e.g., "Tweet about the importance of user research") or pick a template
5. Select a brand voice if you want to override the default
6. Click "Generate" to create the tweet
7. Review, edit if needed, and click "Insert to X"

### Creating Threads

1. Open the AI panel from a compose box
2. Toggle "Create thread" option
3. Specify the number of tweets (2-10)
4. Enter your thread outline or topic
5. Generate and review the complete thread
6. Insert all tweets to Twitter at once

### Replying to Tweets

1. Click "Reply" on any tweet
2. The sparkle button appears in the reply box
3. Click to open the AI panel — the original tweet appears in the context card
4. Pick a reply template (optional) or describe the response you want
5. Generate — the AI blends the captured context with your brand voice
6. Review and insert

### Managing Brand Voices & Settings

- Open the panel and click the gear icon to launch the settings dashboard
- View, edit, or delete saved brand voices with real-time validation
- Set a default voice and model, toggle dark/light mode, and rerun onboarding

## Project Structure

```
kotodama/
├── .agent/               # Agent workflows and automation
├── src/                  # Source code
│   ├── api/              # AI provider clients (OpenAI wired today; Gemini/Claude prototypes)
│   ├── background/       # Manifest V3 service worker
│   ├── components/       # Shared React building blocks
│   ├── constants/        # Model metadata and design tokens
│   ├── content/          # Twitter/X DOM integration
│   ├── onboarding/       # First-time setup flow
│   ├── panel/            # Main composer UI
│   ├── settings/         # Settings + brand voice manager UI
│   ├── storage/          # IndexedDB schema & encryption helpers
│   ├── styles/           # Global styles and theme variables
│   └── types/            # Shared TypeScript definitions
├── docs/                 # Documentation hub (see docs/README.md)
├── public/
│   ├── manifest.json     # Chrome extension manifest
│   └── icons/            # Extension icons
├── scripts/              # Build scripts
│   ├── build.js          # Post-build file copying
│   └── create-icons.js   # Icon generation
├── vite.config.ts        # Vite build configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── CLAUDE.md             # Claude Code project instructions
├── CHANGELOG.md          # Version history
└── README.md
```

## Documentation

Comprehensive documentation is available in the [docs/](docs/) directory:

- **[Quick Start Guide](docs/guides/QUICKSTART.md)** - Get started quickly
- **[Quick Reference](docs/guides/QUICK_REFERENCE.md)** - Panel shortcuts & request flags
- **[Development Guide](docs/development/DEVELOPMENT.md)** - Development setup and workflows
- **[Testing Guide](docs/testing/TESTING.md)** - Testing strategies and procedures
- **[API Reference](docs/reference/API_REFERENCE.md)** - API documentation
- **[Model Reference](docs/reference/MODEL_REFERENCE.md)** - Supported models & mappings
- **[Full Documentation Index](docs/README.md)** - Complete documentation overview

## Development

### Available Scripts

- **`npm run dev`**: Build in watch mode for development
- **`npm run build`**: Production build
- **`npm run type-check`**: Run TypeScript type checking
- **`npm run lint`**: Lint the codebase
- **`npm test`**: Run all tests

### Development Workflow

1. Make changes to the source files
2. Run `npm run dev` to watch for changes
3. Reload the extension in Chrome:
   - Go to `chrome://extensions/`
   - Click the refresh icon on the Kotodama extension
4. Refresh Twitter/X page to see changes

### Tech Stack

- **Frontend**: React 19 + TypeScript 5.9
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Storage**: IndexedDB (via Dexie.js 4.x)
- **State Management**: Zustand 5
- **Encryption**: Web Crypto API
- **AI Models**:
  - OpenAI `gpt-4o-2024-11-20` (default), `gpt-4o-mini`, and `o1-2024-12-17`
  - Gemini and Claude clients exist but are not yet wired into the runtime

## Architecture

### Components

1. **Content Script**: Injects UI elements into Twitter/X pages, detects compose boxes
2. **Background Service Worker**: Handles API calls, data processing, and message routing
3. **Panel UI**: React-based side panel for tweet composition and editing
4. **Onboarding UI**: First-time setup wizard
5. **Settings UI**: Advanced configuration and brand voice management dashboard
6. **Storage Layer**: IndexedDB for large data, Chrome Storage for settings

### Data Flow

```
Twitter Page (Content Script)
    ↓ (detects compose box)
Floating Button Click
    ↓ (opens panel)
Panel UI
    ↓ (sends generate request)
Background Service Worker
    ↓ (API call)
OpenAI API
    ↓ (response)
Panel UI (displays result)
    ↓ (user clicks insert)
Content Script (inserts to Twitter)
```

## Security & Privacy

- ✅ **Local Storage**: All data stored locally on your device
- ✅ **Encrypted Keys**: API keys encrypted using Web Crypto API
- ✅ **No Telemetry**: No usage tracking or analytics
- ✅ **Minimal Permissions**: Only accesses twitter.com and x.com
- ✅ **GDPR/CCPA Compliant**: No personal data collection

## Roadmap

### Shipped in v1.3.0 (October 2025)
- Brand voice manager with edit/delete and Markdown import
- Reply context fixes with templates and performance logging
- Design tokens refresh with light/dark switching

### Up Next
1. Wire up Gemini and Claude providers end-to-end (service worker + UI selection)
2. Multi-suggestion generation and side-by-side comparison
3. Tone adjustment sliders with live preview
4. Tweet performance tracking and export/import for voices

### Longer Term
- Multi-platform support (LinkedIn, Threads)
- Analytics dashboard and insights
- Team collaboration features
- Optional cloud sync for settings

## Known Issues

- Icon files are SVG placeholders (convert to PNG before publishing)
- Only the OpenAI provider is currently wired; Gemini/Claude clients are experimental
- Twitter DOM selectors may break with Twitter UI updates
- Profile tweet scraping is still stubbed (manual tweet samples required)

## Contributing

This is currently a personal project. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC License - see LICENSE file for details

## Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Inspired by the need for authentic, brand-consistent social media presence
- Name "Kotodama" (言霊) reflects the Japanese concept of words having spiritual power

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.

---

**Note**: This is v1.4.0. The extension is under active development. Features and UI may change.
