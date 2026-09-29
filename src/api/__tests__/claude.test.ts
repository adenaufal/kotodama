import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateWithClaude } from '../claude';
import type { BrandVoice, GenerateRequest } from '../../types';

const request = {
  prompt: 'Reply briefly',
  brandVoiceId: 'voice-1',
  replyContext: { username: 'author', text: 'A tweet' },
} as GenerateRequest;

const brandVoice = {
  id: 'voice-1',
  name: 'Test voice',
  description: '',
  guidelines: '',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  exampleTweets: [],
  toneAttributes: {
    formality: 50,
    humor: 50,
    technicality: 50,
    empathy: 50,
    energy: 50,
    authenticity: 50,
  },
} as BrandVoice;

function successResponse() {
  return new Response(
    JSON.stringify({ content: [{ text: 'A concise reply.' }], usage: { input_tokens: 10, output_tokens: 5 } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('generateWithClaude sampling parameters', () => {
  it('omits temperature for models that require default sampling', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(successResponse());
    vi.stubGlobal('fetch', fetchMock);

    await generateWithClaude(request, 'claude-key', brandVoice, undefined, 'claude-sonnet-5');

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.model).toBe('claude-sonnet-5');
    expect(body).not.toHaveProperty('temperature');
  });

  it('uses temperature on older models and retries without it when rejected', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'temperature parameter is not supported' } }), {
          status: 400,
        })
      )
      .mockResolvedValueOnce(successResponse())
      .mockResolvedValueOnce(successResponse());
    vi.stubGlobal('fetch', fetchMock);
    const model = 'claude-sonnet-4-sampling-regression';

    await generateWithClaude(request, 'claude-key', brandVoice, undefined, model);
    await generateWithClaude(request, 'claude-key', brandVoice, undefined, model);

    const bodies = fetchMock.mock.calls.map((call) => JSON.parse(String(call[1]?.body)));
    expect(bodies[0]).toMatchObject({ model, temperature: 0.7 });
    expect(bodies[1]).not.toHaveProperty('temperature');
    expect(bodies[2]).not.toHaveProperty('temperature');
  });
});
