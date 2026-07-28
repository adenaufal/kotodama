import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Panel from '../panel/Panel';
import styles from '../panel/index.css?inline';
import { applyTheme } from '../utils/theme';
import type { TweetContext, TweetImage, ThreadEntry, UserSettings } from '../types';
import { sanitizeTweetContext } from '../utils/sanitize';

interface ButtonPosition {
    top: number;
    left: number;
}

// --- Helper Functions ---

const TWEET_ARTICLE_SELECTOR = 'article[data-testid="tweet"]';

/**
 * X serves the same media at several sizes. We only want real tweet photos
 * (pbs.twimg.com/media/...) — avatars, emoji and link-card thumbnails live on
 * other paths and would just burn vision tokens. Returns null for anything else.
 */
function normalizeTweetImageUrl(src: string | null): string | null {
    if (!src) return null;
    let url: URL;
    try {
        url = new URL(src, location.href);
    } catch {
        return null;
    }
    if (url.protocol !== 'https:' || url.hostname !== 'pbs.twimg.com') return null;
    if (!url.pathname.includes('/media/')) return null;

    // Legacy form: /media/<id>.jpg:large  →  :small. Modern form: ?name=small.
    if (/:[a-z]+$/.test(url.pathname)) {
        url.pathname = url.pathname.replace(/:[a-z]+$/, ':small');
    } else {
        url.searchParams.set('name', 'small');
    }
    return url.toString();
}

/**
 * A quote-tweet is rendered INSIDE the outer article as a div[role="link"]
 * wrapper, not as a nested <article> — so a plain querySelector for tweetText
 * or tweetPhoto can return the QUOTED post's content and hand it to the model
 * as the outer author's words. Anything under such a wrapper is the quoted post.
 * ponytail: wrapper shape taken from other X scrapers, NOT verified against a
 * live x.com DOM from this environment (no browser available). It is a no-op
 * when the wrapper is absent; if X renames it, widen this selector.
 */
const QUOTE_WRAPPER_SELECTOR = '[role="link"][tabindex], [data-testid="quoteTweet"]';

function quoteWrapperOf(node: Element, tweetElement: HTMLElement): HTMLElement | null {
    const wrapper = node.closest<HTMLElement>(QUOTE_WRAPPER_SELECTOR);
    return wrapper && wrapper !== tweetElement && tweetElement.contains(wrapper) ? wrapper : null;
}

function extractImages(tweetElement: HTMLElement): TweetImage[] {
    const images: TweetImage[] = [];
    tweetElement.querySelectorAll('[data-testid="tweetPhoto"] img').forEach((img) => {
        if (quoteWrapperOf(img, tweetElement)) return; // belongs to the quoted post
        const url = normalizeTweetImageUrl(img.getAttribute('src'));
        if (!url) return;
        const alt = img.getAttribute('alt')?.trim();
        images.push(alt && alt !== 'Image' ? { url, alt } : { url });
    });
    return images;
}

function extractAuthor(tweetElement: HTMLElement): { username: string; displayName: string } {
    const nameBlock = tweetElement.querySelector('[data-testid="User-Name"]');
    const link = nameBlock?.querySelector('a[role="link"][href^="/"]')
        ?? tweetElement.querySelector('a[role="link"][href^="/"]');
    const username = link?.getAttribute('href')?.match(/^\/([^\/?#]+)/)?.[1] || '';
    const displayName = nameBlock?.querySelector('a[role="link"] span')?.textContent?.trim() || '';
    return { username, displayName };
}

/**
 * X renders emoji inside tweetText as <img alt="🔥">, and textContent of an
 * image element is ''. So walk it: text nodes plus img alt, in document order.
 */
function readNodeText(node: Node): string {
    let out = '';
    node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) out += child.nodeValue ?? '';
        else if (child.nodeName === 'IMG') out += (child as HTMLImageElement).getAttribute('alt') ?? '';
        else if (child.nodeType === Node.ELEMENT_NODE) out += readNodeText(child);
    });
    return out;
}

function extractTweetText(tweetElement: HTMLElement): string {
    const own = Array.from(tweetElement.querySelectorAll('[data-testid="tweetText"]'))
        .find((node) => !quoteWrapperOf(node, tweetElement));
    return own ? readNodeText(own).trim() : '';
}

/** The quoted post, labelled — never merged into the outer author's words. */
function extractQuotedTweet(tweetElement: HTMLElement): string {
    const quoted = Array.from(tweetElement.querySelectorAll('[data-testid="tweetText"]'))
        .map((node) => ({ node, wrapper: quoteWrapperOf(node, tweetElement) }))
        .find((c) => c.wrapper !== null);
    if (!quoted?.wrapper) return '';

    const text = readNodeText(quoted.node).trim();
    if (!text) return '';
    const { username } = extractAuthor(quoted.wrapper);
    return `\n\n[quoting ${username ? `@${username}` : 'another post'}: "${text}"]`;
}

/**
 * When the composer opens as a modal, the background timeline is still in the
 * DOM and precedes the modal in document order — scope lookups to the dialog so
 * unrelated tweets don't leak into the context.
 */
function conversationScope(node: Element): ParentNode {
    return node.closest('[role="dialog"]') ?? document;
}

/**
 * The tweet being replied to is the article immediately BEFORE the compose box
 * in document order: X renders the conversation as a list of articles and drops
 * the reply composer right after the tweet it belongs to (both inline on a
 * status page and inside the reply modal). Taking articles[0] instead grabs
 * whichever article renders first, which on a thread is the wrong tweet.
 */
function findTargetTweetArticle(): HTMLElement | null {
    const compose = findComposeEditable();
    const scope = compose ? conversationScope(compose) : document;
    const articles = Array.from(scope.querySelectorAll<HTMLElement>(TWEET_ARTICLE_SELECTOR));
    if (articles.length === 0) return null;

    if (compose) {
        // Composer nested inside the tweet card itself — that card is the target.
        const own = compose.closest<HTMLElement>(TWEET_ARTICLE_SELECTOR);
        if (own) return own;

        const preceding = articles.filter(
            (a) => (compose.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_PRECEDING) !== 0
        );
        if (preceding.length > 0) return preceding[preceding.length - 1];
    }

    // No composer to anchor against (logged out, or it hasn't mounted yet): the
    // last article is some unrelated reply near the bottom of the loaded list, and
    // a confident wrong pick means replying to a stranger. Admit we don't know —
    // the panel already has a "no tweet in view" empty state.
    // ponytail: on /status/ pages the focal tweet could be found by matching the
    // status id in location.pathname against each article's permalink. Add that if
    // "no tweet in view" starts firing on pages where the tweet is plainly there.
    return null;
}

/**
 * Tweets above the target, oldest first.
 * ponytail: capped at the 10 most recent preceding tweets to bound prompt size
 * (and vision cost). Raise it if replies to long threads start losing the point
 * the conversation actually started from.
 */
const THREAD_CONTEXT_LIMIT = 10;

function extractThread(targetArticle: HTMLElement): ThreadEntry[] {
    const entries: ThreadEntry[] = [];
    conversationScope(targetArticle).querySelectorAll<HTMLElement>(TWEET_ARTICLE_SELECTOR).forEach((article) => {
        if ((targetArticle.compareDocumentPosition(article) & Node.DOCUMENT_POSITION_PRECEDING) === 0) return;
        const { username, displayName } = extractAuthor(article);
        const text = extractTweetText(article);
        if (!username || !text) return;
        entries.push({ username, displayName, text });
    });
    return entries.slice(-THREAD_CONTEXT_LIMIT);
}

function extractTweetContextFromPage(tweetElement: HTMLElement): TweetContext | null {
    try {
        const text = extractTweetText(tweetElement) + extractQuotedTweet(tweetElement);
        const { username, displayName } = extractAuthor(tweetElement);
        const images = extractImages(tweetElement);

        const timeElement = tweetElement.querySelector('time');
        const timestamp = timeElement?.getAttribute('datetime') || undefined;

        const metrics: TweetContext['metrics'] = {};
        const parseMetric = (testId: string): number | undefined => {
            const el = tweetElement.querySelector(`[data-testid="${testId}"]`);
            if (!el) return undefined;
            const label = el.getAttribute('aria-label') || el.textContent || '';
            const match = label.match(/([\d,.]+[KMB]?)/);
            if (match) {
                let valStr = match[1].replace(/,/g, '');
                let multiplier = 1;
                if (valStr.endsWith('K')) { multiplier = 1000; valStr = valStr.slice(0, -1); }
                else if (valStr.endsWith('M')) { multiplier = 1000000; valStr = valStr.slice(0, -1); }
                else if (valStr.endsWith('B')) { multiplier = 1000000000; valStr = valStr.slice(0, -1); }
                return parseFloat(valStr) * multiplier;
            }
            return undefined;
        };

        metrics.replies = parseMetric('reply');
        metrics.retweets = parseMetric('retweet');
        metrics.likes = parseMetric('like');

        if (!username) return null;
        if (!text && images.length === 0) return null;

        // Trust boundary: everything above is attacker-controlled page text that
        // ends up inside a model prompt. Sanitize before it leaves this function.
        return sanitizeTweetContext({
            text,
            username,
            displayName,
            timestamp,
            images: images.length > 0 ? images : undefined,
            metrics,
            thread: extractThread(tweetElement)
        });
    } catch (error) {
        console.error('[Kotodama] Error extracting tweet context:', error);
        return null;
    }
}

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
            if (activeElement.matches(selector)) return activeElement;
            const closest = activeElement.closest(selector) as HTMLElement | null;
            if (closest) return closest;
        }
    }

    for (const selector of selectors) {
        const queried = document.querySelector<HTMLElement>(selector);
        if (queried) return queried;
    }
    return null;
}

function insertTweetContent(content: string) {
    const composeEditable = findComposeEditable();
    if (!composeEditable) {
        console.error('[Kotodama] Could not find tweet compose box');
        return;
    }

    // Select the whole box, then let execCommand replace it. This is one path on
    // purpose. The previous version fired a synthetic ClipboardEvent paste, then
    // re-checked textContent inside requestAnimationFrame and ran execCommand as a
    // "fallback" when the two differed -- but rAF fires before React commits the
    // paste, so the check always saw stale text and inserted a SECOND copy. Verified
    // against x.com: select-all + insertText replaces cleanly and React picks up the
    // resulting beforeinput/input, which is what enables the Reply button.
    composeEditable.focus();

    const selection = window.getSelection();
    if (selection) {
        const range = document.createRange();
        range.selectNodeContents(composeEditable);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    // ponytail: execCommand is deprecated but is still the only thing that drives a
    // React-controlled contenteditable without owning its internal state. Revisit if
    // Chrome drops it -- the replacement would be per-site and much larger.
    if (!document.execCommand('insertText', false, content)) {
        composeEditable.textContent = content;
        composeEditable.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Caret to the end so the user can keep typing.
    const after = window.getSelection();
    if (after) {
        const endRange = document.createRange();
        endRange.selectNodeContents(composeEditable);
        endRange.collapse(false);
        after.removeAllRanges();
        after.addRange(endRange);
    }
}

// --- Components ---

const FloatingButton: React.FC<{
    onClick: () => void;
    position: ButtonPosition;
    onDragEnd: (pos: ButtonPosition) => void;
}> = ({ onClick, position, onDragEnd }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [currentPos, setCurrentPos] = useState(position);
    const DRAG_THRESHOLD = 5;

    useEffect(() => {
        setCurrentPos(position);
    }, [position]);

    const onMouseDown = (e: React.MouseEvent) => {
        // Prevent default to avoid text selection
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const startTop = currentPos.top;
        const startLeft = currentPos.left;
        let hasMoved = false;

        const onMouseMove = (ev: MouseEvent) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;

            if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
                hasMoved = true;
                setIsDragging(true);
            }

            setCurrentPos({
                top: startTop + dy,
                left: startLeft + dx
            });
        };

        const onMouseUp = (ev: MouseEvent) => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (hasMoved) {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                onDragEnd({
                    top: startTop + dy,
                    left: startLeft + dx
                });

                // Timeout to prevent click from firing immediately after drag
                setTimeout(() => setIsDragging(false), 50);
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <button
            onClick={(e) => {
                if (isDragging) {
                    e.stopPropagation();
                    return;
                }
                onClick();
            }}
            onMouseDown={onMouseDown}
            className={`kotodama-floating-button ${isDragging ? 'cursor-grabbing' : 'cursor-move'}`}
            style={{
                position: 'fixed',
                top: `${currentPos.top}px`,
                left: `${currentPos.left}px`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                padding: '0',
                borderRadius: '50%',
                border: 'none',
                // Inverted against the panel's own surface, so it stays legible in both themes.
                background: 'var(--koto-ink)',
                color: 'var(--koto-canvas)',
                boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 9999,
                transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
                transform: isDragging ? 'scale(1.05)' : 'scale(1)',
                outline: 'none',
                pointerEvents: 'auto',
            }}
            title="Reply with Kotodama"
        >
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="currentColor" />
            </svg>
        </button>
    );
};

// Main App Component

const App = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [context, setContext] = useState<{ type: 'reply' | null, tweetContext?: TweetContext }>({ type: null });
    const [buttonPos, setButtonPos] = useState<ButtonPosition>({ top: 80, left: window.innerWidth - 80 });
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved position
    useEffect(() => {
        chrome.storage.local.get(['buttonPosition'], (result) => {
            if (result.buttonPosition) {
                setButtonPos(result.buttonPosition as ButtonPosition);
            }
            setIsLoaded(true);
        });
    }, []);

    const savePosition = (pos: ButtonPosition) => {
        setButtonPos(pos);
        chrome.storage.local.set({ buttonPosition: pos });
    };

    // Reply-only. If we can't read a tweet to reply to, type stays null and the
    // panel renders its own empty state — never pretend a bare page is a reply.
    const detectContext = (): { type: 'reply' | null, tweetContext?: TweetContext } => {
        const composeBox = document.querySelector('[data-testid="tweetTextarea_0"]');
        const placeholder = composeBox?.getAttribute('data-text') || composeBox?.getAttribute('placeholder') || '';

        const isReply =
            !!document.querySelector('[data-testid="inlineReplyingTo"], [aria-label*="Replying to"]') ||
            placeholder.toLowerCase().includes('reply') ||
            (window.location.pathname.includes('/status/') && !!composeBox);

        if (!isReply) return { type: null };

        const target = findTargetTweetArticle();
        const tweetContext = target ? extractTweetContextFromPage(target) : null;
        return tweetContext ? { type: 'reply', tweetContext } : { type: null };
    };

    const handleButtonClick = () => {
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        setContext(detectContext());
        setIsOpen(true);
    };

    if (!isLoaded) return null;

    return (
        <>
            <FloatingButton
                onClick={handleButtonClick}
                position={buttonPos}
                onDragEnd={savePosition}
            />

            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    right: '20px',
                    zIndex: 999999,
                    width: 'min(450px, calc(100vw - 40px))',
                    height: 'min(850px, calc(100vh - 120px))',
                    pointerEvents: 'auto',
                }}>
                    <Panel
                        initialContext={context}
                        onClose={() => setIsOpen(false)}
                        onInsert={insertTweetContent}
                    />
                </div>
            )}
        </>
    );
};

// --- Initialization ---

// Create host element
const HOST_ID = 'kotodama-host';
let host = document.getElementById(HOST_ID);

if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    host.style.position = 'absolute';
    host.style.top = '0';
    host.style.left = '0';
    host.style.width = '0';
    host.style.height = '0';
    host.style.zIndex = '2147483647'; // Max z-index
    host.style.pointerEvents = 'none'; // Let clicks pass through empty areas
    document.body.appendChild(host);

    // Attach Shadow DOM
    const shadow = host.attachShadow({ mode: 'open' });

    // Inject Styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    shadow.appendChild(styleSheet);

    // Theme. `user_settings.ui.theme` isn't encrypted, so read storage directly
    // rather than waking the service worker just to paint. onChanged keeps
    // already-open tabs in sync when the toggle flips in settings.
    const themeHost = host;
    const syncTheme = () => {
        chrome.storage.local.get('user_settings', (stored) => {
            applyTheme((stored.user_settings as UserSettings | undefined)?.ui?.theme, themeHost);
        });
    };
    syncTheme();
    chrome.storage.onChanged.addListener(syncTheme);

    // Mount React Root
    const root = createRoot(shadow);
    root.render(<App />);

    console.log('[Kotodama] Shadow DOM injected');
}
