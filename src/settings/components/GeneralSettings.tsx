import React, { useState } from 'react';
import { Settings as SettingsIcon, Key as KeyIcon, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { OPENAI_MODELS, getModelById, ModelPriority } from '../../constants/models';

interface GeneralSettingsProps {
    openaiKey: string;
    setOpenaiKey: (key: string) => void;
    defaultModel: string;
    setDefaultModel: (model: string) => void;
    modelPriority: ModelPriority;
    setModelPriority: (priority: ModelPriority) => void;
    saveState: 'idle' | 'saving' | 'saved' | 'error';
}

const MODEL_PRIORITY_OPTIONS: { value: ModelPriority; label: string; description: string; icon: string }[] = [
    {
        value: 'maximize-free',
        label: 'Maximize Free Tokens',
        description: 'Use mini models (10M free tokens/day) by default, premium only for reasoning',
        icon: '🆓',
    },
    {
        value: 'always-quality',
        label: 'Always Quality',
        description: 'Always use premium models like GPT-4o (1M free tokens/day)',
        icon: '✨',
    },
    {
        value: 'always-mini',
        label: 'Always Mini',
        description: 'Always use fast/cheap models like GPT-4o Mini',
        icon: '⚡',
    },
];

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
    openaiKey,
    setOpenaiKey,
    defaultModel,
    setDefaultModel,
    modelPriority,
    setModelPriority,
    saveState
}) => {
    const [showApiKey, setShowApiKey] = useState(false);

    return (
        <div className="space-y-12 max-w-3xl">
            {/* Save Status Badge */}
            {saveState === 'saved' && (
                <div className="koto-info-box inline-flex items-center gap-2 !bg-emerald-50 !border-emerald-200 !text-emerald-600 mb-6">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold">Settings saved</span>
                </div>
            )}

            {/* API Configuration Section */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-[var(--koto-text-primary)] mb-1">API Configuration</h2>
                    <p className="text-sm text-[var(--koto-text-secondary)]">Connect your own OpenAI API key.</p>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--koto-text-secondary)]">OpenAI API Key</label>
                    <div className="relative">
                        <input
                            type={showApiKey ? "text" : "password"}
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full px-4 py-3 bg-[var(--koto-bg-elevated)] border border-[var(--koto-border)] rounded-xl focus:ring-2 focus:ring-[var(--koto-accent)] focus:border-transparent outline-none transition-all font-mono text-sm shadow-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--koto-text-tertiary)] hover:text-[var(--koto-text-primary)] transition-colors p-1"
                        >
                            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <p className="text-xs text-[var(--koto-text-tertiary)] flex items-center gap-1">
                        <KeyIcon size={12} />
                        Keys are stored locally on your device.
                    </p>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-medium text-[var(--koto-text-secondary)]">Model Selection Strategy</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {MODEL_PRIORITY_OPTIONS.map((option) => {
                            const isSelected = modelPriority === option.value;
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => setModelPriority(option.value)}
                                    className={`
                                        text-left p-5 rounded-2xl border transition-all duration-200 group relative overflow-hidden
                                        ${isSelected
                                            ? 'border-[var(--koto-accent)] bg-[var(--koto-bg-elevated)] shadow-sm'
                                            : 'border-[var(--koto-border-light)] bg-[var(--koto-bg-elevated)] hover:border-[var(--koto-border)] hover:shadow-sm'
                                        }
                                    `}
                                >
                                    <div className="flex items-start gap-4 z-10 relative">
                                        <span className="text-2xl filter grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{option.icon}</span>
                                        <div className="flex-1">
                                            <p className={`font-semibold text-sm mb-1 ${isSelected ? 'text-[var(--koto-text-primary)]' : 'text-[var(--koto-text-primary)]'}`}>
                                                {option.label}
                                            </p>
                                            <p className="text-xs text-[var(--koto-text-secondary)] leading-relaxed">
                                                {option.description}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-[var(--koto-success)] flex items-center justify-center flex-shrink-0 text-white animate-scale-in">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <div className="h-px bg-[var(--koto-border-light)]" />

            {/* Model Override Section */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-[var(--koto-text-primary)] mb-1">Advanced Override</h2>
                    <p className="text-sm text-[var(--koto-text-secondary)]">Force a specific model for all requests.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--koto-bg-tertiary)] border border-[var(--koto-border-light)]">
                    <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                                ${defaultModel ? 'bg-[var(--koto-accent)] text-white' : 'bg-[var(--koto-bg-primary)] text-[var(--koto-text-tertiary)] border border-[var(--koto-border)]'}
                            `}>
                                <SettingsIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="block font-medium text-[var(--koto-text-primary)] group-hover:text-[var(--koto-accent)] transition-colors">Default Model Override</span>
                                <span className="text-xs text-[var(--koto-text-secondary)]">
                                    {defaultModel ? `Forced: ${defaultModel}` : 'Auto-select enabled'}
                                </span>
                            </div>
                        </div>
                        <div className={`
                            w-12 h-6 rounded-full transition-colors relative
                            ${defaultModel ? 'bg-[var(--koto-accent)]' : 'bg-[var(--koto-border)]'}
                        `}>
                            <div className={`
                                absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm
                                ${defaultModel ? 'translate-x-6' : 'translate-x-0'}
                            `} />
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={!!defaultModel}
                            onChange={(e) => setDefaultModel(e.target.checked ? 'gpt-4o' : '')}
                        />
                    </label>

                    {defaultModel && (
                        <div className="mt-4 pl-13 animate-in fade-in slide-in-from-top-2">
                            <div className="relative">
                                <select
                                    value={defaultModel}
                                    onChange={(e) => setDefaultModel(e.target.value)}
                                    className="w-full px-4 py-2 bg-[var(--koto-bg-primary)] border border-[var(--koto-border)] rounded-lg text-sm focus:border-[var(--koto-accent)] outline-none transition-colors appearance-none cursor-pointer"
                                >
                                    {OPENAI_MODELS.map(model => (
                                        <option key={model.id} value={model.id}>{model.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--koto-text-tertiary)] pointer-events-none" size={16} />
                            </div>
                            {getModelById(defaultModel) && (
                                <p className="mt-2 text-xs text-[var(--koto-text-secondary)]">
                                    {getModelById(defaultModel)?.description}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
