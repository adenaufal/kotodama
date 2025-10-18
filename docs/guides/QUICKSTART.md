# Quick Start Guide

Get Kotodama up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Chrome or Edge browser
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Extension

```bash
npm run build
```

This creates a `dist` folder with the compiled extension.

### 3. Load in Browser

**Chrome/Edge:**

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Toggle "Developer mode" ON (top-right corner)
3. Click "Load unpacked"
4. Select the `dist` folder from this project

You should see "AI Tweet Composer" installed!

## First-Time Setup

### 1. Configure Extension

Click the Kotodama icon in your browser toolbar. This opens the onboarding wizard.

### 2. Step 1: Add API Key

Enter your OpenAI API key:
- Get one at https://platform.openai.com/api-keys
- Paste it in the form
- Keys are encrypted and stored locally
- Click "Continue"

### 3. Step 2: Create Brand Voice

Define your writing style:
- **Name**: e.g., "Professional", "Casual", "Technical"
- **Description** (optional): Describe your tone
- **Example Tweets**: Paste 5 example tweets in your style

Click "Complete Setup"

## Using Kotodama

### Composing a Tweet

1. Go to [twitter.com](https://twitter.com) or [x.com](https://x.com)
2. Click in the tweet compose box
3. Look for the **sparkle button (✨)** in the top-right
4. Click it to open the AI panel
5. Enter your prompt: *"Tweet about the importance of design systems"*
6. Click "Generate"
7. Review the generated tweet
8. Click "Insert to Twitter"
9. Post!

### Creating a Thread

1. Open the AI panel from compose box
2. Toggle "Create thread" ON
3. Set number of tweets (2-10)
4. Enter your thread topic:
   ```
   5 tweets about building great products:
   1. Start with user research
   2. Define clear goals
   3. Iterate quickly
   4. Measure everything
   5. Ship and learn
   ```
5. Generate and review
6. Insert entire thread

### Replying to Tweets

1. Click "Reply" on any tweet
2. AI panel opens automatically
3. Original tweet context is captured
4. Enter your reply intent
5. Generate and insert

## Development Mode

### Watch for Changes

```bash
npm run dev
```

This rebuilds automatically when you edit files.

### Reload Extension

After code changes:

1. Go to `chrome://extensions/`
2. Click refresh icon on Kotodama
3. Refresh Twitter page

## Common Issues

### "Button not showing"

- Refresh the Twitter page
- Check extension is enabled
- Open DevTools Console for errors

### "Generation failed"

- Verify API key is correct
- Check you have OpenAI API credits
- Look in background service worker console

### "TypeScript errors"

```bash
npm run type-check
```

### "Build fails"

```bash
rm -rf node_modules dist
npm install
npm run build
```

## Debugging

### Content Script (Twitter page)

- F12 on Twitter page
- Check Console tab
- Look for "Kotodama content script loaded"

### Background Worker

- `chrome://extensions/`
- Click "Service worker" under Kotodama
- Opens DevTools for background context

### Panel UI

- Right-click in panel
- Select "Inspect"
- Opens DevTools for iframe

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [DEVELOPMENT.md](DEVELOPMENT.md) for architecture details
- Review [TODO.md](TODO.md) for planned features
- See [prd.md](prd.md) for product vision

## Support

Open an issue on GitHub if you encounter problems.

---

**Happy tweeting! 🚀**
