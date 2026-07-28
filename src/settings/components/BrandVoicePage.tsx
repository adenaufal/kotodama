import React, { useState } from 'react';
import { BrandVoice, ToneAttributes } from '../../types';
import { validateBrandVoice, TONE_PRESETS, getDefaultToneAttributes, getToneAttributeLabel } from '../../utils/brandVoiceUtils';
import { VOICE_TEMPLATES } from '../../onboarding/constants/voiceTemplates';
import { Plus, Edit3, Trash2, ChevronLeft, X } from 'lucide-react';

interface BrandVoicePageProps {
    voices: BrandVoice[];
    defaultVoiceId: string;
    setDefaultVoiceId: (id: string) => void;
    onRefresh: () => void;
}

type ViewState = 'list' | 'templates' | 'edit';

const TONE_KEYS: (keyof ToneAttributes)[] = [
    'formality', 'humor', 'technicality', 'empathy', 'energy', 'authenticity',
];

export const BrandVoicePage: React.FC<BrandVoicePageProps> = ({
    voices, defaultVoiceId, setDefaultVoiceId, onRefresh
}) => {
    const [viewState, setViewState] = useState<ViewState>('list');
    const [editingVoice, setEditingVoice] = useState<BrandVoice | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<BrandVoice>>({
        name: '', description: '', exampleTweets: ['', '', ''], guidelines: '',
        toneAttributes: getDefaultToneAttributes(), category: 'custom', tags: [],
    });

    const resetForm = () => {
        setFormData({ name: '', description: '', exampleTweets: ['', '', ''], guidelines: '', toneAttributes: getDefaultToneAttributes(), category: 'custom', tags: [] });
        setEditingVoice(null); setError(null);
    };

    const handleCreate = () => { resetForm(); setViewState('templates'); };
    const handleEdit = (voice: BrandVoice) => {
        setEditingVoice(voice);
        setFormData({ ...voice, exampleTweets: [...voice.exampleTweets], toneAttributes: { ...voice.toneAttributes } });
        setViewState('edit'); setError(null);
    };
    const handleBack = () => { setViewState('list'); resetForm(); };

    const handleTemplateSelect = (templateId: string) => {
        const template = VOICE_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            let initialAttributes = getDefaultToneAttributes();
            if (template.id === 'professional') initialAttributes = { ...initialAttributes, formality: 80, humor: 10, technicality: 60 };
            if (template.id === 'casual') initialAttributes = { ...initialAttributes, formality: 20, humor: 70, empathy: 80 };
            if (template.id === 'witty') initialAttributes = { ...initialAttributes, formality: 40, humor: 90, technicality: 80, energy: 70 };
            const isCustom = template.id === 'custom';
            setFormData({
                name: isCustom ? '' : template.name, description: isCustom ? '' : `${template.description} ${template.guidelines}`,
                exampleTweets: [...template.exampleTweets], guidelines: isCustom ? '' : template.guidelines,
                toneAttributes: initialAttributes, category: 'custom', tags: [],
            });
            setViewState('edit');
        }
    };

    const handleDelete = async (voiceId: string, voiceName: string) => {
        if (!confirm(`Delete "${voiceName}"?`)) return;
        try {
            const response = await chrome.runtime.sendMessage({ type: 'delete-brand-voice', payload: { id: voiceId } });
            if (response.success) onRefresh();
        } catch (err) { console.error('Failed to delete voice:', err); }
    };

    const handleSave = async () => {
        const validation = validateBrandVoice(formData);
        if (!validation.isValid) { setError(validation.errors[0]); return; }
        setIsSaving(true); setError(null);
        try {
            const validExamples = formData.exampleTweets?.filter((t) => t.trim().length > 0) || [];
            const voiceToSave: BrandVoice = {
                id: editingVoice?.id || `voice_${Date.now()}`, name: formData.name!.trim(), description: formData.description?.trim() || '',
                exampleTweets: validExamples, guidelines: formData.guidelines?.trim() || '', toneAttributes: formData.toneAttributes || getDefaultToneAttributes(),
                category: formData.category || 'custom', tags: formData.tags || [], isTemplate: false,
                createdAt: editingVoice?.createdAt || new Date(), updatedAt: new Date(),
            };
            const response = await chrome.runtime.sendMessage({ type: 'save-brand-voice', payload: voiceToSave });
            if (response.success) { onRefresh(); handleBack(); } else { setError(response.error || 'Failed to save.'); }
        } catch (e: any) { setError(e.message || 'Failed to save.'); }
        finally { setIsSaving(false); }
    };

    const updateExampleTweet = (i: number, v: string) => { const n = [...(formData.exampleTweets || [])]; n[i] = v; setFormData({ ...formData, exampleTweets: n }); };
    const addExampleTweet = () => setFormData({ ...formData, exampleTweets: [...(formData.exampleTweets || []), ''] });
    const removeExampleTweet = (i: number) => { const n = [...(formData.exampleTweets || [])]; n.splice(i, 1); setFormData({ ...formData, exampleTweets: n }); };
    const applyTonePreset = (key: string) => { const p = TONE_PRESETS[key]; if (p) setFormData({ ...formData, toneAttributes: { ...p.attributes } }); };
    const updateToneAttribute = (key: keyof ToneAttributes, v: number) => setFormData({ ...formData, toneAttributes: { ...(formData.toneAttributes || getDefaultToneAttributes()), [key]: v } });

    /** One row per attribute. Six bordered cards said nothing six rows don't. */
    const renderToneSlider = (key: keyof ToneAttributes) => {
        const label = getToneAttributeLabel(key);
        const value = formData.toneAttributes?.[key] ?? 50;
        return (
            <div key={key} className="py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor={`tone-${key}`} className="text-xs text-ink">{label.label}</label>
                    <span className="font-mono text-xs tabular-nums text-faint">{value}</span>
                </div>
                <input
                    id={`tone-${key}`}
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => updateToneAttribute(key, parseInt(e.target.value, 10))}
                    className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-line accent-[var(--koto-accent)]"
                />
                <div className="mt-1 flex justify-between text-xs text-faint">
                    <span>{label.low}</span>
                    <span>{label.high}</span>
                </div>
            </div>
        );
    };

    // === TEMPLATE SELECTION ===
    if (viewState === 'templates') {
        return (
            <div className="koto-rise">
                <button onClick={handleBack} className="koto-btn koto-btn-ghost -ml-3.5 mb-6 h-8 text-xs">
                    <ChevronLeft size={14} strokeWidth={1.5} /> Voices
                </button>

                <h2 className="text-sm font-medium text-ink">Start from</h2>
                <ul className="mt-4 divide-y divide-line border-y border-line">
                    {VOICE_TEMPLATES.map((template) => (
                        <li key={template.id}>
                            <button
                                onClick={() => handleTemplateSelect(template.id)}
                                className="group flex w-full items-start gap-3 py-4 text-left transition-colors duration-150 hover:bg-raise"
                            >
                                <span aria-hidden className="mt-0.5 w-5 shrink-0 text-center text-sm">{template.icon}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium text-ink">{template.name}</span>
                                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">{template.description}</span>
                                </span>
                                <span aria-hidden className="mt-0.5 text-sm text-faint transition-colors group-hover:text-ink">→</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    // === EDIT ===
    if (viewState === 'edit') {
        return (
            <div className="koto-rise">
                <button onClick={handleBack} className="koto-btn koto-btn-ghost -ml-3.5 mb-6 h-8 text-xs">
                    <ChevronLeft size={14} strokeWidth={1.5} /> Voices
                </button>

                <h2 className="text-sm font-medium text-ink">{editingVoice ? 'Edit voice' : 'New voice'}</h2>

                <div className="mt-6 space-y-8">
                    <div>
                        <label htmlFor="voice-name" className="koto-label">Name</label>
                        <input
                            id="voice-name"
                            value={formData.name || ''}
                            onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setError(null); }}
                            className="koto-field"
                            placeholder="Friendly Guide"
                        />
                    </div>

                    <div>
                        <label htmlFor="voice-description" className="koto-label">How it sounds</label>
                        <textarea
                            id="voice-description"
                            value={formData.description || ''}
                            onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setError(null); }}
                            className="koto-field resize-none"
                            rows={3}
                            placeholder="Key phrases, tone notes, things to avoid…"
                        />
                    </div>

                    <div>
                        <label htmlFor="voice-guidelines" className="koto-label">Extra instructions</label>
                        <textarea
                            id="voice-guidelines"
                            value={formData.guidelines || ''}
                            onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })}
                            className="koto-field resize-none font-mono text-xs"
                            rows={4}
                            placeholder="Appended to the system prompt. Optional."
                        />
                    </div>

                    <hr className="koto-rule" />

                    <div>
                        <h3 className="koto-label">Examples</h3>
                        <div className="space-y-2">
                            {(formData.exampleTweets || []).map((tweet, i) => (
                                <div key={i} className="flex gap-2">
                                    <textarea
                                        value={tweet}
                                        onChange={(e) => updateExampleTweet(i, e.target.value)}
                                        className="koto-field resize-none"
                                        rows={2}
                                        aria-label={`Example ${i + 1}`}
                                        placeholder={i === 0 ? 'Paste something you actually wrote' : ''}
                                    />
                                    <button
                                        onClick={() => removeExampleTweet(i)}
                                        aria-label={`Remove example ${i + 1}`}
                                        className="grid size-8 shrink-0 place-items-center self-start rounded-md text-faint transition-colors hover:text-danger"
                                    >
                                        <X size={14} strokeWidth={1.5} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addExampleTweet} className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink">
                            <Plus size={13} strokeWidth={1.5} /> Add example
                        </button>
                    </div>

                    <hr className="koto-rule" />

                    <div>
                        <h3 className="koto-label">Tone</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {Object.entries(TONE_PRESETS).map(([key, preset]) => (
                                <button
                                    key={key}
                                    onClick={() => applyTonePreset(key)}
                                    title={preset.description}
                                    className="rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-line-strong hover:text-ink"
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 divide-y divide-line border-y border-line">
                            {TONE_KEYS.map(renderToneSlider)}
                        </div>
                    </div>

                    {error && <p role="alert" className="text-xs text-danger">{error}</p>}

                    <div className="flex items-center justify-end gap-2 pb-4">
                        <button onClick={handleBack} className="koto-btn koto-btn-ghost">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="koto-btn koto-btn-primary">
                            {isSaving ? 'Saving…' : 'Save voice'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // === LIST ===
    return (
        <div className="koto-rise space-y-10">
            {voices.length === 0 ? (
                <div className="border-y border-line py-14 text-center">
                    <p className="text-sm text-ink">No voices yet</p>
                    <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-muted">
                        A voice is a description plus a few examples. Kotodama reads it before every draft so
                        replies keep sounding like you.
                    </p>
                    <button onClick={handleCreate} className="koto-btn koto-btn-primary mt-6">
                        Create a voice
                    </button>
                </div>
            ) : (
                <>
                    <div>
                        <label htmlFor="default-voice" className="koto-label">Default voice</label>
                        <select
                            id="default-voice"
                            value={defaultVoiceId}
                            onChange={(e) => setDefaultVoiceId(e.target.value)}
                            className="koto-field"
                        >
                            <option value="">None — pick per reply</option>
                            {voices.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
                        </select>
                    </div>

                    <div>
                        <div className="flex items-baseline justify-between gap-3">
                            <h2 className="koto-label mb-0">
                                {voices.length} voice{voices.length > 1 ? 's' : ''}
                            </h2>
                            <button onClick={handleCreate} className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink">
                                <Plus size={13} strokeWidth={1.5} /> New
                            </button>
                        </div>

                        <ul className="mt-2 divide-y divide-line border-y border-line">
                            {voices.map(voice => (
                                <li key={voice.id} className="group flex items-center gap-3 py-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm text-ink">{voice.name}</p>
                                            {defaultVoiceId === voice.id && (
                                                <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-text">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="truncate text-xs text-faint">{voice.description || 'No description'}</p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                                        <button
                                            onClick={() => handleEdit(voice)}
                                            aria-label={`Edit ${voice.name}`}
                                            className="grid size-7 place-items-center rounded-md text-faint transition-colors hover:text-ink"
                                        >
                                            <Edit3 size={14} strokeWidth={1.5} />
                                        </button>
                                        {!voice.isTemplate && (
                                            <button
                                                onClick={() => handleDelete(voice.id, voice.name)}
                                                aria-label={`Delete ${voice.name}`}
                                                className="grid size-7 place-items-center rounded-md text-faint transition-colors hover:text-danger"
                                            >
                                                <Trash2 size={14} strokeWidth={1.5} />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};
