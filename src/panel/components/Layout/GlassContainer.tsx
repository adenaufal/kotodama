import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GlassContainerProps {
    children: React.ReactNode;
    className?: string;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({ children, className }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "relative w-full h-full flex flex-col overflow-hidden",
                "bg-white/95 backdrop-blur-xl",
                "border border-slate-200",
                "shadow-xl shadow-slate-200/50",
                "rounded-2xl",
                className
            )}
        >
            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {children}
            </div>
        </motion.div>
    );
};
