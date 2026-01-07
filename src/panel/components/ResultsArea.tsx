import React, { useState } from 'react';

interface ResultsAreaProps {
    generatedContent: string | string[];
    onInsert: (content?: string, delay?: number) => void;
    onRegenerate: () => void;
    isLoading: boolean;
}

export const ResultsArea: React.FC<ResultsAreaProps> = ({
    generatedContent,
    onInsert,
    onRegenerate,
    isLoading,
}) => {
    if (!generatedContent || (Array.isArray(generatedContent) && generatedContent.length === 0)) {
        return null;
    }

    const isThread = Array.isArray(generatedContent);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // Could add a toast notification here if we had a toast system ready
            // For now, the button state change in ResultItem handles feedback
        });
    };

    const [threadDelay, setThreadDelay] = useState(2);

    return (
        <div className="mt-6 koto-animate-fadeIn mb-8 px-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold tracking-wide" style={{ color: 'var(--koto-text-primary)' }}>
                        <span role="img" aria-label="sparkles" className="mr-2">✨</span>
                        Generated Output
                    </h3>
                    <p className="text-[10px] mt-0.5 font-medium" style={{ color: 'var(--koto-text-secondary)' }}>Review and refine before inserting</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onReset}
                        disabled={isLoading}
                        className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-[var(--koto-bg-input)] active:scale-95 disabled:opacity-50"
                        style={{ color: 'var(--koto-text-secondary)' }}
                        title="Start over with a new prompt"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New
                    </button>
                    <button
                        onClick={onRegenerate}
                        disabled={isLoading}
                        className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-[rgba(236,72,153,0.1)] active:scale-95 disabled:opacity-50"
                        style={{ color: 'var(--koto-sakura-pink)' }}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Regenerate
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {isThread ? (
                    generatedContent.map((tweet, index) => (
                        <ResultItem
                            key={index}
                            content={tweet}
                            index={index + 1}
                            total={generatedContent.length}
                            onInsert={() => onInsert(tweet)}
                            onCopy={() => handleCopy(tweet)}
                        />
                    ))
                ) : (
                    <ResultItem
                        content={generatedContent as string}
                        onCopy={() => handleCopy(generatedContent as string)}
                    />
                )}

                <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-[var(--koto-bg-dark)] via-[var(--koto-bg-dark)] to-transparent z-10 pb-2 flex flex-col gap-3">
                    {isThread && (
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-medium" style={{ color: 'var(--koto-text-secondary)' }}>
                                Thread Delay (seconds)
                            </span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={threadDelay}
                                    onChange={(e) => setThreadDelay(Math.max(1, Math.min(10, parseInt(e.target.value) || 2)))}
                                    className="w-16 px-2 py-1 text-center text-xs rounded-lg border focus:outline-none focus:ring-1 transition-all"
                                    style={{
                                        backgroundColor: 'var(--koto-bg-input)',
                                        borderColor: 'var(--koto-border)',
                                        color: 'var(--koto-text-primary)'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => onInsert(undefined, threadDelay)}
                        className="w-full rounded-xl py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all transform hover:shadow-xl active:scale-[0.99] group flex items-center justify-center gap-2 overflow-hidden relative"
                        style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)', // Emerald gradient
                            boxShadow: '0 8px 20px -6px rgba(16, 185, 129, 0.5)'
                        }}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative flex items-center gap-2">
                            Insert {isThread ? 'All Tweets' : 'Tweet'}
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const ResultItem: React.FC<{
    content: string;
    index?: number;
    total?: number;
    onInsert?: () => void;
    onCopy?: () => void;
}> = ({ content, index, total, onInsert, onCopy }) => {
    const [copied, setCopied] = useState(false);
    const charCount = content.length;
    const isOverLimit = charCount > 280;

    const handleCopyClick = () => {
        if (onCopy) {
            onCopy();
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="group relative rounded-xl border p-5 transition-all duration-300 hover:border-[var(--koto-sakura-pink)] hover:shadow-lg hover:shadow-[rgba(236,72,153,0.05)]" style={{
            backgroundColor: 'var(--koto-bg-card)',
            borderColor: 'var(--koto-border)'
        }}>
            <div className="flex items-center justify-between mb-3">
                {index && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-[var(--koto-bg-input)] border border-[var(--koto-border)] px-2 py-0.5 rounded-full text-[var(--koto-text-secondary)]">
                        {index} / {total}
                    </span>
                )}
                <div className="ml-auto flex items-center gap-3">
                    <span className={`text-[10px] font-mono font-medium ${isOverLimit ? 'text-[var(--koto-error)]' : 'text-[var(--koto-text-tertiary)]'}`}>
                        {charCount} / 280
                    </span>
                </div>
            </div>

            <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-normal" style={{ color: 'var(--koto-text-primary)' }}>
                {content}
            </p>

            {/* Action Overlay - Visible on Hover */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                <button
                    onClick={handleCopyClick}
                    className="p-1.5 rounded-lg bg-[var(--koto-bg-input)] border border-[var(--koto-border)] text-[var(--koto-text-secondary)] hover:text-[var(--koto-text-primary)] hover:border-[var(--koto-text-secondary)] transition-colors shadow-sm"
                    title="Copy text"
                >
                    {copied ? (
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>

                {onInsert && (
                    <button
                        onClick={onInsert}
                        className="p-1.5 rounded-lg bg-[var(--koto-success)] text-white shadow-md hover:brightness-110 hover:-translate-y-0.5 transition-all"
                        title="Insert this tweet only"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};
