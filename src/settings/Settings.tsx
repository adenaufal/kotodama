import React, { useState, useEffect } from 'react';
import { UserSettings, BrandVoice } from '../types';
import { ModelPriority } from '../constants/models';
import BrandVoiceManager from './BrandVoiceManager';
import {
  SettingsLayout,
  GeneralSettings,
  BrandVoiceList
} from './components';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [isManagingVoices, setIsManagingVoices] = useState(false);

  // Form State
  const [openaiKey, setOpenaiKey] = useState('');
  const [defaultVoiceId, setDefaultVoiceId] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [modelPriority, setModelPriority] = useState<ModelPriority>('maximize-free');

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsResponse, voicesResponse] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'get-settings' }),
        chrome.runtime.sendMessage({ type: 'list-brand-voices' }),
      ]);

      if (settingsResponse && settingsResponse.success) {
        const data = settingsResponse.data as UserSettings;
        setSettings(data);
        setOpenaiKey(data.apiKeys?.openai || '');
        setDefaultVoiceId(data.defaultBrandVoiceId || '');
        setDefaultModel(data.defaultModel || '');
        setModelPriority(data.modelPriority || 'maximize-free');
      }

      if (voicesResponse && voicesResponse.success) {
        setBrandVoices(voicesResponse.data as BrandVoice[]);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      setSaveState('saving');

      const defaultSettings: UserSettings = {
        apiKeys: {},
        analysisDepth: 20,
        ui: {
          buttonPosition: 'bottom-right',
          panelWidth: 400,
          theme: 'auto',
        },
        features: {
          autoAnalyze: true,
          rememberHistory: true,
          showToneControls: true,
        }
      };

      const baseSettings = settings || defaultSettings;

      const updatedSettings: UserSettings = {
        ...baseSettings,
        apiKeys: { ...baseSettings.apiKeys, openai: openaiKey },
        defaultBrandVoiceId: defaultVoiceId,
        defaultModel: defaultModel,
        modelPriority: modelPriority,
      };

      await chrome.runtime.sendMessage({ type: 'save-settings', payload: updatedSettings });

      setSettings(updatedSettings);
      setSaveState('saved');

      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveState('error');
    }
  };

  // Debounced auto-save
  useEffect(() => {
    if (!loading && settings) {
      const timeoutId = setTimeout(() => {
        if (
          openaiKey !== (settings.apiKeys?.openai || '') ||
          defaultVoiceId !== (settings.defaultBrandVoiceId || '') ||
          defaultModel !== (settings.defaultModel || '') ||
          modelPriority !== (settings.modelPriority || 'maximize-free')
        ) {
          handleSave();
        }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [openaiKey, defaultVoiceId, defaultModel, modelPriority, settings, loading]);

  const handleRestartOnboarding = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/onboarding/index.html') });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFAFA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--koto-sakura-pink)]"></div>
      </div>
    );
  }

  return (
    <>
      <SettingsLayout>
        <div className="space-y-12 animate-in fade-in duration-500">
          <GeneralSettings
            openaiKey={openaiKey}
            setOpenaiKey={setOpenaiKey}
            defaultModel={defaultModel}
            setDefaultModel={setDefaultModel}
            modelPriority={modelPriority}
            setModelPriority={setModelPriority}
            saveState={saveState}
          />

          <BrandVoiceList
            voices={brandVoices}
            defaultVoiceId={defaultVoiceId}
            setDefaultVoiceId={setDefaultVoiceId}
            onManage={() => setIsManagingVoices(true)}
          />

          <div className="pt-8 border-t border-slate-100 flex justify-center">
            <button
              onClick={handleRestartOnboarding}
              className="text-xs font-bold text-slate-400 hover:text-[var(--koto-sakura-pink)] uppercase tracking-wider transition-colors"
            >
              Restart Onboarding Flow
            </button>
          </div>
        </div>
      </SettingsLayout>

      {isManagingVoices && (
        <BrandVoiceManager
          voices={brandVoices}
          onClose={() => {
            setIsManagingVoices(false);
            loadData(); // Refresh data after managing
          }}
          onRefresh={loadData}
        />
      )}
    </>
  );
};

export default Settings;
