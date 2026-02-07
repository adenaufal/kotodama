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
        primary: "bg-pink-500 text-white shadow-md shadow-pink-200 border border-pink-400 hover:bg-pink-600",
        secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
        ghost: "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100",
        glass: "bg-white/80 backdrop-blur-md border border-slate-200 text-slate-700 hover:bg-white"
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
