import React, { useState } from 'react';
import { BrandVoice, ToneAttributes } from '../../types';
import { validateBrandVoice, TONE_PRESETS, getDefaultToneAttributes, getToneAttributeLabel } from '../../utils/brandVoiceUtils';
import { VOICE_TEMPLATES } from '../../onboarding/constants/voiceTemplates';
import { Plus, Edit3, Trash2, Star, ChevronDown, ChevronLeft, X } from 'lucide-react';

interface BrandVoicePageProps {
    voices: BrandVoice[];
    defaultVoiceId: string;
    setDefaultVoiceId: (id: string) => void;
    onRefresh: () => void;
}

type ViewState = 'list' | 'templates' | 'edit';

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

    const renderToneSlider = (key: keyof ToneAttributes) => {
        const label = getToneAttributeLabel(key);
        const value = formData.toneAttributes?.[key] || 50;
        return (
            <div key={key} className="p-4 rounded-xl bg-[var(--koto-bg-elevated)] border border-[var(--koto-border-light)]">
                <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold text-[var(--koto-text-primary)]">{label.label}</span><span className="text-sm font-bold text-[var(--koto-accent)]">{value}</span></div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--koto-text-tertiary)] uppercase tracking-wide">
                    <span className="w-14 text-left leading-tight">{label.low}</span>
                    <input type="range" min="0" max="100" value={value} onChange={(e) => updateToneAttribute(key, parseInt(e.target.value, 10))} className="flex-1 h-2 bg-[var(--koto-bg-tertiary)] rounded-full appearance-none cursor-pointer accent-[var(--koto-accent)]" />
                    <span className="w-14 text-right leading-tight">{label.high}</span>
                </div>
            </div>
        );
    };

    // === TEMPLATE SELECTION VIEW ===
    if (viewState === 'templates') {
        return (
            <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
                <button onClick={handleBack} className="flex items-center gap-2 text-sm font-medium text-[var(--koto-text-secondary)] hover:text-[var(--koto-text-primary)] transition-colors"><ChevronLeft size={16} /> Back to Voices</button>
                <div><h2 className="text-xl font-semibold text-[var(--koto-text-primary)]">Choose a Template</h2><p className="text-sm text-[var(--koto-text-secondary)]">Start with a preset or create from scratch.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {VOICE_TEMPLATES.map((template) => (
                        <button key={template.id} onClick={() => handleTemplateSelect(template.id)} className="group text-left p-5 rounded-2xl border border-[var(--koto-border-light)] bg-[var(--koto-bg-elevated)] hover:border-[var(--koto-accent)] hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform origin-left">{template.icon}</div>
                            <h3 className="text-lg font-bold text-[var(--koto-text-primary)] mb-1">{template.name}</h3>
                            <p className="text-sm text-[var(--koto-text-secondary)] leading-relaxed flex-1">{template.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // === EDIT VIEW ===
    if (viewState === 'edit') {
        return (
            <div className="space-y-8 max-w-4xl animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                    <button onClick={handleBack} className="flex items-center gap-2 text-sm font-medium text-[var(--koto-text-secondary)] hover:text-[var(--koto-text-primary)] transition-colors"><ChevronLeft size={16} /> Back to Voices</button>
                    <div className="flex gap-3">
                        <button onClick={handleBack} className="px-5 py-2 rounded-xl border border-[var(--koto-border)] text-[var(--koto-text-secondary)] font-semibold text-sm hover:bg-[var(--koto-bg-tertiary)] transition-colors">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 rounded-xl bg-[var(--koto-accent)] text-white font-bold text-sm shadow-md hover:brightness-110 transition-all disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Voice'}</button>
                    </div>
                </div>
                <div><h2 className="text-xl font-semibold text-[var(--koto-text-primary)]">{editingVoice ? 'Edit Voice' : 'Create Voice'}</h2><p className="text-sm text-[var(--koto-text-secondary)]">Define your AI personality's characteristics.</p></div>
                {error && <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2"><X size={16} />{error}</div>}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Identity & Examples */}
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold text-[var(--koto-text-primary)]">Identity</h3>
                            <div><label className="text-xs font-bold uppercase text-[var(--koto-text-tertiary)] mb-1.5 block">Name</label><input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-[var(--koto-border)] px-4 py-3 text-sm focus:border-[var(--koto-accent)] outline-none bg-[var(--koto-bg-elevated)]" placeholder="e.g. Friendly Guide" /></div>
                            <div><label className="text-xs font-bold uppercase text-[var(--koto-text-tertiary)] mb-1.5 block">Description</label><textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-xl border border-[var(--koto-border)] px-4 py-3 text-sm focus:border-[var(--koto-accent)] outline-none resize-none bg-[var(--koto-bg-elevated)]" rows={3} placeholder="Briefly describe this voice..." /></div>
                            <div><label className="text-xs font-bold uppercase text-[var(--koto-text-tertiary)] mb-1.5 block">Guidelines (System Prompt)</label><textarea value={formData.guidelines || ''} onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })} className="w-full rounded-xl border border-[var(--koto-border)] px-4 py-3 text-sm focus:border-[var(--koto-accent)] outline-none resize-none font-mono text-xs bg-[var(--koto-bg-elevated)]" rows={4} placeholder="Specific instructions for the AI..." /></div>
                        </section>
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold text-[var(--koto-text-primary)]">Example Texts</h3>
                            <div className="space-y-3">
                                {(formData.exampleTweets || []).map((tweet, i) => (
                                    <div key={i} className="flex gap-2"><div className="pt-3 text-xs font-mono text-[var(--koto-text-tertiary)] font-bold w-5">0{i + 1}</div><textarea value={tweet} onChange={(e) => updateExampleTweet(i, e.target.value)} className="flex-1 rounded-xl border border-[var(--koto-border)] px-4 py-3 text-sm focus:border-[var(--koto-accent)] outline-none resize-none bg-[var(--koto-bg-elevated)]" rows={2} placeholder="Paste example text..." /><button onClick={() => removeExampleTweet(i)} className="text-[var(--koto-text-tertiary)] hover:text-red-500 transition-colors px-1 self-start pt-3"><X size={14} /></button></div>
                                ))}
                                <button onClick={addExampleTweet} className="text-xs font-bold text-[var(--koto-accent)] hover:underline flex items-center gap-1 ml-7"><Plus size={12} />Add example</button>
                            </div>
                        </section>
                    </div>
                    {/* Right: Tone */}
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold text-[var(--koto-text-primary)]">Tone Attributes</h3>
                            <div className="p-4 rounded-xl bg-[var(--koto-bg-tertiary)] border border-[var(--koto-border-light)]">
                                <span className="text-xs font-bold uppercase text-[var(--koto-text-tertiary)] block mb-2">Quick Presets</span>
                                <div className="flex flex-wrap gap-2">{Object.entries(TONE_PRESETS).map(([key, preset]) => (<button key={key} onClick={() => applyTonePreset(key)} className="px-3 py-1.5 bg-[var(--koto-bg-primary)] border border-[var(--koto-border-light)] rounded-lg text-xs font-medium text-[var(--koto-text-secondary)] hover:border-[var(--koto-accent)] hover:text-[var(--koto-accent)] transition-all" title={preset.description}>{preset.name}</button>))}</div>
                            </div>
                            <div className="space-y-3">
                                {renderToneSlider('formality')}
                                {renderToneSlider('humor')}
                                {renderToneSlider('technicality')}
                                {renderToneSlider('empathy')}
                                {renderToneSlider('energy')}
                                {renderToneSlider('authenticity')}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        );
    }

    // === LIST VIEW (Default) ===
    return (
        <div className="space-y-10 max-w-3xl animate-in fade-in duration-300">
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div><h2 className="text-xl font-semibold text-[var(--koto-text-primary)]">Your Voices</h2><p className="text-sm text-[var(--koto-text-secondary)]">{voices.length === 0 ? 'Create your first AI personality.' : `${voices.length} voice${voices.length > 1 ? 's' : ''} configured.`}</p></div>
                    <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--koto-accent)] text-white text-sm font-bold shadow-md hover:brightness-110 transition-all"><Plus size={16} />New Voice</button>
                </div>
            </section>
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-[var(--koto-text-primary)]">Default Voice</h2>
                <div className="p-5 rounded-2xl bg-[var(--koto-bg-elevated)] border border-[var(--koto-border-light)]">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--koto-text-tertiary)] block mb-2">When writing, always use:</label>
                    <div className="relative"><select value={defaultVoiceId} onChange={(e) => setDefaultVoiceId(e.target.value)} className="w-full appearance-none rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 border border-[var(--koto-border)] bg-[var(--koto-bg-primary)] focus:border-[var(--koto-accent)] text-[var(--koto-text-primary)] shadow-sm cursor-pointer" disabled={voices.length === 0}><option value="">None (Always ask)</option>{voices.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}</select><div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--koto-text-tertiary)]"><ChevronDown size={16} /></div></div>
                </div>
            </section>
            <div className="h-px bg-[var(--koto-border-light)]" />
            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-[var(--koto-text-primary)]">All Voices</h2>
                {voices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border-2 border-dashed border-[var(--koto-border-light)] bg-[var(--koto-bg-tertiary)]"><div className="w-16 h-16 rounded-full bg-[var(--koto-bg-elevated)] flex items-center justify-center mb-4"><span className="text-3xl">🎙️</span></div><h3 className="text-base font-bold text-[var(--koto-text-primary)]">No voices yet</h3><p className="text-sm text-[var(--koto-text-secondary)] max-w-xs mt-1 mb-4">Create a brand voice to write in a consistent style.</p><button onClick={handleCreate} className="px-5 py-2.5 rounded-xl bg-[var(--koto-text-primary)] text-[var(--koto-bg-primary)] font-bold text-sm hover:opacity-90 transition-all">Create your first voice</button></div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {voices.map(voice => (
                            <div key={voice.id} className="group p-4 rounded-2xl bg-[var(--koto-bg-elevated)] border border-[var(--koto-border-light)] hover:border-[var(--koto-accent)] transition-all flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[var(--koto-accent)]/10 text-[var(--koto-accent)] flex items-center justify-center text-base font-bold flex-shrink-0">{voice.name.charAt(0)}</div>
                                <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><h3 className="font-semibold text-[var(--koto-text-primary)] truncate">{voice.name}</h3>{defaultVoiceId === voice.id && (<span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase"><Star size={10} fill="currentColor" /> Default</span>)}</div><p className="text-xs text-[var(--koto-text-tertiary)] truncate">{voice.description || 'No description'}</p></div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEdit(voice)} className="p-2 rounded-lg text-[var(--koto-text-tertiary)] hover:bg-[var(--koto-bg-tertiary)] hover:text-[var(--koto-text-primary)] transition-colors" title="Edit"><Edit3 size={16} /></button>{!voice.isTemplate && (<button onClick={() => handleDelete(voice.id, voice.name)} className="p-2 rounded-lg text-[var(--koto-text-tertiary)] hover:bg-red-50 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={16} /></button>)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
