import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// Types & Utilities
import { GenerateRequest, BrandVoice, UserSettings, TweetContext } from '../types';
import { REPLY_TEMPLATES, TWEET_TEMPLATES } from '../constants/templates';
import { sanitizePrompt } from '../utils/sanitize';
import { sendRuntimeMessage, isRuntimeValid, watchRuntimeValidity, createUserErrorMessage } from '../utils/runtime';

// Components
import { SolidContainer } from './components/Layout/SolidContainer';
import { PanelHeader } from './components/Layout/PanelHeader';
import { AutoTextarea } from './components/Input/AutoTextarea';
import { VoiceSelector } from './components/Input/VoiceSelector';
import { TemplateSelector } from './components/Input/TemplateSelector';
import { LengthSlider, LengthOption } from './components/Input/LengthSlider';
import { Button } from './components/Shared/Button';
import { ResultCarousel } from './components/Output/ResultCarousel';

interface ContextData {
  type: 'compose' | 'reply' | null;
  tweetContext?: TweetContext;
}

interface PanelProps {
  initialContext?: ContextData;
  onClose?: () => void;
  onInsert?: (content: string) => void;
}

const Panel: React.FC<PanelProps> = ({
  initialContext = { type: null },
  onClose,
  onInsert
}) => {
  // State
  const [context, setContext] = useState<ContextData>(initialContext);
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string | string[]>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings State
  const [_settings, setSettings] = useState<UserSettings | null>(null);
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [tweetLength, setTweetLength] = useState<LengthOption>('short');
  // selectedModelId and customModelId removed as they are now global settings

  const [runtimeInvalidated, setRuntimeInvalidated] = useState(false);

  // Update context when prop changes
  useEffect(() => {
    if (initialContext) {
      setContext(initialContext);
    }
  }, [initialContext]);

  // Initialization
  useEffect(() => {
    if (!isRuntimeValid()) {
      setRuntimeInvalidated(true);
      setError('Extension context invalidated. Please reload.');
      return;
    }

    loadInitialData();
    // Removed window.addEventListener('message') as we now use props

    const stopWatching = watchRuntimeValidity(() => {
      setRuntimeInvalidated(true);
      setError('Extension was reloaded. Please refresh.');
    });

    return () => {
      stopWatching();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [settingsRes, voicesRes] = await Promise.all([
        sendRuntimeMessage({ type: 'get-settings' }),
        sendRuntimeMessage({ type: 'list-brand-voices' })
      ]);

      if (settingsRes.success) {
        const settings = settingsRes.data as UserSettings;
        setSettings(settings);
        setSelectedVoiceId(settings.defaultBrandVoiceId || '');
        // No longer managing local model state here
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

      const request: GenerateRequest = {
        prompt: sanitizedPrompt,
        brandVoiceId: selectedVoiceId,
        provider: 'openai', // Default to OpenAI for now
        // Model ID is now handled by the background script using user settings
      };

      if (context.type === 'reply' && context.tweetContext) {
        // Pass full context to backend for better prompting
        request.replyContext = context.tweetContext as any;
      }

      // Append length constraint
      request.prompt = `${request.prompt}. Keep it ${tweetLength} (${charLimit} chars).`;

      // 2. Send API Call
      const response = await sendRuntimeMessage({
        type: 'generate',
        payload: request
      });

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
    onInsert?.(content);
  };

  const handleClose = () => {
    onClose?.();
  };

  const hasResults = !!generatedContent && generatedContent.length > 0;

  return (
    <div className="w-full h-full p-4 flex items-center justify-center">
      <SolidContainer>
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
                <div className="pt-4 pb-2 border-b border-zinc-800 light:border-zinc-200">
                  <VoiceSelector
                    voices={brandVoices}
                    selectedId={selectedVoiceId}
                    onSelect={setSelectedVoiceId}
                  />
                </div>

                {/* Template Selector */}
                <div className="pt-2 pb-2">
                  <TemplateSelector
                    templates={context.type === 'reply' ? REPLY_TEMPLATES : TWEET_TEMPLATES}
                    onSelect={(t) => setPrompt(t.prompt)}
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
                  <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-800 light:border-zinc-200">
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
      </SolidContainer>
    </div>
  );
};

export default Panel;
