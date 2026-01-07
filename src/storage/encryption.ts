// Web Crypto API wrapper for encrypting/decrypting API keys

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 600000; // Modern recommended iterations
const USER_SALT_KEY = 'kotodama_user_salt';
const SALT_LENGTH = 32; // 256 bits

/**
 * Gets or generates a user-specific salt for key derivation.
 * The salt is stored in chrome.storage.local and persists across sessions.
 * Each user/device will have a unique salt, addressing the security vulnerability
 * of using a fixed salt across all installations.
 */
async function getUserSalt(): Promise<Uint8Array> {
  return new Promise((resolve) => {
    chrome.storage.local.get([USER_SALT_KEY], (result: Record<string, string | undefined>) => {
      const storedSalt = result[USER_SALT_KEY];
      if (storedSalt) {
        // Decode existing salt from base64
        const saltArray = Uint8Array.from(atob(storedSalt), (c) => c.charCodeAt(0));
        resolve(saltArray);
      } else {
        // Generate new unique salt for this user/installation
        const newSalt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
        const saltBase64 = btoa(String.fromCharCode(...newSalt));
        chrome.storage.local.set({ [USER_SALT_KEY]: saltBase64 }, () => {
          resolve(newSalt);
        });
      }
    });
  });
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  // Get user-specific salt
  const userSalt = await getUserSalt();

  // Derive key using user-specific salt
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode('kotodama-extension-v2'),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: userSalt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv,
    },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

export async function decryptApiKey(encryptedKey: string): Promise<string> {
  try {
    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const key = await getEncryptionKey();

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv,
      },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt API key');
  }
}
