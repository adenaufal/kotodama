import React, { useState, useEffect } from 'react';
import { GenerateRequest, BrandVoice, UserSettings } from '../types';
import { PanelHeader } from './components/PanelHeader';
import { ContextArea } from './components/ContextArea';
import { InputArea } from './components/InputArea';
import { ResultsArea } from './components/ResultsArea';
import { ReplyTemplate } from '../constants/templates';

interface ContextData {
  type: 'compose' | 'reply' | null;
  tweetContext?: {
    text: string;
    username: string;
  };
}

type TweetLength = 'short' | 'medium' | 'long';

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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [tweetLengthPreset, setTweetLengthPreset] = useState<TweetLength>('short');

  useEffect(() => {
    loadInitialData();
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'context') {
      console.log('[Kotodama Panel] Received context:', {
        type: event.data.context,
        hasTweetContext: !!event.data.tweetContext,
        tweetContext: event.data.tweetContext,
      });

      setContext({
        type: event.data.context,
        tweetContext: event.data.tweetContext,
      });

      if (event.data.context === 'reply' && event.data.tweetContext) {
        setPrompt('');
      }
    }
  };

  const loadInitialData = async () => {
    try {
      const settingsResponse = await chrome.runtime.sendMessage({ type: 'get-settings' });

      if (settingsResponse.success) {
        setSettings(settingsResponse.data);
        setSelectedVoiceId(settingsResponse.data.defaultBrandVoiceId || '');
        if (settingsResponse.data.ui?.theme) {
          setTheme(settingsResponse.data.ui.theme === 'auto' ? 'dark' : settingsResponse.data.ui.theme);
        }
      }

      const voicesResponse = await chrome.runtime.sendMessage({ type: 'list-brand-voices' });

      if (voicesResponse.success) {
        const voices: BrandVoice[] = Array.isArray(voicesResponse.data) ? voicesResponse.data : [];
        setBrandVoices(voices);

        if (voices.length > 0) {
          const defaultId = settingsResponse.success ? settingsResponse.data.defaultBrandVoiceId : undefined;
          const hasDefault = defaultId ? voices.some((voice) => voice.id === defaultId) : false;

          if (!hasDefault) {
            setSelectedVoiceId(voices[0].id);
          }
        }
      }
    } catch (loadError) {
      console.error('Failed to load initial data:', loadError);
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
    setGeneratedContent(''); // Clear previous results

    console.time('[Kotodama Performance] AI generation');
    const startTime = performance.now();

    try {
      const charLimits = {
        short: { min: 100, max: 150, description: 'punchy and concise' },
        medium: { min: 150, max: 220, description: 'balanced length' },
        long: { min: 220, max: 280, description: 'detailed but within Twitter\'s limit' },
      };
      const limit = charLimits[tweetLengthPreset];

      let enhancedPrompt = prompt;
      if (context.type === 'reply' && context.tweetContext) {
        enhancedPrompt = `You are replying to @${context.tweetContext.username}'s tweet.

Original tweet: "${context.tweetContext.text}"

User's instructions: ${prompt}

Write a reply that:
1. Responds directly to the original tweet
2. Maintains the brand voice
3. Is conversational and engaging
4. Is ${limit.description} (${limit.min}-${limit.max} characters)`;
      } else {
        enhancedPrompt = `${prompt}

Keep the tweet ${limit.description} (${limit.min}-${limit.max} characters).`;
      }

      const request: GenerateRequest = {
        prompt: enhancedPrompt,
        brandVoiceId: selectedVoiceId,
        isThread,
        threadLength: isThread ? threadLength : undefined,
      };

      const response = await chrome.runtime.sendMessage({
        type: 'generate',
        payload: request,
      });

      if (response.success) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.timeEnd('[Kotodama Performance] AI generation');
        console.log(`[Kotodama] Gen took ${duration.toFixed(0)}ms`);

        let cleanedContent = response.data.content;
        if (typeof cleanedContent === 'string') {
          cleanedContent = cleanedContent.replace(/^["'](.*)["']$/s, '$1').trim();
        } else if (Array.isArray(cleanedContent)) {
          cleanedContent = cleanedContent.map(tweet =>
            tweet.replace(/^["'](.*)["']$/s, '$1').trim()
          );
        }

        setGeneratedContent(cleanedContent);
      } else {
        setError(response.error || 'Generation failed');
      }
    } catch (generateError: any) {
      setError(generateError.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = (content?: string) => {
    let text: string;

    if (typeof content === 'string') {
      text = content;
    } else if (typeof generatedContent === 'string') {
      text = generatedContent;
    } else if (Array.isArray(generatedContent) && generatedContent.length > 0) {
      text = generatedContent.join('\n\n');
    } else {
      return;
    }

    window.parent.postMessage(
      {
        type: 'insert-tweet',
        content: text,
      },
      '*'
    );
  };

  const handleClose = () => {
    window.parent.postMessage({ type: 'close-panel' }, '*');
  };

  const handleOpenSettings = () => {
    chrome.runtime.sendMessage({ type: 'open-settings' });
  };

  const handleToggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    if (settings) {
      const updatedSettings: UserSettings = {
        ...settings,
        ui: {
          ...settings.ui,
          theme: newTheme as 'light' | 'dark',
        },
      };

      try {
        await chrome.runtime.sendMessage({
          type: 'save-settings',
          payload: updatedSettings,
        });
        setSettings(updatedSettings);
      } catch (err) {
        console.error('Failed to save theme preference:', err);
      }
    }
  };

  const handleTemplateClick = (template: ReplyTemplate) => {
    setPrompt(template.prompt);
  };

  return (
    <div className={`w-full h-screen overflow-hidden flex flex-col font-sans transition-colors duration-300 ${theme === 'light' ? 'light-mode' : ''}`}
      style={{ backgroundColor: 'var(--koto-bg-dark)' }}>

      <PanelHeader
        theme={theme}
        settings={settings}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={handleOpenSettings}
        onClose={handleClose}
      />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <ContextArea
          context={context}
          onTemplateSelect={handleTemplateClick}
        />

        {error && (
          <div className="mx-8 mt-4 rounded-xl border px-4 py-3 text-sm flex items-center gap-2 koto-animate-fadeIn relative z-10" style={{
            borderColor: 'var(--koto-error)',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            color: 'var(--koto-error)'
          }}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {!generatedContent ? (
            <InputArea
              prompt={prompt}
              setPrompt={setPrompt}
              lengthPreset={tweetLengthPreset}
              setLengthPreset={setTweetLengthPreset}
              isThread={isThread}
              setIsThread={setIsThread}
              threadLength={threadLength}
              setThreadLength={setThreadLength}
              voices={brandVoices}
              selectedVoiceId={selectedVoiceId}
              setSelectedVoiceId={setSelectedVoiceId}
              isLoading={isLoading}
              onGenerate={handleGenerate}
              onClear={() => {
                setPrompt('');
                setError(null);
              }}
              contextType={context.type}
            />
          ) : (
            <ResultsArea
              generatedContent={generatedContent}
              onInsert={handleInsert}
              onRegenerate={handleGenerate}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Panel;
