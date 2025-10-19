# Kotodama Release Timeline – October 2025

Final snapshot of the 2025 development sprint leading to v1.3.0.

---

## Release Milestones

| Version | Date | Highlights |
|---------|------|------------|
| **1.0.0** | 2025-10-17 | Initial MVP: floating button, panel, OpenAI GPT-4 integration, onboarding, brand voice storage |
| **1.1.0** | 2025-10-17 | Panel refresh, settings surface groundwork, onboarding polish, OpenAI API alignment |
| **1.2.0** | 2025-10-18 | New UI components, improved onboarding flow, preparatory work for brand voice manager |
| **1.3.0** | 2025-10-18 | Brand voice manager, design token overhaul, reply context fixes, performance instrumentation |

---

## v1.3.0 Feature Recap

1. **Brand Voice Manager** – create, edit, import (Markdown), and delete voices with tone slider controls and validation.
2. **Panel Enhancements** – reply templates, context cards, thread toggle with length limits, character counts, and theme toggle.
3. **Service Worker Upgrades** – OpenAI fallback handling for temperature issues, structured error messages, and history persistence when enabled.
4. **Onboarding Improvements** – tweet URL ingestion, Markdown import helper, dark/light theming, and redirect to settings for returning users.
5. **Design System Refresh** – shared design tokens, updated gradients, light/dark mode parity across onboarding/panel/settings.
6. **Performance Logging** – console timings for button injection, panel init, and AI generation duration to monitor regressions.

---

## Model Coverage (Today)

- **OpenAI** (active): `gpt-4o-2024-11-20`, `gpt-4o-mini`, `gpt-4o-mini-2024-07-18` (fallback), `o1-2024-12-17`.
- **Gemini** (staged): `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.5-flash-lite` – client ready, UI wiring pending.
- **Claude** (staged): Sonnet/Opus/Haiku variants with API + cookie auth support – awaiting provider selection workflow.

---

## Outstanding Work Before Wider Launch

1. Surface provider selection and wire Gemini/Claude through the service worker.
2. Replace SVG icons with PNG assets for Chrome Web Store submission.
3. Add automated tests (Vitest + Playwright) and error boundaries for resilience.
4. Ship multi-suggestion generation and tone controls inside the panel.
5. Finalise documentation (contribution guide, privacy policy) and store collateral.

---

## References
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Project Map](PROJECT_MAP.md)
- [TODO Backlog](TODO.md)
- [Testing Results](../testing/PERFORMANCE-TEST-RESULTS.md)
