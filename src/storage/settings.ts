import { UserSettings } from '../types';
import { encryptApiKey, decryptApiKey } from './encryption';

const SETTINGS_KEY = 'user_settings';

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

  // Decrypt API keys if they exist
  if (settings.apiKeys.openai) {
    try {
      settings.apiKeys.openai = await decryptApiKey(settings.apiKeys.openai);
    } catch (error) {
      console.error('Failed to decrypt OpenAI key');
      settings.apiKeys.openai = undefined;
    }
  }

  if (settings.apiKeys.gemini) {
    try {
      settings.apiKeys.gemini = await decryptApiKey(settings.apiKeys.gemini);
    } catch (error) {
      console.error('Failed to decrypt Gemini key');
      settings.apiKeys.gemini = undefined;
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

  // Encrypt API keys before saving without mutating the original object
  if (settingsToSave.apiKeys.openai) {
    settingsToSave.apiKeys.openai = await encryptApiKey(settingsToSave.apiKeys.openai);
  }

  if (settingsToSave.apiKeys.gemini) {
    settingsToSave.apiKeys.gemini = await encryptApiKey(settingsToSave.apiKeys.gemini);
  }

  await chrome.storage.local.set({ [SETTINGS_KEY]: settingsToSave });
}

export async function updateApiKey(provider: 'openai' | 'gemini', apiKey: string): Promise<void> {
  const settings = await getSettings();
  settings.apiKeys[provider] = apiKey;
  await saveSettings(settings);
}

export async function clearAllData(): Promise<void> {
  await chrome.storage.local.clear();
}
