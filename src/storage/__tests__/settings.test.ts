import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAllData,
  getSettings,
  saveSettings,
  updateApiKey,
} from '../settings';
import { encryptApiKey } from '../encryption';
import type { UserSettings } from '../../types';

type StorageAreaMock = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
};

const SETTINGS_KEY = 'user_settings';

const globalWithChrome = globalThis as typeof globalThis & { chrome?: any };

const storedValues: Record<string, unknown> = {};

beforeEach(() => {
  for (const key of Object.keys(storedValues)) {
    delete storedValues[key];
  }

  const localStorageArea = {
    get: vi.fn(async (key: string) => {
      if (typeof key === 'string') {
        return { [key]: storedValues[key] };
      }

      return {};
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(storedValues, items);
    }),
    clear: vi.fn(async () => {
      for (const key of Object.keys(storedValues)) {
        delete storedValues[key];
      }
    }),
  } satisfies StorageAreaMock;

  globalWithChrome.chrome = {
    storage: {
      local: localStorageArea,
    },
  };
});

describe('getSettings', () => {
  it('returns default settings when storage is empty', async () => {
    const settings = await getSettings();

    expect(settings).toEqual({
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
    });
  });

  it('decrypts stored API keys and handles failures gracefully', async () => {
    const encryptedOpenAI = await encryptApiKey('stored-openai-key');
    storedValues[SETTINGS_KEY] = {
      apiKeys: {
        openai: encryptedOpenAI,
        gemini: 'corrupted-value',
      },
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
    } satisfies UserSettings;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const settings = await getSettings();

    expect(settings.apiKeys.openai).toBe('stored-openai-key');
    expect(settings.apiKeys.gemini).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to decrypt Gemini key');

    consoleSpy.mockRestore();
  });
});

describe('saveSettings', () => {
  it('encrypts API keys before storing them', async () => {
    const openaiKey = 'plain-openai-key';
    const geminiKey = 'plain-gemini-key';

    const settings: UserSettings = {
      apiKeys: {
        openai: openaiKey,
        gemini: geminiKey,
      },
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

    await saveSettings(settings);

    expect(globalWithChrome.chrome?.storage.local.set).toHaveBeenCalledWith({
      [SETTINGS_KEY]: expect.any(Object),
    });

    const stored = storedValues[SETTINGS_KEY] as UserSettings;
    expect(stored.apiKeys.openai).not.toBe(openaiKey);
    expect(stored.apiKeys.gemini).not.toBe(geminiKey);
  });
});

describe('updateApiKey', () => {
  it('updates and persists the requested API key', async () => {
    const openaiKey = 'fresh-openai-key';

    await updateApiKey('openai', openaiKey);

    const stored = storedValues[SETTINGS_KEY] as UserSettings;
    expect(stored.apiKeys.openai).not.toBe(openaiKey);

    const settings = await getSettings();
    expect(settings.apiKeys.openai).toBe(openaiKey);
  });
});

describe('clearAllData', () => {
  it('clears the local storage namespace', async () => {
    storedValues.someKey = 'value';

    await clearAllData();

    expect(globalWithChrome.chrome?.storage.local.clear).toHaveBeenCalledTimes(1);
    expect(Object.keys(storedValues)).toHaveLength(0);
  });
});
