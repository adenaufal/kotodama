import React from 'react';
import { Briefcase, Coffee, Smile, User } from 'lucide-react';
import { TonePreset } from '../../utils/toneModifiers';

interface TonePresetButtonsProps {
  activePresets: TonePreset[];
  onToggle: (preset: TonePreset) => void;
}

const PRESETS: { id: TonePreset; label: string; icon: React.ReactNode }[] = [
  { id: 'formal', label: 'Formal', icon: <Briefcase className="w-3.5 h-3.5" /> },
  { id: 'casual', label: 'Casual', icon: <Coffee className="w-3.5 h-3.5" /> },
  { id: 'humor', label: 'Humor', icon: <Smile className="w-3.5 h-3.5" /> },
  { id: 'professional', label: 'Professional', icon: <User className="w-3.5 h-3.5" /> },
];

export const TonePresetButtons: React.FC<TonePresetButtonsProps> = ({
  activePresets,
  onToggle,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESETS.map((preset) => {
        const isActive = activePresets.includes(preset.id);
        return (
          <button
            key={preset.id}
            onClick={() => onToggle(preset.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isActive
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {preset.icon}
            <span>{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
};
