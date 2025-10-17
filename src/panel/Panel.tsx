import React, { useState, useEffect } from 'react';
import { GenerateRequest, BrandVoice, UserSettings, AIProvider } from '../types';

interface ContextData {
  type: 'compose' | 'reply' | null;
  tweetContext?: {
    text: string;
    username: string;
  };
}

const Panel: React.FC = () => {
  const [context, setContext] = useState<ContextData>({ type: null });
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string | string[]>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isThread, setIsThread] = useState(false);
  const [threadLength, setThreadLength] = useState(5);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<UserSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    // Load settings and brand voices
    loadInitialData();

    // Listen for context from content script
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'context') {
      setContext({
        type: event.data.context,
        tweetContext: event.data.tweetContext,
      });

      // Pre-fill prompt for replies
      if (event.data.context === 'reply' && event.data.tweetContext) {
        setPrompt(`Reply to @${event.data.tweetContext.username}'s tweet about: "${event.data.tweetContext.text.substring(0, 50)}..."`);
      }
    }
  };

  const loadInitialData = async () => {
    try {
      // Get settings
      const settingsResponse = await chrome.runtime.sendMessage({
        type: 'get-settings',
      });

      if (settingsResponse.success) {
        setSettings(settingsResponse.data);
        setSelectedVoiceId(settingsResponse.data.defaultBrandVoiceId || '');
      }

      const voicesResponse = await chrome.runtime.sendMessage({
        type: 'list-brand-voices',
      });

      if (voicesResponse.success) {
        const voices: BrandVoice[] = Array.isArray(voicesResponse.data)
          ? voicesResponse.data
          : [];
        setBrandVoices(voices);

        if (voices.length > 0) {
          const defaultId = settingsResponse.success ? settingsResponse.data.defaultBrandVoiceId : undefined;
          const hasDefault = defaultId ? voices.some((voice) => voice.id === defaultId) : false;

          if (!hasDefault) {
            setSelectedVoiceId(voices[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!selectedVoiceId) {
      setError('Please select a brand voice');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: GenerateRequest = {
        prompt,
        brandVoiceId: selectedVoiceId,
        isThread,
        threadLength: isThread ? threadLength : undefined,
      };

      // If replying, analyze the profile first
      if (context.type === 'reply' && context.tweetContext) {
        // For now, skip profile analysis in MVP
        // In full version, we'd fetch and analyze tweets here
      }

      const response = await chrome.runtime.sendMessage({
        type: 'generate',
        payload: request,
      });

      if (response.success) {
        setGeneratedContent(response.data.content);
      } else {
        setError(response.error || 'Generation failed');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = () => {
    const contentToInsert = Array.isArray(generatedContent)
      ? generatedContent.join('\n\n')
      : generatedContent;

    window.parent.postMessage(
      {
        type: 'insert-tweet',
        content: contentToInsert,
      },
      '*'
    );
  };

  const handleClose = () => {
    window.parent.postMessage({ type: 'close-panel' }, '*');
  };

  const openSettingsPanel = () => {
    setSettingsMessage(null);
    setSettingsError(null);
    const defaults: UserSettings = {
      apiKeys: {},
      analysisDepth: 20,
      defaultProvider: undefined,
      defaultBrandVoiceId: undefined,
      claudeAuthType: undefined,
      claudeCookie: undefined,
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

    const baseSettings: UserSettings = settings
      ? {
          ...defaults,
          ...settings,
          apiKeys: { ...defaults.apiKeys, ...settings.apiKeys },
          ui: { ...defaults.ui, ...settings.ui },
          features: { ...defaults.features, ...settings.features },
        }
      : defaults;

    setSettingsDraft({
      ...baseSettings,
      apiKeys: { ...baseSettings.apiKeys },
      ui: { ...baseSettings.ui },
      features: { ...baseSettings.features },
    });
    setIsSettingsOpen(true);
  };

  const closeSettingsPanel = () => {
    setIsSettingsOpen(false);
    setSettingsDraft(null);
    setSettingsMessage(null);
    setSettingsError(null);
  };

  const updateTopLevelSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettingsDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const updateUiSetting = <K extends keyof UserSettings['ui']>(key: K, value: UserSettings['ui'][K]) => {
    setSettingsDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ui: {
          ...prev.ui,
          [key]: value,
        },
      };
    });
  };

  const updateFeatureSetting = <K extends keyof UserSettings['features']>(
    key: K,
    value: UserSettings['features'][K]
  ) => {
    setSettingsDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        features: {
          ...prev.features,
          [key]: value,
        },
      };
    });
  };

  const updateApiKey = (provider: keyof UserSettings['apiKeys'], value: string) => {
    setSettingsDraft((prev) => {
      if (!prev) return prev;
      const sanitized = value.trim();
      return {
        ...prev,
        apiKeys: {
          ...prev.apiKeys,
          [provider]: sanitized || undefined,
        },
      };
    });
  };

  const handleSaveSettings = async () => {
    if (!settingsDraft) {
      return;
    }

    setIsSavingSettings(true);
    setSettingsMessage(null);
    setSettingsError(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'save-settings',
        payload: settingsDraft,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to save settings');
      }

      const savedSettings: UserSettings = {
        ...settingsDraft,
        apiKeys: { ...settingsDraft.apiKeys },
        ui: { ...settingsDraft.ui },
        features: { ...settingsDraft.features },
      };

      setSettings(savedSettings);
      setSelectedVoiceId(savedSettings.defaultBrandVoiceId || selectedVoiceId);
      setSettingsMessage('Settings saved successfully');
      setTimeout(() => {
        closeSettingsPanel();
      }, 600);
    } catch (error: any) {
      setSettingsError(error.message || 'Unable to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const providerOptions: { label: string; value: AIProvider }[] = [
    { label: 'OpenAI', value: 'openai' },
    { label: 'Gemini', value: 'gemini' },
    { label: 'Claude', value: 'claude' },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold">AI Tweet Composer</h1>
          {settings?.defaultProvider && (
            <p className="text-xs text-gray-500">Default provider: {settings.defaultProvider}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openSettingsPanel}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium"
          >
            Settings
          </button>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {isSettingsOpen ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Extension Settings</h2>
            <button
              onClick={closeSettingsPanel}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">API Keys</h3>
                <p className="text-xs text-gray-500">Stored securely in your browser using encryption.</p>
              </div>
              <label className="block text-sm">
                <span className="text-gray-700">OpenAI API Key</span>
                <input
                  type="password"
                  value={settingsDraft?.apiKeys.openai || ''}
                  onChange={(e) => updateApiKey('openai', e.target.value)}
                  placeholder="sk-..."
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-700">Gemini API Key</span>
                <input
                  type="password"
                  value={settingsDraft?.apiKeys.gemini || ''}
                  onChange={(e) => updateApiKey('gemini', e.target.value)}
                  placeholder="AIza..."
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-gray-700">Default Provider</span>
                  <select
                    value={settingsDraft?.defaultProvider || ''}
                    onChange={(e) => updateTopLevelSetting('defaultProvider', e.target.value as AIProvider)}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select provider...</option>
                    {providerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="text-gray-700">Default Brand Voice</span>
                  <select
                    value={settingsDraft?.defaultBrandVoiceId || ''}
                    onChange={(e) => updateTopLevelSetting('defaultBrandVoiceId', e.target.value || undefined)}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select voice...</option>
                    {brandVoices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="text-gray-700">Analysis Depth</span>
                  <select
                    value={settingsDraft?.analysisDepth || 20}
                    onChange={(e) =>
                      updateTopLevelSetting('analysisDepth', Number(e.target.value) as UserSettings['analysisDepth'])
                    }
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[10, 20, 30, 50].map((depth) => (
                      <option key={depth} value={depth}>
                        {depth} tweets
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="text-gray-700">Panel Width</span>
                  <input
                    type="number"
                    min={320}
                    max={600}
                    value={settingsDraft?.ui.panelWidth || 400}
                    onChange={(e) =>
                      updateUiSetting('panelWidth', Math.max(320, Math.min(600, Number(e.target.value) || 400)))
                    }
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block text-sm">
                  <span className="text-gray-700">Panel Theme</span>
                  <select
                    value={settingsDraft?.ui.theme || 'auto'}
                    onChange={(e) => updateUiSetting('theme', e.target.value as UserSettings['ui']['theme'])}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="auto">Auto</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="text-gray-700">Button Position</span>
                  <select
                    value={settingsDraft?.ui.buttonPosition || 'top-right'}
                    onChange={(e) =>
                      updateUiSetting('buttonPosition', e.target.value as UserSettings['ui']['buttonPosition'])
                    }
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Features</h3>
              <label className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Auto analyze reply targets</span>
                <input
                  type="checkbox"
                  checked={settingsDraft?.features.autoAnalyze ?? true}
                  onChange={(e) => updateFeatureSetting('autoAnalyze', e.target.checked)}
                  className="rounded"
                />
              </label>
              <label className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Remember generation history</span>
                <input
                  type="checkbox"
                  checked={settingsDraft?.features.rememberHistory ?? true}
                  onChange={(e) => updateFeatureSetting('rememberHistory', e.target.checked)}
                  className="rounded"
                />
              </label>
              <label className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Show tone controls</span>
                <input
                  type="checkbox"
                  checked={settingsDraft?.features.showToneControls ?? true}
                  onChange={(e) => updateFeatureSetting('showToneControls', e.target.checked)}
                  className="rounded"
                />
              </label>
            </div>
          </div>

          {settingsError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{settingsError}</div>
          )}
          {settingsMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">{settingsMessage}</div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={closeSettingsPanel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              disabled={isSavingSettings}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings || !settingsDraft}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSavingSettings ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Context Info */}
          {context.type === 'reply' && context.tweetContext && (
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <p className="text-sm text-blue-900">
                Replying to <span className="font-semibold">@{context.tweetContext.username}</span>
              </p>
              <p className="text-xs text-blue-700 mt-1 line-clamp-2">
                {context.tweetContext.text}
              </p>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to say?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  context.type === 'reply'
                    ? 'Describe your reply intent...'
                    : 'Describe your tweet...'
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            {/* Thread Toggle */}
            {context.type === 'compose' && (
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isThread}
                    onChange={(e) => setIsThread(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Create thread</span>
                </label>
                {isThread && (
                  <input
                    type="number"
                    value={threadLength}
                    onChange={(e) => setThreadLength(Math.max(2, Math.min(10, parseInt(e.target.value) || 5)))}
                    min="2"
                    max="10"
                    className="w-16 p-1 border border-gray-300 rounded text-sm"
                  />
                )}
              </div>
            )}

            {/* Brand Voice Selector (placeholder) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Voice
              </label>
              <select
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a voice...</option>
                {brandVoices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim() || !selectedVoiceId}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </button>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Generated Content */}
            {generatedContent && !isLoading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Generated Content</h3>
                  <button
                    onClick={handleGenerate}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    Regenerate
                  </button>
                </div>

                {Array.isArray(generatedContent) ? (
                  <div className="space-y-2">
                    {generatedContent.map((tweet, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="text-xs text-gray-500 mb-1">Tweet {index + 1}</div>
                        <div className="text-sm">{tweet}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {tweet.length} characters
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-sm whitespace-pre-wrap">{generatedContent}</div>
                    <div className="text-xs text-gray-400 mt-2">
                      {generatedContent.length} characters
                    </div>
                  </div>
                )}

                {/* Insert Button */}
                <button
                  onClick={handleInsert}
                  className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  Insert to Twitter
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Powered by AI • Kotodama v1.0
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Panel;
