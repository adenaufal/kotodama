import React from 'react';
import { cn } from '../../utils/cn';

interface SolidContainerProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * The panel shell. Follows the extension's theme rather than pinning dark —
 * the shadow host carries `data-theme`, or nothing at all when the user
 * left it on System.
 *
 * Three fixed zones live inside it; only the middle one scrolls.
 */
export const SolidContainer: React.FC<SolidContainerProps> = ({ children, className }) => {
    return (
        <div
            className={cn(
                'relative flex h-full w-full flex-col overflow-hidden',
                'rounded-koto border border-line bg-canvas text-ink',
                'shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_32px_-8px_rgb(0_0_0/0.18)]',
                className
            )}
        >
            {children}
        </div>
    );
};
