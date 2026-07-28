# TODO – Post reply-only pivot

_Prioritised backlog for the reply-only build._

## Release Blockers
- [ ] **Manual browser test pass** – the reply-only build has never been exercised in Chrome. Work through [../testing/TESTING.md](../testing/TESTING.md) and record the result in a new dated checklist.
- [ ] **Robust error messaging** – verify network failures, provider rate limits, and missing credentials all surface usefully across panel + onboarding.

## Near-Term Improvements
- [ ] **Reply template management** – allow editing/reordering of the built-in templates or adding custom ones.
- [ ] **History & analytics UI** – expose saved drafts (when `rememberHistory` is enabled).
- [ ] **Profile analysis** – `analyze-profile`, `analyzeTwitterProfile`, and the `userProfiles` table still exist but nothing in the UI reaches them; either wire a real path or delete the dead surface.
- [ ] **Thread context depth** – capture is capped at the 10 most recent preceding tweets; revisit if replies to long threads lose the point the conversation started from.

## Quality & Testing
- [ ] **Test target-tweet selection** – `findTargetTweetArticle` / `extractThread` against fixture markup for timeline-modal, permalink, and mid-thread surfaces. Highest-value test in the repo; a regression silently replies to the wrong tweet.
- [ ] **Test the vision fallback** – an image-fetch failure must degrade to a text-only summary, not throw.
- [ ] **Test Claude sampling-parameter omission** – a wrong prefix list 400s every request on the default model.
- [ ] **Test the sanitizer** – length caps and injection stripping on `TweetContext` and prompts.
- [ ] **Error boundary for the panel** – onboarding and settings are wrapped; the injected panel is not.
- [ ] **Content script resilience** – review selectors and add fallbacks for future Twitter DOM churn.

## Documentation & DevX
- [ ] **Contributor guide** – document coding standards, PR expectations, and release workflow.
- [ ] **User tips** – best practices for writing effective reply intents and curating brand voices.

## Distribution Readiness
- [ ] **Chrome Web Store collateral** – prep screenshots, promo copy, and privacy highlights once the reply flow is verified.
- [ ] **Edge Add-ons submission** – evaluate manifest compatibility and packaging requirements.
- [ ] **Privacy policy** – draft a short statement covering local-only data handling, provider API usage, and the `pbs.twimg.com` image fetches made by the vision pass.

## Done
- [x] **Provider selection workflow** – OpenAI, Gemini, and Claude all route through the service worker, with a default-provider setting.
- [x] **Onboarding provider choice** – step 1 lets you pick OpenAI, Gemini, or Claude and stores that key; the rest can be added later in Settings.
- [x] **Credential storage** – one encrypted key per provider.
- [x] **Tone controls in panel** – shipped as stackable tone presets.
- [x] **Multi-suggestion generation** – drafts accumulate in a carousel with per-draft retry.
- [x] **Convert icons to PNG** – shipped in v1.7.0.
- [x] **Error boundaries** – onboarding and settings shells (`src/components/ErrorBoundary.tsx`).
