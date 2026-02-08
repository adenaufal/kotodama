import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../Layout/GlassContainer';

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = 'primary',
    isLoading,
    children,
    icon,
    disabled,
    ...props
}) => {
    const variants = {
        primary: "bg-slate-900 text-white border border-slate-900 hover:bg-slate-800 shadow-none",
        secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-none",
        ghost: "bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100 shadow-none",
        glass: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" // Fallback to secondary style
    };

    return (
        <motion.button
            whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
            whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
            className={cn(
                "relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
                    {icon}
                    {children}
                </>
            )}
        </motion.button>
    );
};
