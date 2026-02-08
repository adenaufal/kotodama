# Kotodama Agent Handbook

## Project Overview
- **Purpose:** Kotodama is a Chrome/Edge extension that helps users compose tweets and replies that reflect their brand voice while leveraging OpenAI today (Gemini and Claude clients are prepared but not yet wired).
- **Tech Stack:** React 19, TypeScript 5.9 (strict mode), Vite 7, Tailwind CSS 4, Zustand 5 for state, Dexie.js 4 for IndexedDB persistence, Web Crypto API for encryption, and Node.js 20+ toolchain.
- **Key Directories:**
  - `src/api/` – AI provider clients (`openai.ts` active; `gemini.ts`/`claude.ts` prototypes).
  - `src/background/` – Service worker entry (`service-worker.ts`) handling messaging, encryption, and API calls.
  - `src/content/` – Content script that injects UI into Twitter/X and coordinates messaging.
  - `src/panel/` – React UI for the compose panel, including `App.tsx`, `Panel.tsx`, and UI components.
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
   ```bash
   # Only required if new features introduce environment-driven configuration
   cp .env.example .env.local
   ```
   - The current codebase does not require runtime `.env` files; API keys are provided inside the extension UI and stored securely. If you add variables, update `.env.example`, document them, and never commit real secrets.
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
  This runs the Vite production build and post-build copy step (`scripts/build.js`).
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
  2. Trigger the content script on Twitter/X and open the panel.
  3. Exercise the feature or bug fix you worked on (panel UI, onboarding, background messaging, etc.).

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
  - Centralize shared UI state in Zustand stores under `src/panel/`.
  - Persist long-lived data via the IndexedDB helpers in `src/storage/`; extend schemas deliberately and add migrations when needed.
- **Styling**
  - Tailwind CSS 4 utility classes are the primary styling mechanism. Keep class lists sorted logically (layout → spacing → typography → effects) to ease diff review.
  - For reusable styling patterns, create helper components or utilities instead of duplicating long class strings.
- **Formatting**
  - Follow Prettier defaults used by the repo: 2-space indentation, single quotes for strings, trailing commas where valid, and no unnecessary semicolons in TSX modules.
- **Naming**
  - Components and React hooks: `PascalCase` for components (`SparkleButton`), `useCamelCase` for hooks.
  - Functions/variables: `camelCase`.
  - Constants: `UPPER_SNAKE_CASE`.
  - Files: prefer `kebab-case.ts` / `kebab-case.tsx` for modules, and place related styles/utilities alongside their component when practical.
- **Architecture**
  - Keep clear boundaries between the content script, background worker, and panel UI. Shared logic belongs in `src/shared/` (create if necessary) or `src/types/`.
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
