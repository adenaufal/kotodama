# Testing Guide - Kotodama Extension

Complete guide for testing the Twitter DOM integration and overall functionality of the Kotodama AI Tweet Composer extension.

## Table of Contents

- [Phase 1: Build & Load Extension](#phase-1-build--load-extension)
- [Phase 2: Twitter DOM Integration Tests](#phase-2-twitter-dom-integration-tests)
- [Phase 3: Functional Testing](#phase-3-functional-testing)
- [Phase 4: Common Issues & Debugging](#phase-4-common-issues--debugging)
- [Phase 5: Advanced Testing Scenarios](#phase-5-advanced-testing-scenarios)
- [Testing Checklist](#testing-checklist)

---

## Phase 1: Build & Load Extension

### Step 1: Build the Extension

```bash
# From project root
npm run build
```

**Expected Output:**
- `dist/` folder created with the following structure:
  ```
  dist/
  ├── manifest.json
  ├── background.js
  ├── commonjsHelpers.js
  ├── content.js
  ├── models.js
  ├── panel.js
  ├── onboarding.js
  ├── settings.js
  ├── index.js
  ├── index.css
  ├── icons/
  └── src/
      ├── panel/index.html
      ├── onboarding/index.html
      └── settings/index.html
  ```
- No TypeScript compilation errors
- Total bundle size ~320KB

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
- ✅ Service worker shows "active" status (click "service worker" link to inspect)

**Troubleshooting:**
- If icons show as broken: Expected for now (SVG placeholders, needs PNG conversion)
- If manifest errors: Check [public/manifest.json](public/manifest.json) syntax
- If build fails: Run `npm install` and retry

---

## Phase 2: Twitter DOM Integration Tests

### Test 1: Content Script Injection

**Goal:** Verify content script loads on Twitter/X pages

**Steps:**
1. Open a new tab and navigate to https://twitter.com or https://x.com
2. Open Chrome DevTools (F12 or Right-click → Inspect)
3. Go to the Console tab
4. Look for the message: `"Kotodama content script loaded"`

**Expected Results:**
- Console message appears within 1-2 seconds of page load
- No JavaScript errors in console
- Page loads and functions normally

**Debug Commands:**
```javascript
// Check if content script loaded
console.log('Kotodama loaded:', !!window.kotodamaLoaded)

// Check for observer
console.log('Observer active:', !!document.querySelector('.kotodama-ai-button'))
```

**If Test Fails:**
- Verify `content.js` exists in `dist/` folder
- Check [manifest.json:18-24](public/manifest.json) content_scripts configuration
- Ensure host_permissions include twitter.com and x.com
- Reload extension and refresh Twitter page

---

### Test 2: Compose Box Detection

**Goal:** Verify MutationObserver detects compose boxes and injects button

**Steps:**
1. On Twitter home page, click the "What is happening?!" compose box
2. Look for the Kotodama button appearing in or near the compose area
3. Try different compose box entry points:
   - Home page main composer
   - "Tweet" button in navigation (opens modal)
   - Profile page "Tweet" button
   - Quote tweet composer

**Current DOM Selectors** ([content-script.ts](src/content/content-script.ts)):
```typescript
'[data-testid="tweetTextarea_0"]'           // Primary selector
'[role="textbox"][contenteditable="true"]'   // Fallback selector
```

**Expected Button Appearance:**
- **Location:**
  - Inside toolbar if `[data-testid="toolBar"]` exists
  - Otherwise: Absolute positioned at bottom-right of compose area
- **Styling:**
  - Gradient background (blue to purple)
  - Sparkle icon + "Kotodama" text
  - Rounded pill shape
  - Hover effect (slight scale and shadow)

**Debug Commands** (run in DevTools Console):
```javascript
// Check if compose boxes are detected
const composeBoxes = document.querySelectorAll('[data-testid="tweetTextarea_0"]')
console.log(`Found ${composeBoxes.length} compose box(es)`, composeBoxes)

// Check if button was injected
const buttons = document.querySelectorAll('.kotodama-ai-button')
console.log(`Found ${buttons.length} Kotodama button(s)`, buttons)

// Check if toolbar exists (for button placement)
const toolbars = document.querySelectorAll('[data-testid="toolBar"]')
console.log(`Found ${toolbars.length} toolbar(s)`, toolbars)

// List all contenteditable elements (for debugging)
const editables = document.querySelectorAll('[contenteditable="true"]')
console.log(`Found ${editables.length} contenteditable element(s)`, editables)
```

**If Button Doesn't Appear:**
1. **Twitter changed their DOM structure:**
   - Inspect the compose box element
   - Copy the actual `data-testid` or attributes
   - Update selectors in [content-script.ts](src/content/content-script.ts)

2. **Button injection failed:**
   - Check browser console for JavaScript errors
   - Verify MutationObserver is running
   - Try clicking compose box multiple times

3. **CSS conflicts:**
   - Button might be hidden behind Twitter elements
   - Check z-index in [content-script.ts](src/content/content-script.ts)

---

### Test 3: Reply Box Detection

**Goal:** Verify button appears when replying to tweets

**Steps:**
1. Find any tweet in your timeline
2. Click the "Reply" button/icon
3. Reply compose box should open
4. Kotodama button should appear in the reply box

**Reply-Specific Detection** ([content-script.ts](src/content/content-script.ts)):
```typescript
const isReply = !!composeBox.closest('[data-testid="reply"]')
```

**Expected Behavior:**
- Button appears in reply composer
- Clicking button captures tweet context:
  - Original tweet text
  - Author's username
  - Timestamp
- Panel shows "Replying to @username" card with context

**Debug Commands:**
```javascript
// Check if reply container detected
const replyContainers = document.querySelectorAll('[data-testid="reply"]')
console.log(`Found ${replyContainers.length} reply container(s)`, replyContainers)

// Check tweet text extraction
const tweetTexts = document.querySelectorAll('[data-testid="tweetText"]')
console.log(`Found ${tweetTexts.length} tweet text element(s)`, tweetTexts)

// Check username extraction
const usernames = document.querySelectorAll('[data-testid="User-Name"] a[role="link"]')
console.log(`Found ${usernames.length} username element(s)`, usernames)
```

**If Reply Detection Fails:**
- Twitter may have renamed the `[data-testid="reply"]` attribute
- Update selector in [content-script.ts](src/content/content-script.ts)
- Check extractTweetContext() function for selector changes

---

### Test 4: Panel Opening & Animation

**Goal:** Verify side panel opens with smooth animations

**Steps:**
1. Click the Kotodama button in any compose box
2. Side panel should slide in from the right
3. Panel should load the React UI
4. Click the × button to close
5. Panel should slide out

**Expected Panel Behavior** ([content-script.ts](src/content/content-script.ts)):
- **Position:** Fixed, right side, 24px from edge
- **Dimensions:** 420px wide × 720px tall (responsive on small screens)
- **Animation:** 300ms ease, opacity + translateY transform
- **URL:** `chrome-extension://[extension-id]/src/panel/index.html`

**Visual Checklist:**
- ✅ Panel slides in smoothly
- ✅ Rounded corners (20px border-radius)
- ✅ Gradient header (blue → indigo → fuchsia)
- ✅ "Kotodama AI Tweet Composer" title visible
- ✅ Close button (×) in top-right corner
- ✅ Form fields: prompt textarea, brand voice dropdown
- ✅ "Generate with AI" button
- ✅ Panel doesn't block Twitter UI

**Debug Commands:**
```javascript
// Check if panel iframe was created
const panel = document.querySelector('#kotodama-panel')
console.log('Panel element:', panel)

// Check panel visibility state
if (panel) {
  console.log('Opacity:', panel.style.opacity)
  console.log('Transform:', panel.style.transform)
  console.log('Pointer events:', panel.style.pointerEvents)
}

// Check panel source URL
if (panel) {
  console.log('Panel URL:', panel.src)
}
```

**If Panel Doesn't Open:**
1. **CSP (Content Security Policy) errors:**
   - Check browser console for CSP violations
   - Verify [manifest.json:40-45](public/manifest.json) web_accessible_resources

2. **Panel HTML not loading:**
   - Open DevTools → Network tab
   - Look for 404 errors on `src/panel/index.html`
   - Verify file exists in `dist/src/panel/`

3. **React app not initializing:**
   - Inspect panel iframe context (right-click panel → Inspect Frame)
   - Check console in iframe context for errors
   - Verify `index.js` loaded successfully

---

## Phase 3: Functional Testing

### Test 5: Onboarding Flow

**Goal:** Test first-time setup wizard

**Steps:**
1. Click the Kotodama extension icon in browser toolbar
2. Onboarding wizard should open in a new tab or popup

#### Step 1: API Key Entry
1. Enter your OpenAI API key (format: `sk-...`)
2. Click "Continue"

**Expected:**
- Input field accepts text
- "Continue" button disabled until key entered
- No validation on key format (validated on first API call)
- Smooth transition to Step 2

#### Step 2: Brand Voice Setup
1. Enter brand voice name: `"Test Voice"`
2. Enter description: `"Professional but friendly tech communicator"`
3. Add example tweets (at least 2 recommended):
   ```
   Example 1: "Just shipped a new feature! 🚀 User feedback has been incredible."
   Example 2: "Quick tip: Always test in production... just kidding! Test locally first."
   Example 3: "The best code is code you don't have to write. Automate everything."
   ```
4. Click "Complete setup"

**Expected:**
- Alert appears: "Setup complete! Visit Twitter/X and click the sparkle button in any compose box."
- Tab/window closes automatically
- Settings saved to Chrome Storage (encrypted)
- Brand voice saved to IndexedDB

**Verify Settings Saved:**
```javascript
// Run in browser console (any page)
chrome.storage.local.get(['settings'], (result) => {
  console.log('Settings:', result)
})
```

**Verify Brand Voice Saved:**
```javascript
// Run in background service worker console
// (chrome://extensions → Kotodama → Service worker "inspect")
chrome.runtime.sendMessage({
  type: 'list-brand-voices'
}, response => {
  console.log('Brand voices:', response)
})
```

**If Onboarding Fails:**
- Check [onboarding/Onboarding.tsx](src/onboarding/Onboarding.tsx) for errors
- Verify storage permissions in manifest
- Check service worker console for message handling errors

---

### Test 6: Tweet Generation (Full Flow)

**Goal:** Test end-to-end AI generation

**Prerequisites:**
- Onboarding completed with valid OpenAI API key
- At least one brand voice created

**Steps:**
1. Go to Twitter/X and open a compose box
2. Click the Kotodama button
3. Panel opens on the right side
4. In the panel:
   - **Brand voice dropdown:** Select your created voice
   - **Prompt field:** Enter `"Share a quick tip about code reviews"`
   - Click **"Generate with AI"** button

**Expected Flow:**

**During Generation:**
- Button text changes to "Crafting magic…"
- Button becomes disabled
- Loading state visible (2-5 seconds typically)

**After Generation:**
- Generated tweet appears in a card below
- Card shows:
  - "Suggested copy" label
  - Character count (e.g., "156 characters")
  - Generated tweet text
- "Insert to X" button appears (green, emerald color)
- "Regenerate" link appears top-right

**Background Process** ([service-worker.ts](src/background/service-worker.ts)):
1. Panel sends `generate` message to background worker
2. Background retrieves brand voice from IndexedDB
3. Background decrypts OpenAI API key
4. Background calls OpenAI API with:
   - System prompt (built from brand voice)
   - User prompt
   - Model: `gpt-4o-2024-11-20` (fallback: `gpt-4o-mini`)
5. Background returns generated content to panel
6. Panel displays result

**Debug Background Service Worker:**
```javascript
// In service worker console (chrome://extensions → inspect service worker)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message)
  return true
})
```

**If Generation Fails:**

1. **Invalid API Key:**
   ```
   Error: Incorrect API key provided
   ```
   → Re-run onboarding to enter correct key

2. **Rate Limit:**
   ```
   Error: Rate limit exceeded
   ```
   → Wait 60 seconds, try again, or upgrade API plan

3. **Network Error:**
   ```
   Error: Failed to fetch
   ```
   → Check internet connection
   → Check firewall/proxy settings
   → Verify OpenAI API is not blocked

4. **Model Fallback Logic** ([openai.ts:17-26](src/api/openai.ts)):
   - Tries primary model first
   - Falls back to mini model on error
   - Returns error if both fail

5. **Check Service Worker Console:**
   - Go to `chrome://extensions/`
   - Find Kotodama extension
   - Click "service worker" link
   - Check for API call logs and errors

---

### Test 7: Content Insertion

**Goal:** Insert generated tweet into Twitter compose box

**Steps:**
1. After generating a tweet (Test 6), click **"Insert to X"** button
2. Watch the panel and compose box

**Expected Behavior:**
- Panel closes after 500ms delay ([content-script.ts](src/content/content-script.ts))
- Tweet text appears in Twitter compose box
- Twitter's character counter updates
- Tweet button becomes enabled
- Cursor positioned at end of text

**Insertion Logic** ([content-script.ts](src/content/content-script.ts)):
1. `findComposeEditable()` searches for active compose box using selectors:
   ```typescript
   '[data-testid="tweetTextarea_0"][contenteditable="true"]'
   '[data-testid="tweetTextarea_0"] [contenteditable="true"]'
   '[role="textbox"][contenteditable="true"]'
   '[aria-label="Tweet text"][contenteditable="true"]'
   '[aria-label="Post text"][contenteditable="true"]'
   ```
2. Focus the contenteditable div
3. Attempt `document.execCommand('insertText', false, content)`
4. Fallback: Set `textContent` directly
5. Dispatch `InputEvent` to trigger Twitter's UI updates
6. Position cursor at end

**Debug Insertion:**
```javascript
// Check which compose box selector matches
const selectors = [
  '[data-testid="tweetTextarea_0"][contenteditable="true"]',
  '[data-testid="tweetTextarea_0"] [contenteditable="true"]',
  '[role="textbox"][contenteditable="true"]',
  '[aria-label="Tweet text"][contenteditable="true"]',
  '[aria-label="Post text"][contenteditable="true"]'
]

selectors.forEach(selector => {
  const el = document.querySelector(selector)
  console.log(selector, el ? '✅ Found' : '❌ Not found')
})

// Test manual insertion
const box = document.querySelector('[data-testid="tweetTextarea_0"]')
if (box) {
  box.textContent = 'Test insertion'
  box.dispatchEvent(new InputEvent('input', { bubbles: true }))
  console.log('✅ Manual insertion successful')
}
```

**If Insertion Fails:**

1. **Compose box not found:**
   - Twitter changed their DOM structure
   - Inspect the compose box element
   - Update selectors in `findComposeEditable()` ([content-script.ts](src/content/content-script.ts))

2. **Text appears but counter doesn't update:**
   - InputEvent not dispatching correctly
   - Try different event types: `input`, `change`, `keyup`

3. **Text doesn't appear at all:**
   - `execCommand` and `textContent` both failed
   - Check browser console for permission errors
   - Twitter might have ContentEditable protections

---

### Test 8: Thread Generation

**Goal:** Multi-tweet thread creation

**Steps:**
1. Open Twitter compose box
2. Click Kotodama button to open panel
3. Toggle **"Turn this into a thread"** checkbox
4. Set **number of posts**: `3`
5. Enter prompt: `"Explain the benefits of TypeScript in a thread"`
6. Click **"Generate with AI"**

**Expected Results:**
- Loading state for 5-10 seconds (longer than single tweet)
- Three separate tweet boxes appear, each labeled:
  - "Suggestion 1" (with character count)
  - "Suggestion 2" (with character count)
  - "Suggestion 3" (with character count)
- Each tweet under 280 characters
- Tweets logically connected (thread flow)
- Single **"Insert to X"** button at bottom

**Thread Insertion Format:**
When inserted, tweets are combined with double newlines:
```
First tweet content here

Second tweet content here

Third tweet content here
```

**Verify in Panel UI** ([Panel.tsx:209-236](src/panel/Panel.tsx)):
- Thread checkbox toggles properly
- Number input constraints: min=2, max=10
- Thread length controls enabled/disabled based on checkbox

**API Thread Generation** ([openai.ts](src/api/openai.ts)):
- System prompt instructs: "Generate exactly {threadLength} tweets"
- Responses split by double newlines
- Each tweet validated for length

**If Thread Generation Fails:**
- Check service worker console for API errors
- Verify threadLength passed correctly in request
- Try reducing thread length (simpler request)

---

## Phase 4: Common Issues & Debugging

### Issue 1: Button Not Appearing

**Symptoms:**
- Content script loads (`console.log` appears)
- But Kotodama button never shows up
- Compose box is visible and functional

**Possible Causes:**
1. Twitter changed their DOM structure
2. CSS conflicts hiding the button
3. MutationObserver not detecting changes
4. Button injection code throwing silent errors

**Diagnosis Steps:**

1. **Check if compose boxes are detected:**
   ```javascript
   // Run in console
   const boxes = document.querySelectorAll('[data-testid="tweetTextarea_0"]')
   console.log('Compose boxes found:', boxes.length)
   ```

2. **Manually inspect Twitter's current structure:**
   - Right-click compose box → Inspect Element
   - Look at data attributes: `data-testid`, `aria-label`, `role`
   - Copy actual attribute values

3. **Check for JavaScript errors:**
   - Open Console tab
   - Look for errors related to content script
   - Common errors: "Cannot read property of null", "querySelector returned null"

4. **Verify button injection code executed:**
   ```javascript
   // In content script, add debug logs
   function injectAIButton(composeBox) {
     console.log('🔧 Injecting button for:', composeBox)
     // ... rest of function
   }
   ```

**Solutions:**

**Solution 1: Update Selectors**

Edit [content-script.ts](src/content/content-script.ts):
```typescript
const composeSelectors = [
  '[data-testid="tweetTextarea_0"]',           // Old selector
  '[data-testid="NEW_SELECTOR_HERE"]',         // Add new selector
  '[role="textbox"][contenteditable="true"]',
]
```

**Solution 2: Add More Fallback Selectors**
```typescript
const composeSelectors = [
  '[data-testid="tweetTextarea_0"]',
  '[data-testid="tweetTextarea_1"]',
  'div[contenteditable="true"][role="textbox"]',
  'div[aria-label*="Tweet"]',
  'div[aria-label*="Post"]',
]
```

**Solution 3: Increase MutationObserver Sensitivity**
If compose boxes appear dynamically after page load:
```typescript
// In content-script.ts
const observer = new MutationObserver(() => {
  console.log('🔍 DOM mutation detected, checking for compose boxes...')
  injectButtonsIfNeeded()
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,  // Also watch attribute changes
  attributeFilter: ['data-testid', 'aria-label']
})
```

---

### Issue 2: Panel Shows Blank Page

**Symptoms:**
- Kotodama button appears and is clickable
- Panel iframe opens but content is blank/white
- No React UI visible

**Possible Causes:**
1. React build failed or incomplete
2. Content Security Policy (CSP) blocking scripts
3. Missing dependencies in bundle
4. Incorrect iframe src URL

**Diagnosis Steps:**

1. **Inspect panel iframe:**
   - Right-click on the blank panel
   - Select "Inspect Frame" or "Inspect Element"
   - This opens DevTools scoped to iframe context

2. **Check Console in iframe context:**
   - Look for React errors
   - Look for CSP violations
   - Look for 404 errors (missing files)

3. **Check Network tab:**
   - Switch to Network tab in DevTools
   - Reload panel (close and reopen)
   - Look for failed requests (red items)

4. **Verify iframe src:**
   ```javascript
   const panel = document.querySelector('#kotodama-panel')
   console.log('Panel src:', panel?.src)
   // Should be: chrome-extension://[id]/src/panel/index.html
   ```

**Solutions:**

**Solution 1: Rebuild Extension**
```bash
# Clean and rebuild
rm -rf dist/
npm run build

# Reload extension in chrome://extensions
```

**Solution 2: Check web_accessible_resources**

Verify [manifest.json:40-45](public/manifest.json):
```json
"web_accessible_resources": [
  {
    "resources": [
      "src/panel/index.html",
      "panel.js",
      "index.js",
      "index.css"
    ],
    "matches": ["https://twitter.com/*", "https://x.com/*"]
  }
]
```

**Solution 3: Check Vite Build Output**

Verify [vite.config.ts](vite.config.ts) includes panel build:
```typescript
build: {
  rollupOptions: {
    input: {
      panel: resolve(__dirname, 'src/panel/index.html'),
      // ... other entries
    }
  }
}
```

**Solution 4: Test Panel Directly**

Open panel URL directly in browser:
```
chrome-extension://[your-extension-id]/src/panel/index.html
```
Replace `[your-extension-id]` with actual ID from `chrome://extensions`

If it works directly but not in iframe:
- CSP issue with iframe embedding
- postMessage communication failure

---

### Issue 3: Generation Fails / API Errors

**Common Error Messages:**

#### Error 1: "Incorrect API key provided"
```
Error: Incorrect API key provided: sk-...
You can find your API key at https://platform.openai.com/account/api-keys
```

**Cause:** Invalid or expired OpenAI API key

**Solution:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Re-run onboarding (click extension icon)
4. Enter new key in Step 1

---

#### Error 2: "Rate limit exceeded"
```
Error: Rate limit reached for requests
```

**Cause:** Too many API requests in short time

**Solutions:**
- Wait 60 seconds and try again
- Upgrade OpenAI API plan for higher limits
- Check for runaway loops making multiple requests

**Debug rate limit usage:**
```javascript
// In service worker console
chrome.runtime.sendMessage({
  type: 'get-settings'
}, response => {
  console.log('API calls made:', response.data.apiCallCount)
})
```

---

#### Error 3: "Network request failed"
```
TypeError: Failed to fetch
```

**Causes:**
- No internet connection
- Firewall blocking OpenAI API
- CORS issues (shouldn't happen in service worker)
- OpenAI API outage

**Solutions:**
1. Check internet: `ping 8.8.8.8`
2. Test API directly:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```
3. Check OpenAI status: https://status.openai.com/
4. Check corporate firewall settings

---

#### Error 4: "Model not found"
```
Error: The model 'gpt-4o' does not exist
```

**Cause:** API key doesn't have access to model

**Solution:**
Update [openai.ts:17-26](src/api/openai.ts) to use accessible model:
```typescript
const MODEL = 'gpt-3.5-turbo'  // Free tier model
```

---

#### Error 5: "Insufficient quota"
```
Error: You exceeded your current quota
```

**Cause:** OpenAI account has no credits

**Solutions:**
- Add payment method: https://platform.openai.com/account/billing/overview
- Wait for free tier reset (monthly)
- Switch to different API key with credits

---

### Issue 4: Text Not Inserting Into Compose Box

**Symptoms:**
- Tweet generates successfully
- Click "Insert to X" button
- Panel closes, but text doesn't appear in Twitter compose box

**Possible Causes:**
1. Compose box selector changed
2. Focus lost (user clicked elsewhere)
3. ContentEditable protections
4. InputEvent not triggering Twitter's handlers

**Diagnosis Steps:**

1. **Check if compose box is findable:**
   ```javascript
   const selectors = [
     '[data-testid="tweetTextarea_0"]',
     '[role="textbox"][contenteditable="true"]'
   ]

   selectors.forEach(sel => {
     const found = document.querySelector(sel)
     console.log(sel, found ? '✅' : '❌')
   })
   ```

2. **Test manual insertion:**
   ```javascript
   const box = document.querySelector('[data-testid="tweetTextarea_0"]')

   if (box) {
     box.focus()
     box.textContent = '🧪 Test insertion'
     box.dispatchEvent(new InputEvent('input', {
       bubbles: true,
       inputType: 'insertText'
     }))
     console.log('Character counter:', document.querySelector('[data-testid="tweetTextarea_0CharacterCounter"]')?.textContent)
   }
   ```

3. **Check for focus issues:**
   ```javascript
   console.log('Active element:', document.activeElement)
   console.log('Is compose box?', document.activeElement?.matches('[data-testid="tweetTextarea_0"]'))
   ```

**Solutions:**

**Solution 1: Update findComposeEditable() Selectors**

Edit [content-script.ts](src/content/content-script.ts):
```typescript
function findComposeEditable(): HTMLElement | null {
  const selectors = [
    '[data-testid="tweetTextarea_0"][contenteditable="true"]',
    '[data-testid="tweetTextarea_0"] [contenteditable="true"]',
    '[role="textbox"][contenteditable="true"]',
    '[aria-label="Tweet text"][contenteditable="true"]',
    '[aria-label="Post text"][contenteditable="true"]',
    // Add new selectors discovered from inspection
    'div[contenteditable="true"][data-testid*="tweet"]',
  ]

  // ... rest of function
}
```

**Solution 2: Use Different Event Types**

Try multiple event types to trigger Twitter's UI:
```typescript
function insertTweetContent(content: string) {
  // ... existing code ...

  // Dispatch multiple event types
  const events = [
    new InputEvent('input', { bubbles: true, inputType: 'insertText' }),
    new Event('change', { bubbles: true }),
    new KeyboardEvent('keyup', { bubbles: true })
  ]

  events.forEach(event => composeEditable.dispatchEvent(event))
}
```

**Solution 3: Use execCommand with Fallbacks**

Improve insertion robustness:
```typescript
function insertTweetContent(content: string) {
  const box = findComposeEditable()
  if (!box) return

  box.focus()

  // Method 1: execCommand (older, more reliable)
  let success = false
  try {
    success = document.execCommand('insertText', false, content)
  } catch (e) {
    console.warn('execCommand failed:', e)
  }

  // Method 2: Set textContent (direct)
  if (!success) {
    box.textContent = content
  }

  // Method 3: Set innerText (alternative)
  if (!box.textContent) {
    box.innerText = content
  }

  // Dispatch events
  box.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    data: content,
    inputType: 'insertText'
  }))
}
```

---

## Phase 5: Advanced Testing Scenarios

### Edge Case 1: Multiple Compose Boxes

**Scenario:** Multiple compose areas active simultaneously

**Steps:**
1. Open main tweet composer (modal)
2. While modal is open, scroll timeline
3. Click reply on a tweet (opens reply box)
4. Both composers are now active

**Expected:**
- Kotodama button appears in BOTH composers
- Each button is independent
- Panel state is shared (opens for most recent click)

**Test:**
1. Click button in main composer → Panel opens for "compose" context
2. Close panel
3. Click button in reply box → Panel opens for "reply" context with tweet details

---

### Edge Case 2: Panel State Persistence

**Scenario:** Generate tweet but close panel without inserting

**Steps:**
1. Open panel, generate a tweet
2. Close panel (× button)
3. Re-open panel

**Expected:**
- ❓ **Current behavior:** Content may be lost (React state resets)
- ✅ **Desired behavior:** Generated content persists

**Improvement Needed:**
- Store generated content in `chrome.storage.session`
- Restore on panel re-open
- Clear after successful insertion

---

### Edge Case 3: Very Long Tweets (Over 280 Chars)

**Scenario:** AI generates tweet exceeding Twitter's limit

**Steps:**
1. Prompt: "Write a very detailed explanation of React hooks in a tweet"
2. Generate

**Expected Handling:**
- ✅ AI should be instructed to stay under 280 chars (in system prompt)
- ⚠️ If over limit: Show warning in panel
- 🔧 Provide "Shorten" button to regenerate

**Current Implementation:**
- No explicit character limit enforcement
- No warning shown

**Enhancement Needed:**
```typescript
// In Panel.tsx after generation
if (typeof generatedContent === 'string' && generatedContent.length > 280) {
  setError('Tweet exceeds 280 characters. Try regenerating with "make it shorter".')
}
```

---

### Edge Case 4: Empty or Invalid Prompts

**Scenarios:**

**Test 1: Empty Prompt**
- Steps: Leave prompt field blank, click Generate
- Expected: Error "Please enter a prompt"
- Status: ✅ Implemented ([Panel.tsx:87-90](src/panel/Panel.tsx))

**Test 2: Very Short Prompt**
- Steps: Enter just "hi", generate
- Expected: AI generates something (may not be useful)
- Enhancement: Require minimum 10 characters

**Test 3: No Brand Voice Selected**
- Steps: Deselect brand voice, try to generate
- Expected: Error "Please select a brand voice"
- Status: ✅ Implemented ([Panel.tsx:92-95](src/panel/Panel.tsx))

---

### Edge Case 5: Network Interruption Mid-Request

**Scenario:** Internet disconnects during API call

**Steps:**
1. Start generation
2. Quickly disconnect WiFi (or pause network in DevTools)
3. Wait for timeout

**Expected:**
- Loading state continues (waiting for response)
- After ~30 seconds: Timeout error
- Error message: "Network request failed. Check your connection."

**Current Implementation:**
- Fetch API timeout: Not explicitly set
- Error handling: Generic catch block

**Enhancement Needed:**
```typescript
// In openai.ts
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 30000)

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  signal: controller.signal,
  // ... other options
})
```

---

### Edge Case 6: Rapid Clicking / Double Submissions

**Scenario:** User clicks Generate button multiple times rapidly

**Steps:**
1. Enter prompt
2. Click "Generate with AI" 5 times rapidly

**Expected:**
- Button should disable after first click
- Subsequent clicks ignored
- Only one API call made

**Current Implementation:**
- ✅ Button disabled during loading ([Panel.tsx:262](src/panel/Panel.tsx))
- ✅ isLoading state prevents double submission

---

### Edge Case 7: Extension Update While Panel Open

**Scenario:** Extension updates automatically while user has panel open

**Steps:**
1. Open panel
2. Update extension (manually via chrome://extensions or auto-update)
3. Try to generate

**Expected:**
- Service worker may restart
- Panel connection lost
- Error: "Extension context invalidated"

**User Impact:** Medium (rare occurrence)

**Mitigation:**
- Detect disconnection
- Show message: "Extension updated. Please refresh the page."

---

### Edge Case 8: Twitter UI Update / Redesign

**Scenario:** Twitter deploys a UI change that breaks selectors

**Impact:** Critical (extension stops working)

**Detection:**
- Button stops appearing
- Insertion fails
- High user complaints

**Recovery Plan:**
1. Identify new selectors (inspect live Twitter)
2. Update content-script.ts selectors
3. Deploy hotfix update
4. Document new selectors in CLAUDE.md

**Preventive Measures:**
- Add multiple fallback selectors
- Use most generic selectors (role, aria-label) as fallbacks
- Monitor Twitter developer community for UI change announcements

---

## Testing Checklist

Use this checklist for systematic testing before each release:

### Build & Load
- [ ] `npm run build` succeeds without errors
- [ ] Extension loads in `chrome://extensions/` without warnings
- [ ] No console errors on extension load
- [ ] Service worker shows "active" status
- [ ] All files present in `dist/` folder

### Content Script
- [ ] Console log "Kotodama content script loaded" appears on Twitter
- [ ] MutationObserver initializes successfully
- [ ] No JavaScript errors in browser console
- [ ] Content script survives page navigation (SPA routing)

### Button Injection
- [ ] Button appears in main tweet composer (home page)
- [ ] Button appears in modal tweet composer ("Tweet" button)
- [ ] Button appears in reply boxes
- [ ] Button appears in quote tweet boxes
- [ ] Button styled correctly (gradient, icon, text)
- [ ] Button hover effects work
- [ ] Multiple buttons can coexist (main + reply)

### Panel UI
- [ ] Panel opens on button click with smooth animation
- [ ] Panel positioned correctly (right side, no overflow)
- [ ] Header displays with gradient background
- [ ] Close button (×) works
- [ ] Panel content scrollable if needed
- [ ] Panel responsive on smaller screens
- [ ] Panel doesn't block Twitter UI interactions

### Onboarding
- [ ] Opens on first install (extension icon click)
- [ ] Step 1: API key input accepts text
- [ ] Step 1: "Continue" button validation works
- [ ] Step 2: Brand voice fields functional
- [ ] Step 2: Example tweets accept text or URLs
- [ ] Step 2: Tweet URL fetching works (syndication API)
- [ ] "Complete setup" saves settings successfully
- [ ] Redirect to settings works (returning users)

### Generation
- [ ] Prompt input field works (typing, pasting)
- [ ] Brand voice dropdown populated with saved voices
- [ ] Loading state shows during generation
- [ ] Generated content appears in card
- [ ] Character count accurate
- [ ] Regenerate button works
- [ ] Multiple generations don't interfere
- [ ] Error messages display correctly

### Insertion
- [ ] "Insert to X" button appears after generation
- [ ] Clicking button inserts text into Twitter compose box
- [ ] Twitter's character counter updates correctly
- [ ] Twitter's "Tweet" button becomes enabled
- [ ] Panel closes after insertion
- [ ] Cursor positioned correctly after insertion
- [ ] Original formatting preserved (line breaks, emojis)

### Thread Generation
- [ ] "Turn this into a thread" toggle works
- [ ] Thread length input (2-10) constrained correctly
- [ ] Thread generation produces multiple tweets
- [ ] Each tweet shown in separate card
- [ ] Thread tweets labeled ("Suggestion 1", "Suggestion 2", etc.)
- [ ] Each tweet under 280 characters
- [ ] Combined insertion includes proper spacing

### Reply Context
- [ ] Reply box detected (vs. main composer)
- [ ] Tweet context extracted (username, text)
- [ ] "Replying to @username" shown in panel header
- [ ] Context card displays original tweet excerpt
- [ ] Generated reply references context appropriately

### Error Handling
- [ ] Empty prompt shows error
- [ ] No brand voice selected shows error
- [ ] Invalid API key shows clear error message
- [ ] Rate limit error displays with helpful message
- [ ] Network errors caught and displayed
- [ ] Service worker errors logged
- [ ] Panel errors don't crash entire extension

### Performance
- [ ] Button injection latency < 500ms
  - **How to test:** Open DevTools Console, refresh Twitter, look for timestamp logs or add: `console.time('button-inject')` at start of `injectAIButton()` and `console.timeEnd('button-inject')` at end
- [ ] Panel opens within 300ms
  - **How to test:** Click button and visually observe - should feel instant. Or add timing logs in content script `openPanel()` function
- [ ] Generation completes within 10 seconds (typical)
  - **How to test:** Time from clicking "Generate with AI" to seeing results. Should be 2-5 seconds for normal requests
- [ ] No memory leaks (test with 50+ generations)
  - **How to test:** Open DevTools → Performance tab → Memory → Take heap snapshot, generate 50 tweets, take another snapshot, compare memory growth (should be minimal)
- [ ] Extension doesn't slow down Twitter page
  - **How to test:** Use Twitter normally (scroll, click, interact) - should feel the same with/without extension loaded

### Security & Privacy
- [ ] API keys encrypted in storage (inspect chrome.storage.local)
  - **How to test:** Open DevTools Console (any page), run:
    ```javascript
    chrome.storage.local.get(['settings'], (result) => {
      console.log('Settings:', result);
      // Look for 'apiKey' - should be encrypted blob, not plain 'sk-...'
    });
    ```
- [ ] No API keys in console logs
  - **How to test:** Open Console on Twitter, generate tweets, search console for "sk-" - should find nothing
- [ ] No telemetry or tracking
  - **How to test:** DevTools → Network tab → Generate tweet → Verify only requests to api.openai.com (or configured AI provider)
- [ ] No external requests except to AI APIs
  - **How to test:** Network tab filtering - should only see requests to AI APIs (OpenAI/Gemini/Claude)
- [ ] Extension isolated from Twitter's context
  - **How to test:** Check manifest.json has minimal permissions, content script doesn't modify Twitter's global objects

### Cross-Browser Testing
- [ ] Chrome (latest version)
  - **How to test:** Check version at `chrome://version/`, should work on Chrome 120+
- [ ] Chrome (one version behind)
  - **How to test:** Optional - install Chrome Beta/Dev channel or use older version
- [ ] Edge (latest version)
  - **How to test:** Load extension at `edge://extensions/`, test same as Chrome
- [ ] Chromium-based browsers (Brave, Vivaldi, Opera)
  - **How to test:** Load unpacked extension in each browser's extension page (same as Chrome)

### Multi-Language Testing
- [ ] Works on Twitter with non-English UI
  - **How to test:** Change Twitter language in Settings → Display → Language → Save
  - **Expected:** Extension button still appears, panel still works (UI may be English-only for now)
- [ ] Generates content in requested language
  - **How to test:** In prompt field, write: "Generate a tweet in [Spanish/French/Japanese] about coding"
  - **Expected:** AI should respond in requested language
  - **Note:** Quality depends on AI model's multilingual capabilities
- [ ] Emoji handling correct
  - **How to test:** Generate tweets with emoji, insert to Twitter, verify they appear correctly
- [ ] Right-to-left text (Arabic, Hebrew)
  - **How to test:** Prompt: "Generate a tweet in Arabic about technology"
  - **Expected:** Text direction should be RTL when inserted into Twitter

---

## Test Data Sets

### Sample Prompts for Testing

**Short Prompts:**
- "Announce a new feature"
- "Thank my followers"
- "Share a quote"

**Medium Prompts:**
- "Write about the importance of user testing in product development"
- "Explain why TypeScript is valuable for large teams"
- "Share thoughts on work-life balance for developers"

**Complex Prompts:**
- "Create a thread explaining the React component lifecycle in 5 tweets"
- "Write a reply to someone asking about career advice, be encouraging but realistic"
- "Announce our new product launch, emphasize the AI features and user-friendly design"

### Sample Brand Voices

**Professional Tech Voice:**
```
Name: Professional Tech
Description: Clear, authoritative, educational. Uses technical terms but explains them. Occasional emoji for emphasis.
Examples:
- "TypeScript isn't just about catching bugs—it's about scaling your team's confidence in the codebase. 🚀"
- "Quick reminder: Performance optimization is premature until you've measured. Profile first, optimize second."
- "The best architecture is the one your team can understand and maintain."
```

**Casual Friendly Voice:**
```
Name: Friendly Casual
Description: Conversational, enthusiastic, uses emojis liberally. Feels like talking to a friend.
Examples:
- "omg just shipped the new feature!! 🎉 been working on this for weeks and it's finally live!"
- "anyone else procrastinate by over-engineering their side projects? just me? 😅"
- "friday night coding hits different ✨ time to build something fun"
```

**Thought Leader Voice:**
```
Name: Thought Leader
Description: Strategic, visionary, speaks to trends and big-picture thinking.
Examples:
- "The future of development isn't about writing more code—it's about orchestrating AI to write code for us."
- "We're entering an era where the ability to prompt > the ability to program."
- "Three predictions for 2025: 1) AI pair programming becomes standard, 2) No-code reaches enterprises, 3) Web3 finds its real use case."
```

---

## Automated Testing (Future Enhancement)

### Unit Tests (Vitest)
```bash
npm test
```

**Test Coverage Goals:**
- `api/openai.ts`: API call logic, error handling
- `storage/encryption.ts`: Encryption/decryption correctness
- `storage/db.ts`: IndexedDB operations
- React components: Rendering, state management

### Integration Tests (Playwright)
```bash
npm run test:e2e
```

**Test Scenarios:**
1. Full onboarding flow
2. Generate and insert tweet
3. Create thread
4. Reply with context
5. Error handling

### Visual Regression Tests
- Screenshot comparison of panel UI
- Ensures UI consistency across updates

---

## Performance Benchmarks

**Target Metrics:**
- Content script injection: < 100ms
- Button appearance: < 500ms after compose box detected
- Panel open animation: 300ms (as designed)
- Tweet generation (API call): 2-5 seconds average
- Content insertion: < 100ms

**Measuring Performance:**
```javascript
// Add to content script
console.time('button-injection')
injectAIButton(composeBox)
console.timeEnd('button-injection')

// Measure panel opening
console.time('panel-open')
openPanel()
panelIframe.addEventListener('load', () => {
  console.timeEnd('panel-open')
})
```

---

## Reporting Issues

When reporting bugs, include:

1. **Extension version:** Check in `chrome://extensions/`
2. **Browser:** Chrome/Edge version
3. **Steps to reproduce:** Exact sequence of actions
4. **Expected behavior:** What should happen
5. **Actual behavior:** What actually happened
6. **Screenshots/Videos:** Visual evidence
7. **Console logs:** From both page and service worker contexts
8. **Network logs:** If API-related issue

**Template:**
```markdown
## Bug Report

**Extension Version:** 1.0.0
**Browser:** Chrome 120.0.6099.109
**OS:** Windows 11

### Steps to Reproduce
1. Go to Twitter.com
2. Click compose box
3. Click Kotodama button
4. Enter prompt: "Test"
5. Click Generate

### Expected
Generated tweet appears in panel

### Actual
Panel shows error: "Rate limit exceeded"

### Console Logs
```
[Service Worker] Error: 429 Too Many Requests
[Service Worker] Falling back to gpt-4o-mini...
```

### Screenshots
[Attach screenshot]

### Additional Context
This happens consistently after generating 3 tweets in a row.
```

---

## Troubleshooting Quick Reference

| Problem | Quick Fix |
|---------|-----------|
| Button not appearing | Update selectors in `content-script.ts` |
| Panel blank | Rebuild: `npm run build`, reload extension |
| Generation fails | Check API key, verify balance at platform.openai.com |
| Text not inserting | Update selectors in `findComposeEditable()` |
| Service worker inactive | Click "service worker" link in extensions page |
| Onboarding loops | Clear Chrome storage: `chrome.storage.local.clear()` |
| "Context invalidated" | Reload extension, refresh Twitter page |

---

## Next Steps

After completing all tests:

1. **Document Test Results:**
   - Create a test report with pass/fail for each item
   - Note any issues discovered
   - Prioritize fixes (critical vs. nice-to-have)

2. **Update TODO.md:**
   - Mark completed test items
   - Add newly discovered issues
   - Reprioritize based on testing findings

3. **Fix Critical Issues:**
   - Focus on issues that prevent core functionality
   - Test fixes thoroughly before moving on

4. **Prepare for Launch:**
   - Convert icons to PNG (see TODO.md)
   - Write user documentation
   - Create demo video
   - Prepare Chrome Web Store listing

---

**Testing completed?** 🎉

Check out [TODO.md](TODO.md) for remaining pre-launch tasks!
