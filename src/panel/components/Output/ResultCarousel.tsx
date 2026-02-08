import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ResultCard } from './ResultCard';
import { Button } from '../Shared/Button';
import { RefreshCw, ArrowLeft } from 'lucide-react';

interface ResultCarouselProps {
    results: string | string[];
    onInsert: (content: string) => void;
    onRegenerate: () => void;
    onBack: () => void;
}

export const ResultCarousel: React.FC<ResultCarouselProps> = ({
    results,
    onInsert,
    onRegenerate,
    onBack
}) => {
    const resultArray = Array.isArray(results) ? results : [results];

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 px-1">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to edit
                </button>

                <span className="text-sm font-medium text-slate-400">
                    {resultArray.length} variation{resultArray.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-4 space-y-4">
                <AnimatePresence mode="popLayout">
                    {resultArray.map((result, index) => (
                        <ResultCard
                            key={index}
                            index={index}
                            content={result}
                            onInsert={onInsert}
                            onCopy={handleCopy}
                        />
                    ))}
                </AnimatePresence>
            </div>

            <div className="pt-4 border-t border-slate-200 mt-auto">
                <Button
                    variant="secondary"
                    onClick={onRegenerate}
                    className="w-full"
                    icon={<RefreshCw className="w-4 h-4" />}
                >
                    Try Again
                </Button>
            </div>
        </div>
    );
};
