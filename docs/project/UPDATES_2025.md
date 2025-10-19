# Kotodama Updates – October 2025

Summary of the work completed for the v1.3.0 release cycle.

---

## AI Provider Updates
- Upgraded OpenAI defaults to `gpt-4o-2024-11-20` with fast fallback (`gpt-4o-mini` and `gpt-4o-mini-2024-07-18`).
- Added reasoning support via `o1-2024-12-17` (temperature automatically removed when required).
- Prepared but did **not** yet wire Gemini (`src/api/gemini.ts`) and Claude (`src/api/claude.ts`) clients for future releases.

## Experience Improvements
- **Brand voice manager**: create/edit/delete voices, adjust tone sliders, import Markdown, validate example tweets.
- **Reply intelligence**: context cards in the panel, curated reply templates, improved detection in the content script.
- **Thread composer**: toggle-based threads with length control, per-tweet character counts, and smooth insertion.
- **Design tokens + theming**: refreshed gradients, light/dark toggle persisted in user settings.
- **Performance logging**: console timers for button injection, panel init, and AI generation duration.

## Onboarding & Settings
- Onboarding wizard now fetches tweet text from URLs, supports Markdown imports, and enforces required fields.
- Settings dashboard manages encrypted OpenAI keys, default model/voice, theme, and quick relaunch of onboarding.
- Brand voice manager modal lives inside the settings experience for post-setup maintenance.

## Code & Tooling
- Consolidated model metadata in `src/constants/models.ts` (currently OpenAI only).
- Added `models.js` bundle to `dist/` and new HTML entry for `settings/index.html`.
- Scripts/build.js now copies manifest + icon assets and preserves SVG placeholders (pending PNG replacement).
- Documentation refresh: README, quick start/reference guides, development guide, model/API references, project summaries.

## Outstanding Tasks (rolled forward)

1. Wire up multi-provider selection (Gemini/Claude) in the panel, settings, and service worker.
2. Implement structured error messaging for network/rate-limit scenarios.
3. Automate tests (Vitest + potential Playwright flows).
4. Replace icon SVGs with PNGs for Chrome Web Store compliance.
5. Add variant generation, tone controls within the panel, and richer history analytics.
