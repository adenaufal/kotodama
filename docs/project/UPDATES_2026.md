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

- **OpenAI** (active): `gpt-5-2025-08-07` (Default), `gpt-4o-2024-11-20`.
- **Gemini** (staged): Client ready, UI wiring pending.
- **Claude** (staged): Client ready, UI wiring pending.

---

## Outstanding Work

1. Wire up Gemini and Claude providers end-to-end.
2. Multi-suggestion generation and side-by-side comparison.
3. Tone adjustment sliders with live preview inside the panel.
4. Profile tweet scraping implementation.

---

## References
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Project Map](PROJECT_MAP.md)
- [TODO Backlog](TODO.md)
- [Previous Updates (2025)](UPDATES_FINAL_2025.md)
