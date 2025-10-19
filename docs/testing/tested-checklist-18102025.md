### Build & Load
✅ `npm run build` succeeds without errors
✅ Extension loads in `chrome://extensions/` without warnings
✅ No console errors on extension load (but on debug says false when asked about loaded/active)
❌ Service worker shows "active" status (inactive but on https://x.com/home (iframe) doesnt say active but its working)
✅ All files present in `dist/` folder

### Content Script
✅ Console log "Kotodama content script loaded" appears on Twitter
✅ MutationObserver initializes successfully
✅ No JavaScript errors in browser console
✅ Content script survives page navigation (SPA routing)

### Button Injection
✅ Button appears in top-right (home page)
✅ Button styled correctly (gradient, icon, text)
✅ Button hover effects work

### Panel UI
✅ Panel opens on button click with smooth animation
✅ Panel positioned correctly (right side, no overflow)
✅ Header displays with gradient background
✅ Close button (×) works
✅ Panel content scrollable if needed
✅ Panel responsive on smaller screens
✅ Panel doesn't block Twitter UI interactions (only affect right-side, doesnt matter)

### Onboarding
✅ Opens on first install (extension icon click)
✅ Step 1: API key input accepts text (work but need verification by calling it to API)
✅ Step 1: "Continue" button validation works
✅ Step 2: Brand voice fields validate name + description (required)
✅ Step 2: Example tweets accept text or URLs with live validation
✅ Step 2: Tweet URL fetching works (syndication API)
✅ "Complete setup" saves settings successfully
✅ Redirect to settings works (returning users)

### Generation
✅ Prompt input field works (typing, pasting)
✅ Brand voice dropdown populated with saved voices
✅ Loading state shows during generation
✅ Generated content appears in card
✅ Character count accurate
✅ Regenerate button works
✅ Multiple generations don't interfere
✅ Error messages display correctly (ie. wrong API key)

### Insertion
✅ "Insert to X" button appears after generation
✅ Clicking button inserts text into Twitter compose box
✅ Twitter's character counter updates correctly
✅ Twitter's "Tweet" button becomes enabled
✅ Panel closes after insertion
✅ Cursor positioned correctly after insertion
✅ Original formatting preserved (line breaks, emojis)

### Thread Generation
✅ "Turn this into a thread" toggle works
✅ Thread length input (2-10) constrained correctly
✅ Thread generation produces multiple tweets
✅ Each tweet shown in separate card
✅ Thread tweets labeled ("Suggestion 1", "Suggestion 2", etc.)
✅ Each tweet under 280 characters
✅ Combined insertion includes proper spacing

### Reply Context
✅ Reply box detected (vs. main composer)
✅ Tweet context extracted (username, text)
✅ "Replying to @username" shown in panel header
✅ Context card displays original tweet excerpt
✅ Generated reply references context appropriately

### Error Handling
✅ Empty prompt shows error (avoided
✅ No brand voice selected shows error
✅ Invalid API key shows clear error message
- [ ] Rate limit error displays with helpful message (idk but cant be tested atm)
- [ ] Network errors caught and displayed
- [ ] Service worker errors logged
- [ ] Panel errors don't crash entire extension

### Performance
✅ Button injection latency < 500ms
✅ Panel opens within 300ms
✅ Generation completes within 10 seconds (typical)
✅ No memory leaks (test with 50+ generations)
✅ Extension doesn't slow down Twitter page

### Security & Privacy
✅ API keys encrypted in storage (inspect chrome.storage.local)
✅ No API keys in console logs
✅ No telemetry or tracking
✅ No external requests except to AI APIs
✅ Extension isolated from Twitter's context

### Cross-Browser Testing
- [ ] Chrome (latest version)
- [ ] Chrome (one version behind)
- [ ] Edge (latest version)
- [ ] Chromium-based browsers (Brave, Vivaldi, Opera)

### Multi-Language Testing
- [ ] Works on Twitter with non-English UI
✅ Generates content in requested language (prompt must specify language)
- [ ] Emoji handling correct
- [ ] Right-to-left text (Arabic, Hebrew)
