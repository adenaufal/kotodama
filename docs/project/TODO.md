# TODO List

## Critical for v1.0 Launch

- [ ] **Convert SVG icons to PNG** - Chrome Web Store requires PNG format icons
  - Use tools like ImageMagick or online converters
  - Sizes: 16x16, 32x32, 48x48, 128x128

- [ ] **Test on Twitter/X** - Verify all functionality works on live site
  - [ ] Compose box detection
  - [ ] Reply box detection
  - [ ] Button injection
  - [ ] Panel sliding animation
  - [ ] Content insertion

- [ ] **Add error boundaries** in React components
  - Prevent crashes from propagating
  - Show user-friendly error messages

- [ ] **Implement brand voice list loading** in Panel.tsx
  - Currently shows empty dropdown
  - Fetch from IndexedDB on mount

- [ ] **Improve Twitter DOM selectors**
  - Current selectors may be fragile
  - Add fallbacks for different Twitter UI states
  - Test with new tweet composer, reply boxes, quote tweets

## Important but Not Blocking

- [ ] **Add loading states** throughout UI
  - Skeleton screens
  - Better spinners
  - Progress indicators for long operations

- [ ] **Implement regeneration with context**
  - Store previous prompt
  - Allow tweaking without re-entering

- [ ] **Add character counter** in Panel
  - Show 280 character limit
  - Warn when approaching limit
  - Handle multiple tweets in threads

- [ ] **Better error messages**
  - User-friendly API error handling
  - Network error recovery
  - Rate limit handling

- [ ] **Add settings page**
  - Manage multiple brand voices
  - Edit existing voices
  - View API usage statistics
  - Adjust preferences

## Nice to Have

- [ ] **Keyboard shortcuts**
  - Quick open/close panel (e.g., Ctrl+Shift+K)
  - Insert with Enter
  - Regenerate with Ctrl+R

- [ ] **Undo/Redo** for edits in panel

- [ ] **Copy to clipboard** button

- [ ] **Export/Import** brand voices

- [ ] **Dark mode** support to match Twitter theme

- [ ] **Analytics**
  - Track generation success rate
  - Token usage per month
  - Most used brand voice

- [ ] **Onboarding improvements**
  - Video walkthrough
  - Interactive tutorial on Twitter
  - Sample brand voices to try

## v1.1 Features (From PRD)

- [ ] **Google Gemini integration**
  - API client implementation
  - UI toggle for provider selection
  - Fallback logic

- [ ] **Tone adjustment sliders**
  - Formality slider
  - Humor slider
  - Technicality slider
  - Real-time preview

- [ ] **Profile analysis improvements**
  - Actually fetch tweets from profile pages
  - Deeper analysis of writing patterns
  - Save frequent contact profiles

- [ ] **Multiple suggestions**
  - Generate 2-3 variations
  - A/B comparison view
  - Quick switching between options

- [ ] **Tweet performance tracking**
  - Mark tweets as posted
  - Remember successful patterns
  - Improve future suggestions

## Technical Debt

- [ ] **Add unit tests**
  - Jest setup
  - Component tests
  - API client tests
  - Storage layer tests

- [ ] **Add integration tests**
  - E2E testing with Playwright
  - Test full user flows

- [ ] **Improve TypeScript coverage**
  - Remove any types
  - Stricter checks
  - Better type inference

- [ ] **Code splitting**
  - Reduce bundle size
  - Lazy load components
  - Optimize dependencies

- [ ] **Add JSDoc comments**
  - Document all public functions
  - Add usage examples
  - Improve IDE autocomplete

- [ ] **Refactor content script**
  - Extract DOM manipulation to separate module
  - Improve readability
  - Add more robust selectors

- [ ] **State management**
  - Implement Zustand store
  - Centralize state logic
  - Better data flow

- [ ] **Error logging**
  - Structured logging
  - Error categorization
  - User-friendly error reporting

## Documentation

- [ ] **API documentation**
  - Document message protocol
  - Storage schema reference
  - Extension architecture diagram

- [ ] **User guide**
  - Step-by-step tutorials
  - Best practices for brand voices
  - Tips for better prompts

- [ ] **Contributing guide**
  - Code style guidelines
  - PR process
  - Issue templates

- [ ] **Video demos**
  - Feature showcase
  - Setup walkthrough
  - Common use cases

## Security & Privacy

- [ ] **Security audit**
  - Review encryption implementation
  - Check for XSS vulnerabilities
  - Validate CSP policy

- [ ] **Privacy policy**
  - Document data handling
  - Clarify API usage
  - User rights and controls

- [ ] **Permissions audit**
  - Minimize required permissions
  - Document why each is needed
  - Request on-demand where possible

## Distribution

- [ ] **Chrome Web Store listing**
  - Compelling description
  - Screenshots
  - Promotional graphics
  - Category selection

- [ ] **Edge Add-ons listing**
  - Port manifest if needed
  - Submit to Microsoft store

- [ ] **Landing page**
  - Product overview
  - Feature highlights
  - Download links
  - Documentation links

---

## Priority Legend
- **Critical**: Must-have for v1.0 launch
- **Important**: Should-have for good UX
- **Nice to Have**: Would improve experience
- **v1.1**: Planned for next release
- **Technical Debt**: Cleanup and optimization
- **Documentation**: Better docs and guides

## Notes

- Focus on getting v1.0 MVP working solidly before adding more features
- User feedback after initial launch will guide prioritization
- Keep the codebase clean and maintainable as you go
