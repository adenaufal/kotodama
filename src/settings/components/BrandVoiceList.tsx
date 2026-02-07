import React from 'react';
import { BrandVoice } from '../../types';
import { Plus, Edit3, Trash2, Star, ChevronDown } from 'lucide-react';

interface BrandVoiceListProps {
    voices: BrandVoice[];
    defaultVoiceId: string;
    setDefaultVoiceId: (id: string) => void;
    onManage: () => void;
    onEdit?: (voice: BrandVoice) => void;
    onRefresh?: () => void;
}

export const BrandVoiceList: React.FC<BrandVoiceListProps> = ({
    voices,
    defaultVoiceId,
    setDefaultVoiceId,
    onManage,
    onEdit,
    onRefresh
}) => {
    const handleDelete = async (voiceId: string, voiceName: string) => {
        if (!confirm(`Are you sure you want to delete "${voiceName}"?`)) return;
        try {
            const response = await chrome.runtime.sendMessage({ type: 'delete-brand-voice', payload: { id: voiceId } });
            if (response.success && onRefresh) onRefresh();
        } catch (err) { console.error('Failed to delete voice:', err); }
    };

    return (
        <div className="space-y-10 max-w-3xl">
            {/* Header Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-[var(--koto-text-primary)]">Your Voices</h2>
                        <p className="text-sm text-[var(--koto-text-secondary)]">
                            {voices.length === 0 ? 'Create your first AI personality.' : `${voices.length} voice${voices.length > 1 ? 's' : ''} configured.`}
                        </p>
                    </div>
                    <button
                        onClick={onManage}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--koto-accent)] text-white text-sm font-bold shadow-md hover:brightness-110 transition-all"
                    >
                        <Plus size={16} />
                        New Voice
                    </button>
                </div>
            </section>

            {/* Default Voice Selector */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-[var(--koto-text-primary)]">Default Voice</h2>
                <div className="p-5 rounded-2xl bg-[var(--koto-bg-elevated)] border border-[var(--koto-border-light)]">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--koto-text-tertiary)] block mb-2">
                        When writing, always use:
                    </label>
                    <div className="relative">
                        <select
                            value={defaultVoiceId}
                            onChange={(e) => setDefaultVoiceId(e.target.value)}
                            className="w-full appearance-none rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 border border-[var(--koto-border)] bg-[var(--koto-bg-primary)] focus:border-[var(--koto-accent)] text-[var(--koto-text-primary)] shadow-sm cursor-pointer"
                            disabled={voices.length === 0}
                        >
                            <option value="">None (Always ask)</option>
                            {voices.map((voice) => (
                                <option key={voice.id} value={voice.id}>{voice.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--koto-text-tertiary)]">
                            <ChevronDown size={16} />
                        </div>
                    </div>
                </div>
            </section>

            <div className="h-px bg-[var(--koto-border-light)]" />

            {/* Voice List */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-[var(--koto-text-primary)]">All Voices</h2>
                {voices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border-2 border-dashed border-[var(--koto-border-light)] bg-[var(--koto-bg-tertiary)]">
                        <div className="w-16 h-16 rounded-full bg-[var(--koto-bg-elevated)] flex items-center justify-center mb-4">
                            <span className="text-3xl">🎙️</span>
                        </div>
                        <h3 className="text-base font-bold text-[var(--koto-text-primary)]">No voices yet</h3>
                        <p className="text-sm text-[var(--koto-text-secondary)] max-w-xs mt-1 mb-4">
                            Create a brand voice to write in a consistent style that sounds like you.
                        </p>
                        <button onClick={onManage} className="px-5 py-2.5 rounded-xl bg-[var(--koto-text-primary)] text-[var(--koto-bg-primary)] font-bold text-sm hover:opacity-90 transition-all">
                            Create your first voice
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {voices.map(voice => (
                            <div key={voice.id} className="group p-4 rounded-2xl bg-[var(--koto-bg-elevated)] border border-[var(--koto-border-light)] hover:border-[var(--koto-accent)] transition-all flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[var(--koto-accent)]/10 text-[var(--koto-accent)] flex items-center justify-center text-base font-bold flex-shrink-0">
                                    {voice.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-[var(--koto-text-primary)] truncate">{voice.name}</h3>
                                        {defaultVoiceId === voice.id && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">
                                                <Star size={10} fill="currentColor" /> Default
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--koto-text-tertiary)] truncate">{voice.description || 'No description'}</p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {onEdit && (
                                        <button onClick={() => onEdit(voice)} className="p-2 rounded-lg text-[var(--koto-text-tertiary)] hover:bg-[var(--koto-bg-tertiary)] hover:text-[var(--koto-text-primary)] transition-colors" title="Edit">
                                            <Edit3 size={16} />
                                        </button>
                                    )}
                                    {!voice.isTemplate && (
                                        <button onClick={() => handleDelete(voice.id, voice.name)} className="p-2 rounded-lg text-[var(--koto-text-tertiary)] hover:bg-red-50 hover:text-red-500 transition-colors" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
