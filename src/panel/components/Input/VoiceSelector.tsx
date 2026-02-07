import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../Layout/GlassContainer';

export interface VoiceOption {
    id: string;
    name: string;
    icon?: string;
}

interface VoiceSelectorProps {
    voices: VoiceOption[];
    selectedId: string;
    onSelect: (id: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ voices, selectedId, onSelect }) => {
    return (
        <div className="w-full overflow-x-auto no-scrollbar py-2">
            <div className="flex items-center gap-2 px-5 min-w-max">
                {voices.map((voice) => {
                    const isSelected = voice.id === selectedId;
                    return (
                        <button
                            key={voice.id}
                            onClick={() => onSelect(voice.id)}
                            className={cn(
                                "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                                "border flex items-center gap-2",
                                isSelected
                                    ? "border-pink-400 bg-pink-50 text-pink-600 shadow-sm"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                            )}
                        >
                            {isSelected && (
                                <motion.div
                                    layoutId="activeVoiceGlow"
                                    className="absolute inset-0 rounded-full bg-pink-100/50 -z-10"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            {voice.icon && <span>{voice.icon}</span>}
                            {voice.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
