# Quick Start Guide

Kotodama in a nutshell — install, load, and start replying on Twitter/X in minutes.

## Prerequisites

- Node.js 20+ (ships with npm 10+)
- Google Chrome or Microsoft Edge (latest stable release)
- An API key for one provider — [OpenAI](https://platform.openai.com/api-keys), [Gemini](https://aistudio.google.com/app/apikey), or [Claude](https://console.anthropic.com/settings/keys). Onboarding lets you pick which; the other two can be added later in Settings.

> Kotodama stores everything locally. No additional services or credentials are required.

## Install & Build

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the extension**
   ```bash
   npm run build
   ```
   This generates the production bundle under `dist/`, copies the manifest, and prepares icons.

3. **(Optional) Watch for changes**
   ```bash
   npm run dev
   ```
   Vite rebuilds into `dist/` whenever you edit files. Reload the unpacked extension to pick up changes.

## Load in Chrome/Edge

1. Visit `chrome://extensions/` (or `edge://extensions/`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the repository’s `dist/` directory.
4. Confirm the “Kotodama” extension appears without errors.

## First-Time Setup

Click the Kotodama toolbar icon to launch the onboarding flow.

1. **Connect an AI**
   - Pick a provider (OpenAI, Gemini, or Claude) and paste that provider's API key. One key is enough.
   - Keys are encrypted locally using the Web Crypto API before they touch disk.

2. **Teach Your Voice**
   - Supply a name, description, and at least one example tweet.
   - Paste tweet URLs to auto-fetch text, or import a Markdown file with `Name`, `Description`, and `Example Tweets` sections.
   - Tone sliders default to 50/50/50 and can be fine-tuned later.

Finishing the wizard saves your settings, creates a default brand voice, and opens Twitter/X so you can start replying.

## Everyday Usage

Kotodama is reply-only: it drafts replies to a tweet you have open. There is no compose-a-new-tweet mode.

### Reply to a Tweet

1. Open a tweet (or its reply composer) on Twitter/X. A draggable sparkle button (✨) floats on the page.
2. Click the button to open the panel. It reads the tweet you're replying to — including its images and the tweets above it — and shows a short plain-language summary of what it found.
3. Type what you want to say back. A reply template can fill that in for you.
4. Optionally add tone presets (formal / casual / humor / professional) and pick a length (S / M / L).
5. Pick (or keep) the default brand voice and click **Generate reply**.
6. Every draft lands in a carousel — retry one in place, or click **Insert** to paste it into the reply box.

If the panel says "No tweet in view", it could not read a tweet to reply to — open a tweet first.

### Manage Voices & Preferences

- From the panel, tap the gear icon to open the settings dashboard.
- Navigation: Use the left sidebar to switch between **General** and **Brand Voices**.
- Manage Voices: Refresh, edit, or delete brand voices with live validation in the dedicated dashboard view.
- Import additional voices via Markdown, tweak tone sliders, or set a new default voice/model.

## Recommended Dev Workflow

- **Rebuild on change:** `npm run dev`
- **Type safety:** `npm run type-check`
- **Linting:** `npm run lint`
- **Unit tests:** `npm test`

Always reload the unpacked extension after a successful build to exercise the latest code in the browser.

## Troubleshooting

- **Sparkle button missing:** Refresh Twitter/X. Confirm the extension is enabled and watch DevTools for selector warnings.
- **“No tweet in view”:** Kotodama could not read a tweet to reply to. Open a tweet or its reply composer and try again; if it persists, Twitter's markup has likely changed.
- **“Generation failed”:** Ensure the key for your selected provider is valid, has credit, and that you are under the rate limit.
- **Service worker listed as “inactive”:** Normal Manifest V3 behaviour — it wakes automatically when needed.
- **Tweet text not fetched from URL:** Twitter’s syndication endpoint occasionally throttles requests. Try again or paste the text manually.
- **Panel styling looks off:** Reload after running `npm run build`; the settings theme toggle also resets cached styles.

Need a deeper dive? Check `docs/README.md` for the full documentation index.
