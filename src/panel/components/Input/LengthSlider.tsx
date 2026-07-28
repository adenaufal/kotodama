import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../utils/cn';

export type LengthOption = 'short' | 'medium' | 'long';

interface LengthSliderProps {
    value: LengthOption;
    onChange: (value: LengthOption) => void;
    className?: string;
}

const OPTIONS: { id: LengthOption; label: string }[] = [
    { id: 'short', label: 'S' },
    { id: 'medium', label: 'M' },
    { id: 'long', label: 'L' },
];

/** Segmented, so it never reads as another row of tone pills. Thumb moves on transform only. */
export const LengthSlider: React.FC<LengthSliderProps> = ({ value, onChange, className }) => {
    const reduced = useReducedMotion();
    const activeIndex = OPTIONS.findIndex((o) => o.id === value);

    return (
        <div
            role="group"
            aria-label="Reply length"
            className={cn('relative grid h-7 grid-cols-3 rounded-full border border-line bg-surface p-0.5', className)}
        >
            <motion.span
                aria-hidden
                initial={false}
                animate={{ x: `${activeIndex * 100}%` }}
                transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                className="absolute inset-y-0.5 left-0.5 w-[calc((100%-4px)/3)] rounded-full bg-raise"
            />
            {OPTIONS.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    aria-pressed={value === option.id}
                    onClick={() => onChange(option.id)}
                    className={cn(
                        'relative rounded-full text-center text-xs font-medium transition-colors duration-150 ease-out',
                        value === option.id ? 'text-ink' : 'text-faint hover:text-muted'
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};
