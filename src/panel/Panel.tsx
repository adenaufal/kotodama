import React, { useState, useEffect } from 'react';
import { GenerateRequest, BrandVoice, UserSettings } from '../types';
import BrandVoiceManager from './BrandVoiceManager';

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
  const [showVoiceManager, setShowVoiceManager] = useState(false);

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
        setPrompt(
          `Reply to @${event.data.tweetContext.username}'s tweet about: "${event.data.tweetContext.text.substring(0, 50)}..."`
        );
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

    try {
      const request: GenerateRequest = {
        prompt,
        brandVoiceId: selectedVoiceId,
        isThread,
        threadLength: isThread ? threadLength : undefined,
      };

      if (context.type === 'reply' && context.tweetContext) {
        // Reserved for future profile analysis
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
    } catch (generateError: any) {
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

  const handleOpenVoiceManager = () => {
    setShowVoiceManager(true);
  };

  const handleCloseVoiceManager = () => {
    setShowVoiceManager(false);
  };

  const handleRefreshVoices = async () => {
    try {
      const voicesResponse = await chrome.runtime.sendMessage({ type: 'list-brand-voices' });

      if (voicesResponse.success) {
        const voices: BrandVoice[] = Array.isArray(voicesResponse.data) ? voicesResponse.data : [];
        setBrandVoices(voices);

        // If currently selected voice was deleted, reset to first available or empty
        if (selectedVoiceId && !voices.some((v) => v.id === selectedVoiceId)) {
          setSelectedVoiceId(voices.length > 0 ? voices[0].id : '');
        }
      }
    } catch (refreshError) {
      console.error('Failed to refresh brand voices:', refreshError);
    }
  };

  const hasGeneratedContent =
    (Array.isArray(generatedContent) && generatedContent.length > 0) ||
    (!!generatedContent && !Array.isArray(generatedContent));

  return (
    <>
      <div className="w-full min-h-screen bg-slate-950/5 text-slate-900">
        <div className="flex w-full flex-col h-full">
        <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 px-6 pb-14 pt-4 text-white shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_55%)]" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="stack-sm">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/70">Kotodama</p>
              <h1 className="text-2xl font-semibold leading-tight">AI Tweet Composer</h1>
              {settings?.defaultProvider && (
                <p className="text-xs text-white/70">
                  Default provider:{' '}
                  <span className="font-medium text-white">{settings.defaultProvider}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleOpenVoiceManager}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                aria-label="Manage brand voices"
                title="Manage brand voices"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={handleClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg text-white transition hover:bg-white/25"
                aria-label="Close panel"
              >
                &times;
              </button>
            </div>
          </div>

          {context.type === 'reply' && context.tweetContext && (
            <div className="relative z-10 mt-6 rounded-2xl border border-white/10 bg-white/15 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Replying to</p>
              <p className="mt-1 text-sm font-medium text-white">@{context.tweetContext.username}</p>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/80">{context.tweetContext.text}</p>
            </div>
          )}
        </div>

        <div className="-mt-10 flex-1 overflow-y-auto px-6 pb-0">
          <div className="stack rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-sm">
            <div className="stack">
              <div className="stack-sm">
                <label className="text-sm font-semibold text-slate-700">
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
                  className="min-h-[120px] w-full resize-none rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm leading-relaxed text-slate-800 shadow-inner outline-none transition focus:border-transparent focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-white"
                />
              </div>

              {context.type === 'compose' && (
                <div className="stack-sm rounded-2xl bg-slate-50/80 p-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={isThread}
                      onChange={(event) => setIsThread(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
                    />
                    Turn this into a thread
                  </label>
                  {isThread && (
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
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
                        className="h-8 w-16 rounded-full border border-slate-200 bg-white px-2 text-center text-sm font-semibold text-slate-900 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="stack-sm">
                <label className="text-sm font-semibold text-slate-700">Brand voice</label>
                <div className="relative">
                  <select
                    value={selectedVoiceId}
                    onChange={(event) => setSelectedVoiceId(event.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 px-4 py-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-white"
                  >
                    <option value="">Select a voice...</option>
                    {brandVoices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    v
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt.trim() || !selectedVoiceId}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  {isLoading ? 'Crafting magic...' : 'Generate with AI'}
                </button>
                <button
                  onClick={() => {
                    setPrompt('');
                    setGeneratedContent('');
                    setError(null);
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  type="button"
                >
                  Clear
                </button>
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-600 shadow-sm">
                  {error}
                </div>
              )}

              {hasGeneratedContent && !isLoading && (
                <div className="stack">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Generated suggestions</h3>
                      <p className="text-xs text-slate-500">
                        Click insert to drop your favorite version into X.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerate}
                      className="text-sm font-semibold text-indigo-500 transition hover:text-indigo-600"
                    >
                      Regenerate
                    </button>
                  </div>

                  {Array.isArray(generatedContent) ? (
                    <div className="stack-sm">
                      {generatedContent.map((tweet, index) => (
                        <div
                          key={index}
                          className="stack-sm rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <span>Suggestion {index + 1}</span>
                            <span>{tweet.length} characters</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{tweet}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="stack-sm rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <span>Suggested copy</span>
                        <span>{generatedContent.length} characters</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{generatedContent}</p>
                    </div>
                  )}

                  <button
                    onClick={handleInsert}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    Insert to X
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Powered by Kotodama - Crafted with AI assistance
          </div>
        </div>
      </div>
    </div>

    {showVoiceManager && (
      <BrandVoiceManager
        voices={brandVoices}
        onClose={handleCloseVoiceManager}
        onRefresh={handleRefreshVoices}
      />
    )}
  </>
  );
};

export default Panel;
