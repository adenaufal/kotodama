import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SolidContainerProps {
    children: React.ReactNode;
    className?: string;
}

export const SolidContainer: React.FC<SolidContainerProps> = ({ children, className }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "relative w-full h-full flex flex-col overflow-hidden",
                // Solid Background - Always White
                "bg-white",
                // Border - Subtle Slate
                "border border-slate-200",
                // Shadow - None (Flat)
                // "shadow-2xl shadow-black/20", // Removed
                // Rounded Corners
                // Rounded Corners
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
