import React, { useRef, useEffect } from 'react';
import { cn } from '../Layout/GlassContainer';

interface AutoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    containerClassName?: string;
    contextType?: 'compose' | 'reply' | null;
}

export const AutoTextarea: React.FC<AutoTextareaProps> = ({
    className,
    value,
    containerClassName,
    contextType,
    ...props
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    const placeholder = contextType === 'reply'
        ? "Draft a reply (e.g., 'Agree and ask about pricing')..."
        : "What would you like to post? (e.g., 'Thread about AI trends')...";

    return (
        <div className={cn("relative w-full group", containerClassName)}>
            <textarea
                ref={textareaRef}
                value={value}
                rows={1}
                placeholder={placeholder}
                className={cn(
                    "w-full bg-transparent text-lg text-slate-900 placeholder-slate-400 resize-none outline-none",
                    "max-h-[200px] overflow-y-auto no-scrollbar",
                    className
                )}
                style={{ minHeight: '60px' }}
                {...props}
            />

            {/* Active line indicator - Minimalist Black */}
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-slate-900 transition-all duration-200 group-focus-within:w-full rounded-full" />
        </div>
    );
};
