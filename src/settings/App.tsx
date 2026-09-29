import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/pages.css';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { BrandLogo } from '../components/BrandLogo';
import { Settings as SettingsIcon, Mic2 as VoiceIcon, Info as AboutIcon, RefreshCw } from 'lucide-react';

// Components
import { GeneralSettings } from './components/GeneralSettings';
import { BrandVoicePage } from './components/BrandVoicePage';
import About from './About';

// Hooks & Types
import { useRuntimeMessaging } from '../hooks/useRuntimeMessaging';
import { RuntimeInvalidatedModal } from '../components/RuntimeInvalidatedModal';
import { UserSettings, BrandVoice, AIProvider, CredentialVaultStatus } from '../types';
import { applyTheme, Theme } from '../utils/theme';
import { logger } from '../utils/logger';

export type PageType = 'general' | 'voices' | 'about';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const PROVIDERS: AIProvider[] = ['openai', 'gemini', 'claude'];
const EMPTY_KEYS: Record<AIProvider, string> = { openai: '', gemini: '', claude: '' };

const PAGES: { id: PageType; label: string; subtitle: string }[] = [
  { id: 'general', label: 'General', subtitle: 'API keys, model, and appearance.' },
  { id: 'voices', label: 'Brand voices', subtitle: 'The personalities Kotodama writes as.' },
  { id: 'about', label: 'About', subtitle: 'Version and links.' },
];

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('general');
  const { sendMessage, isInvalidated } = useRuntimeMessaging();

  // Settings State
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [vaultStatus, setVaultStatus] = useState<CredentialVaultStatus | null>(null);
  const [vaultPassphrase, setVaultPassphrase] = useState('');
  const [vaultPassphraseConfirmation, setVaultPassphraseConfirmation] = useState('');
  const [vaultError, setVaultError] = useState('');
  const [providersToRemove, setProvidersToRemove] = useState<AIProvider[]>([]);

  // Form State
  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>(EMPTY_KEYS);
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [defaultVoiceId, setDefaultVoiceId] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [customModels, setCustomModels] = useState<{ id: string; name: string }[]>([]);
  const [theme, setTheme] = useState<Theme>('auto');

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, voicesData, statusData] = await Promise.all([
        sendMessage<UserSettings>({ type: 'get-settings' }),
        sendMessage<BrandVoice[]>({ type: 'list-brand-voices' }),
        sendMessage<CredentialVaultStatus>({ type: 'get-vault-status' }),
      ]);
      setSettings(settingsData);
      setApiKeys(EMPTY_KEYS);
      setVaultStatus(statusData);
      setProvider(settingsData.defaultProvider || 'openai');
      setDefaultVoiceId(settingsData.defaultBrandVoiceId || '');
      setDefaultModel(settingsData.defaultModel || '');
      setCustomModels(settingsData.customModels || []);
      setTheme(settingsData.ui?.theme || 'auto');
      setBrandVoices(voicesData);
    } catch (err) {
      logger.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Repaint the moment the radio flips — waiting on the debounced save would
  // make the control feel broken.
  useEffect(() => { applyTheme(theme); }, [theme]);

  const handleSave = async () => {
    try {
      setSaveState('saving');
      const defaultSettings: UserSettings = { apiKeys: {}, analysisDepth: 20, ui: { buttonPosition: 'bottom-right', panelWidth: 400, theme: 'auto' }, features: { autoAnalyze: true, rememberHistory: true, showToneControls: true } };
      const baseSettings = settings || defaultSettings;
      const updatedSettings: UserSettings = {
        ...baseSettings,
        apiKeys: {},
        defaultProvider: provider,
        defaultBrandVoiceId: defaultVoiceId,
        defaultModel: defaultModel,
        customModels: customModels,
        ui: { ...baseSettings.ui, theme },
      };

      const credentialUpdates = Object.fromEntries(
        PROVIDERS.flatMap((item) => apiKeys[item].trim() ? [[item, apiKeys[item].trim()]] : []),
      ) as Partial<Record<AIProvider, string>>;
      if (Object.keys(credentialUpdates).length > 0 || providersToRemove.length > 0) {
        if (!vaultStatus?.unlocked) {
          throw new Error('Unlock credential protection before changing API keys.');
        }
        const updatedVaultStatus = await sendMessage<CredentialVaultStatus>({
          type: 'update-vault-credentials',
          payload: { apiKeys: credentialUpdates, providersToRemove },
        });
        setVaultStatus(updatedVaultStatus);
      }
      await sendMessage({ type: 'save-settings', payload: updatedSettings });
      setSettings(updatedSettings);
      setApiKeys(EMPTY_KEYS);
      setProvidersToRemove([]);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err) {
      logger.error('Failed to save settings:', err);
      setSaveState('error');
    }
  };

  const handleUnlockVault = async () => {
    setVaultError('');
    if (!vaultPassphrase.trim()) {
      setVaultError('Enter your master passphrase.');
      return;
    }
    if (!vaultStatus?.hasVault) {
      if (vaultPassphrase.length < 12) {
        setVaultError('Choose a master passphrase with at least 12 characters.');
        return;
      }
      if (vaultPassphrase !== vaultPassphraseConfirmation) {
        setVaultError('The passphrases do not match.');
        return;
      }
    }

    try {
      const status = await sendMessage<CredentialVaultStatus>({
        type: 'unlock-vault',
        payload: { passphrase: vaultPassphrase },
      });
      setVaultStatus(status);
      setVaultPassphrase('');
      setVaultPassphraseConfirmation('');
      setVaultError('');
    } catch (error) {
      setVaultError(error instanceof Error ? error.message : 'Could not unlock credential protection.');
    }
  };

  const handleLockVault = async () => {
    try {
      const status = await sendMessage<CredentialVaultStatus>({ type: 'lock-vault' });
      setVaultStatus(status);
      setApiKeys(EMPTY_KEYS);
      setProvidersToRemove([]);
    } catch {
      setVaultError('Could not lock credential protection.');
    }
  };

  const handleResetVault = async () => {
    const confirmed = window.confirm(
      'Reset the credential vault? Saved provider keys that are not available in a legacy copy will be erased and cannot be recovered. You will need to enter replacement keys and choose a new master passphrase.',
    );
    if (!confirmed) return;

    try {
      const status = await sendMessage<CredentialVaultStatus>({ type: 'reset-vault' });
      setVaultStatus(status);
      setApiKeys(EMPTY_KEYS);
      setProvidersToRemove([]);
      setVaultPassphrase('');
      setVaultPassphraseConfirmation('');
      setVaultError('');
    } catch {
      setVaultError('Could not reset credential protection.');
    }
  };

  useEffect(() => {
    if (!loading && settings) {
      const timeoutId = setTimeout(() => {
        if (
          PROVIDERS.some((p) => apiKeys[p].trim() !== '') ||
          providersToRemove.length > 0 ||
          provider !== (settings.defaultProvider || 'openai') ||
          defaultVoiceId !== (settings.defaultBrandVoiceId || '') ||
          defaultModel !== (settings.defaultModel || '') ||
          theme !== (settings.ui?.theme || 'auto') ||
          JSON.stringify(customModels) !== JSON.stringify(settings.customModels || [])
        ) {
          handleSave();
        }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [apiKeys, providersToRemove, provider, defaultVoiceId, defaultModel, customModels, theme, settings, loading]);

  const handleRestartOnboarding = () => { chrome.tabs.create({ url: chrome.runtime.getURL('src/onboarding/index.html?skipRedirect=1') }); };

  const activePage = PAGES.find((p) => p.id === currentPage)!;

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <p className="text-sm text-faint">Loading…</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-canvas text-ink">
        <aside className="flex w-56 shrink-0 flex-col border-r border-line px-3 py-5">
          <div className="flex items-center gap-2.5 px-3 pb-6">
            <BrandLogo size={20} />
            <span className="text-sm font-medium tracking-tight">Kotodama</span>
          </div>

          <nav className="flex-1 space-y-0.5">
            {PAGES.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex w-full items-center gap-2.5 rounded-koto px-3 py-2 text-sm transition-colors duration-150 ${active ? 'bg-raise font-medium text-ink' : 'text-muted hover:text-ink'
                    }`}
                >
                  {/* The only accent on this page: where you are. */}
                  {active && (
                    <span aria-hidden className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent" />
                  )}
                  {item.id === 'general' && <SettingsIcon size={15} strokeWidth={1.5} />}
                  {item.id === 'voices' && <VoiceIcon size={15} strokeWidth={1.5} />}
                  {item.id === 'about' && <AboutIcon size={15} strokeWidth={1.5} />}
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            onClick={handleRestartOnboarding}
            className="flex w-full items-center gap-2.5 rounded-koto px-3 py-2 text-xs text-faint transition-colors duration-150 hover:text-ink"
          >
            <RefreshCw size={13} strokeWidth={1.5} />
            Restart onboarding
          </button>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {/* Left-aligned against the sidebar rather than centred in the remaining
              space — centring drifts the whole page right on wide monitors. */}
          <div className="max-w-2xl px-10 py-14">
            <header className="pb-10">
              <h1 className="text-xl font-semibold tracking-tight">{activePage.label}</h1>
              <p className="mt-1 text-sm text-muted">{activePage.subtitle}</p>
            </header>

            {currentPage === 'general' && (
              <>
                <section className="mb-10 rounded-koto border border-line bg-surface p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-medium text-ink">Credential protection</h2>
                      {vaultStatus?.unlocked ? (
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          Unlocked for this browser session. The master passphrase is not stored; closing the browser or reloading the extension locks the vault.
                        </p>
                      ) : vaultStatus?.needsMigration ? (
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          Saved keys use the older bundle-derived protection. Create a master passphrase to migrate them;
                          the old encrypted data is kept unless migration succeeds.
                        </p>
                      ) : vaultStatus?.hasVault ? (
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          Unlock your saved provider keys for this browser session. You will need the passphrase again
                          after the browser closes or the extension reloads.
                        </p>
                      ) : (
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          Create a master passphrase before saving provider keys. Kotodama does not store the passphrase.
                        </p>
                      )}
                    </div>
                    {vaultStatus?.unlocked && (
                      <button
                        type="button"
                        onClick={handleLockVault}
                        className="shrink-0 rounded-md border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink"
                      >
                        Lock now
                      </button>
                    )}
                  </div>

                  {!vaultStatus?.unlocked && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs text-muted" htmlFor="vault-passphrase">
                        Master passphrase
                        <input
                          id="vault-passphrase"
                          type="password"
                          autoComplete="new-password"
                          value={vaultPassphrase}
                          onChange={(event) => setVaultPassphrase(event.target.value)}
                          className="koto-field mt-1.5"
                        />
                      </label>
                      {!vaultStatus?.hasVault && (
                        <label className="text-xs text-muted" htmlFor="vault-passphrase-confirmation">
                          Confirm passphrase
                          <input
                            id="vault-passphrase-confirmation"
                            type="password"
                            autoComplete="new-password"
                            value={vaultPassphraseConfirmation}
                            onChange={(event) => setVaultPassphraseConfirmation(event.target.value)}
                            className="koto-field mt-1.5"
                          />
                        </label>
                      )}
                      <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleUnlockVault}
                          className="rounded-md bg-accent px-3.5 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                        >
                          {vaultStatus?.hasVault ? 'Unlock vault' : vaultStatus?.needsMigration ? 'Migrate and unlock' : 'Create vault'}
                        </button>
                        {vaultError && <p role="alert" className="text-xs text-danger">{vaultError}</p>}
                      </div>
                    </div>
                  )}
                  {vaultStatus?.hasVault && !vaultStatus.unlocked && (
                    <button
                      type="button"
                      onClick={handleResetVault}
                      className="mt-3 text-xs text-faint underline underline-offset-2 transition-colors hover:text-danger"
                    >
                      Forgot your passphrase? Reset the vault
                    </button>
                  )}
                </section>

                <GeneralSettings
                  apiKeys={apiKeys}
                  setApiKeys={setApiKeys}
                  configuredProviders={vaultStatus?.providers ?? []}
                  credentialsUnlocked={!!vaultStatus?.unlocked}
                  onRemoveCredential={(item) => setProvidersToRemove((current) =>
                    current.includes(item) ? current : [...current, item],
                  )}
                  provider={provider}
                  setProvider={setProvider}
                  selectedModelId={defaultModel}
                  setSelectedModelId={setDefaultModel}
                  customModels={customModels}
                  setCustomModels={setCustomModels}
                  theme={theme}
                  setTheme={setTheme}
                  saveState={saveState}
                />
              </>
            )}

            {currentPage === 'voices' && (
              <BrandVoicePage
                voices={brandVoices}
                defaultVoiceId={defaultVoiceId}
                setDefaultVoiceId={setDefaultVoiceId}
                onRefresh={loadData}
              />
            )}

            {currentPage === 'about' && <About />}
          </div>
        </main>
      </div>

      <RuntimeInvalidatedModal isOpen={isInvalidated} />
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
