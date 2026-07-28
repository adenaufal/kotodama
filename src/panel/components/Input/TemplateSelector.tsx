import React from 'react';
import { ChevronDown } from 'lucide-react';
import { ReplyTemplate } from '../../../constants/templates';

interface TemplateSelectorProps {
    templates: ReplyTemplate[];
    onSelect: (template: ReplyTemplate) => void;
}

/**
 * Starter intents. Native <select> with optgroups: real keyboard/type-ahead
 * behaviour, no hand-rolled listbox.
 */
export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, onSelect }) => {
    const groups = templates.reduce<Record<string, ReplyTemplate[]>>((acc, t) => {
        (acc[t.category] ||= []).push(t);
        return acc;
    }, {});

    return (
        <div className="relative">
            <select
                aria-label="Start from a template"
                value=""
                onChange={(e) => {
                    const t = templates.find((x) => x.id === e.target.value);
                    if (t) onSelect(t);
                }}
                className="h-9 w-full appearance-none rounded-koto border border-line bg-surface pl-3 pr-8 text-[13px] text-ink outline-none transition-colors duration-150 ease-out hover:border-line-strong focus:border-accent"
            >
                <option value="">Start from a template…</option>
                {Object.entries(groups).map(([category, items]) => (
                    <optgroup key={category} label={category}>
                        {items.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.icon} {t.label}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
            <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-faint"
                strokeWidth={1.5}
            />
        </div>
    );
};
