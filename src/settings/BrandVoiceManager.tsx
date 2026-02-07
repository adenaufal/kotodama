import React, { useState, useRef } from 'react';
import { BrandVoice, ToneAttributes } from '../types';
import {
  validateBrandVoice,
  TONE_PRESETS,
  getDefaultToneAttributes,
  getToneAttributeLabel,
  exportBrandVoice,
  exportBrandVoiceAsMarkdown,
  importBrandVoice,
} from '../utils/brandVoiceUtils';
import { VOICE_TEMPLATES } from '../onboarding/constants/voiceTemplates';
import { X, Plus, Upload, Download, Trash2, Edit3, FileJson, FileText } from 'lucide-react';

interface BrandVoiceManagerProps {
  voices: BrandVoice[];
  onClose: () => void;
  onRefresh: () => void;
}

type ViewMode = 'list' | 'edit' | 'templates';

const BrandVoiceManager: React.FC<BrandVoiceManagerProps> = ({ voices, onClose, onRefresh }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingVoice, setEditingVoice] = useState<BrandVoice | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateBrandVoice> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<BrandVoice>>({
    name: '',
    description: '',
    exampleTweets: ['', '', ''],
    guidelines: '',
    toneAttributes: getDefaultToneAttributes(),
    category: 'custom',
    tags: [],
  });

  const handleEdit = (voice: BrandVoice) => {
    setEditingVoice(voice);
    setIsCreating(false);
    setViewMode('edit');
    setFormData({
      ...voice,
      exampleTweets: [...voice.exampleTweets],
      toneAttributes: { ...voice.toneAttributes },
    });
    setError(null);
    setValidationResult(null);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingVoice(null);
    setViewMode('templates');
    setError(null);
    setValidationResult(null);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = VOICE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setIsCreating(true);
      setEditingVoice(null);
      setViewMode('edit');
      let initialAttributes = getDefaultToneAttributes();
      if (template.id === 'professional') initialAttributes = { ...initialAttributes, formality: 80, humor: 10, technicality: 60 };
      if (template.id === 'casual') initialAttributes = { ...initialAttributes, formality: 20, humor: 70, empathy: 80 };
      if (template.id === 'witty') initialAttributes = { ...initialAttributes, formality: 40, humor: 90, technicality: 80, energy: 70 };
      const isCustom = template.id === 'custom';
      setFormData({
        name: isCustom ? '' : template.name,
        description: isCustom ? '' : `${template.description} ${template.guidelines}`,
        exampleTweets: [...template.exampleTweets],
        guidelines: isCustom ? '' : template.guidelines,
        toneAttributes: initialAttributes,
        category: 'custom',
        tags: [],
      });
    }
  };

  const handleDelete = async (voiceId: string, voiceName: string) => {
    if (!confirm(`Are you sure you want to delete "${voiceName}"? This action cannot be undone.`)) return;
    try {
      const response = await chrome.runtime.sendMessage({ type: 'delete-brand-voice', payload: { id: voiceId } });
      if (response.success) { onRefresh(); setError(null); }
      else { setError(response.error || 'Failed to delete brand voice'); }
    } catch (deleteError: any) { setError(deleteError.message || 'Failed to delete brand voice'); }
  };

  const handleValidate = () => { const result = validateBrandVoice(formData); setValidationResult(result); return result; };

  const handleSave = async () => {
    const validation = handleValidate();
    if (!validation.isValid) { setError(validation.errors[0]); return; }
    setIsSaving(true); setError(null);
    try {
      const validExamples = formData.exampleTweets?.filter((tweet) => tweet.trim().length > 0) || [];
      const voiceToSave: BrandVoice = {
        id: editingVoice?.id || `voice_${Date.now()}`, name: formData.name!.trim(), description: formData.description?.trim() || '',
        exampleTweets: validExamples, guidelines: formData.guidelines?.trim() || '', toneAttributes: formData.toneAttributes || getDefaultToneAttributes(),
        category: formData.category || 'custom', tags: formData.tags || [], isTemplate: false,
        createdAt: editingVoice?.createdAt || new Date(), updatedAt: new Date(),
      };
      const response = await chrome.runtime.sendMessage({ type: 'save-brand-voice', payload: voiceToSave });
      if (response.success) { setEditingVoice(null); setIsCreating(false); setViewMode('list'); onRefresh(); }
      else { setError(response.error || 'Failed to save brand voice'); }
    } catch (saveError: any) { setError(saveError.message || 'Failed to save brand voice'); }
    finally { setIsSaving(false); }
  };

  const handleCancel = () => { setEditingVoice(null); setIsCreating(false); setViewMode('list'); setError(null); setValidationResult(null); };

  const handleExportJSON = (voice: BrandVoice) => { const json = exportBrandVoice(voice); const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${voice.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`; a.click(); URL.revokeObjectURL(url); };
  const handleExportMarkdown = (voice: BrandVoice) => { const markdown = exportBrandVoiceAsMarkdown(voice); const blob = new Blob([markdown], { type: 'text/markdown' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${voice.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`; a.click(); URL.revokeObjectURL(url); };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text(); const imported = importBrandVoice(text);
      const response = await chrome.runtime.sendMessage({ type: 'save-brand-voice', payload: imported });
      if (response.success) { onRefresh(); setError(null); } else { setError(response.error || 'Failed to import brand voice'); }
    } catch (importError: any) { setError(importError.message || 'Failed to import brand voice'); }
    if (fileInputRef.current) { fileInputRef.current.value = ''; }
  };

  const updateExampleTweet = (index: number, value: string) => { const newExamples = [...(formData.exampleTweets || ['', '', ''])]; newExamples[index] = value; setFormData({ ...formData, exampleTweets: newExamples }); };
  const addExampleTweet = () => { setFormData({ ...formData, exampleTweets: [...(formData.exampleTweets || []), ''] }); };
  const removeExampleTweet = (index: number) => { const newExamples = [...(formData.exampleTweets || [])]; newExamples.splice(index, 1); setFormData({ ...formData, exampleTweets: newExamples }); };
  const applyTonePreset = (presetKey: string) => { const preset = TONE_PRESETS[presetKey]; if (preset) { setFormData({ ...formData, toneAttributes: { ...preset.attributes } }); } };
  const updateToneAttribute = (key: keyof ToneAttributes, value: number) => { setFormData({ ...formData, toneAttributes: { ...(formData.toneAttributes || getDefaultToneAttributes()), [key]: value } }); };

  const renderToneSlider = (key: keyof ToneAttributes) => {
    const label = getToneAttributeLabel(key);
    const value = formData.toneAttributes?.[key] || 50;
    return (
      <div key={key} className="p-4 rounded-xl bg-[var(--koto-bg-elevated)] border border-[var(--koto-border-light)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[var(--koto-text-primary)]">{label.label}</span>
          <span className="text-sm font-bold text-[var(--koto-accent)]">{value}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--koto-text-tertiary)] uppercase tracking-wide">
          <span className="w-16 text-left leading-tight">{label.low}</span>
          <input type="range" min="0" max="100" value={value} onChange={(e) => updateToneAttribute(key, parseInt(e.target.value, 10))} className="flex-1 h-2 bg-[var(--koto-bg-tertiary)] rounded-full appearance-none cursor-pointer accent-[var(--koto-accent)]" />
          <span className="w-16 text-right leading-tight">{label.high}</span>
        </div>
      </div>
    );
  };

  // === Templates View ===
  if (viewMode === 'templates') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm bg-[var(--koto-bg-primary)]/80 p-4 flex items-center justify-center">
        <div className="bg-[var(--koto-bg-primary)] rounded-2xl shadow-xl border border-[var(--koto-border)] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-6 border-b border-[var(--koto-border-light)] flex items-center justify-between">
            <div><h2 className="text-xl font-bold text-[var(--koto-text-primary)]">Choose a Template</h2><p className="text-sm text-[var(--koto-text-secondary)]">Select a starting point for your new brand voice.</p></div>
            <button onClick={() => setViewMode('list')} className="p-2 rounded-full hover:bg-[var(--koto-bg-tertiary)] transition-colors text-[var(--koto-text-tertiary)]"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-[var(--koto-bg-secondary)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VOICE_TEMPLATES.map((template) => (
                <button key={template.id} onClick={() => handleTemplateSelect(template.id)} className="group text-left p-5 rounded-2xl border border-[var(--koto-border-light)] bg-[var(--koto-bg-primary)] hover:border-[var(--koto-accent)] hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300 transform origin-left">{template.icon}</div>
                  <h3 className="text-lg font-bold text-[var(--koto-text-primary)] mb-1">{template.name}</h3>
                  <p className="text-sm text-[var(--koto-text-secondary)] leading-relaxed mb-4 flex-1">{template.description}</p>
                  <div className="w-full py-2.5 rounded-xl bg-[var(--koto-bg-tertiary)] text-[var(--koto-text-secondary)] font-bold text-sm text-center group-hover:bg-[var(--koto-accent)] group-hover:text-white transition-colors">Select</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === Edit View ===
  if (viewMode === 'edit') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm bg-[var(--koto-bg-primary)]/80 p-4 flex items-center justify-center">
        <div className="bg-[var(--koto-bg-primary)] rounded-2xl shadow-xl border border-[var(--koto-border)] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-6 border-b border-[var(--koto-border-light)] flex items-center justify-between sticky top-0 z-10 bg-[var(--koto-bg-primary)]">
            <div><h2 className="text-xl font-bold text-[var(--koto-text-primary)]">{isCreating ? 'Create Brand Voice' : 'Edit Brand Voice'}</h2><p className="text-sm text-[var(--koto-text-secondary)]">Fine-tune your AI's personality settings.</p></div>
            <div className="flex gap-3">
              <button onClick={handleCancel} className="px-5 py-2 rounded-xl border border-[var(--koto-border)] text-[var(--koto-text-secondary)] font-semibold text-sm hover:bg-[var(--koto-bg-tertiary)] transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 rounded-xl bg-[var(--koto-accent)] text-white font-bold text-sm shadow-md hover:brightness-110 transition-all disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Voice'}</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2"><X size={16} />{error}</div>}
            {validationResult?.warnings.length ? <div className="p-4 rounded-xl bg-amber-50 text-amber-700 text-sm border border-amber-100"><strong className="block mb-1">Warnings:</strong><ul className="list-disc pl-5 space-y-1">{validationResult.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div> : null}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Identity */}
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-[var(--koto-text-primary)] flex items-center gap-2"><span className="w-8 h-8 rounded-lg bg-[var(--koto-bg-tertiary)] flex items-center justify-center text-lg">🆔</span>Identity</h3>
                <div className="space-y-4">
                  <div><label className="text-xs font-bold uppercase text-[var(--koto-text-tertiary)] mb-1.5 block">Name</label><input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-[var(--koto-border)] px-4 py-3 text-sm focus:border-[var(--koto-accent)] outline-none bg-[var(--koto-bg-elevated)]" placeholder="e.g. Friendly Support" /></div>
                  <div><label className="text-xs font-bold uppercase text-[var(--koto-text-tertiary)] mb-1.5 block">Description</label><textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-xl border border-[var(--koto-border)] px-4 py-3 text-sm focus:border-[var(--koto-accent)] outline-none resize-none bg-[var(--koto-bg-elevated)]" rows={3} placeholder="Briefly describe this voice..." /></div>
                  <div><label className="text-xs font-bold uppercase text-[var(--koto-text-tertiary)] mb-1.5 block">Guidelines</label><textarea value={formData.guidelines || ''} onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })} className="w-full rounded-xl border border-[var(--koto-border)] px-4 py-3 text-sm focus:border-[var(--koto-accent)] outline-none resize-none font-mono text-xs bg-[var(--koto-bg-elevated)]" rows={4} placeholder="Specific instructions for the AI..." /></div>
                </div>
                <h3 className="text-lg font-bold text-[var(--koto-text-primary)] flex items-center gap-2 pt-4"><span className="w-8 h-8 rounded-lg bg-[var(--koto-bg-tertiary)] flex items-center justify-center text-lg">🐦</span>Examples</h3>
                <div className="space-y-3">
                  {(formData.exampleTweets || []).map((tweet, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="pt-3 text-xs font-mono text-[var(--koto-text-tertiary)] font-bold">0{index + 1}</div>
                      <textarea value={tweet} onChange={(e) => updateExampleTweet(index, e.target.value)} className="flex-1 rounded-xl border border-[var(--koto-border)] px-4 py-3 text-sm focus:border-[var(--koto-accent)] outline-none resize-none bg-[var(--koto-bg-elevated)]" rows={2} placeholder="Paste a model tweet here..." />
                      <button onClick={() => removeExampleTweet(index)} className="text-[var(--koto-text-tertiary)] hover:text-red-500 transition-colors px-1"><X size={16} /></button>
                    </div>
                  ))}
                  <button onClick={addExampleTweet} className="text-xs font-bold text-[var(--koto-accent)] hover:underline ml-6 flex items-center gap-1"><Plus size={12} />Add another example</button>
                </div>
              </div>
              {/* Right Column: Tone */}
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-[var(--koto-text-primary)] flex items-center gap-2"><span className="w-8 h-8 rounded-lg bg-[var(--koto-bg-tertiary)] flex items-center justify-center text-lg">🎚️</span>Tone Attributes</h3>
                <div className="p-4 rounded-xl bg-[var(--koto-bg-tertiary)] border border-[var(--koto-border-light)]">
                  <span className="text-xs font-bold uppercase text-[var(--koto-text-tertiary)] block mb-2">Quick Presets</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(TONE_PRESETS).map(([key, preset]) => (
                      <button key={key} onClick={() => applyTonePreset(key)} className="px-3 py-1.5 bg-[var(--koto-bg-primary)] border border-[var(--koto-border-light)] rounded-lg text-xs font-medium text-[var(--koto-text-secondary)] hover:border-[var(--koto-accent)] hover:text-[var(--koto-accent)] transition-all" title={preset.description}>{preset.name}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {renderToneSlider('formality')}
                  {renderToneSlider('humor')}
                  {renderToneSlider('technicality')}
                  {renderToneSlider('empathy')}
                  {renderToneSlider('energy')}
                  {renderToneSlider('authenticity')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === List View ===
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm bg-[var(--koto-bg-primary)]/80 p-4 flex items-center justify-center">
      <div className="bg-[var(--koto-bg-primary)] rounded-2xl shadow-xl border border-[var(--koto-border)] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-[var(--koto-border-light)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><h2 className="text-xl font-bold text-[var(--koto-text-primary)]">Brand Voices</h2><p className="text-sm text-[var(--koto-text-secondary)] mt-1">Manage your collection of AI personalities.</p></div>
          <div className="flex items-center gap-3">
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-xl bg-[var(--koto-bg-elevated)] border border-[var(--koto-border-light)] text-[var(--koto-text-secondary)] text-sm font-semibold hover:bg-[var(--koto-bg-tertiary)] transition-all flex items-center gap-2"><Upload size={14} />Import</button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            <button onClick={handleCreate} className="px-4 py-2 rounded-xl bg-[var(--koto-accent)] text-white text-sm font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-2"><Plus size={16} />New Voice</button>
            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--koto-bg-tertiary)] text-[var(--koto-text-tertiary)] transition-colors"><X size={20} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-[var(--koto-bg-secondary)]">
          {error && <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-start gap-3"><X size={16} className="mt-0.5" />{error}</div>}
          {voices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-[var(--koto-bg-tertiary)] flex items-center justify-center mb-6"><span className="text-4xl">🎙️</span></div>
              <h3 className="text-lg font-bold text-[var(--koto-text-primary)]">No voices yet</h3>
              <p className="text-sm text-[var(--koto-text-secondary)] max-w-sm mt-2 mb-6">Create a custom brand voice to consistently generate content that sounds like you.</p>
              <button onClick={handleCreate} className="px-6 py-3 rounded-xl bg-[var(--koto-text-primary)] text-[var(--koto-bg-primary)] font-bold hover:opacity-90 transition-all">Create your first voice</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {voices.map(voice => (
                <div key={voice.id} className="group bg-[var(--koto-bg-primary)] rounded-2xl p-5 border border-[var(--koto-border-light)] hover:shadow-lg transition-all hover:border-[var(--koto-accent)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 bg-gradient-to-l from-[var(--koto-bg-primary)] via-[var(--koto-bg-primary)] to-transparent pl-8">
                    <button onClick={() => handleExportJSON(voice)} className="p-1.5 text-[var(--koto-text-tertiary)] hover:text-[var(--koto-text-primary)] hover:bg-[var(--koto-bg-tertiary)] rounded-lg transition-colors" title="Export JSON"><FileJson size={14} /></button>
                    <button onClick={() => handleExportMarkdown(voice)} className="p-1.5 text-[var(--koto-text-tertiary)] hover:text-[var(--koto-text-primary)] hover:bg-[var(--koto-bg-tertiary)] rounded-lg transition-colors" title="Export Markdown"><FileText size={14} /></button>
                  </div>
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-[var(--koto-accent)]/10 text-[var(--koto-accent)] flex items-center justify-center text-lg font-bold">{voice.name.charAt(0)}</div>
                    <div className="pr-12"><h3 className="font-bold text-[var(--koto-text-primary)] text-base leading-tight">{voice.name}</h3><p className="text-xs font-semibold text-[var(--koto-text-tertiary)] uppercase tracking-wider mt-0.5">{voice.category || 'Custom'}</p></div>
                  </div>
                  <p className="text-[var(--koto-text-secondary)] text-sm line-clamp-2 mb-5 h-10">{voice.description || "No description provided."}</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-[var(--koto-border-light)]">
                    <button onClick={() => handleEdit(voice)} className="flex-1 px-4 py-2 rounded-xl bg-[var(--koto-bg-tertiary)] text-[var(--koto-text-primary)] font-semibold text-sm hover:bg-[var(--koto-bg-elevated)] transition-colors flex items-center justify-center gap-2"><Edit3 size={14} />Edit</button>
                    {!voice.isTemplate && <button onClick={() => handleDelete(voice.id, voice.name)} className="px-4 py-2 rounded-xl text-red-400 font-semibold text-sm hover:bg-red-50 hover:text-red-500 transition-colors flex items-center gap-2"><Trash2 size={14} />Delete</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandVoiceManager;
