// Content script that runs on Twitter/X pages
// Responsible for detecting compose areas and injecting the AI button

let panelIframe: HTMLIFrameElement | null = null;
let currentContext: 'compose' | 'reply' | null = null;
let currentTweetContext: any = null;
let isPanelOpen = false;

const PANEL_TRANSITION_DURATION = 300;

function styleToolbarButton(button: HTMLButtonElement) {
  button.classList.add('kotodama-ai-button');

  // Icon-only button matching Twitter's style
  button.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="currentColor"/>
    </svg>
  `;

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
  // Check if button already exists
  if (document.querySelector('.kotodama-floating-button')) {
    return;
  }

  const button = document.createElement('button');
  button.className = 'kotodama-floating-button';
  button.title = 'Compose with Kotodama';

  // Icon-only button
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="currentColor"/>
    </svg>
    <span style="margin-left: 8px; font-weight: 600;">Kotodama</span>
  `;

  // Floating button style
  Object.assign(button.style, {
    position: 'fixed',
    top: '80px',
    right: '24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '44px',
    padding: '0 20px',
    borderRadius: '9999px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.95)',
    color: 'rgb(29, 155, 240)',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.2s ease',
    outline: 'none',
    zIndex: '1000',
    fontSize: '15px',
    fontWeight: '600',
  } as CSSStyleDeclaration);

  button.addEventListener('mouseenter', () => {
    button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
    button.style.transform = 'translateY(-1px)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    button.style.transform = 'translateY(0)';
  });

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    currentContext = 'compose';
    currentTweetContext = null;

    if (panelIframe && document.body.contains(panelIframe)) {
      togglePanel();
    } else {
      openPanel();
    }
  });

  document.body.appendChild(button);
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
  // Find the original tweet being replied to
  const tweetArticle = replyBox.closest('article') ||
                       document.querySelector('[data-testid="tweet"]');

  if (!tweetArticle) return null;

  // Extract tweet text
  const tweetText = tweetArticle.querySelector('[data-testid="tweetText"]')?.textContent || '';

  // Extract username
  const usernameElement = tweetArticle.querySelector('[data-testid="User-Name"] a[role="link"]');
  const username = usernameElement?.textContent?.replace('@', '') || '';

  return {
    text: tweetText,
    username,
    timestamp: new Date().toISOString(),
  };
}

function openPanel() {
  if (panelIframe) {
    showPanel();
    return;
  }

  panelIframe = document.createElement('iframe');
  panelIframe.src = chrome.runtime.getURL('src/panel/index.html');
  panelIframe.id = 'kotodama-panel';

  Object.assign(panelIframe.style, {
    position: 'fixed',
    top: '72px',
    right: '24px',
    width: 'min(420px, calc(100vw - 48px))',
    height: 'min(720px, calc(100vh - 120px))',
    minHeight: '480px',
    border: 'none',
    borderRadius: '20px',
    zIndex: '999999',
    boxShadow: '0 30px 80px rgba(15, 23, 42, 0.35)',
    background: 'white',
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
