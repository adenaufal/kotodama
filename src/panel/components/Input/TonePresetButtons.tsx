import React from 'react';
import { Briefcase, Coffee, Smile, User } from 'lucide-react';
import { TonePreset } from '../../utils/toneModifiers';
import { cn } from '../../utils/cn';

interface TonePresetButtonsProps {
    activePresets: TonePreset[];
    onToggle: (preset: TonePreset) => void;
}

const PRESETS: { id: TonePreset; label: string; icon: React.ReactNode }[] = [
    { id: 'formal', label: 'Formal', icon: <Briefcase className="size-3.5" strokeWidth={1.5} /> },
    { id: 'casual', label: 'Casual', icon: <Coffee className="size-3.5" strokeWidth={1.5} /> },
    { id: 'humor', label: 'Humor', icon: <Smile className="size-3.5" strokeWidth={1.5} /> },
    { id: 'professional', label: 'Pro', icon: <User className="size-3.5" strokeWidth={1.5} /> },
];

/** Per-reply knobs. Pills, so they never read like the persistent brand-voice chip. */
export const TonePresetButtons: React.FC<TonePresetButtonsProps> = ({ activePresets, onToggle }) => (
    <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((preset) => {
            const active = activePresets.includes(preset.id);
            return (
                <button
                    key={preset.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onToggle(preset.id)}
                    className={cn(
                        'flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs',
                        'transition-colors duration-150 ease-out active:scale-[0.96]',
                        active
                            ? 'border-line-strong bg-raise font-medium text-ink'
                            : 'border-line text-muted hover:border-line-strong hover:text-ink'
                    )}
                >
                    {preset.icon}
                    {preset.label}
                </button>
            );
        })}
    </div>
);
