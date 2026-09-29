import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BrandVoice, GenerateRequest } from '../../types';
import { generateWithOpenAI } from '../openai';

const API_KEY = 'sk-test-private-api-key';
const PROMPT = 'private user prompt text';
const TWEET = 'private tweet context text';
const GENERATED_REPLY = 'private generated reply text';

const request: GenerateRequest = {
  prompt: PROMPT,
  brandVoiceId: 'private-voice-id',
  replyContext: { text: TWEET, username: 'private-user' },
};

const voice: BrandVoice = {
  id: 'private-voice-id',
  name: 'private brand name',
  description: 'private voice description',
  exampleTweets: ['private example tweet'],
  toneAttributes: { formality: 50, humor: 50, technicality: 50, empathy: 50, energy: 50, authenticity: 50 },
  createdAt: new Date(),
  updatedAt: new Date(),
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('OpenAI client logging', () => {
  it('does not log credentials, prompts, tweet text, or generated content', async () => {
    const response = {
      choices: [{ message: { content: GENERATED_REPLY }, finish_reason: 'stop' }],
      usage: { total_tokens: 42 },
    };
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(response), { status: 200 })));
    const spies = [
      vi.spyOn(console, 'log').mockImplementation(() => {}),
      vi.spyOn(console, 'info').mockImplementation(() => {}),
      vi.spyOn(console, 'debug').mockImplementation(() => {}),
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
      vi.spyOn(console, 'error').mockImplementation(() => {}),
    ];

    await expect(generateWithOpenAI(request, API_KEY, voice)).resolves.toMatchObject({
      content: GENERATED_REPLY,
      provider: 'openai',
    });

    const output = JSON.stringify(spies.flatMap((spy) => spy.mock.calls));
    for (const sensitiveValue of [API_KEY, PROMPT, TWEET, GENERATED_REPLY, 'private brand name']) {
      expect(output).not.toContain(sensitiveValue);
    }
  });
});
