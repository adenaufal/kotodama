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
import { UserSettings, BrandVoice, AIProvider } from '../types';
import { applyTheme, Theme } from '../utils/theme';

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
      const [settingsData, voicesData] = await Promise.all([
        sendMessage<UserSettings>({ type: 'get-settings' }),
        sendMessage<BrandVoice[]>({ type: 'list-brand-voices' }),
      ]);
      setSettings(settingsData);
      setApiKeys({
        openai: settingsData.apiKeys?.openai || '',
        gemini: settingsData.apiKeys?.gemini || '',
        claude: settingsData.apiKeys?.claude || '',
      });
      setProvider(settingsData.defaultProvider || 'openai');
      setDefaultVoiceId(settingsData.defaultBrandVoiceId || '');
      setDefaultModel(settingsData.defaultModel || '');
      setCustomModels(settingsData.customModels || []);
      setTheme(settingsData.ui?.theme || 'auto');
      setBrandVoices(voicesData);
    } catch (err) {
      console.error('Failed to load settings:', err);
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
        apiKeys: {
          openai: apiKeys.openai.trim(),
          gemini: apiKeys.gemini.trim(),
          claude: apiKeys.claude.trim(),
        },
        defaultProvider: provider,
        defaultBrandVoiceId: defaultVoiceId,
        defaultModel: defaultModel,
        customModels: customModels,
        ui: { ...baseSettings.ui, theme },
      };
      await sendMessage({ type: 'save-settings', payload: updatedSettings });
      setSettings(updatedSettings);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveState('error');
    }
  };

  useEffect(() => {
    if (!loading && settings) {
      const timeoutId = setTimeout(() => {
        if (
          PROVIDERS.some((p) => apiKeys[p].trim() !== (settings.apiKeys?.[p] || '')) ||
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
  }, [apiKeys, provider, defaultVoiceId, defaultModel, customModels, theme, settings, loading]);

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
              <GeneralSettings
                apiKeys={apiKeys}
                setApiKeys={setApiKeys}
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
