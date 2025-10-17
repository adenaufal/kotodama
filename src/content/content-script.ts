// Content script that runs on Twitter/X pages
// Responsible for detecting compose areas and injecting the AI button

let panelIframe: HTMLIFrameElement | null = null;
let currentContext: 'compose' | 'reply' | null = null;
let currentTweetContext: any = null;

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
      if (!box.parentElement?.querySelector('.kotodama-ai-button')) {
        injectAIButton(box as HTMLElement);
      }
    });
  });
}

function injectAIButton(composeBox: HTMLElement) {
  const button = document.createElement('button');
  button.className = 'kotodama-ai-button';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="currentColor"/>
    </svg>
  `;
  button.title = 'Compose with AI';

  // Style the button
  Object.assign(button.style, {
    position: 'absolute',
    right: '10px',
    top: '10px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: '#1d9bf0',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1000',
    transition: 'all 0.2s ease',
  });

  button.addEventListener('mouseenter', () => {
    button.style.background = '#1a8cd8';
    button.style.transform = 'scale(1.05)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = '#1d9bf0';
    button.style.transform = 'scale(1)';
  });

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleAIButtonClick(composeBox);
  });

  // Position the button relative to the compose box
  const container =
    composeBox.closest<HTMLElement>('[data-testid="tweetTextarea_0_wrapper"]') ||
    composeBox.parentElement;

  if (container instanceof HTMLElement) {
    container.style.position = 'relative';
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
    panelIframe.style.transform = 'translateX(0)';
    return;
  }

  // Create iframe for the panel
  panelIframe = document.createElement('iframe');
  panelIframe.src = chrome.runtime.getURL('src/panel/index.html');
  panelIframe.id = 'kotodama-panel';

  Object.assign(panelIframe.style, {
    position: 'fixed',
    top: '0',
    right: '0',
    width: '400px',
    height: '100vh',
    border: 'none',
    zIndex: '999999',
    boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
    transform: 'translateX(100%)',
    transition: 'transform 0.3s ease',
  });

  document.body.appendChild(panelIframe);

  // Animate in
  setTimeout(() => {
    if (panelIframe) {
      panelIframe.style.transform = 'translateX(0)';
    }
  }, 10);

  // Send context to panel once loaded
  panelIframe.addEventListener('load', () => {
    sendContextToPanel();
  });
}

function togglePanel() {
  if (!panelIframe) return;

  const isOpen = panelIframe.style.transform === 'translateX(0px)';

  if (isOpen) {
    panelIframe.style.transform = 'translateX(100%)';
  } else {
    panelIframe.style.transform = 'translateX(0)';
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

// Listen for messages from the panel
window.addEventListener('message', async (event) => {
  if (event.data.type === 'insert-tweet') {
    insertTweetContent(event.data.content);
  } else if (event.data.type === 'close-panel') {
    if (panelIframe) {
      panelIframe.style.transform = 'translateX(100%)';
    }
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
      if (panelIframe) panelIframe.style.transform = 'translateX(100%)';
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
