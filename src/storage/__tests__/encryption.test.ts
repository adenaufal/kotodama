import { beforeEach, describe, expect, it } from 'vitest';
import {
  createCredentialVault,
  getUnlockedCredentials,
  isCredentialVaultUnlocked,
  lockCredentialVault,
  unlockCredentialVault,
} from '../encryption';

const MASTER_PASSPHRASE = 'a strong master passphrase';
const SAMPLE_KEY = 'sk-test-1234567890abcdef';

beforeEach(async () => {
  await lockCredentialVault();
});

describe('credential vault encryption', () => {
  it('encrypts credentials with a fresh salt and IV and unlocks them', async () => {
    const credentials = { apiKeys: { openai: SAMPLE_KEY } };
    const first = await createCredentialVault(MASTER_PASSPHRASE, credentials);
    const second = await createCredentialVault(MASTER_PASSPHRASE, credentials);

    expect(first).not.toEqual(second);
    expect(first.ciphertext).not.toContain(SAMPLE_KEY);
    expect(first.providers).toEqual(['openai']);
    await lockCredentialVault();
    await unlockCredentialVault(MASTER_PASSPHRASE, first);
    expect(await getUnlockedCredentials(first)).toEqual(credentials);
    expect(await isCredentialVaultUnlocked()).toBe(true);
  });

  it('requires a passphrase after locking and rejects an incorrect passphrase', async () => {
    const vault = await createCredentialVault(MASTER_PASSPHRASE, {
      apiKeys: { openai: SAMPLE_KEY },
    });
    await lockCredentialVault();

    await expect(getUnlockedCredentials(vault)).rejects.toThrow('Credential vault is locked');
    await expect(unlockCredentialVault('incorrect passphrase', vault)).rejects.toThrow(
      'Could not unlock the credential vault',
    );
    expect(await isCredentialVaultUnlocked()).toBe(false);

    await expect(unlockCredentialVault(MASTER_PASSPHRASE, vault)).resolves.toMatchObject({
      apiKeys: { openai: SAMPLE_KEY },
    });
  });

  it('keeps the passphrase out of browser storage', async () => {
    await createCredentialVault(MASTER_PASSPHRASE, { apiKeys: { openai: SAMPLE_KEY } });

    const sessionState = await chrome.storage.session.get(null);
    const localState = await chrome.storage.local.get(['user_settings', 'credential_vault']);
    expect(JSON.stringify(sessionState)).not.toContain(MASTER_PASSPHRASE);
    expect(JSON.stringify(localState)).not.toContain(MASTER_PASSPHRASE);
    expect(JSON.stringify(localState)).not.toContain(SAMPLE_KEY);
  });
});
