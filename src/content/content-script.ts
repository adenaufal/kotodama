// Content script that runs on Twitter/X pages
// Responsible for detecting compose areas and injecting the AI button

let panelIframe: HTMLIFrameElement | null = null;
let currentContext: 'compose' | 'reply' | null = null;
let currentTweetContext: any = null;
let isPanelOpen = false;

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
    borderRadius: '9999px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.95)',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.2s ease',
    outline: 'none',
    zIndex: '1000',
  } as CSSStyleDeclaration);

  button.addEventListener('mouseenter', () => {
    button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
    button.style.transform = 'translateY(-1px)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    button.style.transform = 'translateY(0)';
  });

  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('[Kotodama] Floating button clicked, detecting context...');

    // Strategy 1: Check for "Replying to" text - most reliable indicator
    const replyingToSelectors = [
      '[data-testid="inlineReplyingTo"]',
      '[aria-label*="Replying to"]',
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
    const placeholder = composeBox?.getAttribute('data-text') || composeBox?.getAttribute('placeholder') || '';
    const isReplyPlaceholder = placeholder.toLowerCase().includes('reply');

    // Strategy 3: Check if the compose box is within a reply container
    const isInReplyContainer = !!composeBox?.closest('[data-testid="reply"]');

    console.log('[Kotodama] Detection results:', {
      replyingToElement: !!replyingToElement,
      isReplyPlaceholder,
      isInReplyContainer,
      placeholder: placeholder.substring(0, 50),
    });

    // Determine if this is a reply context - use stricter criteria
    // Only treat as reply if we have EXPLICIT reply indicators
    const isReplyContext = (
      replyingToElement !== null ||
      isInReplyContainer ||
      (isReplyPlaceholder && placeholder.toLowerCase().startsWith('post your reply'))
    );

    if (isReplyContext) {
      console.log('[Kotodama] Reply context detected');
      currentContext = 'reply';

      // Try to find the tweet we're replying to
      const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]');
      if (tweetArticles.length > 0) {
        currentTweetContext = await extractTweetContextFromPage(tweetArticles[0] as HTMLElement);
        console.log('[Kotodama] Extracted context:', currentTweetContext);
      } else {
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

async function handleAIButtonClick(composeBox: HTMLElement) {
  // Determine if this is a reply or original tweet
  const isReply = !!composeBox.closest('[data-testid="reply"]');
  currentContext = isReply ? 'reply' : 'compose';

  if (isReply) {
    // Extract tweet context for replies
    currentTweetContext = await extractTweetContext(composeBox);
  } else {
    currentTweetContext = null;
  }

  // Open or toggle the panel
  if (panelIframe && document.body.contains(panelIframe)) {
    togglePanel();
  } else {
    openPanel();
  }
}

async function extractTweetContext(replyBox: HTMLElement): Promise<any> {
  console.log('[Kotodama] Extracting tweet context from reply box');

  // Strategy 1: Look for tweet article in the same container
  let tweetArticle = replyBox.closest('article');

  // Strategy 2: If not found, look for the tweet above the reply
  if (!tweetArticle) {
    const allArticles = document.querySelectorAll('article');
    // The original tweet should be one of the articles before the reply box
    tweetArticle = Array.from(allArticles).find(article => {
      return article.querySelector('[data-testid="tweetText"]') !== null;
    }) || null;
  }

  if (!tweetArticle) {
    console.warn('[Kotodama] Could not find original tweet article');
    return null;
  }

  // Extract tweet text
  const tweetTextElement = tweetArticle.querySelector('[data-testid="tweetText"]');
  const tweetText = tweetTextElement?.textContent || '';

  // Extract username - try multiple selectors
  let username = '';
  const usernameSelectors = [
    '[data-testid="User-Name"] a[role="link"]',
    '[data-testid="User-Name"] span',
    'a[role="link"][href^="/"]',
  ];

  for (const selector of usernameSelectors) {
    const element = tweetArticle.querySelector(selector);
    if (element?.textContent) {
      username = element.textContent.replace('@', '').trim();
      if (username && username !== '') break;
    }
  }

  const context = {
    text: tweetText,
    username,
    timestamp: new Date().toISOString(),
  };

  console.log('[Kotodama] Extracted context:', context);

  return context;
}

async function extractTweetContextFromPage(tweetArticle: HTMLElement): Promise<any> {
  console.log('[Kotodama] Extracting tweet context from page');

  if (!tweetArticle) {
    console.warn('[Kotodama] No tweet article provided');
    return null;
  }

  // Extract tweet text
  const tweetTextElement = tweetArticle.querySelector('[data-testid="tweetText"]');
  const tweetText = tweetTextElement?.textContent || '';

  // Extract username - try multiple selectors
  let username = '';
  const usernameSelectors = [
    '[data-testid="User-Name"] a[role="link"]',
    '[data-testid="User-Name"] span',
    'a[role="link"][href^="/"]',
  ];

  for (const selector of usernameSelectors) {
    const element = tweetArticle.querySelector(selector);
    if (element) {
      const href = element.getAttribute('href');
      if (href && href.startsWith('/')) {
        username = href.substring(1).split('/')[0];
        break;
      }
      const text = element.textContent;
      if (text) {
        username = text.replace('@', '').trim();
        if (username && username !== '') break;
      }
    }
  }

  const context = {
    text: tweetText,
    username,
    timestamp: new Date().toISOString(),
  };

  console.log('[Kotodama] Extracted context from page:', context);

  return context;
}

function openPanel() {
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
    return;
  }

  console.time('[Kotodama Performance] Panel creation + first load');

  panelIframe = document.createElement('iframe');
  panelIframe.src = extensionRuntime.getURL('src/panel/index.html');
  panelIframe.id = 'kotodama-panel';

  Object.assign(panelIframe.style, {
    position: 'fixed',
    top: '80px',
    right: '40px',
    width: 'min(520px, calc(100vw - 80px))',
    height: 'min(800px, calc(100vh - 120px))',
    minHeight: '600px',
    border: 'none',
    borderRadius: '20px',
    zIndex: '999999',
    boxShadow: '0 30px 80px rgba(15, 23, 42, 0.35)',
    background: 'transparent',
    overflow: 'hidden',
    transform: 'translateY(24px)',
    opacity: '0',
    pointerEvents: 'none',
    transition: 'transform 0.3s ease, opacity 0.3s ease',
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

function sendContextToPanel() {
  if (!panelIframe?.contentWindow) return;

  panelIframe.contentWindow.postMessage(
    {
      type: 'context',
      context: currentContext,
      tweetContext: currentTweetContext,
    },
    '*'
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
  if (event.data.type === 'insert-tweet') {
    insertTweetContent(event.data.content);
  } else if (event.data.type === 'close-panel') {
    hidePanel();
  } else if (event.data.type === 'analyze-profile') {
    const tweets = await fetchUserTweets(event.data.username);
    event.source?.postMessage(
      {
        type: 'profile-tweets',
        tweets,
      },
      { targetOrigin: '*' } as any
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

  // Clear existing content first
  composeEditable.textContent = '';
  composeEditable.focus();

  // Try using execCommand first (more reliable for maintaining Twitter's state)
  let inserted = false;
  try {
    // Position cursor at the start
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(composeEditable);
      range.collapse(true); // Collapse to start
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Try to insert using execCommand
    inserted = document.execCommand('insertText', false, content);
    console.log('[Kotodama] execCommand insertText result:', inserted);
  } catch (error) {
    console.warn('[Kotodama] Failed to use execCommand for insertion', error);
  }

  // Fallback to direct textContent setting
  if (!inserted || composeEditable.textContent !== content) {
    console.log('[Kotodama] Using textContent fallback');
    composeEditable.textContent = content;
  }

  // Dispatch input events to notify Twitter's React components
  composeEditable.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: content,
  }));

  // Also dispatch a change event for good measure
  composeEditable.dispatchEvent(new Event('change', { bubbles: true }));

  // Position cursor at the end
  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(composeEditable);
    range.collapse(false); // Collapse to end
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // Verify insertion
  console.log('[Kotodama] Final content length:', composeEditable.textContent?.length);
  console.log('[Kotodama] Expected length:', content.length);

  if (panelIframe) {
    setTimeout(() => {
      hidePanel();
    }, 500);
  }
}

async function fetchUserTweets(_username: string): Promise<string[]> {
  // This would ideally scrape the user's timeline
  // For now, return a placeholder implementation
  // In production, this would navigate to the user's profile and extract recent tweets

  // TODO: Implement actual tweet scraping
  // This is a simplified version - real implementation would be more complex

  return [];
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
