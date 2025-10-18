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

    // Strategy 1: Check for "Replying to" text (multiple selectors)
    const replyingToSelectors = [
      '[data-testid="inlineReplyingTo"]',
      '[aria-label*="Replying to"]',
      'div[dir="ltr"] > span:first-child', // "Replying to" text
    ];
    let replyingToElement = null;
    for (const selector of replyingToSelectors) {
      replyingToElement = document.querySelector(selector);
      if (replyingToElement?.textContent?.includes('Replying to')) break;
    }

    // Strategy 2: Look for tweet articles on the page (original tweet)
    const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]');

    // Strategy 3: Check URL for /status/ (we're viewing a tweet detail page)
    const isStatusPage = window.location.pathname.includes('/status/');

    // Strategy 4: Check for compose box placeholder text
    const composeBox = document.querySelector('[data-testid="tweetTextarea_0"]');
    const placeholder = composeBox?.getAttribute('data-text') || composeBox?.getAttribute('placeholder') || '';
    const isReplyPlaceholder = placeholder.toLowerCase().includes('reply');

    console.log('[Kotodama] Detection results:', {
      replyingToElement: !!replyingToElement,
      tweetArticles: tweetArticles.length,
      isStatusPage,
      isReplyPlaceholder,
      placeholder: placeholder.substring(0, 30),
    });

    // Determine if this is a reply context
    const isReplyContext = (
      replyingToElement ||
      (isStatusPage && tweetArticles.length > 0) ||
      isReplyPlaceholder
    );

    if (isReplyContext && tweetArticles.length > 0) {
      console.log('[Kotodama] Reply context detected');
      currentContext = 'reply';
      currentTweetContext = await extractTweetContextFromPage(tweetArticles[0] as HTMLElement);
      console.log('[Kotodama] Extracted context:', currentTweetContext);
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
    top: '72px',
    right: '24px',
    width: 'min(520px, calc(100vw - 48px))',
    height: 'min(800px, calc(100vh - 96px))',
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

  composeEditable.focus();

  const selection = window.getSelection();

  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(composeEditable);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  let inserted = false;

  try {
    inserted = document.execCommand('insertText', false, content);
  } catch (error) {
    console.warn('Failed to use execCommand for insertion', error);
  }

  if (!inserted) {
    composeEditable.textContent = content;
  }

  const inputEvent = new InputEvent('input', {
    bubbles: true,
    data: content,
    inputType: 'insertFromPaste',
  });

  composeEditable.dispatchEvent(inputEvent);

  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(composeEditable);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

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
