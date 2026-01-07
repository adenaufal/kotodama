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
        <div className="flex-1 flex flex-col gap-5 p-6 overflow-y-auto">
            {/* Input Section */}
            <div className="relative group z-0">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--koto-text-secondary)' }}>
                    Your Instruction
                </label>

                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={
                            contextType === 'reply'
                                ? "How shall we reply? (e.g. 'Politely disagree and offer an alternative suggestion')"
                                : "What's on your mind? (e.g. 'A tweet about the future of AI coding assistants')"
                        }
                        className="w-full min-h-[140px] resize-none rounded-2xl p-4 text-[15px] leading-relaxed outline-none transition-all duration-300 border focus:ring-4"
                        style={{
                            backgroundColor: 'var(--koto-bg-input)',
                            color: 'var(--koto-text-primary)',
                            borderColor: 'transparent',
                            // Dynamic box shadow for focus will be handled by class if possible, or inline
                            // Note: using custom props for focus ring colors as they might not be in tailwind config
                        }}
                    />
                    {/* Subtle focus ring simulation via css variables or classes is best, assuming tailwind config is minimal */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
            textarea:focus {
              border-color: var(--koto-sakura-pink);
              box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.15);
            }
            textarea::placeholder {
              color: var(--koto-text-tertiary);
              opacity: 0.7;
            }
          `}} />

                    {/* Clear Button */}
                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {prompt && (
                            <button
                                onClick={onClear}
                                className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95"
                                style={{
                                    backgroundColor: 'var(--koto-bg-card)',
                                    color: 'var(--koto-text-tertiary)',
                                    border: '1px solid var(--koto-border)'
                                }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Configuration Section */}
            <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--koto-text-secondary)' }}>
                    Configuration
                </label>

                <div className="grid grid-cols-2 gap-3">
                    {/* Brand Voice Selector */}
                    <div className="relative col-span-1">
                        {voices.length === 0 ? (
                            <div className="w-full h-full rounded-xl border border-dashed px-4 py-3 text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-[rgba(236,72,153,0.05)]"
                                onClick={() => chrome.runtime.sendMessage({ type: 'open-settings' })}
                                style={{
                                    borderColor: 'var(--koto-sakura-pink)',
                                    color: 'var(--koto-text-secondary)'
                                }}
                            >
                                <svg className="w-4 h-4" style={{ color: 'var(--koto-sakura-pink)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Add Voice</span>
                            </div>
                        ) : (
                            <div className="relative h-full">
                                <select
                                    value={selectedVoiceId}
                                    onChange={(e) => setSelectedVoiceId(e.target.value)}
                                    className="w-full h-full appearance-none rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm outline-none transition-all cursor-pointer focus:border-[var(--koto-sakura-pink)] focus:ring-2 focus:ring-[var(--koto-sakura-pink)]/20"
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
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Length Selector */}
                    <div className="flex bg-[var(--koto-bg-card)] rounded-xl border p-1 col-span-1 h-12" style={{ borderColor: 'var(--koto-border)' }}>
                        {(['short', 'medium', 'long'] as const).map((len) => (
                            <button
                                key={len}
                                onClick={() => setLengthPreset(len)}
                                className={`flex-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all duration-200 relative overflow-hidden ${lengthPreset === len
                                    ? 'text-white shadow-md'
                                    : 'text-[var(--koto-text-secondary)] hover:bg-[var(--koto-bg-input)]'
                                    }`}
                                style={lengthPreset === len ? {
                                    background: 'linear-gradient(135deg, var(--koto-sakura-pink), #ec4899)'
                                } : {}}
                            >
                                {len}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Thread Toggle (Conditional) */}
                {contextType === 'compose' && (
                    <div className="mt-3 flex items-center justify-between rounded-xl border px-4 py-2.5 transition-all duration-200 hover:border-[var(--koto-sakura-pink)] hover:bg-[var(--koto-bg-card)]/50 cursor-pointer"
                        style={{
                            borderColor: isThread ? 'var(--koto-sakura-pink)' : 'var(--koto-border)',
                            backgroundColor: isThread ? 'rgba(236,72,153,0.03)' : 'var(--koto-bg-card)'
                        }}
                        onClick={() => setIsThread(!isThread)}
                    >
                        <div className="flex items-center gap-3 select-none">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300 ${isThread ? 'bg-[var(--koto-sakura-pink)] border-[var(--koto-sakura-pink)] scale-110' : 'border-[var(--koto-border)] bg-[var(--koto-bg-input)]'}`}>
                                <svg className={`w-3 h-3 text-white transition-opacity duration-200 ${isThread ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className={`text-sm font-semibold transition-colors ${isThread ? 'text-[var(--koto-sakura-pink)]' : 'text-[var(--koto-text-primary)]'}`}>Create Thread</span>
                        </div>

                        <div
                            className={`flex items-center gap-2 transition-all duration-300 ${isThread ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="number"
                                value={threadLength}
                                onChange={(e) => setThreadLength(Math.max(2, Math.min(10, parseInt(e.target.value) || 2)))}
                                className="w-12 rounded-lg border px-2 py-1 text-center text-xs font-bold outline-none focus:border-[var(--koto-sakura-pink)] text-[var(--koto-text-primary)] bg-[var(--koto-bg-input)]"
                                style={{ borderColor: 'var(--koto-border)' }}
                                min="2"
                                max="10"
                            />
                            <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--koto-text-secondary)' }}>Tweets</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-auto space-y-3 pt-2">
                <button
                    onClick={onGenerate}
                    disabled={isLoading || !prompt.trim() || !selectedVoiceId}
                    className="relative overflow-hidden w-full group rounded-xl py-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] hover:shadow-xl"
                    style={{
                        background: isLoading || !prompt.trim() || !selectedVoiceId
                            ? 'var(--koto-border)'
                            : 'linear-gradient(135deg, var(--koto-sakura-pink) 0%, #d946ef 100%)',
                        boxShadow: isLoading || !prompt.trim() || !selectedVoiceId
                            ? 'none'
                            : '0 8px 25px -6px rgba(217, 70, 239, 0.5)'
                    }}
                >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] skew-x-[-15deg] group-hover:animate-[shine_1s_ease-in-out_infinite]" />

                    <span className="relative z-10 flex items-center justify-center gap-2 text-sm font-bold tracking-wide text-white">
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Crafting magic...
                            </>
                        ) : (
                            <>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                                Generate Tweet
                            </>
                        )}
                    </span>
                </button>

                {/* Keyboard shortcuts hint */}
                <div className="flex justify-center gap-4 text-[9px] font-semibold tracking-wider opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--koto-text-tertiary)' }}>
                    <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--koto-bg-card)] border border-[var(--koto-border)] font-sans">⌘</kbd>
                        <span>+</span>
                        <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--koto-bg-card)] border border-[var(--koto-border)] font-sans">Enter</kbd>
                        <span className="ml-1">to run</span>
                    </span>
                </div>
            </div>
        </div>
    );
};
