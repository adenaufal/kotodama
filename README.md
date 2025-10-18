# Kotodama - AI Tweet Composer Extension

> 言霊 (Kotodama) - "The spirit of language" in Japanese

An intelligent Chrome/Edge browser extension that helps you compose tweets and replies that maintain your unique brand voice while adapting to your audience's communication style.

## Features (v1.0 MVP)

- **🎨 Brand Voice Management**: Define your unique writing style with examples and descriptions
- **✨ AI-Powered Generation**: Create original tweets and threads using OpenAI
- **💬 Smart Replies**: Context-aware replies that adapt to the conversation
- **🔒 Privacy-First**: All data stored locally, encrypted API keys
- **⚡ Seamless Integration**: Floating button appears in Twitter/X compose boxes
- **🎯 Thread Creation**: Generate complete threads from a single prompt

## Prerequisites

- Node.js 20+ and npm 10+
- At least one AI API key:
  - OpenAI API key ([Get one here](https://platform.openai.com/api-keys)) - Recommended
  - Google Gemini API key ([Get one here](https://ai.google.dev/gemini-api/docs/api-key))
  - Anthropic Claude API key ([Get one here](https://console.anthropic.com/))
- Chrome or Edge browser (latest version)

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
   - **Step 1**: Enter your OpenAI API key
   - **Step 2**: Define your brand voice with examples or description
3. Navigate to Twitter/X and start composing!

## Usage

### Composing Tweets

1. Go to Twitter/X and click on the tweet compose box
2. A sparkle button (✨) will appear in the top-right corner
3. Click the button to open the AI panel
4. Enter your prompt (e.g., "Tweet about the importance of user research")
5. Click "Generate" to create the tweet
6. Review, edit if needed, and click "Insert to Twitter"

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
3. Click to open the AI panel (context is automatically captured)
4. Enter your reply intent
5. The AI will analyze the original tweet and generate a contextual reply
6. Review and insert

## Project Structure

```
kotodama/
├── src/
│   ├── api/              # API integrations (OpenAI, Gemini, Claude)
│   │   └── openai.ts     # OpenAI API client
│   ├── background/       # Service worker
│   │   └── service-worker.ts
│   ├── content/          # Content script for Twitter DOM injection
│   │   └── content-script.ts
│   ├── panel/            # React UI for the side panel
│   │   ├── App.tsx
│   │   ├── Panel.tsx
│   │   └── index.html
│   ├── onboarding/       # First-time setup UI
│   │   ├── App.tsx
│   │   ├── Onboarding.tsx
│   │   └── index.html
│   ├── storage/          # Data persistence layer
│   │   ├── db.ts         # IndexedDB schema
│   │   ├── encryption.ts # API key encryption
│   │   └── settings.ts   # Settings management
│   └── types/            # TypeScript type definitions
│       └── index.ts
├── docs/                 # Documentation (see docs/README.md)
│   ├── development/      # Development guides
│   ├── guides/           # Quick-start and user guides
│   ├── reference/        # API and technical references
│   ├── testing/          # Testing documentation
│   └── project/          # Project planning and history
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
- **[Development Guide](docs/development/DEVELOPMENT.md)** - Development setup and workflows
- **[Testing Guide](docs/testing/TESTING.md)** - Testing strategies and procedures
- **[API Reference](docs/reference/API_REFERENCE.md)** - API documentation
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
  - OpenAI GPT-4o, GPT-4o-mini
  - Google Gemini 2.5 Pro, Gemini 2.5 Flash
  - Anthropic Claude 3.5 Sonnet

## Architecture

### Components

1. **Content Script**: Injects UI elements into Twitter/X pages, detects compose boxes
2. **Background Service Worker**: Handles API calls, data processing, and message routing
3. **Panel UI**: React-based side panel for tweet composition and editing
4. **Onboarding UI**: First-time setup wizard
5. **Storage Layer**: IndexedDB for large data, Chrome Storage for settings

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

### v1.1 (Planned)
- Google Gemini API integration
- Multiple suggestion generation (A/B options)
- Tone adjustment sliders
- Tweet performance tracking

### v1.2 (Planned)
- Claude API integration
- Profile management for frequent contacts
- Advanced thread building
- Import/export settings

### v2.0 (Future)
- Multi-platform support (LinkedIn, Threads)
- Analytics dashboard
- Team collaboration features
- Cloud sync (optional)

## Known Issues

- Icon files are SVG placeholders (convert to PNG for production)
- Twitter DOM selectors may break with Twitter UI updates
- Profile tweet scraping not yet implemented (coming in v1.1)

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

**Note**: This is v1.0 MVP. The extension is under active development. Features and UI may change.
