import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeContext } from '../vision';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('analyzeContext image fallback', () => {
  it('summarizes the tweet as text when every image fetch fails', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('image unavailable'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: 'A person shares an update.' } }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await analyzeContext(
      {
        context: {
          username: 'author',
          text: 'An update with a broken image',
          images: [{ url: 'https://pbs.twimg.com/media/missing.jpg' }],
        },
      },
      'openai-key',
      'openai'
    );

    expect(result).toEqual({
      summary: 'A person shares an update.',
      provider: 'openai',
      visionFailed: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const requestBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(requestBody.messages[1].content).toContain('An update with a broken image');
    expect(requestBody.messages[1].content).toContain('could not be loaded');
    expect(typeof requestBody.messages[1].content).toBe('string');
  });
});
