import React from 'react';
import { REPLY_TEMPLATES, ReplyTemplate } from '../../constants/templates';

interface ContextAreaProps {
    context: {
        type: 'compose' | 'reply' | null;
        tweetContext?: {
            text: string;
            username: string;
        };
    };
    onTemplateSelect: (template: ReplyTemplate) => void;
}

export const ContextArea: React.FC<ContextAreaProps> = ({ context, onTemplateSelect }) => {
    if (context.type !== 'reply' || !context.tweetContext) return null;

    return (
        <div className="px-8 -mt-6 relative z-10 koto-animate-slideIn">
            <div className="rounded-2xl border backdrop-blur-md p-5 shadow-lg" style={{
                backgroundColor: 'var(--koto-bg-card)',
                borderColor: 'var(--koto-border)',
                boxShadow: 'var(--koto-shadow-md)'
            }}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-[var(--koto-sakura-pink)] animate-pulse" />
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--koto-text-secondary)' }}>
                        Replying to <span className="text-[var(--koto-text-primary)]">@{context.tweetContext.username}</span>
                    </p>
                </div>

                <p className="text-sm leading-relaxed max-h-32 overflow-y-auto pr-2 custom-scrollbar" style={{ color: 'var(--koto-text-primary)' }}>
                    {context.tweetContext.text}
                </p>

                <div className="mt-4 pt-4 border-t flex items-center gap-3" style={{ borderColor: 'var(--koto-border)' }}>
                    <label className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--koto-text-secondary)' }}>
                        Quick Start:
                    </label>
                    <div className="relative flex-1 group">
                        <select
                            onChange={(e) => {
                                const template = REPLY_TEMPLATES.find(t => t.id === e.target.value);
                                if (template) {
                                    onTemplateSelect(template);
                                    e.target.value = '';
                                }
                            }}
                            className="w-full appearance-none rounded-lg border bg-transparent px-3 py-1.5 pr-8 text-xs font-medium cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-[var(--koto-sakura-pink)]/30"
                            style={{
                                borderColor: 'var(--koto-border)',
                                color: 'var(--koto-text-primary)'
                            }}
                            defaultValue=""
                        >
                            <option value="" className="bg-[var(--koto-bg-dark)]">Pick a vibe...</option>
                            {['supportive', 'thoughtful', 'engaging', 'professional', 'casual', 'appreciative'].map(category => (
                                <optgroup label={category.charAt(0).toUpperCase() + category.slice(1)} key={category} className="bg-[var(--koto-bg-dark)]">
                                    {REPLY_TEMPLATES.filter(t => t.category === category).map(template => (
                                        <option key={template.id} value={template.id}>
                                            {template.icon} {template.label}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[10px]" style={{ color: 'var(--koto-text-secondary)' }}>
                            ▼
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
