import React from 'react';
import { ChevronDown, Mic } from 'lucide-react';
import type { BrandVoice } from '../../../types';

interface VoiceSelectorProps {
    voices: Pick<BrandVoice, 'id' | 'name'>[];
    selectedId: string;
    onSelect: (id: string) => void;
}

/**
 * Brand voice is persistent identity, not a per-reply knob, so it lives on the
 * composer's bottom edge as a dropdown chip - a different shape from the tone pills.
 * Native <select> keeps keyboard and screen-reader behaviour for free.
 */
export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ voices, selectedId, onSelect }) => {
    const empty = voices.length === 0;

    return (
        <div className="relative inline-flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-2.5 pr-6 text-xs text-ink focus-within:border-line-strong">
            <Mic className="size-3.5 shrink-0 text-faint" strokeWidth={1.5} />
            <select
                aria-label="Brand voice"
                value={selectedId}
                disabled={empty}
                onChange={(e) => onSelect(e.target.value)}
                className="max-w-32 appearance-none truncate bg-transparent outline-none disabled:text-faint"
            >
                {empty ? (
                    <option value="">No brand voice</option>
                ) : (
                    voices.map((v) => (
                        <option key={v.id} value={v.id}>
                            {v.name}
                        </option>
                    ))
                )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 size-3.5 text-faint" strokeWidth={1.5} />
        </div>
    );
};
