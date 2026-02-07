import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// Types & Utilities
import { GenerateRequest, BrandVoice, UserSettings } from '../types';
import { sanitizePrompt, sanitizeTweetContext } from '../utils/sanitize';
import { sendRuntimeMessage, isRuntimeValid, watchRuntimeValidity, createUserErrorMessage } from '../utils/runtime';

// Components
import { GlassContainer } from './components/Layout/GlassContainer';
import { PanelHeader } from './components/Layout/PanelHeader';
import { AutoTextarea } from './components/Input/AutoTextarea';
import { VoiceSelector } from './components/Input/VoiceSelector';
import { LengthSlider, LengthOption } from './components/Input/LengthSlider';
import { Button } from './components/Shared/Button';
import { ResultCarousel } from './components/Output/ResultCarousel';

interface ContextData {
  type: 'compose' | 'reply' | null;
  tweetContext?: {
    text: string;
    username: string;
  };
}

const Panel: React.FC = () => {
  // State
  const [context, setContext] = useState<ContextData>({ type: null });
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string | string[]>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings State
  const [_settings, setSettings] = useState<UserSettings | null>(null);
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [tweetLength, setTweetLength] = useState<LengthOption>('short');
  const [modelMode, setModelMode] = useState<'fast' | 'smart'>('fast');
  const [runtimeInvalidated, setRuntimeInvalidated] = useState(false);

  // Initialization
  useEffect(() => {
    if (!isRuntimeValid()) {
      setRuntimeInvalidated(true);
      setError('Extension context invalidated. Please reload.');
      return;
    }

    loadInitialData();
    window.addEventListener('message', handleMessage);

    const stopWatching = watchRuntimeValidity(() => {
      setRuntimeInvalidated(true);
      setError('Extension was reloaded. Please refresh.');
    });

    return () => {
      window.removeEventListener('message', handleMessage);
      stopWatching();
    };
  }, []);

  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'context') {
      setContext({
        type: event.data.context,
        tweetContext: event.data.tweetContext,
      });
      if (event.data.context === 'reply' && event.data.tweetContext) {
        // Optional: clear prompt or set default
      }
    }
  };

  const loadInitialData = async () => {
    try {
      const [settingsRes, voicesRes] = await Promise.all([
        sendRuntimeMessage({ type: 'get-settings' }),
        sendRuntimeMessage({ type: 'list-brand-voices' })
      ]);

      if (settingsRes.success) {
        setSettings(settingsRes.data);
        setSelectedVoiceId(settingsRes.data.defaultBrandVoiceId || '');
      }

      if (voicesRes.success && Array.isArray(voicesRes.data)) {
        setBrandVoices(voicesRes.data);
        if (!selectedVoiceId && voicesRes.data.length > 0) {
          setSelectedVoiceId(voicesRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  // Logic
  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedVoiceId) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Prepare Request
      const sanitizedPrompt = sanitizePrompt(prompt);
      const charLimit = tweetLength === 'short' ? '100-150' : tweetLength === 'medium' ? '150-220' : '220-280';

      let enhancedPrompt = sanitizedPrompt;
      if (context.type === 'reply' && context.tweetContext) {
        const safeContext = sanitizeTweetContext(context.tweetContext);
        enhancedPrompt = `Reply to @${safeContext.username}: "${safeContext.text}". User instruction: ${sanitizedPrompt}. Keep it ${tweetLength} (${charLimit} chars).`;
      } else {
        enhancedPrompt = `${sanitizedPrompt}. Keep it ${tweetLength} (${charLimit} chars).`;
      }

      const request: GenerateRequest = {
        prompt: enhancedPrompt,
        brandVoiceId: selectedVoiceId,
        // TODO: Pass model mode if backend supports it
      };

      // 2. Send API Call
      const response = await sendRuntimeMessage({ type: 'generate', payload: request });

      if (response.success) {
        let content = response.data.content;
        // Basic cleanup
        if (typeof content === 'string') {
          content = content.replace(/^["'](.*)["']$/s, '$1').trim();
        }
        setGeneratedContent(content);
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (err: any) {
      setError(createUserErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = (content: string) => {
    const targetOrigin = window.location.ancestorOrigins?.[0] || 'https://twitter.com';
    window.parent.postMessage({ type: 'insert-tweet', content }, targetOrigin);
  };

  const handleClose = () => {
    const targetOrigin = window.location.ancestorOrigins?.[0] || 'https://twitter.com';
    window.parent.postMessage({ type: 'close-panel' }, targetOrigin);
  };

  const hasResults = !!generatedContent && generatedContent.length > 0;

  return (
    <div className="w-full h-full p-4 flex items-center justify-center">
      <GlassContainer>
        {/* Runtime Error Overlay */}
        {runtimeInvalidated && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-6 text-center">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Extension Reloaded</h3>
              <p className="text-white/60 mb-4">Please refresh the page.</p>
              <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </div>
          </div>
        )}

        <PanelHeader
          onClose={handleClose}
          onOpenSettings={() => sendRuntimeMessage({ type: 'open-settings' })}
          context={context}
          modelMode={modelMode}
          toggleModel={() => setModelMode(m => m === 'fast' ? 'smart' : 'fast')}
        />

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {!hasResults ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                {/* Voice Selector */}
                <div className="pt-4 pb-2 border-b border-white/5">
                  <VoiceSelector
                    voices={brandVoices}
                    selectedId={selectedVoiceId}
                    onSelect={setSelectedVoiceId}
                  />
                </div>

                {/* Main Input Area */}
                <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                  <div className="flex-1 min-h-[120px]">
                    <AutoTextarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      contextType={context.type}
                      autoFocus
                    />
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                    <div className="w-[180px]">
                      <LengthSlider value={tweetLength} onChange={setTweetLength} />
                    </div>

                    <Button
                      onClick={handleGenerate}
                      isLoading={isLoading}
                      disabled={!prompt.trim() || !selectedVoiceId}
                      icon={<Sparkles className="w-4 h-4" />}
                      className="px-8 shadow-blue-500/20"
                    >
                      Generate
                    </Button>
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                      {error}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full p-6"
              >
                <ResultCarousel
                  results={generatedContent}
                  onInsert={handleInsert}
                  onRegenerate={handleGenerate}
                  onBack={() => setGeneratedContent('')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassContainer>
    </div>
  );
};

export default Panel;
