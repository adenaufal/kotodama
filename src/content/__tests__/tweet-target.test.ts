import { describe, expect, it, vi } from 'vitest';
import { getEarlierTweetArticles, selectTargetTweetArticle } from '../tweet-target';

const documentOrder = new WeakMap<Node, number>();

function positionedElement(order: number): HTMLElement {
  const element = {
    compareDocumentPosition(other: Node) {
      const otherOrder = documentOrder.get(other);
      if (otherOrder === undefined || otherOrder === order) return 0;
      return otherOrder < order ? 2 : 4;
    },
    closest: vi.fn(() => null),
  } as unknown as HTMLElement;
  documentOrder.set(element, order);
  return element;
}

function articleScope(articles: HTMLElement[]): ParentNode {
  return {
    querySelectorAll: vi.fn(() => articles),
  } as unknown as ParentNode;
}

describe('tweet target selection', () => {
  it('scopes a modal reply to its dialog instead of the background timeline', () => {
    const backgroundTweet = positionedElement(1);
    const earlierModalTweet = positionedElement(10);
    const targetTweet = positionedElement(20);
    const dialog = articleScope([earlierModalTweet, targetTweet]);
    const compose = positionedElement(30);
    vi.mocked(compose.closest).mockImplementation((selector: string) =>
      selector === '[role="dialog"]' ? (dialog as Element) : null
    );
    vi.mocked(targetTweet.closest).mockImplementation((selector: string) =>
      selector === '[role="dialog"]' ? (dialog as Element) : null
    );
    const root = articleScope([backgroundTweet, earlierModalTweet, targetTweet]);

    expect(selectTargetTweetArticle(compose, root)).toBe(targetTweet);
    expect(getEarlierTweetArticles(targetTweet, root)).toEqual([earlierModalTweet]);
  });

  it('uses the tweet immediately before the inline composer on a permalink page', () => {
    const originalTweet = positionedElement(1);
    const replyBeingAnswered = positionedElement(2);
    const compose = positionedElement(3);
    const root = articleScope([originalTweet, replyBeingAnswered]);

    expect(selectTargetTweetArticle(compose, root)).toBe(replyBeingAnswered);
  });

  it('keeps only tweets above a reply target in the middle of a thread', () => {
    const thread = [0, 1, 2, 3, 4].map(positionedElement);
    const target = thread[3];
    const compose = positionedElement(3.5);
    const root = articleScope(thread);

    expect(selectTargetTweetArticle(compose, root)).toBe(target);
    expect(getEarlierTweetArticles(target, root)).toEqual(thread.slice(0, 3));
  });

  it('returns no target when the composer is absent', () => {
    const root = articleScope([positionedElement(1), positionedElement(2)]);

    expect(selectTargetTweetArticle(null, root)).toBeNull();
  });
});
