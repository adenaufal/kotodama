import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquareOff, Sparkles } from 'lucide-react';

import type {
    AnalyzeContextResponse,
    BrandVoice,
    GenerateRequest,
    GenerateResponse,
    TweetContext,
    UserSettings,
} from '../types';
import { REPLY_TEMPLATES } from '../constants/templates';
import { sanitizePrompt } from '../utils/sanitize';
import { sendRuntimeMessage, isRuntimeValid, watchRuntimeValidity, createUserErrorMessage } from '../utils/runtime';

import { SolidContainer } from './components/Layout/SolidContainer';
import { PanelHeader } from './components/Layout/PanelHeader';
import { ContextCard, SummaryState } from './components/Context/ContextCard';
import { AutoTextarea } from './components/Input/AutoTextarea';
import { VoiceSelector } from './components/Input/VoiceSelector';
import { TemplateSelector } from './components/Input/TemplateSelector';
import { LengthSlider, LengthOption } from './components/Input/LengthSlider';
import { TonePresetButtons } from './components/Input/TonePresetButtons';
import { Button } from './components/Shared/Button';
import { ResultCarousel } from './components/Output/ResultCarousel';
import { TonePreset, calculateToneAdjustment } from './utils/toneModifiers';

interface ContextData {
    type?: 'reply' | null;
    tweetContext?: TweetContext;
}

interface PanelProps {
    initialContext?: ContextData;
    onClose?: () => void;
    onInsert?: (content: string) => void;
}

const LENGTH_HINT: Record<LengthOption, string> = {
    short: 'one or two sentences, under 120 characters',
    medium: 'around 120-200 characters',
    long: 'up to 280 characters',
};

const Panel: React.FC<PanelProps> = ({ initialContext, onClose, onInsert }) => {
    const tweetContext = initialContext?.tweetContext;

    const [prompt, setPrompt] = useState('');
    const [drafts, setDrafts] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [retryingIndex, setRetryingIndex] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
    const [selectedVoiceId, setSelectedVoiceId] = useState('');
    const [length, setLength] = useState<LengthOption>('short');
    const [tonePresets, setTonePresets] = useState<TonePreset[]>([]);

    const [summary, setSummary] = useState<SummaryState>({ status: 'idle' });
    const [runtimeInvalidated, setRuntimeInvalidated] = useState(false);

    // --- boot -------------------------------------------------------------
    useEffect(() => {
        if (!isRuntimeValid()) {
            setRuntimeInvalidated(true);
            return;
        }

        (async () => {
            const [settingsRes, voicesRes] = await Promise.all([
                sendRuntimeMessage({ type: 'get-settings' }),
                sendRuntimeMessage({ type: 'list-brand-voices' }),
            ]);

            const loaded = settingsRes.success ? (settingsRes.data as UserSettings) : null;
            if (loaded) setSettings(loaded);

            if (voicesRes.success && Array.isArray(voicesRes.data)) {
                setBrandVoices(voicesRes.data);
                setSelectedVoiceId(
                    voicesRes.data.find((v: BrandVoice) => v.id === loaded?.defaultBrandVoiceId)?.id ??
                    voicesRes.data[0]?.id ??
                    ''
                );
            }
        })().catch((err) => console.error('Failed to load panel data:', err));

        return watchRuntimeValidity(() => setRuntimeInvalidated(true));
    }, []);

    // --- context summary --------------------------------------------------
    const analyzeContext = useCallback(async (context: TweetContext) => {
        setSummary({ status: 'loading' });
        try {
            const res = await sendRuntimeMessage({ type: 'analyze-context', payload: { context } });
            if (!res.success) throw new Error(res.error);
            const data = res.data as AnalyzeContextResponse;
            setSummary({ status: 'ready', text: data.summary, visionFailed: data.visionFailed });
        } catch {
            // Never blocks the job: the tweet, its images and Generate all stay usable.
            setSummary({ status: 'error' });
        }
    }, []);

    useEffect(() => {
        if (tweetContext) analyzeContext(tweetContext);
    }, [tweetContext, analyzeContext]);

    // --- generation -------------------------------------------------------
    const runGenerate = async (replaceIndex: number | null) => {
        if (!tweetContext || !selectedVoiceId || !prompt.trim()) return;

        if (replaceIndex === null) setGenerating(true);
        else setRetryingIndex(replaceIndex);
        setError(null);

        try {
            const request: GenerateRequest = {
                prompt: `${sanitizePrompt(prompt)}. Keep the reply ${LENGTH_HINT[length]}.`,
                brandVoiceId: selectedVoiceId,
                replyContext: tweetContext,
                contextSummary: summary.status === 'ready' ? summary.text : undefined,
                toneAdjustment: tonePresets.length ? calculateToneAdjustment(tonePresets) : undefined,
                provider: settings?.defaultProvider,
            };

            const res = await sendRuntimeMessage({ type: 'generate', payload: request });
            if (!res.success) throw new Error(res.error || 'Generation failed');

            const content = (res.data as GenerateResponse).content.replace(/^["'](.*)["']$/s, '$1').trim();

            if (replaceIndex === null) {
                setDrafts((prev) => [content, ...prev]);
                setSelectedIndex(0);
            } else {
                setDrafts((prev) => prev.map((d, i) => (i === replaceIndex ? content : d)));
            }
        } catch (err) {
            setError(createUserErrorMessage(err));
        } finally {
            setGenerating(false);
            setRetryingIndex(null);
        }
    };

    const noVoices = brandVoices.length === 0;
    const canGenerate = !!tweetContext && !!selectedVoiceId && !!prompt.trim() && !generating;

    return (
        <SolidContainer>
            {runtimeInvalidated && (
                <div className="absolute inset-0 z-50 grid place-items-center bg-canvas/90 p-6 text-center">
                    <div>
                        <h2 className="text-sm font-medium text-ink">Extension was reloaded</h2>
                        <p className="mt-1 text-xs text-faint">Refresh the page to keep going.</p>
                        <Button className="mt-4" onClick={() => window.location.reload()}>
                            Refresh page
                        </Button>
                    </div>
                </div>
            )}

            <PanelHeader
                username={tweetContext?.username}
                onClose={() => onClose?.()}
                onOpenSettings={() => sendRuntimeMessage({ type: 'open-settings' })}
            />

            {/* Zone 2: the only scroller. */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                {tweetContext ? (
                    <ContextCard
                        context={tweetContext}
                        summary={summary}
                        onRetrySummary={() => analyzeContext(tweetContext)}
                    />
                ) : (
                    <div className="rounded-koto border border-line bg-surface p-4 text-center">
                        <MessageSquareOff className="mx-auto size-5 text-faint" strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] text-ink">No tweet in view</p>
                        <p className="mt-0.5 text-xs text-faint">
                            Open a tweet, then hit the sparkle to draft a reply.
                        </p>
                    </div>
                )}

                {drafts.length || generating ? (
                    <ResultCarousel
                        results={drafts}
                        selectedIndex={selectedIndex}
                        retryingIndex={retryingIndex}
                        generating={generating}
                        onSelect={setSelectedIndex}
                        onInsert={(content) => onInsert?.(content)}
                        onRetry={(index) => runGenerate(index)}
                    />
                ) : (
                    <div className="rounded-koto border border-dashed border-line p-4 text-center">
                        <Sparkles className="mx-auto size-5 text-faint" strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] text-muted">No drafts yet</p>
                        <div className="mt-3">
                            <TemplateSelector templates={REPLY_TEMPLATES} onSelect={(t) => setPrompt(t.prompt)} />
                        </div>
                    </div>
                )}
            </div>

            {/* Zone 3: pinned composer. */}
            <div className="shrink-0 space-y-2 border-t border-line p-3">
                <div className="rounded-koto border border-line bg-surface p-2 transition-colors duration-150 focus-within:border-accent">
                    <label className="sr-only" htmlFor="koto-intent">
                        What you want to say back
                    </label>
                    <AutoTextarea
                        id="koto-intent"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Per-reply knobs. */}
                <div className="flex items-center justify-between gap-2">
                    <TonePresetButtons
                        activePresets={tonePresets}
                        onToggle={(preset) =>
                            setTonePresets((prev) =>
                                prev.includes(preset) ? prev.filter((p) => p !== preset) : [...prev, preset]
                            )
                        }
                    />
                    <LengthSlider value={length} onChange={setLength} className="w-[104px] shrink-0" />
                </div>

                {/* Bottom edge: who I am, not how this one sounds. */}
                <div className="flex items-center justify-between gap-2">
                    <VoiceSelector voices={brandVoices} selectedId={selectedVoiceId} onSelect={setSelectedVoiceId} />
                    {noVoices && (
                        <button
                            type="button"
                            onClick={() => sendRuntimeMessage({ type: 'open-settings' })}
                            className="text-xs text-muted underline underline-offset-2 transition-colors duration-150 ease-out hover:text-ink"
                        >
                            Add a brand voice
                        </button>
                    )}
                </div>

                {error && <p role="alert" className="text-xs text-danger">{error}</p>}

                <Button className="w-full" disabled={!canGenerate} onClick={() => runGenerate(null)}>
                    <Sparkles className="size-4" strokeWidth={2} />
                    {generating ? 'Writing…' : 'Generate reply'}
                </Button>
            </div>
        </SolidContainer>
    );
};

export default Panel;
