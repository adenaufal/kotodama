import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../Layout/GlassContainer';

export type LengthOption = 'short' | 'medium' | 'long';

interface LengthSliderProps {
    value: LengthOption;
    onChange: (value: LengthOption) => void;
}

export const LengthSlider: React.FC<LengthSliderProps> = ({ value, onChange }) => {
    const options: { id: LengthOption; label: string }[] = [
        { id: 'short', label: 'Short' },
        { id: 'medium', label: 'Medium' },
        { id: 'long', label: 'Long' },
    ];

    const activeIndex = options.findIndex(o => o.id === value);

    return (
        <div className="relative">
            <div className="flex items-center justify-between bg-slate-100 rounded-full p-1 border border-slate-200 relative z-0">
                {/* Sliding background */}
                <motion.div
                    className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm z-0 border border-slate-200"
                    initial={false}
                    animate={{
                        left: `calc(${(activeIndex * 100) / 3}% + 4px)`,
                        width: 'calc(33.33% - 4px)'
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />

                {options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => onChange(option.id)}
                        className={cn(
                            "flex-1 py-1.5 text-xs font-semibold text-center rounded-full relative z-10 transition-colors",
                            value === option.id ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
