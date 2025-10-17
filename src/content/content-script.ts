// Content script that runs on Twitter/X pages
// Responsible for detecting compose areas and injecting the AI button

let panelIframe: HTMLIFrameElement | null = null;
let currentContext: 'compose' | 'reply' | null = null;
let currentTweetContext: any = null;
let isPanelOpen = false;

const PANEL_TRANSITION_DURATION = 300;

function styleToolbarButton(button: HTMLButtonElement) {
  button.classList.add('kotodama-ai-button');
  button.innerHTML = `
    <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:9999px;background:rgba(255,255,255,0.18);backdrop-filter:blur(6px);">
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="currentColor"/>
      </svg>
    </span>
    <span style="font-weight:600;letter-spacing:0.01em;">Kotodama</span>
  `;

  Object.assign(button.style, {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 16px',
    height: '36px',
    borderRadius: '9999px',
    border: 'none',
    background: 'linear-gradient(135deg, #1d9bf0, #7c3aed)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(124, 58, 237, 0.35)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease',
    position: 'relative',
    outline: 'none',
    whiteSpace: 'nowrap',
  } as CSSStyleDeclaration);

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-1px) scale(1.01)';
    button.style.boxShadow = '0 18px 34px rgba(29, 155, 240, 0.35)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0) scale(1)';
    button.style.boxShadow = '0 10px 30px rgba(124, 58, 237, 0.35)';
  });
}

// Initialize the content script
function init() {
  console.log('Kotodama content script loaded');

  // Use MutationObserver to detect when compose boxes appear
  const observer = new MutationObserver(() => {
    injectButtonsIfNeeded();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial injection
  injectButtonsIfNeeded();
}

function injectButtonsIfNeeded() {
  // Twitter's compose box selectors (these may need adjustment based on Twitter's DOM)
  const composeSelectors = [
    '[data-testid="tweetTextarea_0"]',
    '[role="textbox"][contenteditable="true"]',
  ];

  composeSelectors.forEach((selector) => {
    const composeBoxes = document.querySelectorAll(selector);
    composeBoxes.forEach((box) => {
      const element = box as HTMLElement;
      const wrapper = element.closest('[data-testid="tweetTextarea_0_wrapper"]');
      const container = wrapper?.parentElement || element.parentElement;

      if (container && container.querySelector('.kotodama-ai-button')) {
        return;
      }

      injectAIButton(element);
    });
  });
}

function injectAIButton(composeBox: HTMLElement) {
  const button = document.createElement('button');
  button.title = 'Compose with Kotodama';
  styleToolbarButton(button);

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleAIButtonClick(composeBox);
  });

  const wrapper = composeBox.closest('[data-testid="tweetTextarea_0_wrapper"]');
  const toolbar = wrapper?.parentElement?.querySelector<HTMLElement>('[data-testid="toolBar"]');

  if (toolbar && !toolbar.querySelector('.kotodama-ai-button')) {
    const slot = document.createElement('div');
    slot.className = 'kotodama-ai-button-slot';
    Object.assign(slot.style, {
      display: 'flex',
      alignItems: 'center',
      marginLeft: '8px',
    });
    slot.appendChild(button);
    toolbar.appendChild(slot);
    return;
  }

  const container = wrapper || composeBox.parentElement;

  if (container instanceof HTMLElement) {
    container.style.position = container.style.position || 'relative';
    Object.assign(button.style, {
      position: 'absolute',
      right: '12px',
      bottom: '-18px',
      transform: 'translateY(100%)',
    });
    container.appendChild(button);
  }
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

function insertTweetContent(content: string) {
  // Find the active compose box
  const activeBox = document.activeElement?.closest('[role="textbox"]') as HTMLElement ||
                    document.querySelector('[data-testid="tweetTextarea_0"]') as HTMLElement;

  if (!activeBox) {
    console.error('Could not find tweet compose box');
    return;
  }

  // Set the content
  activeBox.focus();

  // For contenteditable divs, we need to set innerHTML or use execCommand
  if (activeBox.getAttribute('contenteditable') === 'true') {
    activeBox.textContent = content;

    // Trigger input event so Twitter recognizes the change
    const inputEvent = new Event('input', { bubbles: true });
    activeBox.dispatchEvent(inputEvent);

    // Place cursor at end
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(activeBox);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  // Close panel after insertion
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
