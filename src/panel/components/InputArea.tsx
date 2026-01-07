import React from 'react';
import { BrandVoice } from '../../types';

interface InputAreaProps {
    prompt: string;
    setPrompt: (value: string) => void;
    lengthPreset: 'short' | 'medium' | 'long';
    setLengthPreset: (value: 'short' | 'medium' | 'long') => void;
    isThread: boolean;
    setIsThread: (value: boolean) => void;
    threadLength: number;
    setThreadLength: (value: number) => void;
    voices: BrandVoice[];
    selectedVoiceId: string;
    setSelectedVoiceId: (value: string) => void;
    isLoading: boolean;
    onGenerate: () => void;
    onClear: () => void;
    contextType: 'compose' | 'reply' | null;
}

export const InputArea: React.FC<InputAreaProps> = ({
    prompt,
    setPrompt,
    lengthPreset,
    setLengthPreset,
    isThread,
    setIsThread,
    threadLength,
    setThreadLength,
    voices,
    selectedVoiceId,
    setSelectedVoiceId,
    isLoading,
    onGenerate,
    onClear,
    contextType,
}) => {
    return (
        <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto">
            <div className="stack relative z-0">
                <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: 'var(--koto-text-secondary)' }}>
                    Your Instruction
                </label>

                <div className="relative group">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={
                            contextType === 'reply'
                                ? "How do you want to reply? (e.g. 'Politely disagree and offer an alternative suggestion')"
                                : "What's on your mind? (e.g. 'A tweet about the future of AI coding assistants')"
                        }
                        className="w-full min-h-[140px] resize-none rounded-2xl p-4 text-sm leading-relaxed outline-none transition-all duration-200 border border-transparent focus:border-[var(--koto-sakura-pink)] focus:ring-4 focus:ring-[var(--koto-sakura-pink)]/10"
                        style={{
                            backgroundColor: 'var(--koto-bg-input)',
                            color: 'var(--koto-text-primary)'
                        }}
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                        {prompt && (
                            <button
                                onClick={onClear}
                                className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded bg-[var(--koto-bg-card)] hover:bg-[var(--koto-error)]/10 hover:text-[var(--koto-error)] transition-colors"
                                style={{ color: 'var(--koto-text-tertiary)' }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="stack-sm">
                <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: 'var(--koto-text-secondary)' }}>
                    Configuration
                </label>

                <div className="grid grid-cols-2 gap-3">
                    {/* Brand Voice Selector */}
                    <div className="relative col-span-2 sm:col-span-1">
                        <select
                            value={selectedVoiceId}
                            onChange={(e) => setSelectedVoiceId(e.target.value)}
                            className="w-full appearance-none rounded-xl border px-4 py-3 text-xs font-semibold shadow-sm outline-none transition-all focus:border-[var(--koto-sakura-pink)]"
                            style={{
                                borderColor: 'var(--koto-border)',
                                backgroundColor: 'var(--koto-bg-card)',
                                color: 'var(--koto-text-primary)'
                            }}
                        >
                            <option value="">Select Voice...</option>
                            {voices.map((voice) => (
                                <option key={voice.id} value={voice.id}>
                                    {voice.name}
                                </option>
                            ))}
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px]" style={{ color: 'var(--koto-text-tertiary)' }}>
                            ▼
                        </span>
                    </div>

                    {/* Length Selector */}
                    <div className="flex bg-[var(--koto-bg-card)] rounded-xl border p-1 col-span-2 sm:col-span-1" style={{ borderColor: 'var(--koto-border)' }}>
                        {(['short', 'medium', 'long'] as const).map((len) => (
                            <button
                                key={len}
                                onClick={() => setLengthPreset(len)}
                                className={`flex-1 rounded-lg text-[10px] font-bold uppercase tracking-wide py-2 transition-all ${lengthPreset === len
                                        ? 'bg-[var(--koto-sakura-pink)] text-white shadow-sm'
                                        : 'text-[var(--koto-text-secondary)] hover:bg-[var(--koto-bg-dark)]'
                                    }`}
                            >
                                {len}
                            </button>
                        ))}
                    </div>
                </div>

                {contextType === 'compose' && (
                    <div className="flex items-center justify-between rounded-xl border px-4 py-3 transition-colors hover:border-[var(--koto-border)]"
                        style={{ borderColor: 'var(--koto-border)', backgroundColor: 'var(--koto-bg-card)' }}
                    >
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isThread ? 'bg-[var(--koto-sakura-pink)] border-[var(--koto-sakura-pink)]' : 'border-[var(--koto-border)]'}`}>
                                {isThread && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <input
                                type="checkbox"
                                checked={isThread}
                                onChange={(e) => setIsThread(e.target.checked)}
                                className="hidden"
                            />
                            <span className="text-xs font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Create Thread</span>
                        </label>

                        {isThread && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium uppercase" style={{ color: 'var(--koto-text-secondary)' }}>Count:</span>
                                <input
                                    type="number"
                                    value={threadLength}
                                    onChange={(e) => setThreadLength(Math.max(2, Math.min(10, parseInt(e.target.value) || 2)))}
                                    className="w-12 rounded-lg border px-2 py-1 text-center text-xs font-bold outline-none focus:border-[var(--koto-sakura-pink)]"
                                    style={{
                                        backgroundColor: 'var(--koto-bg-dark)',
                                        borderColor: 'var(--koto-border)',
                                        color: 'var(--koto-text-primary)'
                                    }}
                                    min="2"
                                    max="10"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button
                onClick={onGenerate}
                disabled={isLoading || !prompt.trim() || !selectedVoiceId}
                className="relative overflow-hidden w-full group rounded-xl py-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99]"
                style={{
                    background: isLoading || !prompt.trim() || !selectedVoiceId
                        ? 'var(--koto-border)'
                        : 'linear-gradient(135deg, var(--koto-sakura-pink), #ec4899)',
                    boxShadow: isLoading || !prompt.trim() || !selectedVoiceId
                        ? 'none'
                        : '0 8px 20px -4px rgba(236, 72, 153, 0.5)'
                }}
            >
                <span className="relative z-10 flex items-center justify-center gap-2 text-sm font-bold tracking-wide text-white">
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Thinking...
                        </>
                    ) : (
                        <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Generate Magic
                        </>
                    )}
                </span>
            </button>
        </div>
    );
};
