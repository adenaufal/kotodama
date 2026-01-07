// Content script that runs on Twitter/X pages
// Responsible for detecting compose areas and injecting the AI button

let panelIframe: HTMLIFrameElement | null = null;
let currentContext: 'compose' | 'reply' | null = null;
let currentTweetContext: any = null;
let isPanelOpen = false;
let runtimeInvalidated = false;

const PANEL_TRANSITION_DURATION = 300;

type ExtensionRuntime = typeof chrome.runtime | null;

function resolveExtensionRuntime(): ExtensionRuntime {
  const globals = globalThis as typeof globalThis & {
    chrome?: typeof chrome;
    browser?: typeof chrome;
  };

  if (globals.chrome?.runtime) {
    return globals.chrome.runtime;
  }

  if (globals.browser?.runtime) {
    return globals.browser.runtime;
  }

  return null;
}

/**
 * Checks if the extension runtime is still valid
 */
function isRuntimeValid(): boolean {
  try {
    const runtime = resolveExtensionRuntime();
    return !!(runtime && runtime.id);
  } catch {
    return false;
  }
}

/**
 * Monitors runtime validity and shows reload notification when invalidated
 */
function watchRuntimeValidity(): void {
  const checkInterval = 3000; // Check every 3 seconds

  const intervalId = setInterval(() => {
    if (!isRuntimeValid() && !runtimeInvalidated) {
      runtimeInvalidated = true;
      clearInterval(intervalId);
      showRuntimeInvalidatedNotification();
    }
  }, checkInterval);

  // Also listen for errors
  window.addEventListener('error', (event) => {
    if (event.message?.includes('Extension context invalidated') && !runtimeInvalidated) {
      runtimeInvalidated = true;
      clearInterval(intervalId);
      showRuntimeInvalidatedNotification();
    }
  });
}

/**
 * Shows a notification when the runtime is invalidated
 */
function showRuntimeInvalidatedNotification(): void {
  // Remove any existing notification
  const existingNotification = document.querySelector('.kotodama-reload-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'kotodama-reload-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
      padding: 16px 20px;
      max-width: 360px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.3s ease;
    ">
      <div style="display: flex; align-items: start; gap: 12px;">
        <svg style="width: 24px; height: 24px; flex-shrink: 0; color: #f59e0b;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
            Kotodama Extension Updated
          </div>
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 12px;">
            Please reload this page to continue using Kotodama.
          </div>
          <button onclick="window.location.reload()" style="
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
          " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
            Reload Page
          </button>
        </div>
        <button onclick="this.closest('.kotodama-reload-notification').remove()" style="
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg style="width: 20px; height: 20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  `;

  // Add animation keyframes
  if (!document.querySelector('#kotodama-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'kotodama-notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    notification.remove();
  }, 30000);
}

const extensionRuntime = resolveExtensionRuntime();
const KOTODAMA_ICON_URL = extensionRuntime?.getURL('icons/kotodama-button.svg') ?? '';
const FALLBACK_ICON_SVG = `
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="currentColor"/>
  </svg>
`;

function createKotodamaIcon(size = 20): HTMLElement {
  if (!KOTODAMA_ICON_URL) {
    const fallbackWrapper = document.createElement('span');
    fallbackWrapper.innerHTML = FALLBACK_ICON_SVG.trim();
    fallbackWrapper.style.display = 'inline-flex';
    fallbackWrapper.style.pointerEvents = 'none';
    return fallbackWrapper;
  }

  const icon = document.createElement('img');
  icon.src = KOTODAMA_ICON_URL;
  icon.alt = 'Kotodama logo';
  icon.width = size;
  icon.height = size;
  icon.style.display = 'block';
  icon.style.pointerEvents = 'none';
  return icon;
}

function styleToolbarButton(button: HTMLButtonElement) {
  button.classList.add('kotodama-ai-button');

  // Icon-only button matching Twitter's style
  button.innerHTML = '';
  const icon = createKotodamaIcon(18);
  button.appendChild(icon);

  // Match Twitter's action button style
  Object.assign(button.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '9999px',
    border: 'none',
    background: 'transparent',
    color: 'rgb(83, 100, 113)', // Twitter's gray
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    outline: 'none',
    padding: '0',
    marginLeft: '0',
  } as CSSStyleDeclaration);

  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = 'rgba(29, 155, 240, 0.1)'; // Light blue background
    button.style.color = 'rgb(29, 155, 240)'; // Twitter's blue
  });

  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = 'transparent';
    button.style.color = 'rgb(83, 100, 113)';
  });
}

// Initialize the content script
function init() {
  console.log('Kotodama content script loaded');

  // Check if runtime is valid
  if (!isRuntimeValid()) {
    console.error('[Kotodama] Extension runtime is not valid on initialization');
    showRuntimeInvalidatedNotification();
    return;
  }

  // Start watching for runtime invalidation
  watchRuntimeValidity();

  // Create a floating button at top-right
  createFloatingButton();
}

function createFloatingButton() {
  console.time('[Kotodama Performance] Button injection');

  // Check if button already exists
  if (document.querySelector('.kotodama-floating-button')) {
    console.timeEnd('[Kotodama Performance] Button injection');
    return;
  }

  const button = document.createElement('button');
  button.className = 'kotodama-floating-button';
  button.title = 'Compose with Kotodama';

  // Icon-only button
  button.innerHTML = '';
  const iconWrapper = document.createElement('span');
  iconWrapper.style.display = 'inline-flex';
  iconWrapper.style.alignItems = 'center';
  iconWrapper.style.justifyContent = 'center';
  iconWrapper.appendChild(createKotodamaIcon(24));

  button.append(iconWrapper);

  // Floating button style
  Object.assign(button.style, {
    position: 'fixed',
    top: '24px',
    right: '24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    padding: '0',
    borderRadius: '16px', // Soft square look
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'linear-gradient(135deg, #1d9bf0, #ec4899)', // Twitter Blue to Sakura Pink
    cursor: 'pointer',
    boxShadow: '0 8px 20px -4px rgba(29, 155, 240, 0.5), 0 4px 12px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy transition
    outline: 'none',
    zIndex: '9999', // Higher z-index to be safe
    backdropFilter: 'blur(8px)',
  } as CSSStyleDeclaration);

  // White icon for contrast against gradient
  const iconSvg = button.querySelector('img, svg');
  if (iconSvg) {
    (iconSvg as HTMLElement).style.filter = 'brightness(0) invert(1)';
  }

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1) rotate(5deg)';
    button.style.boxShadow = '0 12px 28px -6px rgba(236, 72, 153, 0.6), 0 8px 16px rgba(0, 0, 0, 0.15)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1) rotate(0deg)';
    button.style.boxShadow = '0 8px 20px -4px rgba(29, 155, 240, 0.5), 0 4px 12px rgba(0, 0, 0, 0.1)';
  });

  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('[Kotodama] Floating button clicked, detecting context...');

    // Strategy 1: Check for "Replying to" text - most reliable indicator
    const replyingToSelectors = [
      '[data-testid="inlineReplyingTo"]',
      '[aria-label*="Replying to"]',
      '.css-1rynq56.r-bcqeeo.r-qvutc0.r-37j5jr.r-a023e6.r-rjixqe.r-16dba41.r-1awozwy.r-6koalj.r-1h0z5md.r-o7ynqc.r-clp7b1.r-3s2u2q',
    ];
    let replyingToElement = null;
    for (const selector of replyingToSelectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.includes('Replying to')) {
        replyingToElement = element;
        break;
      }
    }

    // Strategy 2: Check for compose box placeholder text containing "reply"
    const composeBox = document.querySelector('[data-testid="tweetTextarea_0"]');
    const placeholder = composeBox?.getAttribute('data-text') || composeBox?.getAttribute('placeholder') || composeBox?.getAttribute('aria-label') || '';
    const isReplyPlaceholder = placeholder.toLowerCase().includes('reply');

    // Strategy 3: Check if the compose box is within a reply container
    const isInReplyContainer = !!composeBox?.closest('[data-testid="reply"]');

    // Strategy 4: Look for tweet articles on the page
    const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]');
    const hasTweetAbove = tweetArticles.length > 0;

    // Strategy 5: Check URL pattern for reply pages
    const isReplyURL = window.location.pathname.includes('/status/') && composeBox !== null;

    console.log('[Kotodama] Detection results:', {
      replyingToElement: !!replyingToElement,
      isReplyPlaceholder,
      isInReplyContainer,
      hasTweetAbove,
      isReplyURL,
      placeholder: placeholder.substring(0, 50),
      tweetArticleCount: tweetArticles.length,
    });

    // Determine if this is a reply context
    const isReplyContext = (
      replyingToElement !== null ||
      isInReplyContainer ||
      (isReplyPlaceholder && placeholder.toLowerCase().includes('post your reply')) ||
      (isReplyURL && hasTweetAbove)
    );

    if (isReplyContext) {
      console.log('[Kotodama] Reply context detected');
      currentContext = 'reply';

      // Try to find the tweet we're replying to
      if (tweetArticles.length > 0) {
        // Find the first tweet that's not a reply (the original tweet)
        let targetTweet = tweetArticles[0] as HTMLElement;

        // If there are multiple tweets, try to find the main one
        for (let i = 0; i < tweetArticles.length; i++) {
          const article = tweetArticles[i] as HTMLElement;
          // Skip if this is our own compose area
          if (article.contains(composeBox)) continue;
          targetTweet = article;
          break;
        }

        currentTweetContext = await extractTweetContextFromPage(targetTweet);
        console.log('[Kotodama] Extracted context:', currentTweetContext);
      } else {
        console.warn('[Kotodama] Reply context detected but no tweet found');
        currentTweetContext = null;
      }
    } else {
      console.log('[Kotodama] Compose context (not a reply)');
      currentContext = 'compose';
      currentTweetContext = null;
    }

    if (panelIframe && document.body.contains(panelIframe)) {
      togglePanel();
    } else {
      openPanel();
    }
  });

  document.body.appendChild(button);

  console.timeEnd('[Kotodama Performance] Button injection');
  console.log('[Kotodama Performance] Floating button ready');
}

// ... existing code ...

function openPanel() {
  // Check if runtime is still valid
  if (!isRuntimeValid()) {
    console.error('[Kotodama] Extension runtime is invalidated');
    showRuntimeInvalidatedNotification();
    return;
  }

  if (panelIframe) {
    console.time('[Kotodama Performance] Panel show');
    showPanel();
    // End timing after transition completes
    setTimeout(() => {
      console.timeEnd('[Kotodama Performance] Panel show');
    }, PANEL_TRANSITION_DURATION);
    return;
  }

  if (!extensionRuntime) {
    console.error('Kotodama: extension runtime is unavailable in this context.');
    showRuntimeInvalidatedNotification();
    return;
  }

  console.time('[Kotodama Performance] Panel creation + first load');

  panelIframe = document.createElement('iframe');
  panelIframe.src = extensionRuntime.getURL('src/panel/index.html');
  panelIframe.id = 'kotodama-panel';

  // Responsive sizing based on viewport
  const viewportWidth = window.innerWidth;

  // Adjust dimensions for smaller screens - Slightly larger and more spacious
  let panelWidth: string;
  let panelHeight: string;
  let panelTop: string;
  let panelRight: string;

  if (viewportWidth <= 1366) {
    // Small screens (13-14 inch laptops, 720p-1080p)
    panelWidth = 'min(420px, calc(100vw - 40px))';
    panelHeight = 'min(680px, calc(100vh - 80px))';
    panelTop = '80px';
    panelRight = '20px';
  } else if (viewportWidth <= 1920) {
    // Medium screens (15-17 inch laptops, 1080p-1440p)
    // Capped at 440px to prevent bloated look
    panelWidth = 'min(440px, calc(100vw - 60px))';
    panelHeight = 'min(750px, calc(100vh - 100px))';
    panelTop = '80px';
    panelRight = '30px';
  } else {
    // Large screens (1440p+)
    // Capped at 450px to prevent bloated look
    panelWidth = 'min(450px, calc(100vw - 80px))';
    panelHeight = 'min(850px, calc(100vh - 120px))';
    panelTop = '90px';
    panelRight = '40px';
  }

  Object.assign(panelIframe.style, {
    position: 'fixed',
    top: panelTop,
    right: panelRight,
    width: panelWidth,
    height: panelHeight,
    minHeight: '550px',
    border: 'none',
    borderRadius: '24px', // More rounded corners
    zIndex: '999999',
    boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.4), 0 10px 30px -10px rgba(29, 155, 240, 0.2)', // Deeper shadow
    background: 'transparent',
    overflow: 'hidden',
    transform: 'translateY(30px) scale(0.98)',
    opacity: '0',
    pointerEvents: 'none',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease', // Apple-like spring
  } as CSSStyleDeclaration);

  document.body.appendChild(panelIframe);

  requestAnimationFrame(() => {
    showPanel();
  });

  panelIframe.addEventListener('load', () => {
    console.timeEnd('[Kotodama Performance] Panel creation + first load');
    sendContextToPanel();
  });
}

function togglePanel() {
  if (!panelIframe) return;

  if (isPanelOpen) {
    hidePanel();
  } else {
    showPanel();
    sendContextToPanel();
  }
}

// Trusted origins for postMessage security
const TRUSTED_ORIGINS = [
  'https://twitter.com',
  'https://x.com',
];

function isExtensionOrigin(origin: string): boolean {
  return origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://');
}

function sendContextToPanel() {
  if (!panelIframe?.contentWindow) return;

  // Send to extension origin (panel iframe)
  const panelOrigin = extensionRuntime?.getURL('').replace(/\/$/, '') || '*';
  panelIframe.contentWindow.postMessage(
    {
      type: 'context',
      context: currentContext,
      tweetContext: currentTweetContext,
    },
    panelOrigin
  );
}

function showPanel() {
  if (!panelIframe) return;

  isPanelOpen = true;
  panelIframe.style.pointerEvents = 'auto';
  panelIframe.style.transform = 'translateY(0)';
  panelIframe.style.opacity = '1';
}

function hidePanel() {
  if (!panelIframe) return;

  isPanelOpen = false;
  panelIframe.style.pointerEvents = 'none';
  panelIframe.style.transform = 'translateY(24px)';
  panelIframe.style.opacity = '0';

  setTimeout(() => {
    if (!isPanelOpen && panelIframe) {
      panelIframe.style.pointerEvents = 'none';
    }
  }, PANEL_TRANSITION_DURATION);
}

// Listen for messages from the panel
window.addEventListener('message', async (event) => {
  // Verify the message is from a trusted source (extension panel or Twitter)
  const origin = event.origin;
  const isTrustedOrigin = isExtensionOrigin(origin) || TRUSTED_ORIGINS.some((t) => origin.startsWith(t));

  if (!isTrustedOrigin) {
    return;
  }

  if (event.data.type === 'insert-tweet') {
    insertTweetContent(event.data.content);
  } else if (event.data.type === 'close-panel') {
    hidePanel();
  } else if (event.data.type === 'analyze-profile') {
    const tweets = await fetchUserTweets(event.data.username);
    // Reply to the extension origin
    const replyOrigin = extensionRuntime?.getURL('').replace(/\/$/, '') || origin;
    event.source?.postMessage(
      {
        type: 'profile-tweets',
        tweets,
      },
      { targetOrigin: replyOrigin } as WindowPostMessageOptions
    );
  }
});

function findComposeEditable(): HTMLElement | null {
  const activeElement = document.activeElement as HTMLElement | null;
  const selectors = [
    '[data-testid="tweetTextarea_0"][contenteditable="true"]',
    '[data-testid="tweetTextarea_0"] [contenteditable="true"]',
    '[role="textbox"][contenteditable="true"]',
    '[aria-label="Tweet text"][contenteditable="true"]',
    '[aria-label="Post text"][contenteditable="true"]',
  ];

  if (activeElement) {
    for (const selector of selectors) {
      if (activeElement.matches(selector)) {
        return activeElement;
      }

      const closest = activeElement.closest(selector) as HTMLElement | null;
      if (closest) {
        return closest;
      }
    }
  }

  for (const selector of selectors) {
    const queried = document.querySelector<HTMLElement>(selector);
    if (queried) {
      return queried;
    }
  }

  return null;
}

function insertTweetContent(content: string) {
  const composeEditable = findComposeEditable();

  if (!composeEditable) {
    console.error('Could not find tweet compose box');
    return;
  }

  console.log('[Kotodama] Inserting content:', content);

  // Focus the element first to activate Twitter's editor
  composeEditable.focus();

  // Select everything so we can replace it in one go
  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(composeEditable);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  let pasteHandled = false;
  if (typeof ClipboardEvent === 'function' && typeof DataTransfer === 'function') {
    try {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', content);
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
      });

      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: clipboardData,
        configurable: true,
      });

      const dispatchResult = composeEditable.dispatchEvent(pasteEvent);
      pasteHandled = pasteEvent.defaultPrevented || !dispatchResult;
      console.log('[Kotodama] Paste event dispatched. Handled by X:', pasteHandled);
    } catch (error) {
      console.warn('[Kotodama] Clipboard paste simulation failed:', error);
    }
  }

  const normalize = (value: string) => value.replace(/\s+$/g, '').replace(/\r\n/g, '\n');

  const applyFallbackInsertion = () => {
    console.log('[Kotodama] Using execCommand fallback insertion');
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(composeEditable);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    try {
      composeEditable.dispatchEvent(new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertReplacementText',
        data: content,
      }));
    } catch (error) {
      console.warn('[Kotodama] beforeinput insertReplacementText failed:', error);
    }

    try {
      const inserted = document.execCommand('insertText', false, content);
      if (!inserted) {
        throw new Error('execCommand insertText returned false');
      }
    } catch (error) {
      console.warn('[Kotodama] execCommand insertText fallback failed:', error);
      composeEditable.textContent = content;
    }
  };

  const finalizeInsertion = () => {
    const currentText = normalize(composeEditable.textContent || '');
    const expectedText = normalize(content);

    if (currentText !== expectedText) {
      applyFallbackInsertion();
    }

    // Ensure placeholder state and aria label stay accurate
    composeEditable.setAttribute('data-text', 'true');
    if (composeEditable.hasAttribute('aria-label')) {
      composeEditable.setAttribute('aria-label', 'Tweet text');
    }

    try {
      composeEditable.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: content,
        inputType: pasteHandled ? 'insertFromPaste' : 'insertReplacementText',
      }));
    } catch (error) {
      console.warn('[Kotodama] input event failed:', error);
      composeEditable.dispatchEvent(new Event('input', { bubbles: true }));
    }

    composeEditable.dispatchEvent(new Event('change', { bubbles: true }));

    // Place cursor at the end
    const finalSelection = window.getSelection();
    if (finalSelection) {
      const finalRange = document.createRange();
      finalRange.selectNodeContents(composeEditable);
      finalRange.collapse(false);
      finalSelection.removeAllRanges();
      finalSelection.addRange(finalRange);
    }

    console.log('[Kotodama] Final content length:', composeEditable.textContent?.length);
    console.log('[Kotodama] Expected length:', content.length);
    console.log('[Kotodama] Match:', composeEditable.textContent === content);

    composeEditable.blur();
    setTimeout(() => {
      composeEditable.focus();

      if (panelIframe) {
        setTimeout(() => {
          hidePanel();
        }, 600);
      }
    }, 50);
  };

  if (pasteHandled) {
    requestAnimationFrame(finalizeInsertion);
  } else {
    finalizeInsertion();
  }

}

/**
 * Fetches tweets from the current page or navigates to user profile.
 * Extracts tweet text content from visible tweet articles.
 */
async function fetchUserTweets(username: string): Promise<string[]> {
  const tweets: string[] = [];

  // If we're already on the user's profile, scrape directly
  const currentPath = window.location.pathname;
  const isOnProfile = currentPath === `/${username}` || currentPath.startsWith(`/${username}/`);

  if (isOnProfile) {
    // Scrape tweets from current page
    const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');

    for (const article of tweetElements) {
      const tweetTextEl = article.querySelector('[data-testid="tweetText"]');
      if (tweetTextEl?.textContent) {
        const text = tweetTextEl.textContent.trim();
        // Only include tweets with substantial content
        if (text.length > 10 && text.length <= 280) {
          tweets.push(text);
        }
      }

      // Limit to 20 tweets for analysis
      if (tweets.length >= 20) break;
    }
  } else {
    // Try to fetch from Twitter's syndication API (public tweets only)
    // This is a fallback for when not on the user's profile page
    try {
      // Use Twitter's oEmbed/syndication for public profile data
      // Note: This has limitations and may not work for all profiles
      const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]');

      // Check if any visible tweets are from the target user
      for (const article of tweetArticles) {
        const userLinks = article.querySelectorAll('a[role="link"][href^="/"]');
        let isFromUser = false;

        for (const link of userLinks) {
          const href = link.getAttribute('href') || '';
          if (href === `/${username}` || href.startsWith(`/${username}/`)) {
            isFromUser = true;
            break;
          }
        }

        if (isFromUser) {
          const tweetTextEl = article.querySelector('[data-testid="tweetText"]');
          if (tweetTextEl?.textContent) {
            const text = tweetTextEl.textContent.trim();
            if (text.length > 10 && text.length <= 280) {
              tweets.push(text);
            }
          }
        }

        if (tweets.length >= 20) break;
      }
    } catch (error) {
      // Scraping failed, return empty array
      // The calling code should handle this gracefully
    }
  }

  return tweets;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
