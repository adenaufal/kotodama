import React from 'react';
import { BrandVoice } from '../../types';

interface BrandVoiceListProps {
    voices: BrandVoice[];
    defaultVoiceId: string;
    setDefaultVoiceId: (id: string) => void;
    onManage: () => void;
}

export const BrandVoiceList: React.FC<BrandVoiceListProps> = ({
    voices,
    defaultVoiceId,
    setDefaultVoiceId,
    onManage
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-slate-100 pb-2 mb-6">
                <h2 className="text-xl font-bold text-slate-900">Brand Voices</h2>
                <button
                    onClick={onManage}
                    className="text-sm font-bold text-[var(--koto-sakura-pink)] hover:text-pink-600 transition-colors"
                >
                    Manage Voices →
                </button>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-[var(--koto-sakura-pink)]/5 rounded-full blur-3xl group-hover:bg-[var(--koto-sakura-pink)]/10 transition-all duration-500"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="text-3xl font-bold text-slate-800 font-mono">
                            {voices.length}
                        </div>
                        <div className="text-xs uppercase tracking-wider font-bold text-slate-400">
                            Active Voices
                        </div>
                    </div>

                    <div className="flex-1 max-w-sm">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                            Default Voice
                        </label>
                        <div className="relative">
                            <select
                                value={defaultVoiceId}
                                onChange={(e) => setDefaultVoiceId(e.target.value)}
                                className="w-full appearance-none rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 border border-slate-200 bg-white focus:border-[var(--koto-sakura-pink)] text-slate-900 shadow-sm cursor-pointer"
                                disabled={voices.length === 0}
                            >
                                <option value="">None (Always ask)</option>
                                {voices.map((voice) => (
                                    <option key={voice.id} value={voice.id}>
                                        {voice.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {voices.length > 0 && (
                    <p className="relative z-10 mt-4 text-xs text-slate-400 text-center">
                        Click "Manage Voices" to edit, create, or delete your brand voices
                    </p>
                )}
            </div>
        </div>
    );
};
