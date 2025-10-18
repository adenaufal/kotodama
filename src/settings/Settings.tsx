import React, { useEffect, useMemo, useState } from 'react';
import { BrandVoice, UserSettings } from '../types';
import BrandVoiceManager from './BrandVoiceManager';

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
  const [showVoiceManager, setShowVoiceManager] = useState(false);

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

  const handleOpenVoiceManager = () => {
    setShowVoiceManager(true);
  };

  const handleCloseVoiceManager = () => {
    setShowVoiceManager(false);
  };

  const handleRefreshVoices = async () => {
    try {
      const voicesResponse = await chrome.runtime.sendMessage({ type: 'list-brand-voices' });

      if (voicesResponse.success && Array.isArray(voicesResponse.data)) {
        setBrandVoices(voicesResponse.data as BrandVoice[]);

        // If currently selected default voice was deleted, reset to empty
        if (defaultBrandVoiceId && !voicesResponse.data.some((v: BrandVoice) => v.id === defaultBrandVoiceId)) {
          setDefaultBrandVoiceId('');
        }
      }
    } catch (refreshError) {
      console.error('Failed to refresh brand voices:', refreshError);
    }
  };

  const hasChanges = useMemo(() => {
    const trimmedKey = openaiKey.trim();
    return trimmedKey !== initialOpenaiKey || defaultBrandVoiceId !== initialBrandVoiceId;
  }, [defaultBrandVoiceId, initialBrandVoiceId, initialOpenaiKey, openaiKey]);

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="rounded-2xl px-8 py-6 text-center shadow-xl" style={{
          backgroundColor: 'var(--koto-surface)',
          boxShadow: 'var(--koto-shadow-lg)'
        }}>
          <p className="text-sm font-medium" style={{ color: 'var(--koto-text-secondary)' }}>Loading your settings…</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="page-shell">
        <div className="stack max-w-md rounded-2xl px-8 py-6 text-center shadow-xl" style={{
          backgroundColor: 'var(--koto-surface)',
          boxShadow: 'var(--koto-shadow-lg)'
        }}>
          <p className="text-base font-semibold" style={{ color: 'var(--koto-text-primary)' }}>We couldn&apos;t load your settings.</p>
          <p className="mt-3 text-sm" style={{ color: 'var(--koto-text-secondary)' }}>
            Please close this window and reopen the extension. If the problem continues, try running the onboarding flow again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="stack w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="stack rounded-3xl p-8 shadow-2xl ring-1 sm:p-10" style={{
          backgroundColor: 'var(--koto-surface)',
          boxShadow: 'var(--koto-shadow-lg)',
          borderColor: 'var(--koto-border)'
        }}>
          <header className="stack-sm">
            <p className="text-sm font-medium uppercase tracking-[0.3em]" style={{ color: 'var(--koto-sakura-pink)' }}>Settings</p>
            <h1 className="text-3xl font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Manage your Kotodama configuration</h1>
            <p className="text-sm" style={{ color: 'var(--koto-text-secondary)' }}>
              Update your API connections and defaults. These preferences sync locally on this browser only.
            </p>
          </header>

          <div className="stack">
            <section className="stack-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--koto-text-primary)' }}>OpenAI API key</h2>
                {saveState === 'saved' && (
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" style={{
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    color: 'var(--koto-success)'
                  }}>
                    Saved
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: 'var(--koto-text-secondary)' }}>
                Your key is encrypted with the Web Crypto API before being stored. Kotodama never uploads or shares it.
              </p>
              <input
                type="password"
                value={openaiKey}
                onChange={(event) => setOpenaiKey(event.target.value)}
                placeholder="sk-..."
                className="w-full rounded-xl border px-4 py-3 text-base shadow-inner focus:outline-none"
                style={{
                  borderColor: 'var(--koto-border)',
                  backgroundColor: 'var(--koto-bg-dark)',
                  color: 'var(--koto-text-primary)'
                }}
              />
              <p className="text-xs" style={{ color: 'var(--koto-text-secondary)' }}>
                Need a new key?{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium"
                  style={{ color: 'var(--koto-sakura-pink)' }}
                >
                  Generate one in the OpenAI dashboard
                </a>
                .
              </p>
            </section>

            <section className="stack-sm">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Brand Voices</h2>
              <p className="text-sm" style={{ color: 'var(--koto-text-secondary)' }}>
                Manage your brand voices - create, edit, or delete voices to match your unique style.
              </p>
              <button
                type="button"
                onClick={handleOpenVoiceManager}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-4 text-sm font-semibold transition koto-button-hover focus:outline-none"
                style={{
                  borderColor: 'var(--koto-border)',
                  backgroundColor: 'rgba(26, 29, 46, 0.3)',
                  color: 'var(--koto-text-secondary)'
                }}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage Brand Voices ({brandVoices.length})
              </button>
            </section>

            {brandVoices.length > 0 && (
              <section className="stack-sm">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Default brand voice</h2>
                <p className="text-sm" style={{ color: 'var(--koto-text-secondary)' }}>
                  Choose which saved voice Kotodama selects automatically when you open the compose panel.
                </p>
                <select
                  value={defaultBrandVoiceId}
                  onChange={(event) => setDefaultBrandVoiceId(event.target.value)}
                  className="w-full rounded-xl border px-4 py-3 text-base shadow-sm focus:outline-none"
                  style={{
                    borderColor: 'var(--koto-border)',
                    backgroundColor: 'var(--koto-bg-dark)',
                    color: 'var(--koto-text-primary)'
                  }}
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
              <div className="rounded-2xl border px-4 py-3 text-sm koto-animate-fadeIn" style={{
                borderColor: 'var(--koto-error)',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                color: 'var(--koto-error)'
              }}>
                {error}
              </div>
            )}
          </div>

          <footer className="flex flex-col justify-between gap-3 border-t pt-6 sm:flex-row sm:items-center" style={{ borderColor: 'var(--koto-border)' }}>
            <button
              type="button"
              onClick={handleRerunOnboarding}
              className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition koto-button-hover focus:outline-none"
              style={{
                borderColor: 'var(--koto-border)',
                color: 'var(--koto-sakura-pink)'
              }}
            >
              Re-run onboarding
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || saveState === 'saving'}
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition koto-button-hover focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: !hasChanges || saveState === 'saving' ? 'var(--koto-border)' : 'var(--koto-sakura-pink)',
                boxShadow: !hasChanges || saveState === 'saving' ? 'none' : '0 4px 12px rgba(232, 92, 143, 0.3)'
              }}
            >
              {saveState === 'saving' ? 'Saving…' : 'Save changes'}
            </button>
          </footer>
        </div>
      </div>

      {showVoiceManager && (
        <BrandVoiceManager
          voices={brandVoices}
          onClose={handleCloseVoiceManager}
          onRefresh={handleRefreshVoices}
        />
      )}
    </div>
  );
};

export default Settings;
