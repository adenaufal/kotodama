import React from 'react';
import { cn } from '../../utils/cn';

type AutoTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Starts at 2 rows, grows to 5, then scrolls internally.
 * `field-sizing: content` does the growing natively - no measurement effect.
 */
export const AutoTextarea: React.FC<AutoTextareaProps> = ({ className, ...props }) => (
    <textarea
        rows={2}
        placeholder="e.g. agree but add a caveat about cost"
        className={cn(
            'field-sizing-content max-h-[100px] w-full resize-none overflow-y-auto bg-transparent',
            'text-[13px] leading-5 text-ink outline-none placeholder:text-faint',
            className
        )}
        {...props}
    />
);
