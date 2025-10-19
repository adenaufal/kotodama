# TODO – Post v1.3.0

_Prioritised backlog of work remaining after the v1.3.0 release._

## Release Blockers
- [ ] **Convert icons to PNG** – Chrome Web Store requires 16/32/48/128px PNG variants (replace SVG placeholders in `public/icons/`).
- [ ] **Provider selection workflow** – expose OpenAI/Gemini/Claude choice in settings and panel; route requests accordingly in the service worker.
- [ ] **Credential storage extensions** – encrypt and persist Gemini API keys plus Claude API key/cookie once the provider workflow is surfaced.
- [ ] **Robust error messaging** – friendly handling for network failures, OpenAI rate limits, and missing credentials across panel + onboarding.

## Near-Term Improvements
- [ ] **Tone controls in panel** – surface formality/humor/technicality sliders with real-time preview before generation.
- [ ] **Multi-suggestion generation** – offer 2–3 variants per prompt with quick compare + insert.
- [ ] **Reply template management** – allow editing/reordering of the built-in templates or adding custom ones.
- [ ] **History & analytics UI** – expose saved generations (when `rememberHistory` is enabled) and provide simple performance insights.
- [ ] **Profile analysis** – replace `fetchUserTweets` stub with actual scraping or API integration to enrich target profiles.

## Quality & Testing
- [ ] **Automated tests** – add Vitest coverage for API helpers, storage utilities, and UI pieces; consider Playwright for end-to-end flows.
- [ ] **Error boundaries** – wrap major React shells (panel, settings, onboarding) to catch rendering failures gracefully.
- [ ] **Telemetry hooks (optional)** – structured logging (without sending data off device) to ease debugging during development.
- [ ] **Content script resilience** – review selectors and add fallbacks for future Twitter DOM churn.

## Documentation & DevX
- [ ] **Contributor guide** – document coding standards, PR expectations, and release workflow.
- [ ] **Architecture diagram** – visual map of runtime communication (content script ↔ panel ↔ service worker).
- [ ] **User tips** – expand docs with best practices for writing effective prompts and curating brand voices.

## Distribution Readiness
- [ ] **Chrome Web Store collateral** – prep screenshots, promo copy, and privacy highlights once feature set stabilises.
- [ ] **Edge Add-ons submission** – evaluate manifest compatibility and packaging requirements.
- [ ] **Privacy policy** – draft a short statement clarifying local-only data handling and API usage.
