import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/pages.css';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PageLayout } from '../components/Layout/PageLayout';
import { Settings as SettingsIcon, Mic2 as VoiceIcon, Info as AboutIcon, RefreshCw } from 'lucide-react';

// Components
import { GeneralSettings } from './components/GeneralSettings';
import { BrandVoicePage } from './components/BrandVoicePage';
import About from './About';

// Hooks & Types
import { useRuntimeMessaging } from '../hooks/useRuntimeMessaging';
import { RuntimeInvalidatedModal } from '../components/RuntimeInvalidatedModal';
import { UserSettings, BrandVoice } from '../types';
import { ModelPriority } from '../constants/models';

export type PageType = 'general' | 'voices' | 'about';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('general');
  const { sendMessage, isInvalidated } = useRuntimeMessaging();

  // Settings State
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // Form State
  const [openaiKey, setOpenaiKey] = useState('');
  const [defaultVoiceId, setDefaultVoiceId] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [modelPriority, setModelPriority] = useState<ModelPriority>('maximize-free');

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, voicesData] = await Promise.all([
        sendMessage<UserSettings>({ type: 'get-settings' }),
        sendMessage<BrandVoice[]>({ type: 'list-brand-voices' }),
      ]);
      setSettings(settingsData);
      setOpenaiKey(settingsData.apiKeys?.openai || '');
      setDefaultVoiceId(settingsData.defaultBrandVoiceId || '');
      setDefaultModel(settingsData.defaultModel || '');
      setModelPriority(settingsData.modelPriority || 'maximize-free');
      setBrandVoices(voicesData);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    try {
      setSaveState('saving');
      const defaultSettings: UserSettings = { apiKeys: {}, analysisDepth: 20, ui: { buttonPosition: 'bottom-right', panelWidth: 400, theme: 'auto' }, features: { autoAnalyze: true, rememberHistory: true, showToneControls: true } };
      const baseSettings = settings || defaultSettings;
      const updatedSettings: UserSettings = { ...baseSettings, apiKeys: { ...baseSettings.apiKeys, openai: openaiKey }, defaultBrandVoiceId: defaultVoiceId, defaultModel: defaultModel, modelPriority: modelPriority };
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
        if (openaiKey !== (settings.apiKeys?.openai || '') || defaultVoiceId !== (settings.defaultBrandVoiceId || '') || defaultModel !== (settings.defaultModel || '') || modelPriority !== (settings.modelPriority || 'maximize-free')) {
          handleSave();
        }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [openaiKey, defaultVoiceId, defaultModel, modelPriority, settings, loading]);

  const handleRestartOnboarding = () => { chrome.tabs.create({ url: chrome.runtime.getURL('src/onboarding/index.html?skipRedirect=1') }); };

  // Navigation Items
  const mainNavItems = [
    { id: 'general', label: 'General', icon: <SettingsIcon size={18} /> },
    { id: 'voices', label: 'Brand Voices', icon: <VoiceIcon size={18} /> },
  ];

  const getPageTitle = () => {
    if (currentPage === 'general') return 'General Settings';
    if (currentPage === 'voices') return 'Brand Voices';
    return 'About';
  };
  const getPageSubtitle = () => {
    if (currentPage === 'general') return 'Manage your API keys and AI model preferences.';
    if (currentPage === 'voices') return 'Create and manage your AI writing personalities.';
    return 'Version information and credits.';
  };

  const Sidebar = (
    <div className="flex flex-col h-full">
      {/* Main Navigation */}
      <nav className="space-y-1 flex-1">
        {mainNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id as PageType)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
              ${currentPage === item.id
                ? 'bg-[var(--koto-bg-elevated)] text-[var(--koto-text-primary)] shadow-sm font-semibold'
                : 'text-[var(--koto-text-secondary)] hover:bg-[var(--koto-bg-tertiary)] hover:text-[var(--koto-text-primary)]'
              }
            `}
          >
            <span className={`${currentPage === item.id ? 'text-[var(--koto-accent)]' : 'text-[var(--koto-text-tertiary)]'}`}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="pt-4 mt-4 border-t border-[var(--koto-border-light)] space-y-2">
        <button
          onClick={handleRestartOnboarding}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-[var(--koto-text-tertiary)] hover:bg-[var(--koto-bg-tertiary)] hover:text-[var(--koto-text-secondary)] transition-all"
        >
          <RefreshCw size={14} />
          Restart Onboarding
        </button>
        <button
          onClick={() => setCurrentPage('about')}
          className={`
            w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all
            ${currentPage === 'about'
              ? 'bg-[var(--koto-bg-elevated)] text-[var(--koto-text-primary)] font-semibold'
              : 'text-[var(--koto-text-tertiary)] hover:bg-[var(--koto-bg-tertiary)] hover:text-[var(--koto-text-secondary)]'
            }
          `}
        >
          <AboutIcon size={14} />
          About Kotodama
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--koto-bg-secondary)]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--koto-accent)] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        variant="dashboard"
        sidebar={Sidebar}
        title={getPageTitle()}
        subtitle={getPageSubtitle()}
      >
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* General Settings Page */}
          {currentPage === 'general' && (
            <GeneralSettings
              openaiKey={openaiKey}
              setOpenaiKey={setOpenaiKey}
              defaultModel={defaultModel}
              setDefaultModel={setDefaultModel}
              modelPriority={modelPriority}
              setModelPriority={setModelPriority}
              saveState={saveState}
            />
          )}

          {/* Brand Voices Page - Fully Inline */}
          {currentPage === 'voices' && (
            <BrandVoicePage
              voices={brandVoices}
              defaultVoiceId={defaultVoiceId}
              setDefaultVoiceId={setDefaultVoiceId}
              onRefresh={loadData}
            />
          )}

          {/* About Page */}
          {currentPage === 'about' && <About />}
        </div>
      </PageLayout>

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
