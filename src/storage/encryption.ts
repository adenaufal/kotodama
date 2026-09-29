// Web Crypto helpers for a passphrase-protected credential vault.

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const KDF_ITERATIONS = 600_000;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;
const VAULT_CONTEXT = 'kotodama-credential-vault-v1';
const SESSION_KEY_NAME = 'kotodama_credential_vault_key';
const MIN_PASSPHRASE_LENGTH = 12;

const LEGACY_ENCRYPTION_SECRET = 'kotodama-extension-v2';
const LEGACY_SALT_KEY = 'kotodama_user_salt';

export type AIProvider = 'openai' | 'gemini' | 'claude';

export interface CredentialBundle {
  apiKeys: Partial<Record<AIProvider, string>>;
  claudeCookie?: string;
}

export interface EncryptedCredentialVault {
  version: 1;
  salt: string;
  iv: string;
  ciphertext: string;
  providers: AIProvider[];
  hasClaudeCookie: boolean;
}

let cachedSessionKey: CryptoKey | undefined;

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function configureSessionStorage(): Promise<void> {
  const sessionStorage = chrome.storage.session;
  if (sessionStorage?.setAccessLevel) {
    await sessionStorage.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
  }
}

function assertPassphrase(passphrase: string, isNew: boolean): void {
  if (typeof passphrase !== 'string' || !passphrase.trim()) {
    throw new Error('Enter your master passphrase.');
  }
  if (isNew && passphrase.length < MIN_PASSPHRASE_LENGTH) {
    throw new Error(`Choose a master passphrase with at least ${MIN_PASSPHRASE_LENGTH} characters.`);
  }
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<{ key: CryptoKey; rawKey: Uint8Array }> {
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const rawKey = new Uint8Array(await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: KDF_ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    KEY_LENGTH,
  ));
  const key = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
  return { key, rawKey };
}

async function storeSessionKey(rawKey: Uint8Array): Promise<void> {
  await configureSessionStorage();
  await chrome.storage.session.set({ [SESSION_KEY_NAME]: encodeBase64(rawKey) });
  cachedSessionKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(rawKey),
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function getSessionKey(): Promise<CryptoKey> {
  if (cachedSessionKey) return cachedSessionKey;

  await configureSessionStorage();
  const stored = await chrome.storage.session.get(SESSION_KEY_NAME);
  const encodedKey = stored[SESSION_KEY_NAME];
  if (typeof encodedKey !== 'string') {
    throw new Error('Credential vault is locked. Unlock it in Settings.');
  }

  cachedSessionKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(decodeBase64(encodedKey)),
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
  return cachedSessionKey;
}

function providerNames(credentials: CredentialBundle): AIProvider[] {
  return (['openai', 'gemini', 'claude'] as const).filter((provider) =>
    typeof credentials.apiKeys[provider] === 'string' && credentials.apiKeys[provider]!.length > 0,
  );
}

async function encryptBundle(
  key: CryptoKey,
  salt: Uint8Array,
  credentials: CredentialBundle,
): Promise<EncryptedCredentialVault> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const providers = providerNames(credentials);
  const hasClaudeCookie = typeof credentials.claudeCookie === 'string' && credentials.claudeCookie.length > 0;
  const plaintext = new TextEncoder().encode(JSON.stringify({
    apiKeys: credentials.apiKeys,
    ...(credentials.claudeCookie ? { claudeCookie: credentials.claudeCookie } : {}),
  }));
  const additionalData = new TextEncoder().encode(JSON.stringify({
    context: VAULT_CONTEXT,
    version: 1,
    providers,
    hasClaudeCookie,
  }));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv,
      additionalData,
    },
    key,
    plaintext,
  );

  return {
    version: 1,
    salt: encodeBase64(salt),
    iv: encodeBase64(iv),
    ciphertext: encodeBase64(new Uint8Array(encrypted)),
    providers,
    hasClaudeCookie,
  };
}

async function decryptBundle(key: CryptoKey, vault: EncryptedCredentialVault): Promise<CredentialBundle> {
  if (vault.version !== 1) throw new Error('Unsupported credential vault version.');

  const additionalData = new TextEncoder().encode(JSON.stringify({
    context: VAULT_CONTEXT,
    version: vault.version,
    providers: vault.providers,
    hasClaudeCookie: vault.hasClaudeCookie,
  }));
  const plaintext = await crypto.subtle.decrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: toArrayBuffer(decodeBase64(vault.iv)),
      additionalData,
    },
    key,
    toArrayBuffer(decodeBase64(vault.ciphertext)),
  );
  const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as CredentialBundle;
  if (!parsed || typeof parsed !== 'object' || !parsed.apiKeys || typeof parsed.apiKeys !== 'object') {
    throw new Error('Credential vault data is invalid.');
  }
  return parsed;
}

/** Create a vault and keep only its derived key in browser-session storage. */
export async function createCredentialVault(
  passphrase: string,
  credentials: CredentialBundle,
): Promise<EncryptedCredentialVault> {
  assertPassphrase(passphrase, true);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const { key, rawKey } = await deriveKey(passphrase, salt);
  const vault = await encryptBundle(key, salt, credentials);

  // Verify the ciphertext before the caller commits it over any legacy data.
  await decryptBundle(key, vault);
  await storeSessionKey(rawKey);
  return vault;
}

/** Unlock an existing vault. The passphrase itself is never persisted. */
export async function unlockCredentialVault(
  passphrase: string,
  vault: EncryptedCredentialVault,
): Promise<CredentialBundle> {
  assertPassphrase(passphrase, false);
  try {
    const { key, rawKey } = await deriveKey(passphrase, decodeBase64(vault.salt));
    const credentials = await decryptBundle(key, vault);
    await storeSessionKey(rawKey);
    return credentials;
  } catch {
    cachedSessionKey = undefined;
    try {
      await chrome.storage.session.remove(SESSION_KEY_NAME);
    } catch {
      // Keep the unlock failure generic if session cleanup is unavailable.
    }
    throw new Error('Could not unlock the credential vault. Check the passphrase and try again.');
  }
}

/** Read the encrypted bundle with the currently unlocked session key. */
export async function getUnlockedCredentials(vault: EncryptedCredentialVault): Promise<CredentialBundle> {
  return decryptBundle(await getSessionKey(), vault);
}

/** Re-encrypt changed credentials with a fresh AES-GCM IV. */
export async function reencryptCredentialVault(
  vault: EncryptedCredentialVault,
  credentials: CredentialBundle,
): Promise<EncryptedCredentialVault> {
  const key = await getSessionKey();
  return encryptBundle(key, decodeBase64(vault.salt), credentials);
}

export async function isCredentialVaultUnlocked(): Promise<boolean> {
  if (cachedSessionKey) return true;
  await configureSessionStorage();
  const stored = await chrome.storage.session.get(SESSION_KEY_NAME);
  return typeof stored[SESSION_KEY_NAME] === 'string';
}

export async function lockCredentialVault(): Promise<void> {
  cachedSessionKey = undefined;
  await configureSessionStorage();
  await chrome.storage.session.remove(SESSION_KEY_NAME);
}

/** Decrypt a pre-vault value only for one-time migration from the legacy format. */
export async function decryptLegacyCredential(encryptedValue: string, storedSalt: string): Promise<string> {
  try {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(LEGACY_ENCRYPTION_SECRET),
      { name: 'PBKDF2' },
      false,
      ['deriveKey'],
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: decodeBase64(storedSalt).buffer as ArrayBuffer,
        iterations: KDF_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
      false,
      ['decrypt'],
    );
    const combined = decodeBase64(encryptedValue);
    if (combined.length <= IV_LENGTH) throw new Error('Invalid legacy credential.');
    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM, iv: combined.slice(0, IV_LENGTH) },
      key,
      combined.slice(IV_LENGTH),
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error('Could not migrate saved credentials. The original encrypted data was left unchanged.');
  }
}

export const LEGACY_CREDENTIAL_SALT_KEY = LEGACY_SALT_KEY;
