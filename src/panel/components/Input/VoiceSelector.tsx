import React from 'react';
import { Select, SelectOption } from '../Shared/Select';

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
    // Map voices to SelectOptions
    const options: SelectOption[] = voices.map(v => ({
        id: v.id,
        label: v.name,
        icon: v.icon ? <span>{v.icon}</span> : undefined
    }));

    return (
        <div className="w-full px-5 py-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Brand Voice
            </label>
            <Select
                options={options}
                value={selectedId}
                onChange={onSelect}
                placeholder="Select a voice..."
                className="w-full"
            />
        </div>
    );
};
