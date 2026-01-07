import React, { useState, useEffect } from 'react';
import { GenerateRequest, BrandVoice, UserSettings } from '../types';
import { PanelHeader } from './components/PanelHeader';
import { ContextArea } from './components/ContextArea';
import { InputArea } from './components/InputArea';
import { ResultsArea } from './components/ResultsArea';
import { ReplyTemplate } from '../constants/templates';
import { sanitizePrompt, sanitizeTweetContext, escapeForPrompt } from '../utils/sanitize';
import { sendRuntimeMessage, isRuntimeValid, watchRuntimeValidity, createUserErrorMessage } from '../utils/runtime';

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
  const [runtimeInvalidated, setRuntimeInvalidated] = useState(false);

  useEffect(() => {
    // Check runtime validity before loading
    if (!isRuntimeValid()) {
      setRuntimeInvalidated(true);
      setError('Extension context invalidated. Please reload this page.');
      return;
    }

    loadInitialData();
    window.addEventListener('message', handleMessage);

    // Watch for runtime invalidation
    const stopWatching = watchRuntimeValidity(() => {
      setRuntimeInvalidated(true);
      setError('Extension was reloaded. Please refresh this page to continue.');
    });

    return () => {
      window.removeEventListener('message', handleMessage);
      stopWatching();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+Enter to generate
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isLoading && !generatedContent) {
          handleGenerate();
        } else if (generatedContent) {
          handleInsert();
        }
      }
      // Escape to close panel
      if (e.key === 'Escape') {
        e.preventDefault();
        if (generatedContent) {
          // If showing results, go back to input
          setGeneratedContent('');
        } else {
          // Otherwise close the panel
          handleClose();
        }
      }
      // Cmd/Ctrl+Shift+R to regenerate
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'r') {
        e.preventDefault();
        if (generatedContent && !isLoading) {
          setGeneratedContent('');
          handleGenerate();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, generatedContent, prompt, selectedVoiceId]);

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
    console.log('[Kotodama Panel] Loading initial data...');
    try {
      const settingsResponse = await sendRuntimeMessage(
        { type: 'get-settings' },
        {
          onRetry: (attempt) => {
            console.log(`[Kotodama Panel] Retrying get-settings (attempt ${attempt})...`);
          }
        }
      );

      console.log('[Kotodama Panel] Settings response:', {
        success: settingsResponse.success,
        hasOpenAiKey: settingsResponse.success && !!settingsResponse.data?.apiKeys?.openai,
        defaultBrandVoiceId: settingsResponse.data?.defaultBrandVoiceId
      });

      if (settingsResponse.success) {
        setSettings(settingsResponse.data);
        setSelectedVoiceId(settingsResponse.data.defaultBrandVoiceId || '');
        if (settingsResponse.data.ui?.theme) {
          setTheme(settingsResponse.data.ui.theme === 'auto' ? 'dark' : settingsResponse.data.ui.theme);
        }
      } else {
        console.error('[Kotodama Panel] Failed to load settings:', settingsResponse.error);
      }

      const voicesResponse = await sendRuntimeMessage(
        { type: 'list-brand-voices' },
        {
          onRetry: (attempt) => {
            console.log(`[Kotodama Panel] Retrying list-brand-voices (attempt ${attempt})...`);
          }
        }
      );

      console.log('[Kotodama Panel] Brand voices response:', {
        success: voicesResponse.success,
        voiceCount: voicesResponse.success && Array.isArray(voicesResponse.data) ? voicesResponse.data.length : 0
      });

      if (voicesResponse.success) {
        const voices: BrandVoice[] = Array.isArray(voicesResponse.data) ? voicesResponse.data : [];
        setBrandVoices(voices);

        if (voices.length === 0) {
          console.warn('[Kotodama Panel] No brand voices found! User needs to create one in settings.');
        } else {
          console.log('[Kotodama Panel] Loaded brand voices:', voices.map(v => ({ id: v.id, name: v.name })));
        }

        if (voices.length > 0) {
          const defaultId = settingsResponse.success ? settingsResponse.data.defaultBrandVoiceId : undefined;
          const hasDefault = defaultId ? voices.some((voice) => voice.id === defaultId) : false;

          if (!hasDefault) {
            console.log('[Kotodama Panel] No default voice or default not found, selecting first voice');
            setSelectedVoiceId(voices[0].id);
          } else {
            console.log('[Kotodama Panel] Using default brand voice:', defaultId);
          }
        }
      } else {
        console.error('[Kotodama Panel] Failed to load brand voices:', voicesResponse.error);
      }

      console.log('[Kotodama Panel] Initial data loaded successfully');
    } catch (loadError: any) {
      console.error('[Kotodama Panel] Failed to load initial data:', loadError);
      const userMessage = createUserErrorMessage(loadError);
      setError(userMessage);

      // Mark runtime as invalidated if it's a context error
      if (userMessage.includes('reload') || userMessage.includes('refresh')) {
        setRuntimeInvalidated(true);
      }
    }
  };

  const handleGenerate = async () => {
    console.log('[Kotodama Panel] Starting generation...');

    // Sanitize and validate prompt
    const sanitizedPrompt = sanitizePrompt(prompt);
    if (!sanitizedPrompt.trim()) {
      console.warn('[Kotodama Panel] Empty prompt');
      setError('Please enter a prompt');
      return;
    }

    if (!selectedVoiceId) {
      console.warn('[Kotodama Panel] No brand voice selected');
      setError('Please select a brand voice');
      return;
    }

    console.log('[Kotodama Panel] Generation request:', {
      promptLength: sanitizedPrompt.length,
      brandVoiceId: selectedVoiceId,
      isThread,
      threadLength: isThread ? threadLength : undefined,
      contextType: context.type
    });

    setIsLoading(true);
    setError(null);
    setGeneratedContent(''); // Clear previous results

    const startTime = performance.now();

    try {
      const charLimits = {
        short: { min: 100, max: 150, description: 'punchy and concise' },
        medium: { min: 150, max: 220, description: 'balanced length' },
        long: { min: 220, max: 280, description: 'detailed but within Twitter\'s limit' },
      };
      const limit = charLimits[tweetLengthPreset];

      let enhancedPrompt = sanitizedPrompt;
      if (context.type === 'reply' && context.tweetContext) {
        // Sanitize tweet context to prevent prompt injection
        const safeContext = sanitizeTweetContext(context.tweetContext);
        const escapedText = escapeForPrompt(safeContext.text);
        const escapedUsername = escapeForPrompt(safeContext.username);

        enhancedPrompt = `You are replying to @${escapedUsername}'s tweet.

Original tweet: "${escapedText}"

User's instructions: ${sanitizedPrompt}

Write a reply that:
1. Responds directly to the original tweet
2. Maintains the brand voice
3. Is conversational and engaging
4. Is ${limit.description} (${limit.min}-${limit.max} characters)`;
      } else {
        enhancedPrompt = `${sanitizedPrompt}

Keep the tweet ${limit.description} (${limit.min}-${limit.max} characters).`;
      }

      const request: GenerateRequest = {
        prompt: enhancedPrompt,
        brandVoiceId: selectedVoiceId,
        isThread,
        threadLength: isThread ? threadLength : undefined,
      };

      console.log('[Kotodama Panel] Sending generate message to background...');
      console.time('[Kotodama Panel] Generation');

      const response = await sendRuntimeMessage(
        {
          type: 'generate',
          payload: request,
        },
        {
          maxRetries: 1, // Limit retries for generation as it's expensive
          onRetry: (attempt, error) => {
            console.log(`[Kotodama Panel] Retrying generation (attempt ${attempt})...`, error);
          }
        }
      );

      console.timeEnd('[Kotodama Panel] Generation');
      console.log('[Kotodama Panel] Received response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error
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
        console.log('[Kotodama Panel] Content set successfully');
      } else {
        console.error('[Kotodama Panel] Generation failed:', response.error);
        setError(response.error || 'Generation failed');
      }
    } catch (generateError: any) {
      console.error('[Kotodama Panel] Exception during generation:', generateError);
      const userMessage = createUserErrorMessage(generateError);
      setError(userMessage);

      // Mark runtime as invalidated if it's a context error
      if (userMessage.includes('reload') || userMessage.includes('refresh')) {
        setRuntimeInvalidated(true);
      }
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

    // Use specific origin instead of wildcard for security
    const targetOrigin = window.location.ancestorOrigins?.[0] || 'https://twitter.com';
    window.parent.postMessage(
      {
        type: 'insert-tweet',
        content: text,
      },
      targetOrigin
    );
  };

  const handleClose = () => {
    const targetOrigin = window.location.ancestorOrigins?.[0] || 'https://twitter.com';
    window.parent.postMessage({ type: 'close-panel' }, targetOrigin);
  };

  const handleOpenSettings = async () => {
    try {
      await sendRuntimeMessage({ type: 'open-settings' });
    } catch (error: any) {
      const userMessage = createUserErrorMessage(error);
      setError(userMessage);
    }
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
        await sendRuntimeMessage({
          type: 'save-settings',
          payload: updatedSettings,
        });
        setSettings(updatedSettings);
      } catch (err: any) {
        console.error('Failed to save theme preference:', err);
        const userMessage = createUserErrorMessage(err);
        setError(userMessage);
      }
    }
  };

  const handleTemplateClick = (template: ReplyTemplate) => {
    setPrompt(template.prompt);
  };

  return (
    <div className={`w-full h-full overflow-hidden flex flex-col font-sans transition-colors duration-300 ${theme === 'light' ? 'light-mode' : ''}`}
      style={{
        backgroundColor: 'var(--koto-bg-dark)',
        // Add a subtle gradient overlay to the whole panel
        backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.03), rgba(255,255,255,0))',
      }}>

      {runtimeInvalidated && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[100000] flex items-center justify-center p-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Extension Reloaded
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The Kotodama extension was updated or reloaded. Please refresh this page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

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
          <div className="mx-6 mt-4 rounded-xl border px-4 py-3 text-sm flex items-center gap-3 koto-animate-fadeIn relative z-10 shadow-sm" style={{
            borderColor: 'rgba(244, 67, 54, 0.2)',
            backgroundColor: 'rgba(244, 67, 54, 0.05)',
            color: 'var(--koto-error)'
          }}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
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
