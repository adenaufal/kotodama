import { describe, expect, it } from 'vitest';
import { INPUT_LIMITS, sanitizePrompt, sanitizeTweetContext } from '../sanitize';
import type { TweetContext } from '../../types';

describe('sanitizePrompt', () => {
  it('trims, removes control characters, and normalizes compatibility characters', () => {
    expect(sanitizePrompt('  Ｈｅｌｌｏ\0\u0001\nworld  ')).toBe('Hello\nworld');
  });

  it('limits a prompt to the requested length', () => {
    expect(sanitizePrompt('x'.repeat(INPUT_LIMITS.prompt + 5))).toHaveLength(INPUT_LIMITS.prompt);
  });
});

describe('sanitizeTweetContext', () => {
  it('sanitizes untrusted fields and drops image URLs outside Twitter media', () => {
    const context: TweetContext = {
      text: ` ${'t'.repeat(INPUT_LIMITS.tweetContextText)}\0tail `,
      username: '@bad name!with punctuation',
      displayName: '  Alice\u0001  ',
      timestamp: 'not a date',
      images: [
        { url: 'https://pbs.twimg.com/media/photo.jpg', alt: '  image\u0001 alt  ' },
        { url: 'https://attacker.example/media/payload.jpg', alt: 'ignored' },
      ],
      metrics: { likes: Number.POSITIVE_INFINITY, replies: -1, retweets: 2.4 },
      thread: [
        {
          username: '@thread user',
          displayName: '  Bob  ',
          text: `${'c'.repeat(INPUT_LIMITS.threadEntryText)}\0ignored`,
        },
      ],
    };

    expect(sanitizeTweetContext(context)).toEqual({
      text: 't'.repeat(INPUT_LIMITS.tweetContextText),
      username: 'badnamewithpunc',
      displayName: 'Alice',
      timestamp: undefined,
      images: [{ url: 'https://pbs.twimg.com/media/photo.jpg', alt: 'image alt' }],
      metrics: { likes: undefined, replies: undefined, retweets: 2 },
      thread: [
        {
          username: 'threaduser',
          displayName: 'Bob',
          text: 'c'.repeat(INPUT_LIMITS.threadEntryText),
        },
      ],
    });
  });
});
