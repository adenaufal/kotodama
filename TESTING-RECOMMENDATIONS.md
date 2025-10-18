# Testing Recommendations for Kotodama

Based on testing conducted on 2025-10-18, this document provides recommendations for addressing untested areas and known issues.

## Quick Summary

### ✅ What's Working Well (Tested & Passing)
- Core build pipeline and extension loading
- Content script injection and DOM detection
- Button injection and styling
- Panel UI and animations
- Onboarding flow (with notes below)
- Tweet generation (single and thread)
- Content insertion into Twitter
- Basic error handling

### ⚠️ Areas Needing Attention

#### 1. Service Worker "Inactive" Status
**Status:** Shows as inactive but works correctly

**Explanation:** This is **normal behavior** for Chrome Manifest V3 service workers. They are event-driven and go idle when not processing messages to save resources. They wake up automatically when needed.

**Recommendation:**
- No action needed - this is expected Chrome behavior
- Update user documentation to clarify this is normal
- Consider adding a note in the extension's FAQ

---

#### 2. Brand Voice Optional Fields
**Issue:** Name and description fields are marked as optional in onboarding

**Testing Finding:** Fields work, but unclear if they should be required

**Recommendation:**
- **Decision needed:** Should brand voice name/description be required?
- If yes: Add validation in [src/onboarding/Onboarding.tsx](src/onboarding/Onboarding.tsx)
- If no: Update placeholder text to indicate optional nature
- Consider: At least name should be required for user organization

**Suggested Change:**
```typescript
// In Onboarding.tsx validation
if (!brandVoice.name.trim()) {
  setError('Please enter a name for your brand voice');
  return;
}
// Description can remain optional
```

---

#### 3. Reply Context Features Not Tested
**Issue:** Unable to verify reply context display in panel

**Missing Tests:**
- [ ] "Replying to @username" shown in panel header
- [ ] Context card displays original tweet excerpt
- [ ] Generated reply references context appropriately

**Recommendation:**
1. Test reply detection:
   - Go to Twitter, find any tweet
   - Click reply button
   - Click Kotodama button in reply box
   - Verify panel shows context

2. If context not showing:
   - Check [src/panel/Panel.tsx](src/panel/Panel.tsx) for context rendering
   - Verify message passing from content script to panel
   - Check content-script.ts context extraction logic

3. Debug commands:
```javascript
// In Twitter reply box, console:
const replyContainers = document.querySelectorAll('[data-testid="reply"]');
console.log('Reply containers:', replyContainers);

// Check if context is being extracted
const tweetText = document.querySelector('[data-testid="tweetText"]');
console.log('Tweet text:', tweetText?.textContent);
```

---

#### 4. Multi-language Generation Failed
**Status:** ❌ Generates content in requested language

**Possible Causes:**
1. Prompt not explicit enough about language
2. System prompt overrides language preference
3. Model defaulting to English

**Recommended Tests:**
```
Test 1: "Write a tweet in Spanish about programming"
Test 2: "Escribe un tweet en español sobre programación"
Test 3: "Generate a tweet in French: [topic]"
```

**Recommended Fix:**
Update [src/api/openai.ts](src/api/openai.ts) to detect language requests:

```typescript
// In generateWithOpenAI, before API call
const languageMatch = request.prompt.match(/in (Spanish|French|German|Japanese|etc)/i);
if (languageMatch) {
  systemPrompt += `\n\nIMPORTANT: Respond in ${languageMatch[1]}, not English.`;
}
```

---

#### 5. Untested Performance Metrics

**Why Important:** Performance impacts user experience

**Priority Tests:**
1. **Button injection latency** (High priority)
   - Add timing logs to measure
   - Target: <500ms

2. **Panel opening speed** (Medium priority)
   - Should feel instant
   - Target: <300ms

3. **Memory leaks** (Low priority, but important for production)
   - Test with 50+ generations
   - Monitor in Chrome DevTools

**Quick Performance Test:**
```javascript
// Add to content-script.ts
console.time('button-inject');
injectAIButton(composeBox);
console.timeEnd('button-inject');

console.time('panel-open');
openPanel();
panelIframe.addEventListener('load', () => {
  console.timeEnd('panel-open');
});
```

---

#### 6. Untested Security Checks

**Critical for Production:**

**Test 1: API Key Encryption**
```javascript
// In browser console
chrome.storage.local.get(['settings'], (result) => {
  console.log('Settings:', result);
  // Verify apiKey is NOT plain text (not starting with 'sk-')
});
```

**Expected:** Should see encrypted blob, not `sk-...`

**Test 2: No API Keys in Logs**
1. Open Console
2. Generate 5 tweets
3. Search console for "sk-"
4. **Expected:** Zero results

**Test 3: Network Isolation**
1. Open DevTools → Network tab
2. Generate tweet
3. Filter by domain
4. **Expected:** Only api.openai.com (or configured AI provider)

---

## Recommended Testing Priority

### High Priority (Before Launch)
1. ✅ Security: API key encryption verification
2. ✅ Security: No keys in console logs
3. ⚠️ Multi-language: Fix language generation
4. ⚠️ Reply context: Verify display in panel

### Medium Priority (Before v1.1)
1. Performance: Basic timing measurements
2. Cross-browser: Test in Edge
3. Error handling: Rate limit testing
4. Network errors: Offline behavior

### Low Priority (Nice to Have)
1. Memory leak testing (50+ generations)
2. Cross-browser: Brave, Vivaldi, Opera
3. Multi-language UI testing
4. RTL text testing (Arabic, Hebrew)

---

## Next Steps

### Immediate Actions
1. **Investigate reply context display**
   - Test reply flow manually
   - Check Panel.tsx for context rendering
   - Update tested-checklist if working

2. **Test multi-language generation**
   - Try explicit language prompts
   - Document results
   - Implement fix if needed

3. **Verify API key encryption**
   - Run security test commands
   - Document in tested-checklist

4. **Decide on brand voice field requirements**
   - Should name be required?
   - Should description be required?
   - Update validation accordingly

### Before Next Release
1. Run high-priority security tests
2. Fix multi-language if broken
3. Test in Edge browser
4. Update all documentation

### Documentation Updates
1. Add FAQ about service worker "inactive" status
2. Document multi-language usage (how to request specific languages)
3. Add troubleshooting section for common issues

---

## Testing Tools & Resources

### Chrome DevTools Commands
```javascript
// Check extension loading
chrome.management.getAll((extensions) => {
  console.log(extensions.find(e => e.name.includes('Kotodama')));
});

// Check storage
chrome.storage.local.get(null, (items) => {
  console.log('All storage:', items);
});

// Test message passing
chrome.runtime.sendMessage({type: 'get-settings'}, (response) => {
  console.log('Settings response:', response);
});
```

### Performance Profiling
1. DevTools → Performance tab
2. Start recording
3. Click Kotodama button → Generate tweet → Insert
4. Stop recording
5. Analyze timeline for slow operations

### Memory Profiling
1. DevTools → Memory tab
2. Take heap snapshot (Baseline)
3. Generate 50 tweets
4. Take heap snapshot (After)
5. Compare → Look for growth
6. Target: <10MB growth

---

## Automated Testing (Future)

Consider adding:
1. **Unit tests** (Vitest) for:
   - API functions
   - Encryption/decryption
   - Storage operations

2. **Integration tests** (Playwright) for:
   - Full onboarding flow
   - Generate and insert flow
   - Error scenarios

3. **Visual regression tests** for:
   - Panel UI consistency
   - Button appearance

Example Vitest test:
```typescript
import { describe, it, expect } from 'vitest';
import { encryptApiKey, decryptApiKey } from '../src/storage/encryption';

describe('API Key Encryption', () => {
  it('should encrypt and decrypt correctly', async () => {
    const original = 'sk-test123';
    const encrypted = await encryptApiKey(original);
    const decrypted = await decryptApiKey(encrypted);

    expect(decrypted).toBe(original);
    expect(encrypted).not.toBe(original);
  });
});
```

---

## Questions for Design Review

1. **Brand Voice Fields:**
   - Should name be required? (Recommend: Yes)
   - Should description be required? (Recommend: No, but encouraged)

2. **Reply Context Display:**
   - Is this feature fully implemented?
   - Should context always show in panel header for replies?

3. **Multi-language Support:**
   - Is this a v1.0 feature or v1.1+?
   - What languages should be prioritized?

4. **Performance Targets:**
   - Are the suggested targets (500ms, 300ms) acceptable?
   - Any specific performance requirements?

---

**Last Updated:** 2025-10-18
**Testing Version:** 1.2.0 (based on tested-checklist-18102025.md)
