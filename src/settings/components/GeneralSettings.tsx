import React, { useMemo } from 'react';
import { Key as KeyIcon, Eye, EyeOff, Bot } from 'lucide-react';
import { OPENAI_MODELS } from '../../constants/models';
import { ModelManager } from './ModelManager';

interface GeneralSettingsProps {
    openaiKey: string;
    setOpenaiKey: (key: string) => void;

    selectedModelId: string;
    setSelectedModelId: (modelId: string) => void;

    customModels: { id: string; name: string }[];
    setCustomModels: (models: { id: string; name: string }[]) => void;

    saveState: 'idle' | 'saving' | 'saved' | 'error';
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
    openaiKey,
    setOpenaiKey,
    selectedModelId,
    setSelectedModelId,
    customModels,
    setCustomModels,
    saveState
}) => {
    const [showApiKey, setShowApiKey] = React.useState(false);

    // Combine standard models with custom models
    const allModels = useMemo(() => {
        const customOptions = customModels.map(m => ({
            id: m.id,
            name: m.name,
            provider: 'openai'
        }));

        // Filter out any standard models that might have been added as custom (though valid)
        // We prioritizing standard definitions if IDs match isn't critical here as we just want a list
        return [...OPENAI_MODELS, ...customOptions];
    }, [customModels]);

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
                            className="w-full px-4 py-3 pr-10 bg-[var(--koto-bg-elevated)] border border-[var(--koto-border)] rounded-xl focus:ring-2 focus:ring-[var(--koto-accent)] focus:border-transparent outline-none transition-all font-mono text-sm shadow-sm"
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
            </section>

            <div className="h-px bg-[var(--koto-border-light)]" />

            {/* AI Model Section */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-[var(--koto-text-primary)] mb-1">AI Model</h2>
                    <p className="text-sm text-[var(--koto-text-secondary)]">
                        Select the model to use for generating content.
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--koto-text-secondary)]">Active Model</label>
                    <div className="relative">
                        <select
                            value={selectedModelId}
                            onChange={(e) => setSelectedModelId(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--koto-bg-elevated)] border border-[var(--koto-border)] rounded-xl focus:ring-2 focus:ring-[var(--koto-accent)] focus:border-transparent outline-none transition-all text-sm shadow-sm appearance-none"
                        >
                            {allModels.map(model => (
                                <option key={model.id} value={model.id}>
                                    {model.name} ({model.id})
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--koto-text-tertiary)] pointer-events-none p-1">
                            <Bot size={16} />
                        </div>
                    </div>
                </div>

                {/* Model Manager */}
                <ModelManager
                    customModels={customModels}
                    onUpdateModels={setCustomModels}
                />
            </section>
        </div>
    );
};
