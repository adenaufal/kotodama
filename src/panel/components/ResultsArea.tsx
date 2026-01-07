import React from 'react';

interface ResultsAreaProps {
    generatedContent: string | string[];
    onInsert: (content?: string) => void;
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

    return (
        <div className="mt-8 koto-animate-fadeIn mb-8 px-8">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--koto-text-primary)' }}>Generated Output</h3>
                    <p className="text-[10px]" style={{ color: 'var(--koto-text-secondary)' }}>Review and insert into X</p>
                </div>
                <button
                    onClick={onRegenerate}
                    disabled={isLoading}
                    className="text-xs font-semibold flex items-center gap-1.5 transition-colors hover:opacity-80 disabled:opacity-50"
                    style={{ color: 'var(--koto-sakura-pink)' }}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                </button>
            </div>

            <div className="stack-sm">
                {isThread ? (
                    generatedContent.map((tweet, index) => (
                        <ResultItem
                            key={index}
                            content={tweet}
                            index={index + 1}
                            total={generatedContent.length}
                            onInsert={() => onInsert(tweet)}
                        />
                    ))
                ) : (
                    <ResultItem content={generatedContent as string} />
                )}

                <button
                    onClick={() => onInsert()}
                    className="w-full rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-transform active:scale-[0.99] mt-2 group flex items-center justify-center gap-2"
                    style={{
                        backgroundColor: 'var(--koto-success)',
                        boxShadow: '0 4px 12px rgba(52, 211, 153, 0.3)'
                    }}
                >
                    Insert {isThread ? 'All Tweets' : 'Tweet'}
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

const ResultItem: React.FC<{
    content: string;
    index?: number;
    total?: number;
    onInsert?: () => void;
}> = ({ content, index, total, onInsert }) => {
    const charCount = content.length;
    const isOverLimit = charCount > 280;

    return (
        <div className="group relative rounded-xl border p-4 transition-all hover:border-[var(--koto-border)] hover:shadow-md" style={{
            backgroundColor: 'var(--koto-bg-card)',
            borderColor: 'var(--koto-border)'
        }}>
            <div className="flex items-center justify-between mb-2">
                {index && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--koto-bg-dark)] px-2 py-0.5 rounded text-[var(--koto-text-secondary)]">
                        {index}/{total}
                    </span>
                )}
                <span className={`text-[10px] font-mono ml-auto ${isOverLimit ? 'text-[var(--koto-error)] font-bold' : 'text-[var(--koto-text-tertiary)]'}`}>
                    {charCount}/280
                </span>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--koto-text-primary)' }}>
                {content}
            </p>

            {onInsert && (
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onInsert}
                        className="p-1.5 rounded-lg bg-[var(--koto-success)] text-white shadow-md hover:translate-y-[-1px] transition-transform"
                        title="Insert this tweet only"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};
