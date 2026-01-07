import React, { useState } from 'react';

interface ApiKeyStepProps {
    apiKey: string;
    setApiKey: (key: string) => void;
    onNext: () => void;
    error?: string;
}

export const ApiKeyStep: React.FC<ApiKeyStepProps> = ({ apiKey, setApiKey, onNext, error }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-slate-900">Connect OpenAI</h2>
                <p className="text-base font-medium text-slate-500">
                    Enter your API key to power the AI engine.
                </p>
            </div>

            <div className="space-y-6">
                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider ml-1 flex items-center gap-2 text-slate-500">
                        API Key <span className="text-[var(--koto-sakura-pink)]">*</span>
                        <button
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </label>

                    <div className="relative group">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full rounded-2xl px-6 py-5 font-mono text-sm outline-none transition-all duration-200 border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-[var(--koto-sakura-pink)] focus:ring-4 focus:ring-[var(--koto-sakura-pink)]/10 text-slate-900 placeholder:text-slate-400"
                        />
                    </div>

                    {/* Detailed Tooltip/Info Box */}
                    <div className={`
              overflow-hidden transition-all duration-300 rounded-2xl border border-blue-100 bg-blue-50/50
              ${showTooltip ? 'max-h-24 opacity-100 mt-3 p-4' : 'max-h-0 opacity-0 p-0'}
           `}>
                        <p className="text-xs leading-relaxed text-blue-800">
                            Your key is <strong>encrypted locally</strong> with AES-GCM before being stored in your browser.
                            We never see your keys, and they never leave your device except to call OpenAI.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm font-semibold p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {error}
                    </div>
                )}
            </div>

            <div className="pt-4">
                <button
                    onClick={onNext}
                    disabled={!apiKey.trim()}
                    className="w-full py-5 rounded-xl text-sm font-bold uppercase tracking-widest text-white shadow-xl shadow-pink-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-pink-500/30 active:translate-y-[0px]"
                    style={{
                        background: 'linear-gradient(135deg, var(--koto-sakura-pink), #ec4899)',
                    }}
                >
                    Continue
                </button>
                <p className="text-center text-xs mt-6 font-medium text-slate-400">
                    Don't have a key? <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline hover:text-slate-600 transition-colors">Get one here</a>.
                </p>
            </div>
        </div>
    );
};
