import { describe, expect, it } from 'vitest';
import { decryptApiKey, encryptApiKey } from '../encryption';

const SAMPLE_KEY = 'sk-live-1234567890abcdef';
const DECRYPT_ERROR_MESSAGE = 'Failed to decrypt API key';

describe('encryptApiKey and decryptApiKey', () => {
  it('returns the original value after encryption and decryption', async () => {
    const encrypted = await encryptApiKey(SAMPLE_KEY);

    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toBe(SAMPLE_KEY);

    const decrypted = await decryptApiKey(encrypted);
    expect(decrypted).toBe(SAMPLE_KEY);
  });

  it('throws an error when provided malformed encrypted data', async () => {
    await expect(decryptApiKey('not-base64')).rejects.toThrowError(
      DECRYPT_ERROR_MESSAGE
    );
  });
});
