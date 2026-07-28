import { AIProvider, UserSettings } from '../types';
import { encryptApiKey, decryptApiKey } from './encryption';

const SETTINGS_KEY = 'user_settings';

const API_KEY_PROVIDERS: AIProvider[] = ['openai', 'gemini', 'claude'];

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

export async function getSettings(): Promise<UserSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);

  if (!result[SETTINGS_KEY]) {
    return DEFAULT_SETTINGS;
  }

  const settings = result[SETTINGS_KEY] as UserSettings;

  // Decrypt every provider key, not just the ones that shipped first.
  for (const provider of API_KEY_PROVIDERS) {
    const stored = settings.apiKeys?.[provider];
    if (!stored) continue;
    try {
      settings.apiKeys[provider] = await decryptApiKey(stored);
    } catch (error) {
      console.error(`Failed to decrypt ${provider} key`);
      settings.apiKeys[provider] = undefined;
    }
  }

  if (settings.claudeCookie) {
    try {
      settings.claudeCookie = await decryptApiKey(settings.claudeCookie);
    } catch (error) {
      console.error('Failed to decrypt Claude cookie');
      settings.claudeCookie = undefined;
    }
  }

  return settings;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const settingsToSave: UserSettings = {
    ...settings,
    apiKeys: { ...settings.apiKeys },
    ui: { ...settings.ui },
    features: { ...settings.features },
  };

  // Encrypt every provider key before saving, without mutating the original object
  for (const provider of API_KEY_PROVIDERS) {
    const plain = settingsToSave.apiKeys[provider];
    if (plain) {
      settingsToSave.apiKeys[provider] = await encryptApiKey(plain);
    }
  }

  if (settingsToSave.claudeCookie) {
    settingsToSave.claudeCookie = await encryptApiKey(settingsToSave.claudeCookie);
  }

  await chrome.storage.local.set({ [SETTINGS_KEY]: settingsToSave });
}

export async function updateApiKey(provider: AIProvider, apiKey: string): Promise<void> {
  const settings = await getSettings();
  settings.apiKeys[provider] = apiKey;
  await saveSettings(settings);
}

export async function clearAllData(): Promise<void> {
  await chrome.storage.local.clear();
}
