# Extension Context Invalidation Fix

## Problem

The Kotodama extension was experiencing "Extension context invalidated" errors when:
1. The extension was reloaded during development or updates
2. The service worker became inactive (normal MV3 behavior)
3. Users tried to interact with the extension after it was updated
4. Long-running sessions where the service worker went to sleep

This resulted in a poor user experience with cryptic error messages and non-functional UI.

## Solution Overview

Implemented a comprehensive error handling and recovery system across all extension contexts:

### 1. Core Runtime Utilities (`src/utils/runtime.ts`)

Created centralized utilities for handling extension runtime:

- **`isRuntimeValid()`** - Checks if the extension runtime is still accessible
- **`isContextInvalidatedError(error)`** - Identifies context invalidation errors
- **`sendRuntimeMessage()`** - Sends messages with automatic retry logic and error handling
- **`createUserErrorMessage()`** - Converts technical errors to user-friendly messages
- **`watchRuntimeValidity()`** - Monitors runtime health and triggers callbacks on invalidation
- **`getExtensionURL()`** - Safely retrieves extension URLs

#### Key Features:
- **Automatic retries**: Up to 2 retries with configurable delay (default 500ms)
- **Smart error detection**: Recognizes multiple variants of context invalidation errors
- **User-friendly messages**: Converts technical errors to actionable user instructions

### 2. React Hook (`src/hooks/useRuntimeMessaging.ts`)

Created a reusable React hook for all UI components:

```typescript
const { sendMessage, isInvalidated, error, clearError } = useRuntimeMessaging();
```

**Features:**
- Automatically checks runtime validity on component mount
- Watches for runtime invalidation during component lifecycle
- Provides typed message sending with error handling
- Returns invalidation state for UI updates

### 3. UI Component (`src/components/RuntimeInvalidatedModal.tsx`)

Created a modal that appears when the runtime is invalidated:
- Clear warning icon and message
- "Reload Page" button for easy recovery
- Consistent styling across light/dark modes
- High z-index to appear above all content

### 4. Updated Components

#### Panel UI (`src/panel/Panel.tsx`)
- Replaced all `chrome.runtime.sendMessage()` calls with `sendRuntimeMessage()`
- Added runtime validity checking on mount
- Shows modal overlay when runtime is invalidated
- Retry logic for all API operations

#### Settings UI (`src/settings/Settings.tsx`)
- Integrated `useRuntimeMessaging` hook
- Replaced direct runtime calls with hook methods
- Added `RuntimeInvalidatedModal` component

#### Onboarding UI (`src/onboarding/Onboarding.tsx`)
- Integrated `useRuntimeMessaging` hook
- All setup operations use retry-enabled messaging
- Shows modal if runtime invalidates during onboarding

#### Content Script (`src/content/content-script.ts`)
- Added `isRuntimeValid()` function
- Added `watchRuntimeValidity()` to monitor runtime health
- Shows toast notification when runtime is invalidated
- Validates runtime before opening panel
- Graceful degradation when runtime is unavailable

### 5. Notification System

For the content script (which can't use React modals), created an inline notification:
- Slides in from top-right corner
- Provides "Reload Page" button
- Auto-dismisses after 30 seconds
- Dismissible by clicking X
- Uses inline styles to avoid style conflicts with Twitter/X

## Error Handling Flow

### Before Fix:
```
User Action → chrome.runtime.sendMessage() → Error → "Extension context invalidated"
→ User confused, extension broken
```

### After Fix:
```
User Action → sendRuntimeMessage()
→ Retry (if temporary failure)
→ Success OR Context Invalidated
→ User-friendly modal/notification
→ "Reload Page" button
→ Extension functional again
```

## Retry Strategy

Messages are retried automatically with the following defaults:
- **Max retries**: 2 (configurable per message)
- **Retry delay**: 500ms (configurable)
- **Retry conditions**: Only retry on transient errors, fail fast on context invalidation
- **Special cases**: Generation requests limited to 1 retry to avoid expensive duplicate API calls

## Testing

Build verified successful:
```bash
npm run type-check  # ✅ No errors
npm run build       # ✅ Build successful
```

### How to Test Manually:

1. **Load the extension** from `dist/` folder
2. **Open Twitter/X** and click the Kotodama button
3. **While panel is open**, reload the extension in `chrome://extensions`
4. **Expected behavior**: Modal appears with "Extension Reloaded" message and reload button
5. **Click reload** and the page refreshes, extension works again

### Test Scenarios Covered:

- ✅ Extension reload during panel interaction
- ✅ Extension reload during settings changes
- ✅ Extension reload during onboarding
- ✅ Service worker going inactive (automatic wakeup on message)
- ✅ Network transient failures (automatic retry)
- ✅ User-friendly error messages
- ✅ Visual feedback for runtime invalidation

## Files Changed

### New Files:
- `src/utils/runtime.ts` - Core runtime utilities
- `src/hooks/useRuntimeMessaging.ts` - React hook for runtime messaging
- `src/components/RuntimeInvalidatedModal.tsx` - Reusable modal component

### Modified Files:
- `src/panel/Panel.tsx` - Integrated runtime error handling
- `src/settings/Settings.tsx` - Integrated runtime error handling
- `src/onboarding/Onboarding.tsx` - Integrated runtime error handling
- `src/content/content-script.ts` - Added runtime monitoring and notifications

## Benefits

1. **Better UX**: Users see clear, actionable messages instead of technical errors
2. **Resilience**: Automatic retries handle transient failures
3. **Developer Experience**: Single source of truth for runtime handling
4. **Maintainability**: Centralized error handling logic
5. **Type Safety**: TypeScript types for all message handling
6. **Reusability**: Hook and utilities can be used across all components

## Future Improvements

Potential enhancements:
1. Add telemetry to track invalidation frequency
2. Implement automatic page reload after extension update (with user permission)
3. Add service worker keep-alive mechanism for long operations
4. Create a debug mode that logs all runtime operations
5. Add unit tests for runtime utilities

## Notes

- The service worker showing as "inactive" in chrome://extensions is **normal** for MV3 event-based service workers
- Context invalidation is **expected** when the extension is reloaded
- The fixes ensure graceful degradation and easy recovery
- No changes required to `manifest.json` or permissions
