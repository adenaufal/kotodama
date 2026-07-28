import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ResultCard, DraftSkeleton } from './ResultCard';

interface ResultCarouselProps {
    results: string[];
    selectedIndex: number;
    retryingIndex: number | null;
    generating: boolean;
    onSelect: (index: number) => void;
    onInsert: (content: string) => void;
    onRetry: (index: number) => void;
}

/** Zone 2b: the drafts, newest first. */
export const ResultCarousel: React.FC<ResultCarouselProps> = ({
    results,
    selectedIndex,
    retryingIndex,
    generating,
    onSelect,
    onInsert,
    onRetry,
}) => (
    <div className="space-y-2">
        {generating && <DraftSkeleton />}
        {/* initial={false}: the panel remounts on every sparkle click. */}
        <AnimatePresence initial={false}>
            {results.map((result, index) => (
                <ResultCard
                    key={`${index}-${result.slice(0, 24)}`}
                    index={index}
                    content={result}
                    selected={index === selectedIndex}
                    retrying={retryingIndex === index}
                    onSelect={() => onSelect(index)}
                    onInsert={onInsert}
                    onRetry={() => onRetry(index)}
                />
            ))}
        </AnimatePresence>
    </div>
);
