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
    setViewMode('templates'); // Go to templates first
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

      // Rough mapping of template types to tone attributes
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
    if (!confirm(`Are you sure you want to delete "${voiceName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'delete-brand-voice',
        payload: { id: voiceId },
      });

      if (response.success) {
        onRefresh();
        setError(null);
      } else {
        setError(response.error || 'Failed to delete brand voice');
      }
    } catch (deleteError: any) {
      setError(deleteError.message || 'Failed to delete brand voice');
    }
  };

  const handleValidate = () => {
    const result = validateBrandVoice(formData);
    setValidationResult(result);
    return result;
  };

  const handleSave = async () => {
    const validation = handleValidate();

    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const validExamples = formData.exampleTweets?.filter((tweet) => tweet.trim().length > 0) || [];

      const voiceToSave: BrandVoice = {
        id: editingVoice?.id || `voice_${Date.now()}`,
        name: formData.name!.trim(),
        description: formData.description?.trim() || '',
        exampleTweets: validExamples,
        guidelines: formData.guidelines?.trim() || '',
        toneAttributes: formData.toneAttributes || getDefaultToneAttributes(),
        category: formData.category || 'custom',
        tags: formData.tags || [],
        isTemplate: false,
        createdAt: editingVoice?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      const response = await chrome.runtime.sendMessage({
        type: 'save-brand-voice',
        payload: voiceToSave,
      });

      if (response.success) {
        setEditingVoice(null);
        setIsCreating(false);
        setViewMode('list');
        onRefresh();
      } else {
        setError(response.error || 'Failed to save brand voice');
      }
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save brand voice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingVoice(null);
    setIsCreating(false);
    setViewMode('list');
    setError(null);
    setValidationResult(null);
  };

  const handleExportJSON = (voice: BrandVoice) => {
    const json = exportBrandVoice(voice);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${voice.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = (voice: BrandVoice) => {
    const markdown = exportBrandVoiceAsMarkdown(voice);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${voice.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = importBrandVoice(text);

      const response = await chrome.runtime.sendMessage({
        type: 'save-brand-voice',
        payload: imported,
      });

      if (response.success) {
        onRefresh();
        setError(null);
      } else {
        setError(response.error || 'Failed to import brand voice');
      }
    } catch (importError: any) {
      setError(importError.message || 'Failed to import brand voice');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateExampleTweet = (index: number, value: string) => {
    const newExamples = [...(formData.exampleTweets || ['', '', ''])];
    newExamples[index] = value;
    setFormData({ ...formData, exampleTweets: newExamples });
  };

  const addExampleTweet = () => {
    setFormData({
      ...formData,
      exampleTweets: [...(formData.exampleTweets || []), ''],
    });
  };

  const removeExampleTweet = (index: number) => {
    const newExamples = [...(formData.exampleTweets || [])];
    newExamples.splice(index, 1);
    setFormData({ ...formData, exampleTweets: newExamples });
  };

  const applyTonePreset = (presetKey: string) => {
    const preset = TONE_PRESETS[presetKey];
    if (preset) {
      setFormData({
        ...formData,
        toneAttributes: { ...preset.attributes },
      });
    }
  };

  const updateToneAttribute = (key: keyof ToneAttributes, value: number) => {
    setFormData({
      ...formData,
      toneAttributes: {
        ...(formData.toneAttributes || getDefaultToneAttributes()),
        [key]: value,
      },
    });
  };

  const renderToneSlider = (key: keyof ToneAttributes) => {
    const label = getToneAttributeLabel(key);
    const value = formData.toneAttributes?.[key] || 50;

    return (
      <div
        key={key}
        className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">
            {label.label}
          </span>
          <span className="text-sm font-bold text-[var(--koto-sakura-pink)]">
            {value}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          <span className="w-16 text-left leading-tight">{label.low}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => updateToneAttribute(key, parseInt(e.target.value, 10))}
            className="flex-1 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[var(--koto-sakura-pink)]"
          />
          <span className="w-16 text-right leading-tight">{label.high}</span>
        </div>
      </div>
    );
  };

  // Render Templates View
  if (viewMode === 'templates') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-md bg-white/30 p-4 flex items-center justify-center font-sans">
        <div className="bg-white rounded-[32px] shadow-2xl border border-white/50 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Choose a Template</h2>
              <p className="text-slate-500">Select a starting point for your new brand voice.</p>
            </div>
            <button
              onClick={() => setViewMode('list')}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {VOICE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="group text-left p-6 rounded-2xl border-2 border-slate-100 bg-white hover:border-[var(--koto-sakura-pink)] hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 flex flex-col h-full"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 transform origin-left">
                    {template.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">
                    {template.description}
                  </p>
                  <div className="w-full py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm text-center group-hover:bg-[var(--koto-sakura-pink)] group-hover:text-white transition-colors">
                    Select
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Edit View
  if (viewMode === 'edit') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-md bg-white/30 p-4 flex items-center justify-center font-sans">
        <div className="bg-white rounded-[32px] shadow-2xl border border-white/50 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

          {/* Header */}
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {isCreating ? 'Create Brand Voice' : 'Edit Brand Voice'}
              </h2>
              <p className="text-slate-500 text-sm">Fine-tune your AI's personality settings.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[var(--koto-sakura-pink)] text-white font-bold text-sm shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Voice'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">

            {/* Errors & Validation Messages */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}
            {validationResult?.warnings.length ? (
              <div className="p-4 rounded-xl bg-amber-50 text-amber-700 text-sm border border-amber-100">
                <strong className="block mb-1">Warnings:</strong>
                <ul className="list-disc pl-5 space-y-1">
                  {validationResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            ) : null}

            {/* Main Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Identity */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg">🆔</span>
                    Identity
                  </h3>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Name</label>
                    <input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border-2 border-slate-100 px-4 py-3 text-sm focus:border-[var(--koto-sakura-pink)] outline-none transition-colors"
                      placeholder="e.g. Friendly Support"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-xl border-2 border-slate-100 px-4 py-3 text-sm focus:border-[var(--koto-sakura-pink)] outline-none transition-colors resize-none"
                      rows={3}
                      placeholder="Briefly describe this voice..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Guidelines (System Prompt)</label>
                    <textarea
                      value={formData.guidelines || ''}
                      onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })}
                      className="w-full rounded-xl border-2 border-slate-100 px-4 py-3 text-sm focus:border-[var(--koto-sakura-pink)] outline-none transition-colors resize-none font-mono text-xs"
                      rows={4}
                      placeholder="Specific instructions for the AI..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg">🐦</span>
                    Examples
                  </h3>
                  <div className="space-y-3">
                    {(formData.exampleTweets || []).map((tweet, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="pt-3 text-xs font-mono text-slate-300 font-bold">0{index + 1}</div>
                        <textarea
                          value={tweet}
                          onChange={(e) => updateExampleTweet(index, e.target.value)}
                          className="flex-1 rounded-xl border-2 border-slate-100 px-4 py-3 text-sm focus:border-[var(--koto-sakura-pink)] outline-none transition-colors resize-none"
                          rows={2}
                          placeholder="Paste a model tweet here..."
                        />
                        <button onClick={() => removeExampleTweet(index)} className="text-slate-300 hover:text-red-500 transition-colors px-1">
                          &times;
                        </button>
                      </div>
                    ))}
                    <button onClick={addExampleTweet} className="text-xs font-bold text-[var(--koto-sakura-pink)] hover:underline ml-6">
                      + Add another example
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Tone */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg">🎚️</span>
                    Tone Attributes
                  </h3>

                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <span className="text-xs font-bold uppercase text-slate-400 block mb-2">Quick Presets</span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(TONE_PRESETS).map(([key, preset]) => (
                        <button
                          key={key}
                          onClick={() => applyTonePreset(key)}
                          className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-[var(--koto-sakura-pink)] hover:text-[var(--koto-sakura-pink)] transition-all"
                          title={preset.description}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
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
      </div>
    );
  }

  // Render List View
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-md bg-white/30 p-4 flex items-center justify-center font-sans">
      <div className="bg-white rounded-[32px] shadow-2xl border border-white/50 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Brand Voices</h2>
            <p className="text-slate-500 text-sm mt-1">Manage your collection of AI personalities.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              Import JSON
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 rounded-xl bg-[var(--koto-sakura-pink)] text-white text-sm font-bold shadow-lg shadow-pink-200 hover:shadow-xl hover:shadow-pink-300 hover:brightness-110 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Voice
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-2"
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {voices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                <span className="text-4xl">🎙️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">No voices yet</h3>
              <p className="text-slate-500 max-w-sm mt-2 mb-8">
                Create a custom brand voice to consistently generate content that sounds like you.
              </p>
              <button
                onClick={handleCreate}
                className="px-6 py-3 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl"
              >
                Create your first voice
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {voices.map(voice => (
                <div
                  key={voice.id}
                  className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all hover:border-pink-200 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-gradient-to-l from-white via-white to-transparent pl-8">
                    <button
                      onClick={() => handleExportJSON(voice)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Export JSON"
                    >
                      <span className="text-xs font-bold">JSON</span>
                    </button>
                    <button
                      onClick={() => handleExportMarkdown(voice)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Export Markdown"
                    >
                      <span className="text-xs font-bold">MD</span>
                    </button>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--koto-sakura-pink)]/10 text-[var(--koto-sakura-pink)] flex items-center justify-center text-xl shadow-inner font-bold">
                      {voice.name.charAt(0)}
                    </div>
                    <div className="pr-12">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{voice.name}</h3>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{voice.category || 'Custom'}</p>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm line-clamp-2 mb-6 h-10">
                    {voice.description || "No description provided."}
                  </p>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                    <button
                      onClick={() => handleEdit(voice)}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-50 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
                    >
                      Edit
                    </button>
                    {!voice.isTemplate && (
                      <button
                        onClick={() => handleDelete(voice.id, voice.name)}
                        className="px-4 py-2 rounded-xl text-red-400 font-semibold text-sm hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    )}
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
