import React, { useEffect, useMemo, useState } from 'react';
import { BrandVoice, UserSettings } from '../types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
  const [openaiKey, setOpenaiKey] = useState('');
  const [initialOpenaiKey, setInitialOpenaiKey] = useState('');
  const [defaultBrandVoiceId, setDefaultBrandVoiceId] = useState('');
  const [initialBrandVoiceId, setInitialBrandVoiceId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const settingsResponse = await chrome.runtime.sendMessage({
          type: 'get-settings',
        });

        if (settingsResponse.success) {
          const loadedSettings = settingsResponse.data as UserSettings;
          const existingOpenAiKey = loadedSettings.apiKeys.openai ?? '';
          const existingVoiceId = loadedSettings.defaultBrandVoiceId ?? '';

          setSettings(loadedSettings);
          setOpenaiKey(existingOpenAiKey);
          setInitialOpenaiKey(existingOpenAiKey);
          setDefaultBrandVoiceId(existingVoiceId);
          setInitialBrandVoiceId(existingVoiceId);
        } else {
          throw new Error(settingsResponse.error || 'Unable to load settings');
        }

        const voicesResponse = await chrome.runtime.sendMessage({
          type: 'list-brand-voices',
        });

        if (voicesResponse.success && Array.isArray(voicesResponse.data)) {
          setBrandVoices(voicesResponse.data as BrandVoice[]);
        }
      } catch (loadError) {
        console.error('Failed to load settings', loadError);
        setError('Failed to load settings. Please refresh and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (saveState === 'saved') {
      const timeoutId = setTimeout(() => {
        setSaveState('idle');
      }, 2000);

      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [saveState]);

  const handleSave = async () => {
    if (!settings) {
      return;
    }

    setSaveState('saving');
    setError(null);

    try {
      const trimmedKey = openaiKey.trim();
      const updatedSettings: UserSettings = {
        ...settings,
        apiKeys: {
          ...settings.apiKeys,
          openai: trimmedKey ? trimmedKey : undefined,
        },
        defaultBrandVoiceId: defaultBrandVoiceId || undefined,
      };

      await chrome.runtime.sendMessage({
        type: 'save-settings',
        payload: updatedSettings,
      });

      setSettings(updatedSettings);
      setInitialOpenaiKey(trimmedKey);
      setInitialBrandVoiceId(defaultBrandVoiceId);
      setSaveState('saved');
    } catch (saveError) {
      console.error('Failed to save settings', saveError);
      setError('Failed to save settings. Please try again.');
      setSaveState('error');
    }
  };

  const handleRerunOnboarding = () => {
    const onboardingUrl = chrome.runtime.getURL('src/onboarding/index.html?skipRedirect=1');
    window.location.href = onboardingUrl;
  };

  const hasChanges = useMemo(() => {
    const trimmedKey = openaiKey.trim();
    return trimmedKey !== initialOpenaiKey || defaultBrandVoiceId !== initialBrandVoiceId;
  }, [defaultBrandVoiceId, initialBrandVoiceId, initialOpenaiKey, openaiKey]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-xl">
          <p className="text-sm font-medium text-slate-600">Loading your settings…</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="max-w-md rounded-2xl bg-white px-8 py-6 text-center shadow-xl">
          <p className="text-base font-semibold text-slate-800">We couldn&apos;t load your settings.</p>
          <p className="mt-3 text-sm text-slate-600">
            Please close this window and reopen the extension. If the problem continues, try running the onboarding flow again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-slate-200/70 sm:p-10">
          <header className="mb-10">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-indigo-600">Settings</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage your Kotodama configuration</h1>
            <p className="mt-3 text-sm text-slate-600">
              Update your API connections and defaults. These preferences sync locally on this browser only.
            </p>
          </header>

          <div className="space-y-8">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">OpenAI API key</h2>
                {saveState === 'saved' && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Saved
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">
                Your key is encrypted with the Web Crypto API before being stored. Kotodama never uploads or shares it.
              </p>
              <input
                type="password"
                value={openaiKey}
                onChange={(event) => setOpenaiKey(event.target.value)}
                placeholder="sk-..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 shadow-inner focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <p className="text-xs text-slate-500">
                Need a new key?{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Generate one in the OpenAI dashboard
                </a>
                .
              </p>
            </section>

            {brandVoices.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">Default brand voice</h2>
                <p className="text-sm text-slate-600">
                  Choose which saved voice Kotodama selects automatically when you open the compose panel.
                </p>
                <select
                  value={defaultBrandVoiceId}
                  onChange={(event) => setDefaultBrandVoiceId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">No default voice</option>
                  {brandVoices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </section>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}
          </div>

          <footer className="mt-12 flex flex-col justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleRerunOnboarding}
              className="inline-flex items-center justify-center rounded-xl border border-indigo-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 focus:ring-offset-white"
            >
              Re-run onboarding
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || saveState === 'saving'}
              className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 focus:ring-offset-white ${
                !hasChanges || saveState === 'saving'
                  ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
              }`}
            >
              {saveState === 'saving' ? 'Saving…' : 'Save changes'}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Settings;
