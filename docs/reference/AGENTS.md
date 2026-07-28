# Kotodama Agent Handbook

> Read [CLAUDE.md](../../CLAUDE.md) first — especially its **Traps** section, which lists the things
> that break silently. This handbook covers workflow and contribution conventions on top of that.

## Project Overview
- **Purpose:** Kotodama is a Chrome/Edge extension that drafts **replies** on Twitter/X in the user's brand voice. It reads the tweet being replied to — text, preceding thread, and images via a vision model — shows that reading, then generates a reply. It does not compose new tweets and does not generate or post threads.
- **Tech Stack:** React 19, TypeScript 5.9 (strict mode), Vite 7, Tailwind CSS 4, Dexie.js 4 for IndexedDB persistence, Framer Motion for panel animation, Web Crypto API for encryption, and Node.js 20+ toolchain.
- **Key Directories:**
  - `src/api/` – AI provider clients (`openai.ts`, `gemini.ts`, `claude.ts` — all wired) plus `vision.ts` for the context-reading pass.
  - `src/background/` – Service worker entry (`service-worker.ts`) handling messaging, encryption, and API calls.
  - `src/content/` – Content script (`content-script.tsx`) that mounts the panel into a shadow root on Twitter/X, captures reply context, and inserts drafts.
  - `src/panel/` – React reply composer (`Panel.tsx` + components), mounted by the content script; it has no HTML page of its own.
  - `src/onboarding/` – First-run onboarding flow for collecting API keys and brand voice data.
  - `src/storage/` – IndexedDB schema (`db.ts`), encryption helpers, and settings management.
  - `src/types/` – Shared TypeScript definitions.
  - `public/` – Browser extension manifest and icons served with the build.
  - `scripts/` – Node build helpers (`build.js`, `create-icons.js`) that finalize the `dist/` bundle.
  - `dist/` – Generated extension output (ignored by git; produced by `npm run build`).

## Setup & Running Locally
1. **Install Dependencies**
   ```bash
   npm install
   ```
   > The repository ships with an `npm` lockfile. If you must use `pnpm` or `yarn`, remove `package-lock.json`, install afresh, and note the change in your PR description.
2. **Environment Variables**
   - None. There is no `.env` file and no `.env.example`; API keys are entered in the extension UI and stored encrypted. If you ever introduce env-driven config, document it here and never commit real secrets.
3. **Start Development Build (watch mode)**
   ```bash
   npm run dev
   ```
   - This command runs `vite build --watch` to keep the `dist/` directory up to date. After the build completes, reload the unpacked extension in Chrome/Edge from `chrome://extensions/` to see changes.
4. **Load/Reload the Extension**
   - Open `chrome://extensions/`, enable **Developer Mode**, click **Load unpacked**, and select the `dist/` folder.
   - After subsequent code changes while `npm run dev` is running, click the refresh icon on the Kotodama extension and reload Twitter/X to test.

## Development & Testing
- **Production Build (required before delivery)**
  ```bash
  npm run build
  ```
  This runs Vite twice — the main config, then `vite.content.config.ts`, which overwrites
  `dist/content.js` with a single self-contained IIFE — followed by the post-build copy step
  (`scripts/build.js`).
- **Type Checking**
  ```bash
  npm run type-check
  ```
- **Targeted Builds**
  ```bash
  npm run dev -- --mode development
  ```
  Use additional Vite flags as needed when debugging environment-specific behavior.
- **Manual Verification Checklist**
  1. Load the freshly built extension in Chrome/Edge.
  2. Open a tweet on Twitter/X and click the floating sparkle button to open the panel.
  3. Exercise the feature or bug fix you worked on (context capture, vision summary, generation, insertion, onboarding, settings).

- **CRITICAL PROCEDURE**: After finishing EVERY task or making significant changes, you MUST run:
  ```bash
  npm run build
  ```
  Do not consider a task finished until a successful build has been confirmed and the `dist/` folder is updated.

## Code Style & Conventions
- **TypeScript/React**
  - Strict typing is enforced (`strict`, `noUnusedLocals`, `noUnusedParameters`). Prefer explicit interfaces and discriminated unions to `any`.
  - Use modern React (function components + hooks). Avoid legacy class components.
- **State & Data**
  - Panel state is local React state; there is no global store.
  - Persist long-lived data via the IndexedDB helpers in `src/storage/`; extend schemas deliberately and add migrations when needed.
- **Styling**
  - Tailwind CSS 4 utility classes are the primary styling mechanism. Keep class lists sorted logically (layout → spacing → typography → effects) to ease diff review.
  - For reusable styling patterns, create helper components or utilities instead of duplicating long class strings.
- **Formatting**
  - Follow [.prettierrc](../../.prettierrc): semicolons on, single quotes, 100-column print width, 2-space indent, ES5 trailing commas.
- **Naming**
  - Components and React hooks: `PascalCase` for components (`SparkleButton`), `useCamelCase` for hooks.
  - Functions/variables: `camelCase`.
  - Constants: `UPPER_SNAKE_CASE`.
  - Files: prefer `kebab-case.ts` / `kebab-case.tsx` for modules, and place related styles/utilities alongside their component when practical.
- **Architecture**
  - Keep clear boundaries between the content script, background worker, and panel UI. Shared logic belongs in `src/utils/`, shared contracts in `src/types/`. There is no `src/shared/` — do not create one.
  - When adding new APIs, mirror the existing structure in `src/api/` and wire them through the background worker.
  - When adjusting build behavior, update the relevant helper under `scripts/` rather than duplicating logic elsewhere.

## Contribution Guidelines
1. **Branch Naming**
   - Feature work: `feature/<short-description>`
   - Bug fixes: `fix/<issue-id-or-topic>`
   - Maintenance: `chore/<task>` or `docs/<scope>`
2. **Commit Messages**
   - Follow the [Conventional Commits](https://www.conventionalcommits.org/) spec (e.g., `feat(panel): add tone selector`).
   - Keep commits scoped and descriptive; run required commands before committing.
3. **Pull Requests**
   - Include a summary of changes, testing evidence (`npm run type-check`, `npm run build`, manual verification steps), and screenshots/gifs for UI changes when possible.
   - Ensure your branch is rebased on `main` (or the active default branch) before requesting review.
   - Address review feedback promptly and keep discussions in the PR thread for traceability.

## Security Considerations
- Never hardcode or commit API keys, OAuth tokens, or user data. Secrets must only exist in local dev environments or encrypted storage.
- The onboarding flow stores API keys via the Web Crypto helpers—do not bypass encryption or log decrypted values.
- Sanitize any user-generated or remote content rendered in the panel to avoid XSS. Avoid `dangerouslySetInnerHTML`; if unavoidable, sanitize first.
- Use parameterized requests when interacting with external APIs and validate all inputs before sending them.
- Treat content script messaging as untrusted input. Validate message schemas before acting and guard against prototype pollution or DOM injection.
- Review dependency updates for security advisories and run production builds before release to catch supply-chain warnings.
