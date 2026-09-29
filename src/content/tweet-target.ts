const TWEET_ARTICLE_SELECTOR = 'article[data-testid="tweet"]';
const DOCUMENT_POSITION_PRECEDING = 2;

/**
 * Keep tweet lookup inside a reply dialog when one is open. X leaves the
 * background timeline in the document while rendering modal conversations.
 */
export function conversationScope(node: Element, root: ParentNode): ParentNode {
  return node.closest('[role="dialog"]') ?? root;
}

/** Find the tweet immediately before the reply composer in its conversation. */
export function selectTargetTweetArticle(
  compose: HTMLElement | null,
  root: ParentNode
): HTMLElement | null {
  const scope = compose ? conversationScope(compose, root) : root;
  const articles = Array.from(scope.querySelectorAll<HTMLElement>(TWEET_ARTICLE_SELECTOR));
  if (articles.length === 0) return null;

  if (compose) {
    // Composer nested inside the tweet card itself — that card is the target.
    const own = compose.closest<HTMLElement>(TWEET_ARTICLE_SELECTOR);
    if (own) return own;

    const preceding = articles.filter(
      (article) => (compose.compareDocumentPosition(article) & DOCUMENT_POSITION_PRECEDING) !== 0
    );
    if (preceding.length > 0) return preceding[preceding.length - 1];
  }

  // No composer to anchor against: returning an arbitrary tweet could reply to
  // a stranger, so let the panel show its empty state.
  return null;
}

/** Tweets before the target, in document order. */
export function getEarlierTweetArticles(
  targetArticle: HTMLElement,
  root: ParentNode
): HTMLElement[] {
  const scope = conversationScope(targetArticle, root);
  return Array.from(scope.querySelectorAll<HTMLElement>(TWEET_ARTICLE_SELECTOR)).filter(
    (article) =>
      (targetArticle.compareDocumentPosition(article) & DOCUMENT_POSITION_PRECEDING) !== 0
  );
}
