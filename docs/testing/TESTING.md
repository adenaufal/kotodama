# Testing Guide - Kotodama Extension

Manual test plan for the reply-only extension: shadow-root panel, tweet capture, vision reading,
reply generation, and insertion.

Kotodama does not compose new tweets and does not generate or post threads. If you find a test here
for those, it is a leftover — delete it.

## Table of Contents

- [Phase 1: Build & Load Extension](#phase-1-build--load-extension)
- [Phase 2: Twitter DOM Integration Tests](#phase-2-twitter-dom-integration-tests)
- [Phase 3: Functional Testing](#phase-3-functional-testing)
- [Phase 4: Common Issues & Debugging](#phase-4-common-issues--debugging)
- [Phase 5: Edge Cases](#phase-5-edge-cases)
- [Testing Checklist](#testing-checklist)

---

## Phase 1: Build & Load Extension

### Step 1: Build the Extension

```bash
# From project root
npm run build
```

**Expected Output:**
- `dist/` folder created with roughly this shape:
  ```
  dist/
  ├── manifest.json
  ├── background.js
  ├── content.js          # content script + panel, single IIFE
  ├── onboarding.js
  ├── settings.js
  ├── index.css
  ├── icons/
  └── src/
      ├── onboarding/index.html
      └── settings/index.html
  ```
- No TypeScript compilation errors
- **No `panel.js` and no `dist/src/panel/`** — the panel ships inside `content.js`

### Step 2: Load in Chrome/Edge

1. Open browser and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked" button
4. Select the `dist/` folder from your project
5. Extension should appear in the list

**First Load Checklist:**
- ✅ Extension loads without errors
- ✅ Extension icon appears in browser toolbar
- ✅ No console errors in extension details page
- ✅ Service worker link is present (it may read "inactive" — that is normal MV3 behaviour)

**Troubleshooting:**
- If manifest errors: Check [public/manifest.json](../../public/manifest.json) syntax
- If build fails: Run `npm install` and retry

---

## Phase 2: Twitter DOM Integration Tests

### Test 1: Content Script Injection

**Goal:** Verify the content script mounts its shadow root on Twitter/X pages

**Steps:**
1. Open a new tab and navigate to https://twitter.com or https://x.com
2. Open Chrome DevTools (F12 or Right-click → Inspect)
3. Go to the Console tab
4. Look for: `[Kotodama] Shadow DOM injected`

**Expected Results:**
- Console message appears within 1-2 seconds of page load
- A floating sparkle button is visible (top-right by default)
- No JavaScript errors in console
- Page loads and functions normally

**Debug Commands:**
```javascript
// Host element + shadow root
const host = document.getElementById('kotodama-host')
console.log('Host:', host, 'Shadow root:', host?.shadowRoot)

// Button lives inside the shadow root, not the page DOM
console.log('Button:', host?.shadowRoot?.querySelector('.kotodama-floating-button'))
```

**If Test Fails:**
- Verify `content.js` exists in `dist/`
- Check the `content_scripts` block in `public/manifest.json`
- Ensure host_permissions include twitter.com and x.com
- Reload extension and refresh the Twitter page

---

### Test 2: Floating Button

**Goal:** Verify the button renders, drags, and persists its position

**Steps:**
1. Confirm the sparkle button is visible on any Twitter/X page (it is page-level, not attached to a compose box)
2. Drag it somewhere else and release
3. Refresh the page

**Expected:**
- Dragging past ~5px moves the button instead of triggering a click
- A short click (no drag) opens the panel
- After refresh the button reappears at the dragged position

**Debug:**
```javascript
chrome.storage.local.get(['buttonPosition'], r => console.log(r))
```

---

### Test 3: Reply Context Capture

**Goal:** Verify the correct tweet is captured

**Steps:**
1. Open a tweet permalink (`/status/...`) with at least one image and a few replies above it
2. Click the reply box, then click the Kotodama button
3. Check the context card at the top of the panel

**Expected Behaviour:**
- Header reads `Reply to @handle` for the tweet you are actually replying to
- Context card shows author, relative time, tweet text, image thumbnails
- Preceding tweets in the thread are collapsible under the card (capped at 10)
- Metrics are captured when present

**Selectors involved** ([content-script.tsx](../../src/content/content-script.tsx)):
```typescript
'article[data-testid="tweet"]'      // tweet cards
'[data-testid="tweetText"]'         // body
'[data-testid="User-Name"]'         // author
'[data-testid="tweetPhoto"] img'    // photos
```

**Cases that must all pick the right tweet:**
- Reply from the timeline (modal composer) — background timeline tweets must NOT leak in
- Reply from a `/status/` permalink page
- Reply deep inside a thread — the target is the tweet immediately above the composer, not the first tweet on the page

**If capture fails:**
- Panel shows the "No tweet in view" empty state instead of a context card
- Inspect a tweet article and compare against the selectors above

---

### Test 4: Panel Rendering

**Goal:** Verify the panel opens inside the shadow root

**Steps:**
1. Click the Kotodama button
2. Panel appears anchored to the right
3. Click the × to close

**Visual Checklist:**
- ✅ Dark (zinc) panel, unaffected by Twitter's own theme
- ✅ Three zones: header, scrolling middle, pinned composer at the bottom
- ✅ Only the middle zone scrolls
- ✅ Panel doesn't block Twitter UI interactions outside its own box
- ✅ Panel is responsive (`min(450px, 100vw - 40px)`)

**Debug:**
```javascript
const shadow = document.getElementById('kotodama-host')?.shadowRoot
console.log('Panel mounted:', !!shadow?.querySelector('header'))
```

Page styles cannot reach into the shadow root — if the panel looks unstyled, the inlined CSS in
`content.js` failed to build, not Twitter's CSS interfering.

---

## Phase 3: Functional Testing

### Test 5: Onboarding Flow

**Goal:** Test first-time setup wizard

**Steps:**
1. Click the Kotodama extension icon in browser toolbar
2. Onboarding opens in a new tab

#### Step 1: API Key Entry
1. Enter your OpenAI API key (format: `sk-...`)
2. Click "Continue"

**Expected:**
- Input field accepts text
- "Continue" disabled until a key is entered
- No format validation (validated on first API call)

#### Step 2: Brand Voice Setup
1. Enter a name and description
2. Add at least one example tweet (text or a tweet URL)
3. Complete setup

**Expected:**
- Settings saved to Chrome Storage (encrypted)
- Brand voice saved to IndexedDB

**Verify:**
```javascript
chrome.storage.local.get(null, (r) => console.log(r))   // key must be an encrypted blob
chrome.runtime.sendMessage({ type: 'list-brand-voices' }, r => console.log(r))
```

Gemini and Anthropic keys are added afterwards in Settings, which is also where the default
provider is chosen.

---

### Test 6: Context Reading (Vision Pass)

**Goal:** Verify the tweet is read before generation

**Steps:**
1. Open a tweet **with images** and click the Kotodama button
2. Watch the context card

**Expected:**
- A loading state, then 1-3 plain sentences describing what the tweet is about, including its images
- The summary is not a restatement of the tweet text — it should mention what the images show
- If it fails, the card shows an error state with a retry, and **Generate reply stays enabled**

**Service worker console:**
```
Context analysis requested: { provider, images: N, threadEntries: N }
Context analysis complete: { visionFailed: false }
```

**Force the degraded path:** block `pbs.twimg.com` in DevTools → Network request blocking, then
reopen the panel. Expect `visionFailed: true`, a text-only summary, and generation still working.

---

### Test 7: Reply Generation

**Goal:** Test end-to-end drafting

**Prerequisites:** onboarding completed with a valid key, at least one brand voice.

**Steps:**
1. Open a tweet and the panel
2. Type an intent in the composer, e.g. `Agree and add one concrete example`
3. Optionally pick a reply template, tone presets, and a length (S/M/L)
4. Click **Generate reply**

**Expected:**
- Button reads "Writing…" and is disabled while in flight
- Draft appears in the result carousel with a character count
- Generating again prepends a new draft rather than replacing the list
- Retry on a single draft replaces just that one in place

**Background process** ([service-worker.ts](../../src/background/service-worker.ts)):
1. Rate limit check
2. Resolve provider + decrypt its API key
3. Load brand voice from IndexedDB
4. Call the provider client
5. Persist to history when `rememberHistory` is enabled

**Also verify:**
- With no brand voices, an "Add a brand voice" link appears and Generate stays disabled
- With an empty intent, Generate stays disabled

**If Generation Fails:**
| Error | Meaning | Fix |
|-------|---------|-----|
| "…API key not configured" | No key for the selected provider | Add it in Settings |
| "Invalid …API key" | 401 from the provider | Replace the key |
| "Rate limit exceeded" | Kotodama's own limiter (20/min) | Wait for the window |
| 400 mentioning `temperature` | Sampling param sent to a Claude 5-series model | See `FIXED_TEMPERATURE_MODEL_PREFIXES` in `src/api/claude.ts` |
| 404 on a Claude model | Date-suffixed / retired model id | Use bare ids (`claude-sonnet-5`) |
| "Network error…" | Connectivity or blocked host | Check the network and `host_permissions` |

---

### Test 8: Insertion

**Goal:** Insert a draft into the reply box

**Steps:**
1. After generating, click **Insert** on a draft
2. Watch the Twitter compose box

**Expected Behaviour:**
- Text appears in the reply box
- Twitter's character counter updates
- The Reply/Post button becomes enabled
- Cursor is positioned at the end
- **The panel stays open** — insertion does not close it

**Insertion Logic** ([content-script.tsx](../../src/content/content-script.tsx)):
1. `findComposeEditable()` locates the box, preferring `document.activeElement`:
   ```typescript
   '[data-testid="tweetTextarea_0"][contenteditable="true"]'
   '[data-testid="tweetTextarea_0"] [contenteditable="true"]'
   '[role="textbox"][contenteditable="true"]'
   '[aria-label="Tweet text"][contenteditable="true"]'
   '[aria-label="Post text"][contenteditable="true"]'
   ```
2. Select all existing content, then dispatch a synthetic `paste` with a `DataTransfer` payload
3. If the paste wasn't handled, fall back to `beforeinput` → `execCommand('insertText')` → `textContent`
4. Dispatch `input` + `change`, collapse the selection to the end, blur/refocus

**Debug:**
```javascript
[
  '[data-testid="tweetTextarea_0"][contenteditable="true"]',
  '[data-testid="tweetTextarea_0"] [contenteditable="true"]',
  '[role="textbox"][contenteditable="true"]',
].forEach(s => console.log(s, document.querySelector(s) ? '✅' : '❌'))
```

**If Insertion Fails:**
- Text appears but the counter doesn't update → the `input` event isn't reaching Twitter's handler
- Nothing appears → every fallback failed; check the console for `Could not find tweet compose box`

---

## Phase 4: Common Issues & Debugging

### Issue 1: Button Not Appearing

**Symptoms:** page loads, no sparkle button.

**Diagnosis:**
```javascript
console.log(document.getElementById('kotodama-host'))          // host present?
console.log(document.getElementById('kotodama-host')?.shadowRoot) // shadow attached?
```

**Causes:**
1. `content.js` missing or stale in `dist/` — rebuild and reload the extension
2. The script threw during mount — check the page console
3. The button was dragged off-screen — clear it:
   ```javascript
   chrome.storage.local.remove('buttonPosition')
   ```

---

### Issue 2: Panel Opens With "No tweet in view"

**Cause:** `detectContext()` returned `null` — either the page isn't a reply surface, or the
selectors no longer match.

**Diagnosis:**
```javascript
console.log('articles:', document.querySelectorAll('article[data-testid="tweet"]').length)
console.log('composer:', document.querySelector('[data-testid="tweetTextarea_0"]'))
console.log('replying-to:', document.querySelector('[data-testid="inlineReplyingTo"], [aria-label*="Replying to"]'))
```

**Fix:** inspect the live markup and update the selectors in `src/content/content-script.tsx`. Keep
the "article immediately preceding the composer" rule and the `[role="dialog"]` scoping — both exist
to stop the wrong tweet being captured.

---

### Issue 3: Panel Renders Unstyled

**Cause:** the inlined stylesheet (`src/panel/index.css?inline`) didn't make it into `content.js`.

**Fix:** rebuild. Remember `npm run build` runs Vite twice; the second pass
(`vite.content.config.ts`) is the one that produces the loaded `content.js`.

---

### Issue 4: Generation Fails / API Errors

See the error table in [Test 7](#test-7-reply-generation). Check the **service worker** console
(`chrome://extensions/` → Kotodama → "service worker") for the full provider response — the panel
only shows the rewritten user-facing message.

---

### Issue 5: "Extension was reloaded" Overlay

**Cause:** the extension was rebuilt/reloaded while the page still had the old content script.

**Expected:** the panel detects the invalidated runtime and shows a refresh prompt rather than
failing silently. Refreshing the page clears it.

---

## Phase 5: Edge Cases

### Edge Case 1: Tweet With No Text (Image Only)

Context extraction requires a username plus either text or at least one image. An image-only tweet
must still be captured, and the vision summary should describe the image.

### Edge Case 2: Very Long Tweet

`tweetContextText` is capped at 2000 characters by the sanitizer (long-form posts exist; 280 would
truncate the thing being replied to). Preceding thread entries are capped at 500 each.

### Edge Case 3: Draft Over 280 Characters

The system prompt asks for under 280 characters, but nothing enforces it. Verify the character count
is displayed so the user can see the overflow before inserting.

### Edge Case 4: Panel State Persistence

Closing and reopening the panel resets React state — drafts are lost. Current behaviour; note it if
it becomes a complaint.

### Edge Case 5: Rapid Clicking

Generate is disabled while `generating` is true, so double-submission should be impossible. Verify
by clicking rapidly.

### Edge Case 6: Twitter UI Redesign

**Impact:** critical — capture and insertion both break.

**Recovery:** inspect the live markup, update the selectors in `src/content/content-script.tsx`,
update the selector list in `CLAUDE.md`, ship a patch.

---

## Testing Checklist

Use this checklist for systematic testing before each release:

### Build & Load
- [ ] `npm run build` succeeds without errors
- [ ] `dist/content.js` exists and there is no `dist/panel.js`
- [ ] Extension loads in `chrome://extensions/` without warnings
- [ ] No console errors on extension load

### Content Script
- [ ] `[Kotodama] Shadow DOM injected` appears on Twitter
- [ ] Floating button visible and draggable; position persists across reloads
- [ ] No JavaScript errors in the page console
- [ ] Survives SPA navigation between pages

### Context Capture
- [ ] Correct tweet captured from a timeline reply (modal composer)
- [ ] Correct tweet captured on a `/status/` permalink
- [ ] Correct tweet captured mid-thread (not the first article on the page)
- [ ] Background timeline tweets do not leak into a modal capture
- [ ] Images captured with alt text when present
- [ ] Preceding thread entries captured, oldest first, capped at 10
- [ ] Non-reply pages fall back to the "No tweet in view" empty state

### Vision / Context Card
- [ ] Summary loads and describes the tweet, including images
- [ ] Retry works after a failed summary
- [ ] Blocking `pbs.twimg.com` degrades to a text-only summary (`visionFailed: true`)
- [ ] Generation remains possible while the summary is loading or errored

### Panel UI
- [ ] Opens and closes cleanly
- [ ] Only the middle zone scrolls; header and composer stay pinned
- [ ] Responsive at narrow viewport widths
- [ ] Doesn't block Twitter UI outside its own box
- [ ] Reply templates fill the intent box
- [ ] Tone presets toggle on/off and stack
- [ ] Length control changes the hint appended to the prompt

### Onboarding
- [ ] Opens on first install (extension icon click)
- [ ] API key input and "Continue" validation work
- [ ] Brand voice fields validate
- [ ] Example tweets accept text or URLs (syndication fetch)
- [ ] "Complete setup" saves settings and the default voice
- [ ] Returning users are redirected to settings

### Generation
- [ ] Intent box accepts typing and pasting
- [ ] Brand voice selector populated
- [ ] Generate disabled with no intent, no voice, or no captured tweet
- [ ] Loading state shows during generation
- [ ] Draft appears in the carousel with an accurate character count
- [ ] New generations prepend; retry replaces one draft in place
- [ ] Copy button on a draft puts the text on the clipboard
- [ ] Error messages display in the composer area
- [ ] Each of OpenAI / Gemini / Claude works when selected in Settings

### Insertion
- [ ] Insert writes the draft into the reply box
- [ ] Twitter's character counter updates
- [ ] Twitter's Reply/Post button becomes enabled
- [ ] Cursor positioned at the end
- [ ] Panel stays open after insertion
- [ ] Line breaks and emoji preserved

### Error Handling
- [ ] Missing key for the selected provider shows a provider-labelled message
- [ ] Invalid API key shows a clear error
- [ ] Rate limit (20/min) shows a helpful message
- [ ] Network errors caught and displayed
- [ ] Extension-reload overlay appears after a rebuild and the page recovers on refresh

### Security & Privacy
- [ ] API keys encrypted in storage
  ```javascript
  chrome.storage.local.get(null, r => console.log(r)) // no plain 'sk-...'
  ```
- [ ] No API keys in console logs (search the console for `sk-`)
- [ ] No telemetry or tracking
- [ ] Network tab shows only provider APIs plus `pbs.twimg.com` image fetches
- [ ] Prompt-injection text inside a tweet (e.g. "ignore previous instructions") does not change the assistant's behaviour

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Edge (latest, `edge://extensions/`)
- [ ] Chromium-based browsers (Brave, Vivaldi, Opera)

### Multi-Language Testing
- [ ] Works on Twitter with a non-English UI
- [ ] Replies in a requested language when the intent says so
- [ ] Emoji handled correctly through insertion
- [ ] Right-to-left text inserts with correct direction

---

## Test Data Sets

### Sample Intents

**Short:**
- "Agree and add one example"
- "Congratulate them"
- "Ask a follow-up question"

**Medium:**
- "Push back politely and ask for their benchmark"
- "Share a similar experience without making it about me"
- "Explain why this trade-off matters for small teams"

**Tricky (context-dependent — these are where the vision pass earns its keep):**
- "React to what's in the screenshot"
- "Answer the question in the chart"
- "Reply to the point they made earlier in the thread, not the last tweet"

### Sample Brand Voices

**Professional Tech Voice:**
```
Name: Professional Tech
Description: Clear, authoritative, educational. Uses technical terms but explains them.
Examples:
- "TypeScript isn't just about catching bugs—it's about scaling your team's confidence in the codebase."
- "Quick reminder: Performance optimization is premature until you've measured. Profile first, optimize second."
```

**Casual Friendly Voice:**
```
Name: Friendly Casual
Description: Conversational, enthusiastic, uses emojis liberally. Feels like talking to a friend.
Examples:
- "omg just shipped the new feature!! been working on this for weeks and it's finally live!"
- "anyone else procrastinate by over-engineering their side projects? just me? 😅"
```

---

## Automated Testing

### Unit Tests (Vitest)
```bash
npm test
```

Current coverage is thin — encryption, settings, and a context-card helper. Highest-value additions:
- `api/vision.ts`: the degraded-path fallback (image fetch fails → text-only summary)
- `api/claude.ts`: sampling-parameter omission per model prefix
- `utils/sanitize.ts`: caps and injection stripping
- `utils/rateLimiter.ts`: sliding window boundaries

The DOM-dependent parts of `content-script.tsx` (target-tweet selection) are the most fragile code in
the repo and are currently untested.

---

## Reporting Issues

When reporting bugs, include:

1. **Extension version:** Check in `chrome://extensions/`
2. **Browser:** Chrome/Edge version
3. **Provider + model** selected in Settings
4. **Steps to reproduce:** exact sequence, including which page (timeline vs `/status/`)
5. **Expected vs actual behaviour**
6. **Screenshots/Videos**
7. **Console logs:** from both the page and the service worker
8. **Network logs:** if API-related

**Template:**
```markdown
## Bug Report

**Extension Version:** 1.7.2
**Browser:** Chrome 120.0.6099.109
**Provider/Model:** Claude / claude-sonnet-5

### Steps to Reproduce
1. Open a tweet with 2 images
2. Click reply
3. Click the Kotodama button
4. Type "react to the screenshot"
5. Click Generate reply

### Expected
Reply references what the screenshot shows

### Actual
Context card shows an error; reply is generic

### Console Logs
```
[Kotodama] Vision pass failed, falling back to text-only summary: ...
```
```

---

## Troubleshooting Quick Reference

| Problem | Quick Fix |
|---------|-----------|
| Button not appearing | Rebuild + reload; check `#kotodama-host` exists; clear `buttonPosition` |
| "No tweet in view" | Update selectors in `content-script.tsx` |
| Panel unstyled | Rebuild — the second Vite pass produces the loaded `content.js` |
| Summary always errors | Check the provider key and `pbs.twimg.com` host permission |
| Generation fails | Check the service worker console for the raw provider error |
| Claude 400 on `temperature` | Add the model prefix to `FIXED_TEMPERATURE_MODEL_PREFIXES` |
| Claude 404 | Remove the date suffix from the model id |
| Text not inserting | Update selectors in `findComposeEditable()` |
| Service worker inactive | Normal MV3 — it wakes on message |
| "Extension was reloaded" | Refresh the Twitter page |
