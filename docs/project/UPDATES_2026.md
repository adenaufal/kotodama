# Kotodama Release Timeline – 2026

Ongoing development sprint for v1.x series focused on modernizing the UI, upgrading models, and production-ready assets.

---

## Release Milestones (2026)

| Version | Date | Highlights |
|---------|------|------------|
| **1.4.0** | 2026-01-07 | General settings, API key visibility, thread improvements, and bug fixes. |
| **1.5.0** | 2026-01-07 | Sequential thread posting, progress toasts, and persistence improvements. |
| **1.6.0** | 2026-02-08 | Massive UI overhaul: Sidebar settings, Split-screen onboarding, Design System consolidation. |
| **1.7.0** | 2026-02-08 | Production Branding: High-res PNG icons, PWA manifests, and asset organization. |
| **1.7.2** | 2026-02-08 | Template expansion and prompt tightening. |
| **1.8.0** | 2026-07-28 | **Reply-only pivot** (see below): vision context pass, shadow-root panel, all three providers wired. |

---

## Reply-Only Pivot (v1.8.0)

The product was narrowed from "compose tweets and replies" to **replies only**.

**Removed:** compose-a-new-tweet, thread generation, sequential thread posting and its progress
toasts, the thread toggle/length controls, the iframe panel, and the `window.postMessage` channel
between panel and page.

**Added / changed:**
1. **Shadow-root panel** – the content script (`content-script.tsx`) mounts the panel React tree into
   a shadow root on the page; the panel talks to the page through props (`onInsert`, `onClose`).
2. **Richer context capture** – the tweet being replied to is resolved as the article immediately
   preceding the composer (dialog-scoped for modals), and now carries images, metrics, and up to 10
   preceding thread entries, all sanitized before leaving the page.
3. **Vision context pass** – a new `analyze-context` message and `src/api/vision.ts` read the tweet
   and its images with a cheap vision model and show a plain-language summary in the panel. Failures
   degrade to text-only and never block generation.
4. **All three providers wired** – OpenAI, Gemini, and Claude route through the service worker, with
   provider and model selection in Settings.
5. **New panel composer** – intent box, reply templates, tone presets, S/M/L length, and a result
   carousel with per-draft retry.

---

## v1.7.0 Branding & Asset Recap

1. **High-Resolution PNG Icons** – Replaced SVG placeholders with sharp, multi-size PNG assets (16px to 192px).
2. **PWA Integration** – Added `site.webmanifest` and `browserconfig.xml` for modern browser standards.
3. **Asset Organization** – Centralized image assets in `public/icons` and configuration files in `public/` root.
4. **Build System Update** – Updated `scripts/build.js` to handle the new production assets.

---

## v1.6.0 UI Modernization Recap

1. **Dashboard Sidebar** – Revamped settings with a modern left-sidebar navigation.
2. **Split-Screen Onboarding** – Premium first-run experience with contextual information on the left.
3. **Zen Minimalist Aesthetic** – Flat UI, subtle borders, and consistent spacing across the app.
4. **Design System Consolidation** – Centralized logic in `design-system.css` and `pages.css`.

---

## Model Coverage (Today)

All three providers are wired end-to-end. Client defaults: `gpt-4o-2024-11-20`, `gemini-2.5-flash`,
`claude-sonnet-5` — though onboarding writes its own default per provider (`gpt-5-mini-2025-08-07` for
OpenAI). The reading (vision) pass uses `gpt-4o-mini` / `gemini-2.5-flash-lite` / `claude-haiku-4-5`.
Full list and caveats: [../reference/MODEL_REFERENCE.md](../reference/MODEL_REFERENCE.md).

---

## Outstanding Work

1. Manual browser test pass for the reply-only build (none has been done — see [../testing/tested-checklist-18102025.md](../testing/tested-checklist-18102025.md)).
2. Automated coverage for target-tweet selection, the vision fallback, and the sanitizer.
3. Profile analysis: the `analyze-profile` path exists but nothing in the UI reaches it.

---

## References
- [Project Map](PROJECT_MAP.md)
- [TODO Backlog](TODO.md)
- [Changelog](../../CHANGELOG.md)
