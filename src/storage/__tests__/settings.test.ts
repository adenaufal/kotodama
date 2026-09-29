import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAllData,
  getApiKey,
  getCredentialVaultStatus,
  getSettings,
  resetCredentialVault,
  saveSettings,
  unlockOrMigrateCredentialVault,
  updateVaultCredentials,
} from '../settings';
import { getUnlockedCredentials, lockCredentialVault } from '../encryption';
import type { UserSettings } from '../../types';

const SETTINGS_KEY = 'user_settings';
const VAULT_KEY = 'credential_vault';
const LEGACY_SALT_KEY = 'kotodama_user_salt';
const MASTER_PASSPHRASE = 'a strong master passphrase';
const LEGACY_SECRET = 'kotodama-extension-v2';
const ITERATIONS = 600_000;

const storedValues: Record<string, unknown> = {};
const sessionValues: Record<string, unknown> = {};
const globalWithChrome = globalThis as typeof globalThis & { chrome?: any };

function toBase64(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (value) => String.fromCharCode(value)).join(''));
}

async function makeLegacyFixture(values: Record<string, string>) {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const saltBase64 = toBase64(salt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(LEGACY_SECRET),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const encrypted: Record<string, string> = {};
  for (const [name, value] of Object.entries(values)) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(value),
    );
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    encrypted[name] = toBase64(combined);
  }
  return { saltBase64, encrypted };
}

function clearRecord(record: Record<string, unknown>): void {
  for (const key of Object.keys(record)) delete record[key];
}

beforeEach(async () => {
  clearRecord(storedValues);
  clearRecord(sessionValues);

  const local = {
    get: vi.fn((keyOrKeys: string | string[] | null, callback?: (result: Record<string, unknown>) => void) => {
      const keys = keyOrKeys === null ? Object.keys(storedValues) : typeof keyOrKeys === 'string' ? [keyOrKeys] : keyOrKeys;
      const result: Record<string, unknown> = {};
      for (const key of keys) if (key in storedValues) result[key] = storedValues[key];
      callback?.(result);
      return Promise.resolve(result);
    }),
    set: vi.fn((items: Record<string, unknown>, callback?: () => void) => {
      Object.assign(storedValues, items);
      callback?.();
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string | string[], callback?: () => void) => {
      for (const key of typeof keys === 'string' ? [keys] : keys) delete storedValues[key];
      callback?.();
      return Promise.resolve();
    }),
    clear: vi.fn((callback?: () => void) => {
      clearRecord(storedValues);
      callback?.();
      return Promise.resolve();
    }),
  };
  const session = {
    get: vi.fn((keyOrKeys: string | string[] | null) => {
      const keys = keyOrKeys === null ? Object.keys(sessionValues) : typeof keyOrKeys === 'string' ? [keyOrKeys] : keyOrKeys;
      const result: Record<string, unknown> = {};
      for (const key of keys) if (key in sessionValues) result[key] = sessionValues[key];
      return Promise.resolve(result);
    }),
    set: vi.fn((items: Record<string, unknown>) => {
      Object.assign(sessionValues, items);
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string | string[]) => {
      for (const key of typeof keys === 'string' ? [keys] : keys) delete sessionValues[key];
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      clearRecord(sessionValues);
      return Promise.resolve();
    }),
    setAccessLevel: vi.fn(() => Promise.resolve()),
  };

  globalWithChrome.chrome = {
    storage: { local, session },
    runtime: { id: 'test-extension-id', getManifest: () => ({}) },
  };
  await lockCredentialVault();
});

const makeSettings = (apiKeys: UserSettings['apiKeys'] = {}): UserSettings => ({
  apiKeys,
  analysisDepth: 20,
  ui: { buttonPosition: 'top-right', panelWidth: 400, theme: 'auto' },
  features: { autoAnalyze: true, rememberHistory: true, showToneControls: true },
});

describe('getSettings', () => {
  it('returns defaults and never returns stored credential values', async () => {
    const { saltBase64, encrypted } = await makeLegacyFixture({
      openai: 'legacy-openai-key',
      cookie: 'legacy-claude-cookie',
    });
    storedValues[LEGACY_SALT_KEY] = saltBase64;
    storedValues[SETTINGS_KEY] = {
      ...makeSettings({ openai: encrypted.openai }),
      claudeCookie: encrypted.cookie,
      defaultProvider: 'openai',
    };

    const settings = await getSettings();
    expect(settings.apiKeys).toEqual({});
    expect(settings.claudeCookie).toBeUndefined();
    expect(settings.defaultProvider).toBe('openai');
    expect(settings.analysisDepth).toBe(20);
  });
});

describe('credential vault migration', () => {
  it('migrates every legacy key and cookie before removing the old copy', async () => {
    const fixture = await makeLegacyFixture({
      openai: 'legacy-openai-key',
      gemini: 'legacy-gemini-key',
      cookie: 'legacy-claude-cookie',
    });
    storedValues[LEGACY_SALT_KEY] = fixture.saltBase64;
    storedValues[SETTINGS_KEY] = {
      ...makeSettings({ openai: fixture.encrypted.openai, gemini: fixture.encrypted.gemini }),
      claudeCookie: fixture.encrypted.cookie,
    };

    const status = await unlockOrMigrateCredentialVault(MASTER_PASSPHRASE);
    const storedSettings = storedValues[SETTINGS_KEY] as UserSettings & { claudeCookie?: string };
    const vault = storedValues[VAULT_KEY] as any;

    expect(status).toMatchObject({ hasVault: true, hasCredentials: true, needsMigration: false, unlocked: true });
    expect(status.providers).toEqual(['openai', 'gemini']);
    expect(storedSettings.apiKeys).toEqual({});
    expect(storedSettings.claudeCookie).toBeUndefined();
    expect(storedValues[LEGACY_SALT_KEY]).toBeUndefined();
    expect(await getUnlockedCredentials(vault)).toEqual({
      apiKeys: { openai: 'legacy-openai-key', gemini: 'legacy-gemini-key' },
      claudeCookie: 'legacy-claude-cookie',
    });
  });

  it('keeps all legacy bytes when any value fails to decrypt', async () => {
    const fixture = await makeLegacyFixture({ openai: 'legacy-openai-key' });
    const originalSettings = {
      ...makeSettings({ openai: fixture.encrypted.openai, gemini: 'corrupted-value' }),
    };
    storedValues[LEGACY_SALT_KEY] = fixture.saltBase64;
    storedValues[SETTINGS_KEY] = originalSettings;

    await expect(unlockOrMigrateCredentialVault(MASTER_PASSPHRASE)).rejects.toThrow(
      'original encrypted data was left unchanged',
    );
    expect(storedValues[SETTINGS_KEY]).toEqual(originalSettings);
    expect(storedValues[LEGACY_SALT_KEY]).toBe(fixture.saltBase64);
    expect(storedValues[VAULT_KEY]).toBeUndefined();
  });
});

describe('credential access and settings writes', () => {
  it('stores only ciphertext, requires unlock, and supports key removal', async () => {
    await unlockOrMigrateCredentialVault(MASTER_PASSPHRASE, {
      apiKeys: { openai: 'new-openai-key' },
    });
    expect(storedValues[SETTINGS_KEY]).toBeUndefined();
    expect(JSON.stringify(storedValues)).not.toContain('new-openai-key');
    await expect(getApiKey('openai')).resolves.toBe('new-openai-key');

    await lockCredentialVault();
    await expect(getApiKey('openai')).rejects.toThrow('Credential vault is locked');
    await unlockOrMigrateCredentialVault(MASTER_PASSPHRASE);
    await updateVaultCredentials({ apiKeys: { gemini: 'new-gemini-key' } }, ['openai']);

    const status = await getCredentialVaultStatus();
    expect(status.providers).toEqual(['gemini']);
    await expect(getApiKey('openai')).resolves.toBeUndefined();
    await expect(getApiKey('gemini')).resolves.toBe('new-gemini-key');
  });

  it('ignores credential values in public settings updates while preserving legacy ciphertext', async () => {
    const fixture = await makeLegacyFixture({ openai: 'legacy-openai-key' });
    storedValues[LEGACY_SALT_KEY] = fixture.saltBase64;
    storedValues[SETTINGS_KEY] = makeSettings({ openai: fixture.encrypted.openai });

    await saveSettings(makeSettings({ openai: 'untrusted-plaintext-key' }));

    const storedSettings = storedValues[SETTINGS_KEY] as UserSettings;
    expect(storedSettings.apiKeys.openai).toBe(fixture.encrypted.openai);
    expect(JSON.stringify(storedSettings)).not.toContain('untrusted-plaintext-key');
    expect((await getSettings()).apiKeys).toEqual({});
  });

  it('clears the session key when clearing all data', async () => {
    await unlockOrMigrateCredentialVault(MASTER_PASSPHRASE, {
      apiKeys: { openai: 'new-openai-key' },
    });
    await clearAllData();

    expect(storedValues).toEqual({});
    expect(sessionValues).toEqual({});
  });

  it('resets a locked vault without deleting a recoverable legacy copy', async () => {
    await unlockOrMigrateCredentialVault(MASTER_PASSPHRASE, {
      apiKeys: { gemini: 'vault-gemini-key' },
    });
    const fixture = await makeLegacyFixture({ openai: 'legacy-openai-key' });
    const legacySettings = makeSettings({ openai: fixture.encrypted.openai });
    storedValues[SETTINGS_KEY] = legacySettings;
    storedValues[LEGACY_SALT_KEY] = fixture.saltBase64;
    await lockCredentialVault();

    const status = await resetCredentialVault();

    expect(storedValues[VAULT_KEY]).toBeUndefined();
    expect(storedValues[SETTINGS_KEY]).toEqual(legacySettings);
    expect(storedValues[LEGACY_SALT_KEY]).toBe(fixture.saltBase64);
    expect(status).toMatchObject({ hasVault: false, needsMigration: true, hasCredentials: true });
    expect(status.providers).toEqual(['openai']);
  });
});
