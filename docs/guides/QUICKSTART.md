# Quick Start Guide

Kotodama v1.3.0 in a nutshell — install, load, and start composing on Twitter/X in minutes.

## Prerequisites

- Node.js 20+ (ships with npm 10+)
- Google Chrome or Microsoft Edge (latest stable release)
- OpenAI API key with access to the GPT-4o family ([create one](https://platform.openai.com/api-keys))

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

1. **Connect OpenAI**
   - Paste your API key.
   - Keys are encrypted locally using the Web Crypto API before they touch disk.

2. **Teach Your Voice**
   - Supply a name, description, and at least one example tweet.
   - Paste tweet URLs to auto-fetch text, or import a Markdown file with `Name`, `Description`, and `Example Tweets` sections.
   - Tone sliders default to 50/50/50 and can be fine-tuned later.

Finishing the wizard saves your settings, creates a default brand voice, and opens Twitter/X so you can start composing.

## Everyday Usage

### Compose or Reply

1. Focus any compose box or reply on Twitter/X — a sparkle button (✨) appears.
2. Click the button to open the panel.
3. Pick (or keep) the default brand voice, write a prompt, and generate.
4. Threads: toggle **Create thread** and set the desired length (2–10 tweets).
5. Replies: the original tweet appears in a context card. You can drop in a reply template to jump-start the tone.
6. Click **Insert to X** to paste the draft back into Twitter.

### Manage Voices & Preferences

- From the panel, tap the gear icon to open the settings dashboard.
- Refresh, edit, or delete brand voices with live validation.
- Import additional voices via Markdown, tweak tone sliders, or set a new default voice/model.
- Use the moon/sun button to toggle light/dark theming globally.

## Recommended Dev Workflow

- **Rebuild on change:** `npm run dev`
- **Type safety:** `npm run type-check`
- **Linting:** `npm run lint`
- **Unit tests:** `npm test`

Always reload the unpacked extension after a successful build to exercise the latest code in the browser.

## Troubleshooting

- **Sparkle button missing:** Refresh Twitter/X. Confirm the extension is enabled and watch DevTools for selector warnings.
- **“Generation failed”:** Ensure your OpenAI key is valid, has credit, and that you are under the rate limit.
- **Service worker listed as “inactive”:** Normal Manifest V3 behaviour — it wakes automatically when needed.
- **Tweet text not fetched from URL:** Twitter’s syndication endpoint occasionally throttles requests. Try again or paste the text manually.
- **Panel styling looks off:** Reload after running `npm run build`; the settings theme toggle also resets cached styles.

Need a deeper dive? Check `docs/README.md` for the full documentation index.
