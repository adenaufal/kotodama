import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Copy, CornerDownRight, RefreshCw } from 'lucide-react';
import { Button } from '../Shared/Button';
import { cn } from '../../utils/cn';

interface ResultCardProps {
    content: string;
    index: number;
    selected: boolean;
    retrying: boolean;
    onSelect: () => void;
    onInsert: (content: string) => void;
    onRetry: () => void;
}

/** Same geometry as a real draft, so arrival doesn't reflow the list. */
export const DraftSkeleton: React.FC = () => (
    <div className="rounded-koto border border-line bg-surface p-3">
        <p className="mb-2 text-[11px] text-faint">Writing your reply…</p>
        {['100%', '88%', '56%'].map((w) => (
            <div key={w} className="flex h-[19px] items-center">
                <span className="h-2 rounded-full bg-raise" style={{ width: w }} />
            </div>
        ))}
    </div>
);

export const ResultCard: React.FC<ResultCardProps> = ({
    content,
    index,
    selected,
    retrying,
    onSelect,
    onInsert,
    onRetry,
}) => {
    const reduced = useReducedMotion();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.article
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut', delay: reduced ? 0 : Math.min(index, 3) * 0.1 }}
            onClick={onSelect}
            className={cn(
                'relative overflow-hidden rounded-koto border bg-surface p-3',
                'transition-colors duration-150 ease-out',
                selected ? 'border-line-strong' : 'border-line hover:border-line-strong'
            )}
        >
            {/* The one accent in this view: which draft is in focus. */}
            {selected && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}

            <p className="whitespace-pre-wrap text-pretty text-[13px] leading-[1.45] text-ink">{content}</p>

            <div className="mt-3 flex items-center gap-1.5">
                <Button
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onInsert(content);
                    }}
                >
                    <CornerDownRight className="size-3.5" strokeWidth={2} />
                    Insert
                </Button>

                <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Copy reply"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCopy();
                    }}
                >
                    {copied ? <Check className="size-3.5 text-ok" strokeWidth={1.5} /> : <Copy className="size-3.5" strokeWidth={1.5} />}
                    {copied ? 'Copied' : 'Copy'}
                </Button>

                <Button
                    size="sm"
                    variant="ghost"
                    disabled={retrying}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRetry();
                    }}
                >
                    <RefreshCw className="size-3.5" strokeWidth={1.5} />
                    {retrying ? 'Retrying…' : 'Retry'}
                </Button>

                <span className="ml-auto text-[11px] tabular-nums text-faint">
                    {content.length}/280
                </span>
            </div>
        </motion.article>
    );
};
