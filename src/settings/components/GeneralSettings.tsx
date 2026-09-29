import React, { useEffect, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { getModelsByProvider, getDefaultModelForProvider } from '../../constants/models';
import { AIProvider } from '../../types';
import { Theme } from '../../utils/theme';
import { ModelManager } from './ModelManager';

const PROVIDER_META: { id: AIProvider; label: string; placeholder: string; keyUrl: string }[] = [
    { id: 'openai', label: 'OpenAI', placeholder: 'sk-...', keyUrl: 'https://platform.openai.com/api-keys' },
    { id: 'gemini', label: 'Gemini', placeholder: 'AIza...', keyUrl: 'https://aistudio.google.com/app/apikey' },
    { id: 'claude', label: 'Claude', placeholder: 'sk-ant-...', keyUrl: 'https://console.anthropic.com/settings/keys' },
];

const THEMES: { id: Theme; label: string }[] = [
    { id: 'auto', label: 'System' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
];

interface GeneralSettingsProps {
    apiKeys: Record<AIProvider, string>;
    setApiKeys: (keys: Record<AIProvider, string>) => void;
    configuredProviders: AIProvider[];
    credentialsUnlocked: boolean;
    onRemoveCredential: (provider: AIProvider) => void;

    provider: AIProvider;
    setProvider: (provider: AIProvider) => void;

    selectedModelId: string;
    setSelectedModelId: (modelId: string) => void;

    customModels: { id: string; name: string }[];
    setCustomModels: (models: { id: string; name: string }[]) => void;

    theme: Theme;
    setTheme: (theme: Theme) => void;

    saveState: 'idle' | 'saving' | 'saved' | 'error';
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
    apiKeys,
    setApiKeys,
    configuredProviders,
    credentialsUnlocked,
    onRemoveCredential,
    provider,
    setProvider,
    selectedModelId,
    setSelectedModelId,
    customModels,
    setCustomModels,
    theme,
    setTheme,
    saveState
}) => {
    // Models follow the selected provider; custom model IDs stay available to all.
    const allModels = useMemo(
        () => [...getModelsByProvider(provider), ...customModels.map(m => ({ id: m.id, name: m.name }))],
        [provider, customModels]
    );

    // A model saved under a different provider can't be used — fall back to that provider's default.
    useEffect(() => {
        if (!allModels.some(m => m.id === selectedModelId)) {
            setSelectedModelId(getDefaultModelForProvider(provider));
        }
    }, [allModels, selectedModelId, provider]);

    return (
        <div className="koto-rise space-y-10">
            <section>
                <div className="flex items-baseline justify-between gap-3 pb-5">
                    <h2 className="text-sm font-medium text-ink">API keys</h2>
                    {/* Autosave with no receipt is autosave you don't trust. */}
                    <span
                        aria-live="polite"
                        className={`text-xs transition-opacity duration-300 ${saveState === 'idle' ? 'opacity-0' : 'opacity-100'
                            } ${saveState === 'error' ? 'text-danger' : 'text-faint'}`}
                    >
                        {saveState === 'saving' && 'Saving…'}
                        {saveState === 'saved' && 'Saved'}
                        {saveState === 'error' && 'Could not save'}
                    </span>
                </div>

                <div className="space-y-5">
                    {PROVIDER_META.map(({ id, label, placeholder, keyUrl }) => (
                        <div key={id}>
                            <div className="flex items-baseline justify-between gap-3">
                                <label htmlFor={`api-key-${id}`} className="koto-label mb-0">
                                    {label}
                                </label>
                                <a
                                    href={keyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-accent-text underline underline-offset-2"
                                >
                                    Get a key
                                </a>
                            </div>
                            <div className="relative mt-1.5">
                                <input
                                    id={`api-key-${id}`}
                                    type="password"
                                    value={apiKeys[id]}
                                    onChange={(e) => setApiKeys({ ...apiKeys, [id]: e.target.value })}
                                    placeholder={configuredProviders.includes(id) ? 'Saved — enter a new key to replace' : placeholder}
                                    autoComplete="off"
                                    spellCheck={false}
                                    disabled={!credentialsUnlocked}
                                    className="koto-field font-mono text-xs disabled:cursor-not-allowed disabled:opacity-60"
                                />
                            </div>
                            {configuredProviders.includes(id) && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveCredential(id)}
                                    disabled={!credentialsUnlocked}
                                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-faint transition-colors hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Trash2 size={12} strokeWidth={1.5} />
                                    Remove saved key
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <p className="mt-4 text-xs leading-relaxed text-faint">
                    Saved keys are encrypted with your master passphrase and stored on this device. Leave a field blank
                    to keep its saved key; enter a new value to replace it. One provider is enough.
                </p>
            </section>

            <hr className="koto-rule" />

            <section>
                <h2 className="pb-5 text-sm font-medium text-ink">Model</h2>

                <div className="space-y-5">
                    <div>
                        <label htmlFor="default-provider" className="koto-label">Provider</label>
                        <select
                            id="default-provider"
                            value={provider}
                            onChange={(e) => setProvider(e.target.value as AIProvider)}
                            className="koto-field"
                        >
                            {PROVIDER_META.map(({ id, label }) => (
                                <option key={id} value={id} disabled={!apiKeys[id].trim() && !configuredProviders.includes(id)}>
                                    {label}{apiKeys[id].trim() || configuredProviders.includes(id) ? '' : ' — add a key first'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="active-model" className="koto-label">Active model</label>
                        <select
                            id="active-model"
                            value={selectedModelId}
                            onChange={(e) => setSelectedModelId(e.target.value)}
                            className="koto-field"
                        >
                            {allModels.length === 0 && (
                                <option value="">No built-in models — add one below</option>
                            )}
                            {allModels.map(model => (
                                <option key={model.id} value={model.id}>
                                    {model.name} ({model.id})
                                </option>
                            ))}
                        </select>
                        <p className="mt-2 text-xs text-faint">
                            Used to draft replies. Reading the tweet always uses a cheap vision model.
                        </p>
                    </div>
                </div>

                <ModelManager customModels={customModels} onUpdateModels={setCustomModels} />
            </section>

            <hr className="koto-rule" />

            <section>
                <h2 className="pb-5 text-sm font-medium text-ink">Appearance</h2>

                <fieldset>
                    <legend className="koto-label">Theme</legend>
                    <div className="inline-flex rounded-koto border border-line p-0.5">
                        {THEMES.map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTheme(id)}
                                aria-pressed={theme === id}
                                className={`rounded-[7px] px-3 py-1.5 text-xs transition-colors duration-150 ${theme === id ? 'bg-raise font-medium text-ink' : 'text-muted hover:text-ink'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-faint">
                        Applies to these pages and to the reply panel on X.
                    </p>
                </fieldset>
            </section>
        </div>
    );
};
