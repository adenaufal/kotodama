import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'ghost';
    size?: 'sm' | 'md';
}

const VARIANTS = {
    // Inverted rather than accent-filled — same rule as the extension pages.
    primary: 'bg-ink text-canvas hover:opacity-90 disabled:bg-raise disabled:text-faint',
    ghost: 'text-muted hover:bg-raise hover:text-ink',
} as const;

const SIZES = {
    sm: 'h-7 gap-1.5 rounded-md px-2.5 text-xs',
    md: 'h-10 gap-2 rounded-koto px-4 text-[13px]',
} as const;

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = 'primary',
    size = 'md',
    children,
    ...props
}) => (
    <button
        type="button"
        className={cn(
            'inline-flex items-center justify-center font-medium',
            'transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out',
            'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            'active:scale-[0.96] disabled:pointer-events-none disabled:opacity-60',
            SIZES[size],
            VARIANTS[variant],
            className
        )}
        {...props}
    >
        {children}
    </button>
);
