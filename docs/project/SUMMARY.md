# Kotodama v1.3.0 – Release Summary

_Updated 2025-10-18_

## Headline Improvements

- **Brand voice studio** with Markdown import, tweet URL extraction, edit + delete, and tone sliders.
- **Reply-aware composer** featuring context cards, curated reply templates, and improved insertion reliability.
- **Design refresh** built on design tokens with light/dark theming, polished gradients, and performance logging.
- **Settings dashboard** to manage encrypted OpenAI keys, default model/voice selection, and rerun onboarding when needed.
- **Instrumentation** to measure button injection, panel initialization, and generation latency directly in DevTools.

OpenAI remains the production provider (`gpt-4o-2024-11-20`, `gpt-4o-mini`, `o1-2024-12-17`). Gemini and Claude clients live in the repo for future integration.

---

## Completed Checklist

| Area | Highlights |
|------|------------|
| **Onboarding** | Two-step wizard, tweet URL ingestion, Markdown import, theme toggle |
| **Panel UI** | Reply templates, thread toggle (2–10 tweets), character counts, theme switcher, gear icon to settings |
| **Service Worker** | OpenAI routing with automatic fallback when mini/temperature issues occur; encrypted settings retrieval |
| **Brand Voices** | CRUD via IndexedDB, tone sliders persisted, validation for name/description/examples |
| **Settings** | OpenAI key management, default model drop-down, brand voice manager modal, theme persistence |
| **Performance** | Console timers for button injection, panel creation, and AI generation duration |
| **Documentation** | README, quick start/reference, model reference, project map, and testing docs refreshed for v1.3.0 |

---

## Remaining Gaps

1. **Provider selection** – UI and service worker still assume OpenAI; Gemini/Claude helpers await routing + credential storage.
2. **Profile analysis** – `fetchUserTweets` is a stub; no automatic scraping of user timelines yet.
3. **Multiple suggestions** – Panel generates a single draft per request; no A/B comparison or regeneration history.
4. **Analytics & history UX** – Generation history persists only when the feature flag is on; UI surfacing is minimal.
5. **Icon assets** – Chrome Web Store requires PNGs; repository still ships SVG placeholders.
6. **Automated tests** – Vitest is configured but there is no coverage for the panel, settings, or storage utilities.

---

## Recommended Next Steps

1. **Ship multi-provider support**: add provider selection to settings/panel, encrypt Gemini/Claude credentials, and route requests in the service worker.
2. **Expose tone controls**: bring the tone sliders into the panel for quick per-generation adjustments.
3. **Variant generation**: support “Generate 3 options” with quick compare + insert.
4. **Post-generation analytics**: allow marking drafts as posted, track success, and feed insights into suggestions.
5. **Automated regression tests**: add Vitest coverage for critical helpers and consider Playwright for the Twitter/X happy path.
6. **Packaging polish**: convert icons to PNG, verify manifest permissions, and prep Chrome Web Store assets.

---

## Quick Links

- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Project Map](PROJECT_MAP.md)
- [Quick Start Guide](../guides/QUICKSTART.md)
- [API Reference](../reference/API_REFERENCE.md)
- [Testing Checklist](../testing/tested-checklist-18102025.md)
