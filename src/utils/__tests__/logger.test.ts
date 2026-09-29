import { describe, expect, it, vi } from 'vitest';
import { logger, redactLogValue } from '../logger';

describe('sensitive log redaction', () => {
  it('redacts arbitrary strings, errors, and objects before writing to the console', () => {
    const key = 'sk-secret-provider-key';
    const prompt = 'private tweet and user prompt';
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error(prompt, key, new Error(`provider echoed ${key}`), {
      rawContent: prompt,
      nested: { authorization: key },
    });

    const output = JSON.stringify(spy.mock.calls);
    expect(output).not.toContain(key);
    expect(output).not.toContain(prompt);
    expect(output).toContain('[redacted');
    expect(redactLogValue(new Error(prompt))).toBe('[redacted error]');
    spy.mockRestore();
  });
});
