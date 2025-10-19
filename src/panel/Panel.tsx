import React, { useState, useEffect } from 'react';
import { GenerateRequest, BrandVoice, UserSettings } from '../types';
import { getModelById } from '../constants/models';

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

  useEffect(() => {
    loadInitialData();
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

      if (event.data.context === 'reply' && event.data.tweetContext) {
        // Don't set the prompt automatically - let user see context and write their own
        // The context card will show the full tweet
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

    console.time('[Kotodama Performance] AI generation');
    const startTime = performance.now();

    try {
      // Build the prompt with context if replying
      let enhancedPrompt = prompt;
      if (context.type === 'reply' && context.tweetContext) {
        enhancedPrompt = `You are replying to @${context.tweetContext.username}'s tweet.

Original tweet: "${context.tweetContext.text}"

User's instructions: ${prompt}

Write a reply that:
1. Responds directly to the original tweet
2. Maintains the brand voice
3. Is conversational and engaging`;
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
        console.log(`[Kotodama Performance] Generation took ${duration.toFixed(0)}ms`);
        console.log(`[Kotodama Performance] Provider: ${response.data.provider}`);
        console.log(`[Kotodama Performance] Token usage: ${response.data.tokenUsage || 'N/A'}`);

        setGeneratedContent(response.data.content);
      } else {
        setError(response.error || 'Generation failed');
      }
    } catch (generateError: any) {
      console.timeEnd('[Kotodama Performance] AI generation');
      setError(generateError.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = () => {
    if (!generatedContent) {
      return;
    }

    const text =
      typeof generatedContent === 'string'
        ? generatedContent
        : generatedContent.join('\n\n');

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
    // Open the extension settings page in a new tab
    chrome.runtime.sendMessage({ type: 'open-settings' });
  };

  const hasGeneratedContent =
    (Array.isArray(generatedContent) && generatedContent.length > 0) ||
    (!!generatedContent && !Array.isArray(generatedContent));

  return (
    <>
      <div className="w-full min-h-screen text-slate-900" style={{ backgroundColor: 'var(--koto-bg-dark)' }}>
        <div className="flex w-full flex-col h-full">
        <div className="relative overflow-hidden rounded-b-3xl px-6 pb-14 pt-4 text-white shadow-lg" style={{
          backgroundColor: 'var(--koto-deep-indigo)',
          boxShadow: 'var(--koto-shadow-md)'
        }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="stack-sm">
              <p className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color: 'var(--koto-text-secondary)' }}>Kotodama</p>
              <h1 className="text-2xl font-semibold leading-tight" style={{ color: 'var(--koto-text-primary)' }}>AI Tweet Composer</h1>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--koto-text-secondary)' }}>
                {settings?.defaultProvider && (
                  <span>
                    Provider:{' '}
                    <span className="font-medium" style={{ color: 'var(--koto-text-primary)' }}>{settings.defaultProvider}</span>
                  </span>
                )}
                {settings?.defaultModel && getModelById(settings.defaultModel) && (
                  <span>
                    Model:{' '}
                    <span className="font-medium" style={{ color: 'var(--koto-text-primary)' }}>{getModelById(settings.defaultModel)?.name}</span>
                  </span>
                )}
                {!settings?.defaultModel && (
                  <span>
                    Model:{' '}
                    <span className="font-medium" style={{ color: 'var(--koto-text-primary)' }}>Auto</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleOpenSettings}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 koto-button-hover"
                aria-label="Open settings"
                title="Open settings"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={handleClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg text-white transition hover:bg-white/25 koto-button-hover"
                aria-label="Close panel"
              >
                &times;
              </button>
            </div>
          </div>

          {context.type === 'reply' && context.tweetContext && (
            <div className="relative z-10 mt-6 rounded-2xl border p-4 backdrop-blur koto-animate-fadeIn" style={{
              borderColor: 'var(--koto-border)',
              backgroundColor: 'rgba(54, 59, 82, 0.5)'
            }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--koto-text-secondary)' }}>Replying to</p>
              <p className="mt-1 text-sm font-medium" style={{ color: 'var(--koto-text-primary)' }}>@{context.tweetContext.username}</p>
              <p className="mt-2 max-h-32 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--koto-text-secondary)' }}>{context.tweetContext.text}</p>
            </div>
          )}
        </div>

        <div className="-mt-10 flex-1 overflow-y-auto px-6 pb-0">
          <div className="stack rounded-3xl border p-6 shadow-2xl backdrop-blur-sm" style={{
            borderColor: 'var(--koto-border)',
            backgroundColor: 'var(--koto-surface)',
            boxShadow: 'var(--koto-shadow-lg)'
          }}>
            <div className="stack">
              <div className="stack-sm">
                <label className="text-sm font-semibold" style={{ color: 'var(--koto-text-primary)' }}>
                  What would you like to share?
                </label>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={
                    context.type === 'reply'
                      ? 'Briefly describe the tone or key points for your reply...'
                      : 'Share the idea, tone, or key points you want your tweet to convey...'
                  }
                  className="min-h-[120px] w-full resize-none rounded-2xl border p-4 text-sm leading-relaxed shadow-inner outline-none transition"
                  style={{
                    borderColor: 'var(--koto-border)',
                    backgroundColor: 'var(--koto-bg-dark)',
                    color: 'var(--koto-text-primary)'
                  }}
                />
              </div>

              {context.type === 'compose' && (
                <div className="stack-sm rounded-2xl p-4" style={{ backgroundColor: 'rgba(26, 29, 46, 0.5)' }}>
                  <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--koto-text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={isThread}
                      onChange={(event) => setIsThread(event.target.checked)}
                      className="h-4 w-4 rounded"
                      style={{ accentColor: 'var(--koto-sakura-pink)' }}
                    />
                    Turn this into a thread
                  </label>
                  {isThread && (
                    <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium" style={{
                      borderColor: 'var(--koto-border)',
                      backgroundColor: 'var(--koto-bg-dark)',
                      color: 'var(--koto-text-primary)'
                    }}>
                      <span>Posts:</span>
                      <input
                        type="number"
                        value={threadLength}
                        onChange={(event) =>
                          setThreadLength(
                            Math.max(2, Math.min(10, parseInt(event.target.value, 10) || 5))
                          )
                        }
                        min="2"
                        max="10"
                        className="h-8 w-16 rounded-full border px-2 text-center text-sm font-semibold outline-none"
                        style={{
                          borderColor: 'var(--koto-border)',
                          backgroundColor: 'var(--koto-bg-dark)',
                          color: 'var(--koto-text-primary)'
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="stack-sm">
                <label className="text-sm font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Brand voice</label>
                <div className="relative">
                  <select
                    value={selectedVoiceId}
                    onChange={(event) => setSelectedVoiceId(event.target.value)}
                    className="w-full appearance-none rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm outline-none transition"
                    style={{
                      borderColor: 'var(--koto-border)',
                      backgroundColor: 'var(--koto-bg-dark)',
                      color: 'var(--koto-text-primary)'
                    }}
                  >
                    <option value="">Select a voice...</option>
                    {brandVoices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center" style={{ color: 'var(--koto-text-secondary)' }}>
                    v
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt.trim() || !selectedVoiceId}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition koto-button-hover focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                  style={{
                    backgroundColor: isLoading || !prompt.trim() || !selectedVoiceId ? 'var(--koto-border)' : 'var(--koto-sakura-pink)',
                    boxShadow: isLoading || !prompt.trim() || !selectedVoiceId ? 'none' : '0 4px 12px rgba(232, 92, 143, 0.3)'
                  }}
                >
                  {isLoading ? 'Crafting magic...' : 'Generate with AI'}
                </button>
                <button
                  onClick={() => {
                    setPrompt('');
                    setGeneratedContent('');
                    setError(null);
                  }}
                  className="inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold transition koto-button-hover focus:outline-none"
                  style={{
                    borderColor: 'var(--koto-border)',
                    color: 'var(--koto-text-secondary)'
                  }}
                  type="button"
                >
                  Clear
                </button>
              </div>

              {error && (
                <div className="rounded-2xl border px-4 py-3 text-sm shadow-sm koto-animate-fadeIn" style={{
                  borderColor: 'var(--koto-error)',
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  color: 'var(--koto-error)'
                }}>
                  {error}
                </div>
              )}

              {hasGeneratedContent && !isLoading && (
                <div className="stack koto-animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Generated suggestions</h3>
                      <p className="text-xs" style={{ color: 'var(--koto-text-secondary)' }}>
                        Click insert to drop your favorite version into X.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerate}
                      className="text-sm font-semibold transition"
                      style={{ color: 'var(--koto-sakura-pink)' }}
                    >
                      Regenerate
                    </button>
                  </div>

                  {Array.isArray(generatedContent) ? (
                    <div className="stack-sm">
                      {generatedContent.map((tweet, index) => (
                        <div
                          key={index}
                          className="stack-sm rounded-2xl border p-4 shadow-sm"
                          style={{
                            borderColor: 'var(--koto-border)',
                            backgroundColor: 'var(--koto-bg-dark)'
                          }}
                        >
                          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--koto-text-secondary)' }}>
                            <span>Suggestion {index + 1}</span>
                            <span>{tweet.length} characters</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--koto-text-primary)' }}>{tweet}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="stack-sm rounded-2xl border p-4 shadow-sm" style={{
                      borderColor: 'var(--koto-border)',
                      backgroundColor: 'var(--koto-bg-dark)'
                    }}>
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--koto-text-secondary)' }}>
                        <span>Suggested copy</span>
                        <span>{generatedContent.length} characters</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--koto-text-primary)' }}>{generatedContent}</p>
                    </div>
                  )}

                  <button
                    onClick={handleInsert}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition koto-button-hover focus:outline-none"
                    style={{
                      backgroundColor: 'var(--koto-success)',
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                    }}
                  >
                    Insert to X
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center text-xs" style={{ color: 'var(--koto-text-secondary)' }}>
            Powered by Kotodama - Crafted with AI assistance
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Panel;
