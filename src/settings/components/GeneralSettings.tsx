import React, { useState } from 'react';
import { OPENAI_MODELS, getModelById } from '../../constants/models';

interface GeneralSettingsProps {
    openaiKey: string;
    setOpenaiKey: (key: string) => void;
    defaultModel: string;
    setDefaultModel: (model: string) => void;
    saveState: 'idle' | 'saving' | 'saved' | 'error';
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
    openaiKey,
    setOpenaiKey,
    defaultModel,
    setDefaultModel,
    saveState
}) => {
    const [showApiKey, setShowApiKey] = useState(false);

    return (
        <div className="space-y-8">
            <div className="border-b border-slate-100 pb-2 mb-6">
                <h2 className="text-xl font-bold text-slate-900">General Configuration</h2>
            </div>

            {/* OpenAI Key */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        OpenAI API Key
                    </label>
                    {saveState === 'saved' && (
                        <span className="text-emerald-500 text-xs font-bold px-2 py-1 bg-emerald-50 rounded-full border border-emerald-100 animate-in fade-in">
                            Saved
                        </span>
                    )}
                </div>

                <div className="relative group">
                    <input
                        type={showApiKey ? "text" : "password"}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full rounded-xl px-5 py-4 pr-12 font-mono text-sm outline-none transition-all duration-200 border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-[var(--koto-sakura-pink)] text-slate-900 placeholder:text-slate-400 shadow-sm"
                    />
                    <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        title={showApiKey ? "Hide API Key" : "Show API Key"}
                    >
                        {showApiKey ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                </div>
                <p className="text-xs text-slate-400 max-w-lg">
                    Your key is encrypted effectively and stored locally. We never see your key.
                </p>
            </div>

            {/* AI Model */}
            <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-wider text-slate-500 block">
                    Default AI Model
                </label>
                <div className="relative">
                    <select
                        value={defaultModel}
                        onChange={(e) => setDefaultModel(e.target.value)}
                        className="w-full appearance-none rounded-xl px-5 py-4 text-base outline-none transition-all duration-200 border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-[var(--koto-sakura-pink)] text-slate-900 shadow-sm cursor-pointer"
                    >
                        <option value="">Auto (Best Available)</option>
                        {OPENAI_MODELS.map((model) => (
                            <option key={model.id} value={model.id}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {defaultModel && getModelById(defaultModel) && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                        <span className="font-bold">Info:</span> {getModelById(defaultModel)?.description}
                    </div>
                )}
            </div>
        </div>
    );
};
