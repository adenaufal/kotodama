import { AIProvider, CredentialVaultStatus, UserSettings } from '../types';
import {
  CredentialBundle,
  createCredentialVault,
  decryptLegacyCredential,
  EncryptedCredentialVault,
  getUnlockedCredentials,
  isCredentialVaultUnlocked,
  LEGACY_CREDENTIAL_SALT_KEY,
  lockCredentialVault,
  reencryptCredentialVault,
  unlockCredentialVault,
} from './encryption';

const SETTINGS_KEY = 'user_settings';
const CREDENTIAL_VAULT_KEY = 'credential_vault';
const API_KEY_PROVIDERS: AIProvider[] = ['openai', 'gemini', 'claude'];
const PUBLIC_SETTING_KEYS = [
  'defaultProvider',
  'claudeAuthType',
  'defaultBrandVoiceId',
  'defaultModel',
  'customModels',
  'modelPriority',
  'userTier',
  'analysisDepth',
  'ui',
  'features',
] as const satisfies readonly (keyof UserSettings)[];

const DEFAULT_SETTINGS: UserSettings = {
  apiKeys: {},
  analysisDepth: 20,
  ui: {
    buttonPosition: 'top-right',
    panelWidth: 400,
    theme: 'auto',
  },
  features: {
    autoAnalyze: true,
    rememberHistory: true,
    showToneControls: true,
  },
};

type StoredSettings = Partial<UserSettings> & {
  apiKeys?: Partial<Record<AIProvider, string>>;
  claudeCookie?: string;
};

interface StorageSnapshot {
  settings: StoredSettings;
  vault?: EncryptedCredentialVault;
  legacySalt?: string;
}

async function readSnapshot(): Promise<StorageSnapshot> {
  const result = await chrome.storage.local.get([
    SETTINGS_KEY,
    CREDENTIAL_VAULT_KEY,
    LEGACY_CREDENTIAL_SALT_KEY,
  ]);
  return {
    settings: (result[SETTINGS_KEY] as StoredSettings | undefined) ?? {},
    vault: result[CREDENTIAL_VAULT_KEY] as EncryptedCredentialVault | undefined,
    legacySalt: result[LEGACY_CREDENTIAL_SALT_KEY] as string | undefined,
  };
}

function legacyProviders(settings: StoredSettings): AIProvider[] {
  return API_KEY_PROVIDERS.filter((provider) =>
    typeof settings.apiKeys?.[provider] === 'string' && settings.apiKeys[provider]!.length > 0,
  );
}

function hasLegacyData(settings: StoredSettings): boolean {
  return legacyProviders(settings).length > 0 ||
    (typeof settings.claudeCookie === 'string' && settings.claudeCookie.length > 0);
}

function stripLegacyCredentials(settings: StoredSettings): StoredSettings {
  const sanitized: StoredSettings = { ...settings, apiKeys: {} };
  delete sanitized.claudeCookie;
  return sanitized;
}

async function clearLegacyCredentials(snapshot: StorageSnapshot): Promise<void> {
  if (hasLegacyData(snapshot.settings)) {
    await chrome.storage.local.set({
      [SETTINGS_KEY]: stripLegacyCredentials(snapshot.settings),
    });
  }
  if (snapshot.legacySalt) await chrome.storage.local.remove(LEGACY_CREDENTIAL_SALT_KEY);
}

function toPublicSettings(settings: StoredSettings): UserSettings {
  const publicSettings = Object.fromEntries(
    PUBLIC_SETTING_KEYS.flatMap((key) => key in settings ? [[key, settings[key]]] : []),
  ) as Partial<UserSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...publicSettings,
    // Secret values are never returned through get-settings.
    apiKeys: {},
    ui: { ...DEFAULT_SETTINGS.ui, ...settings.ui },
    features: { ...DEFAULT_SETTINGS.features, ...settings.features },
  };
}

export async function getSettings(): Promise<UserSettings> {
  const snapshot = await readSnapshot();
  return toPublicSettings(snapshot.settings);
}

export async function getCredentialVaultStatus(): Promise<CredentialVaultStatus> {
  const snapshot = await readSnapshot();
  const providers = snapshot.vault?.providers ?? legacyProviders(snapshot.settings);
  const hasClaudeCookie = snapshot.vault?.hasClaudeCookie ??
    (typeof snapshot.settings.claudeCookie === 'string' && snapshot.settings.claudeCookie.length > 0);
  const hasLegacy = hasLegacyData(snapshot.settings);

  return {
    hasVault: !!snapshot.vault,
    hasCredentials: providers.length > 0 || hasClaudeCookie,
    needsMigration: !snapshot.vault && hasLegacy,
    hasLegacyData: hasLegacy,
    providers: [...providers],
    hasClaudeCookie,
    unlocked: snapshot.vault ? await isCredentialVaultUnlocked() : false,
  };
}

/**
 * Unlock an existing vault or migrate the pre-passphrase credentials on first use.
 * Legacy data is only removed after all values decrypt and the replacement vault is
 * written successfully, so a failed migration never discards the user's old keys.
 */
export async function unlockOrMigrateCredentialVault(
  passphrase: string,
  initialCredentials: CredentialBundle = { apiKeys: {} },
): Promise<CredentialVaultStatus> {
  const snapshot = await readSnapshot();

  if (snapshot.vault) {
    const credentials = await unlockCredentialVault(passphrase, snapshot.vault);
    await clearLegacyCredentials(snapshot);
    if (hasCredentialsToWrite(initialCredentials)) {
      await writeCredentials(snapshot.vault, mergeCredentials(credentials, initialCredentials));
    }
    return getCredentialVaultStatus();
  }

  const credentials = await readLegacyCredentials(snapshot);
  const merged = mergeCredentials(credentials, initialCredentials);
  const vault = await createCredentialVault(passphrase, merged);

  // Commit the complete, verified replacement before clearing any legacy bytes.
  await chrome.storage.local.set({ [CREDENTIAL_VAULT_KEY]: vault });
  const updatedSnapshot = { ...snapshot, vault };
  await clearLegacyCredentials(updatedSnapshot);

  return getCredentialVaultStatus();
}

async function readLegacyCredentials(snapshot: StorageSnapshot): Promise<CredentialBundle> {
  const apiKeys: Partial<Record<AIProvider, string>> = {};
  if (!hasLegacyData(snapshot.settings)) return { apiKeys };
  if (!snapshot.legacySalt) {
    throw new Error('Could not migrate saved credentials. The original encrypted data was left unchanged.');
  }

  try {
    for (const provider of API_KEY_PROVIDERS) {
      const encrypted = snapshot.settings.apiKeys?.[provider];
      if (encrypted) apiKeys[provider] = await decryptLegacyCredential(encrypted, snapshot.legacySalt);
    }

    const credentials: CredentialBundle = { apiKeys };
    if (snapshot.settings.claudeCookie) {
      credentials.claudeCookie = await decryptLegacyCredential(
        snapshot.settings.claudeCookie,
        snapshot.legacySalt,
      );
    }
    return credentials;
  } catch {
    throw new Error('Could not migrate saved credentials. The original encrypted data was left unchanged.');
  }
}

function hasCredentialsToWrite(credentials: CredentialBundle): boolean {
  return API_KEY_PROVIDERS.some((provider) => !!credentials.apiKeys[provider]) ||
    !!credentials.claudeCookie;
}

function mergeCredentials(current: CredentialBundle, incoming: CredentialBundle): CredentialBundle {
  const apiKeys = { ...current.apiKeys };
  for (const provider of API_KEY_PROVIDERS) {
    const key = incoming.apiKeys[provider]?.trim();
    if (key) apiKeys[provider] = key;
  }
  return {
    apiKeys,
    ...(incoming.claudeCookie?.trim() || current.claudeCookie
      ? { claudeCookie: incoming.claudeCookie?.trim() || current.claudeCookie }
      : {}),
  };
}

async function writeCredentials(
  vault: EncryptedCredentialVault,
  credentials: CredentialBundle,
): Promise<void> {
  const updated = await reencryptCredentialVault(vault, credentials);
  await chrome.storage.local.set({ [CREDENTIAL_VAULT_KEY]: updated });
}

export async function getApiKey(provider: AIProvider): Promise<string | undefined> {
  const snapshot = await readSnapshot();
  if (!snapshot.vault) {
    if (legacyProviders(snapshot.settings).includes(provider)) {
      throw new Error('Secure saved credentials in Settings before using them.');
    }
    return undefined;
  }
  if (!snapshot.vault.providers.includes(provider)) return undefined;
  const credentials = await getUnlockedCredentials(snapshot.vault);
  return credentials.apiKeys[provider];
}

export async function updateVaultCredentials(
  incoming: CredentialBundle,
  providersToRemove: AIProvider[] = [],
): Promise<CredentialVaultStatus> {
  const snapshot = await readSnapshot();
  if (!snapshot.vault) throw new Error('Set a master passphrase before saving provider keys.');

  const credentials = await getUnlockedCredentials(snapshot.vault);
  const apiKeys = { ...credentials.apiKeys };
  for (const provider of providersToRemove) delete apiKeys[provider];
  const updated = mergeCredentials({ ...credentials, apiKeys }, incoming);
  await writeCredentials(snapshot.vault, updated);
  return getCredentialVaultStatus();
}

/** Reset an unrecoverable vault. Legacy migration bytes, if present, are kept intact. */
export async function resetCredentialVault(): Promise<CredentialVaultStatus> {
  const snapshot = await readSnapshot();
  if (!snapshot.vault) throw new Error('There is no credential vault to reset.');

  await lockCredentialVault();
  await chrome.storage.local.remove(CREDENTIAL_VAULT_KEY);
  return getCredentialVaultStatus();
}

/** Save public settings without accepting or echoing credentials from a UI payload. */
export async function saveSettings(settings: UserSettings): Promise<void> {
  const snapshot = await readSnapshot();
  const current = snapshot.settings;
  const publicInput = Object.fromEntries(
    PUBLIC_SETTING_KEYS.flatMap((key) => key in settings ? [[key, settings[key]]] : []),
  ) as Partial<UserSettings>;

  await chrome.storage.local.set({
    [SETTINGS_KEY]: {
      ...DEFAULT_SETTINGS,
      ...current,
      ...publicInput,
      apiKeys: { ...(current.apiKeys ?? {}) },
      ...(current.claudeCookie ? { claudeCookie: current.claudeCookie } : {}),
      ui: { ...DEFAULT_SETTINGS.ui, ...current.ui, ...publicInput.ui },
      features: { ...DEFAULT_SETTINGS.features, ...current.features, ...publicInput.features },
    },
  });
}

export async function updateApiKey(provider: AIProvider, apiKey: string): Promise<void> {
  await updateVaultCredentials({ apiKeys: { [provider]: apiKey } });
}

export async function clearAllData(): Promise<void> {
  await lockCredentialVault();
  await chrome.storage.local.clear();
}
