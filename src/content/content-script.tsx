import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Panel from '../panel/Panel';
import styles from '../panel/index.css?inline';

// Types
interface TweetContext {
    text: string;
    username: string;
    displayName?: string;
    timestamp?: string;
    images?: string[];
    metrics?: {
        replies?: number;
        retweets?: number;
        likes?: number;
    };
    isThread?: boolean;
}

interface ButtonPosition {
    top: number;
    left: number;
}

// --- Helper Functions (Ported from content-script.ts) ---

async function extractTweetContextFromPage(tweetElement: HTMLElement): Promise<TweetContext | null> {
    try {
        const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]');
        const text = tweetTextElement?.textContent?.trim() || '';

        const authorLink = tweetElement.querySelector('a[role="link"][href*="/"]');
        let username = '';
        let displayName = '';

        if (authorLink) {
            const href = authorLink.getAttribute('href') || '';
            const match = href.match(/^\/([^\/]+)/);
            if (match) {
                username = match[1];
            }
            displayName = authorLink.textContent?.trim() || '';
            displayName = displayName.replace(/@\w+/, '').trim();
        }

        const timeElement = tweetElement.querySelector('time');
        const timestamp = timeElement?.getAttribute('datetime') || undefined;

        const imageElements = tweetElement.querySelectorAll('[data-testid="tweetPhoto"] img');
        const images: string[] = [];
        imageElements.forEach((img) => {
            const alt = img.getAttribute('alt');
            if (alt && alt !== 'Image') {
                images.push(alt);
            }
        });

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

        if (!text && images.length === 0) {
            if (images.length === 0) return null;
        }

        if (!username) return null;

        return {
            text,
            username,
            displayName,
            timestamp,
            images: images.length > 0 ? images : undefined,
            metrics
        };
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

    composeEditable.focus();

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
        } catch (error) {
            console.warn('[Kotodama] Clipboard paste simulation failed:', error);
        }
    }

    const normalize = (value: string) => value.replace(/\s+$/g, '').replace(/\r\n/g, '\n');

    const applyFallbackInsertion = () => {
        try {
            composeEditable.dispatchEvent(new InputEvent('beforeinput', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertReplacementText',
                data: content,
            }));
        } catch (error) { }

        try {
            const inserted = document.execCommand('insertText', false, content);
            if (!inserted) throw new Error('execCommand returned false');
        } catch (error) {
            composeEditable.textContent = content;
        }
    };

    const finalizeInsertion = () => {
        const currentText = normalize(composeEditable.textContent || '');
        const expectedText = normalize(content);

        if (currentText !== expectedText) {
            applyFallbackInsertion();
        }

        composeEditable.setAttribute('data-text', 'true');
        composeEditable.dispatchEvent(new Event('input', { bubbles: true }));
        composeEditable.dispatchEvent(new Event('change', { bubbles: true }));

        const finalSelection = window.getSelection();
        if (finalSelection) {
            const finalRange = document.createRange();
            finalRange.selectNodeContents(composeEditable);
            finalRange.collapse(false);
            finalSelection.removeAllRanges();
            finalSelection.addRange(finalRange);
        }

        composeEditable.blur();
        setTimeout(() => composeEditable.focus(), 50);
    };

    if (pasteHandled) {
        requestAnimationFrame(finalizeInsertion);
    } else {
        finalizeInsertion();
    }
}

// --- Components ---

const FloatingButton: React.FC<{
    onClick: (e: React.MouseEvent) => void;
    position: ButtonPosition;
    onDragEnd: (pos: ButtonPosition) => void;
}> = ({ onClick, position, onDragEnd }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [currentPos, setCurrentPos] = useState(position);
    const dragStart = useRef<{ x: number, y: number, initialTop: number, initialLeft: number } | null>(null);
    const DRAG_THRESHOLD = 5;

    useEffect(() => {
        setCurrentPos(position);
    }, [position]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(false);
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            initialTop: currentPos.top,
            initialLeft: currentPos.left
        };

        const handleMouseMove = (ev: MouseEvent) => {
            if (!dragStart.current) return;

            const dx = ev.clientX - dragStart.current.x;
            const dy = ev.clientY - dragStart.current.y;

            if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
                setIsDragging(true);
            }

            setCurrentPos({
                top: dragStart.current.initialTop + dy,
                left: dragStart.current.initialLeft + dx
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            if (dragStart.current) {
                // Save the final position
                // We use the state currentPos which has the latest value from mousemove
                // But we need to call onDragEnd with it
                // Since event listeners close over state, we need to be careful.
                // Actually handleMouseMove updates state, so we can't easily access the *very latest* state inside this closure without a ref or accessing the state setter's callback.
                // But we can just recalculate it or trust that React updates are fast enough? No.
                // Better: Use the ref values + dx/dy.
                // Or simpler: Just update the parent in onDragEnd.
            }
            dragStart.current = null;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Effect to call onDragEnd when dragging stops? 
    // Easier: Update parent on mouse up inside the event handler using the latest calculated position.
    // Let's rewrite the mouse handlers to be self-contained for position calculation.

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
                onClick(e);
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
                background: '#18181b', // Zinc-900
                color: '#ffffff',
                boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 9999,
                transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
                transform: isDragging ? 'scale(1.05)' : 'scale(1)',
                outline: 'none',
                pointerEvents: 'auto',
            }}
            title="Compose with Kotodama"
        >
            <span style={{ display: 'inline-flex', filter: 'brightness(0) invert(1)' }}>
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="currentColor" />
                </svg>
            </span>
        </button>
    );
};

// Main App Component

const App = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [context, setContext] = useState<{ type: 'compose' | 'reply' | null, tweetContext?: TweetContext }>({ type: null });
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

    const detectContext = async () => {
        console.log('[Kotodama] Detecting context...');

        // Strategy 1: Check for "Replying to"
        const replyingToSelectors = [
            '[data-testid="inlineReplyingTo"]',
            '[aria-label*="Replying to"]',
        ];
        let isReply = false;
        for (const selector of replyingToSelectors) {
            if (document.querySelector(selector)) {
                isReply = true;
                break;
            }
        }

        // Strategy 2: Compose box placeholder
        const composeBox = document.querySelector('[data-testid="tweetTextarea_0"]');
        if (composeBox) {
            const placeholder = composeBox.getAttribute('data-text') || composeBox.getAttribute('placeholder') || '';
            if (placeholder.toLowerCase().includes('reply')) isReply = true;
        }

        // Strategy 3: Check URL for /status/
        if (window.location.pathname.includes('/status/') && composeBox) {
            // If we are on a status page and there is a compose box, it's likely a reply
            // unless it's a quote tweet or new tweet but those usually have modals
            isReply = true;
        }

        let tweetContext = null;
        if (isReply) {
            const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]');
            if (tweetArticles.length > 0) {
                // Simplistic: First article that isn't the compose box container
                let targetTweet = tweetArticles[0] as HTMLElement;
                // Iterate to find correct one if needed
                tweetContext = await extractTweetContextFromPage(targetTweet);
            }
        }

        return {
            type: isReply ? 'reply' : 'compose' as 'reply' | 'compose',
            tweetContext: tweetContext || undefined
        };
    };

    const handleButtonClick = async (e: React.MouseEvent) => {
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        const newContext = await detectContext();
        setContext(newContext);
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
                    top: '80px', // Default, logic for responsive positioning can be added here or in Panel
                    right: '20px',
                    zIndex: 999999,
                    // We can reuse the responsive sizing logic from old script here or in Panel.
                    // For now let's pass it to Panel or handle it via CSS/Container.
                    // The old script calculated width/height in JS.
                    // Let's use simplified CSS-in-JS here to mimic it.
                    width: 'min(450px, calc(100vw - 40px))',
                    height: 'min(850px, calc(100vh - 120px))',
                    pointerEvents: 'auto',
                }}>
                    <Panel
                        initialContext={context}
                        onClose={() => setIsOpen(false)}
                        onInsert={(content) => {
                            insertTweetContent(content);
                            // Optional: keep open or close? Old behavior kept it open?
                            // insertTweetContent logic had a setTimeout to keep panel open.
                            // We'll leave it open for now.
                        }}
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

    // Mount React Root
    const root = createRoot(shadow);
    root.render(<App />);

    console.log('[Kotodama] Shadow DOM injected');
}
