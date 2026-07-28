import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import type { TweetContext, TweetImage, ThreadEntry } from '../../../types';
import { cn } from '../../utils/cn';

export type SummaryStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface SummaryState {
    status: SummaryStatus;
    text?: string;
    visionFailed?: boolean;
}

interface ContextCardProps {
    context: TweetContext;
    summary: SummaryState;
    onRetrySummary: () => void;
}

/** Photo tiles need an edge in both schemes, so it rides the border token. */
const IMAGE_OUTLINE = 'outline outline-1 -outline-offset-1 outline-line-strong';

/** "7m", "3h", "2d". Falls back to whatever the scraper gave us if it isn't parseable. */
export function shortTime(raw?: string): string | null {
    if (!raw) return null;
    const t = Date.parse(raw);
    if (Number.isNaN(t)) return raw;
    const s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 60) return `${Math.floor(s)}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    if (s < 604800) return `${Math.floor(s / 86400)}d`;
    return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** No avatar URL in TweetContext, so a monogram stands in for one. */
const Avatar: React.FC<{ name: string; className?: string }> = ({ name, className }) => (
    <span
        aria-hidden
        className={cn(
            'grid shrink-0 place-items-center rounded-full bg-raise text-[11px] font-medium text-muted',
            className
        )}
    >
        {name.replace(/^@/, '').charAt(0).toUpperCase() || '?'}
    </span>
);

const ImageStrip: React.FC<{ images: TweetImage[] }> = ({ images }) => {
    const shown = images.slice(0, 4);
    const extra = images.length - shown.length;

    return (
        <div className="mt-2 flex gap-1 pl-10">
            {shown.map((img, i) => (
                <div key={img.url} className="relative h-[68px] min-w-0 flex-1">
                    <img
                        src={img.url}
                        alt={img.alt || ''}
                        loading="lazy"
                        className={cn('size-full rounded-md bg-raise object-cover', IMAGE_OUTLINE)}
                    />
                    {extra > 0 && i === shown.length - 1 && (
                        <span className="absolute inset-0 grid place-items-center rounded-md bg-black/60 text-xs font-semibold text-white">
                            +{extra}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

/** Collapsed by default, always: a facepile row, not an accordion header. */
const ThreadStrip: React.FC<{ thread: ThreadEntry[] }> = ({ thread }) => {
    const [open, setOpen] = useState(false);

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="-mx-2 mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 ease-out hover:bg-raise active:scale-[0.96]"
            >
                <span className="flex -space-x-1.5">
                    {thread.slice(0, 3).map((e, i) => (
                        <Avatar
                            key={i}
                            name={e.displayName || e.username}
                            className="size-5 text-[9px] ring-2 ring-surface"
                        />
                    ))}
                </span>
                <span className="text-xs text-muted">
                    {thread.length} earlier post{thread.length === 1 ? '' : 's'}
                </span>
                <ChevronRight className="size-3.5 text-faint" strokeWidth={1.5} />
            </button>
        );
    }

    return (
        <div className="mt-3">
            {/* One shared container with a rail down the avatar gutter - not four stacked cards. */}
            <div className="relative space-y-2.5">
                <span aria-hidden className="absolute bottom-1 left-[11px] top-1 w-0.5 rounded-full bg-line" />
                {thread.map((e, i) => (
                    <div key={i} className="relative flex gap-2">
                        <Avatar name={e.displayName || e.username} className="size-6 text-[10px] ring-2 ring-surface" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs text-faint">
                                <span className="font-medium text-muted">{e.displayName || e.username}</span>{' '}
                                @{e.username}
                            </p>
                            <p className="line-clamp-2 text-pretty text-[13px] leading-[1.45] text-muted">{e.text}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center gap-1 text-xs text-faint transition-colors duration-150 ease-out hover:text-ink"
            >
                <ChevronDown className="size-3.5 rotate-180" strokeWidth={1.5} />
                Hide earlier posts
            </button>
        </div>
    );
};

/**
 * Skeleton lives in the final geometry: three 19px line boxes, exactly where the
 * summary's three lines land, so nothing reflows when the text arrives.
 */
const SummarySkeleton: React.FC = () => (
    <div>
        {['100%', '92%', '64%'].map((w) => (
            <div key={w} className="flex h-[19px] items-center">
                <span className="h-2 rounded-full bg-raise" style={{ width: w }} />
            </div>
        ))}
    </div>
);

const SummaryBlock: React.FC<{ summary: SummaryState; onRetry: () => void }> = ({ summary, onRetry }) => {
    const reduced = useReducedMotion();
    const rise = reduced ? 0 : 5;
    const fade = { duration: 0.16, ease: 'easeOut' } as const;

    if (summary.status === 'idle') return null;

    return (
        <div className="mt-3 border-t border-line pt-3">
            <AnimatePresence initial={false} mode="wait">
                {summary.status === 'error' ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={fade}
                        className="flex h-8 items-center gap-2 text-xs text-faint"
                    >
                        <span>Couldn&apos;t read this one.</span>
                        <button
                            type="button"
                            onClick={onRetry}
                            className="text-ink underline underline-offset-2 transition-colors duration-150 ease-out hover:text-accent-text"
                        >
                            Retry
                        </button>
                    </motion.div>
                ) : summary.status === 'loading' ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -rise }}
                        transition={fade}
                    >
                        <p className="mb-1 flex h-4 items-center gap-1.5 text-[11px] text-faint">
                            <Sparkles className="size-3 text-accent" strokeWidth={1.5} />
                            Reading the tweet…
                        </p>
                        <SummarySkeleton />
                    </motion.div>
                ) : (
                    <motion.div
                        key="ready"
                        initial={{ opacity: 0, y: rise }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={fade}
                    >
                        <p className="mb-1 flex h-4 items-center gap-1.5 text-[11px] text-faint">
                            <Sparkles className="size-3 text-accent" strokeWidth={1.5} />
                            What they&apos;re saying
                        </p>
                        <p className="text-pretty text-[13px] leading-[1.45] text-muted">{summary.text}</p>
                        {summary.visionFailed && (
                            <p className="mt-1 text-[11px] text-faint">Images couldn&apos;t be read — text only.</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/**
 * Zone 2a. Reads as read-only: lighter surface, hairline border, accent rail on the
 * left edge. The AI summary is a sub-block of this card, never a sibling card.
 */
export const ContextCard: React.FC<ContextCardProps> = ({ context, summary, onRetrySummary }) => {
    const [expanded, setExpanded] = useState(false);
    const images = context.images ?? [];
    const single = images.length === 1 ? images[0] : null;
    const name = context.displayName || context.username;
    const time = shortTime(context.timestamp);
    const clampable = context.text.length > 160 || context.text.split('\n').length > 4;

    return (
        <article className="relative overflow-hidden rounded-koto border border-line bg-surface p-4">
            <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" />

            <div className="flex items-center gap-2">
                <Avatar name={name} className="size-8 text-xs" />
                <p className="flex min-w-0 items-baseline gap-1.5">
                    <span className="truncate text-[13px] font-medium text-ink">{name}</span>
                    <span className="shrink-0 text-xs text-faint">@{context.username}</span>
                    {time && <span className="shrink-0 text-xs text-faint">· {time}</span>}
                </p>
            </div>

            <div className="mt-2 flex gap-3 pl-10">
                <div className="min-w-0 flex-1">
                    <p
                        className={cn(
                            'text-pretty text-[13px] leading-[1.45] text-muted',
                            !expanded && 'line-clamp-4'
                        )}
                    >
                        {context.text}
                    </p>
                    {clampable && (
                        <button
                            type="button"
                            onClick={() => setExpanded((v) => !v)}
                            className="mt-1 text-xs text-muted underline-offset-2 transition-colors duration-150 ease-out hover:text-ink hover:underline"
                        >
                            {expanded ? 'Show less' : 'Show more'}
                        </button>
                    )}
                </div>

                {/* A lone image gets a 56px thumbnail so it can't eat 72px of vertical budget. */}
                {single && (
                    <img
                        src={single.url}
                        alt={single.alt || ''}
                        loading="lazy"
                        className={cn('size-14 shrink-0 rounded-md bg-raise object-cover', IMAGE_OUTLINE)}
                    />
                )}
            </div>

            {images.length > 1 && <ImageStrip images={images} />}

            {!!context.thread?.length && <ThreadStrip thread={context.thread} />}

            <SummaryBlock summary={summary} onRetry={onRetrySummary} />
        </article>
    );
};
