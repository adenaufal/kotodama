import React, { useState, useRef } from 'react';
import { BrandVoice, ToneAttributes } from '../types';
import {
  validateBrandVoice,
  TONE_PRESETS,
  BRAND_VOICE_TEMPLATES,
  getDefaultToneAttributes,
  getToneAttributeLabel,
  exportBrandVoice,
  exportBrandVoiceAsMarkdown,
  importBrandVoice,
} from '../utils/brandVoiceUtils';

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
    setViewMode('edit');
    setFormData({
      name: '',
      description: '',
      exampleTweets: ['', '', ''],
      guidelines: '',
      toneAttributes: getDefaultToneAttributes(),
      category: 'custom',
      tags: [],
    });
    setError(null);
    setValidationResult(null);
  };

  const handleCreateFromTemplate = (template: BrandVoice) => {
    setIsCreating(true);
    setEditingVoice(null);
    setViewMode('edit');
    setFormData({
      ...template,
      id: undefined,
      name: `${template.name} (Copy)`,
      exampleTweets: [...template.exampleTweets],
      toneAttributes: { ...template.toneAttributes },
      isTemplate: false,
    });
    setError(null);
    setValidationResult(null);
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
        className="stack-sm rounded-2xl border px-4 py-4"
        style={{
          borderColor: 'rgba(148, 163, 184, 0.28)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)'
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: 'var(--koto-text-primary)' }}>
            {label.label}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--koto-text-secondary)' }}>
            {value}
          </span>
        </div>
        <div
          className="flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-wide"
          style={{ color: 'rgba(226, 232, 240, 0.85)' }}
        >
          <span className="w-20 text-left">{label.low}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => updateToneAttribute(key, parseInt(e.target.value, 10))}
            className="flex-1 cursor-pointer"
            style={{
              accentColor: 'var(--koto-sakura-pink)',
              height: '6px'
            }}
          />
          <span className="w-20 text-right">{label.high}</span>
        </div>
      </div>
    );
  };

  // Render Templates View
  if (viewMode === 'templates') {
    return (
      <div
        className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
      >
        <div className="flex min-h-full items-start justify-center p-4 md:p-8">
          <div
            className="relative flex w-full max-w-4xl max-h-[92vh] flex-col overflow-hidden rounded-3xl border shadow-2xl koto-animate-fadeIn"
            style={{
              borderColor: 'var(--koto-border)',
              backgroundColor: 'var(--koto-surface)',
              boxShadow: 'var(--koto-shadow-lg)'
            }}
          >
            <div
              className="relative overflow-hidden px-6 py-6"
              style={{
                backgroundColor: 'var(--koto-deep-indigo)',
                color: 'var(--koto-text-primary)'
              }}
            >
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold" style={{ color: 'var(--koto-text-primary)' }}>
                    Brand Voice Templates
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--koto-text-secondary)' }}>
                    Choose a template to get started quickly
                  </p>
                </div>
                <button
                  onClick={() => setViewMode('list')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg transition koto-button-hover"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    color: 'var(--koto-text-primary)'
                  }}
                  aria-label="Back"
                >
                  ←
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {BRAND_VOICE_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-2xl border p-5 shadow-sm transition hover:shadow-md"
                    style={{
                      borderColor: 'var(--koto-border)',
                      backgroundColor: 'var(--koto-bg-dark)'
                    }}
                  >
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--koto-text-primary)' }}>
                      {template.name}
                    </h3>
                    <p className="mt-2 text-sm" style={{ color: 'var(--koto-text-secondary)' }}>
                      {template.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {template.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: 'rgba(232, 92, 143, 0.1)',
                            color: 'var(--koto-sakura-pink)'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--koto-text-secondary)' }}>
                      <div>Formality: {template.toneAttributes.formality}</div>
                      <div>Humor: {template.toneAttributes.humor}</div>
                      <div>Technical: {template.toneAttributes.technicality}</div>
                      <div>Energy: {template.toneAttributes.energy}</div>
                    </div>
                    <button
                      onClick={() => handleCreateFromTemplate(template)}
                      className="mt-4 w-full rounded-full px-4 py-2 text-sm font-semibold transition koto-button-hover"
                      style={{
                        backgroundColor: 'var(--koto-sakura-pink)',
                        color: 'white'
                      }}
                    >
                      Use This Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Edit View
  if (viewMode === 'edit') {
    return (
      <div
        className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
      >
        <div className="flex min-h-full items-start justify-center p-4 md:p-8">
          <div
            className="relative flex w-full max-w-3xl max-h-[92vh] flex-col overflow-hidden rounded-3xl border shadow-2xl koto-animate-fadeIn"
            style={{
              borderColor: 'var(--koto-border)',
              backgroundColor: 'var(--koto-surface)',
              boxShadow: 'var(--koto-shadow-lg)'
            }}
          >
            <div
              className="relative overflow-hidden px-6 py-6"
              style={{
                background: 'linear-gradient(135deg, rgba(232, 92, 143, 0.18), rgba(45, 50, 80, 0.18))',
                color: 'var(--koto-text-primary)',
                borderBottom: '1px solid var(--koto-border)'
              }}
            >
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--koto-text-primary)' }}>
                    {isCreating ? 'Create Brand Voice' : 'Edit Brand Voice'}
                  </h2>
                  <p className="mt-2 text-base leading-snug" style={{ color: 'var(--koto-text-secondary)' }}>
                    Configure your unique writing style
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-xl transition koto-button-hover"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    color: 'var(--koto-text-primary)',
                    border: '1px solid rgba(255, 255, 255, 0.25)'
                  }}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div
                  className="mb-4 rounded-2xl border px-4 py-3 text-sm shadow-sm koto-animate-fadeIn"
                  style={{
                    borderColor: 'var(--koto-error)',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    color: 'var(--koto-error)'
                  }}
                >
                  {error}
                </div>
              )}

              {validationResult && (
                <>
                  {validationResult.warnings.length > 0 && (
                    <div
                      className="mb-4 rounded-2xl border px-4 py-3 text-sm shadow-sm"
                      style={{
                        borderColor: '#ff9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        color: '#ff9800'
                      }}
                    >
                      <strong>Warnings:</strong>
                      <ul className="mt-1 ml-4 list-disc">
                        {validationResult.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validationResult.suggestions.length > 0 && (
                    <div
                      className="mb-4 rounded-2xl border px-4 py-3 text-sm shadow-sm"
                      style={{
                        borderColor: 'var(--koto-sakura-pink)',
                        backgroundColor: 'rgba(232, 92, 143, 0.1)',
                        color: 'var(--koto-sakura-pink)'
                      }}
                    >
                      <strong>Suggestions:</strong>
                      <ul className="mt-1 ml-4 list-disc">
                        {validationResult.suggestions.map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              <div className="stack">
                <div className="stack-sm">
                  <label className="text-sm font-semibold" style={{ color: 'var(--koto-text-primary)' }}>
                    Name <span style={{ color: 'var(--koto-error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Professional Tech Expert"
                    required
                    className="w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition"
                    style={{
                      borderColor: 'var(--koto-border)',
                      backgroundColor: 'var(--koto-bg-dark)',
                      color: 'var(--koto-text-primary)'
                    }}
                  />
                </div>

                <div className="stack-sm">
                  <label className="text-sm font-semibold" style={{ color: 'var(--koto-text-primary)' }}>
                    Description <span style={{ color: 'var(--koto-error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this voice"
                    required
                    className="w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition"
                    style={{
                      borderColor: 'var(--koto-border)',
                      backgroundColor: 'var(--koto-bg-dark)',
                      color: 'var(--koto-text-primary)'
                    }}
                  />
                </div>

                <div className="stack-sm">
                  <label className="text-sm font-semibold" style={{ color: 'var(--koto-text-primary)' }}>
                    Guidelines (optional)
                  </label>
                  <textarea
                    value={formData.guidelines || ''}
                    onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })}
                    placeholder="e.g., Always use emojis, Keep it casual, Focus on tech topics"
                    rows={3}
                    className="w-full resize-none rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition"
                    style={{
                      borderColor: 'var(--koto-border)',
                      backgroundColor: 'var(--koto-bg-dark)',
                      color: 'var(--koto-text-primary)'
                    }}
                  />
                </div>

                <div className="stack-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold" style={{ color: 'var(--koto-text-primary)' }}>
                      Example Tweets
                    </label>
                    <button
                      onClick={addExampleTweet}
                      className="text-xs font-semibold transition"
                      style={{ color: 'var(--koto-sakura-pink)' }}
                    >
                      + Add Example
                    </button>
                  </div>
                  <div className="stack-sm">
                    {(formData.exampleTweets || []).map((tweet, index) => (
                      <div key={index} className="flex gap-2">
                        <textarea
                          value={tweet}
                          onChange={(e) => updateExampleTweet(index, e.target.value)}
                          placeholder={`Example ${index + 1}`}
                          rows={2}
                          className="flex-1 resize-none rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition"
                          style={{
                            borderColor: 'var(--koto-border)',
                            backgroundColor: 'var(--koto-bg-dark)',
                            color: 'var(--koto-text-primary)'
                          }}
                        />
                        {(formData.exampleTweets?.length || 0) > 1 && (
                          <button
                            onClick={() => removeExampleTweet(index)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full transition"
                            style={{ color: 'var(--koto-text-secondary)' }}
                            aria-label="Remove example"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="stack-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold" style={{ color: 'var(--koto-text-primary)' }}>
                      Tone Attributes
                    </label>
                    <button
                      onClick={handleValidate}
                      className="text-xs font-semibold transition"
                      style={{ color: 'var(--koto-sakura-pink)' }}
                    >
                      Validate
                    </button>
                  </div>

                  {/* Tone Presets */}
                  <div
                    className="rounded-3xl p-5 shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(232, 92, 143, 0.14), rgba(45, 50, 80, 0.12))',
                      border: '1px solid rgba(232, 92, 143, 0.25)',
                      boxShadow: '0 4px 12px rgba(232, 92, 143, 0.15)'
                    }}
                  >
                    <div className="mb-3 text-sm font-semibold tracking-wide" style={{ color: 'var(--koto-text-primary)' }}>
                      Quick Presets:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(TONE_PRESETS).map(([key, preset]) => (
                        <button
                          key={key}
                          onClick={() => applyTonePreset(key)}
                          className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition koto-button-hover"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.35)',
                            color: 'var(--koto-text-primary)'
                          }}
                          title={preset.description}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tone Sliders */}
                  <div
                    className="stack-sm rounded-3xl p-5"
                    style={{
                      background: 'linear-gradient(140deg, rgba(15, 23, 42, 0.55), rgba(24, 33, 63, 0.45))',
                      border: '1px solid rgba(148, 163, 184, 0.28)',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
                    }}
                  >
                    {renderToneSlider('formality')}
                    {renderToneSlider('humor')}
                    {renderToneSlider('technicality')}
                    {renderToneSlider('empathy')}
                    {renderToneSlider('energy')}
                    {renderToneSlider('authenticity')}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition koto-button-hover disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--koto-sakura-pink)',
                      boxShadow: '0 4px 12px rgba(232, 92, 143, 0.25)'
                    }}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="rounded-full border px-6 py-3 text-sm font-semibold transition koto-button-hover"
                    style={{
                      borderColor: 'var(--koto-border)',
                      color: 'var(--koto-text-secondary)'
                    }}
                  >
                    Cancel
                  </button>
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
    <div
      className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
    >
      <div className="flex min-h-full items-start justify-center p-4 md:p-8">
        <div
          className="relative flex w-full max-w-3xl max-h-[92vh] flex-col overflow-hidden rounded-3xl border shadow-2xl koto-animate-fadeIn"
          style={{
            borderColor: 'var(--koto-border)',
            backgroundColor: 'var(--koto-surface)',
            boxShadow: 'var(--koto-shadow-lg)'
          }}
        >
          <div
            className="relative overflow-hidden px-6 py-6"
            style={{
              background: 'linear-gradient(135deg, rgba(232, 92, 143, 0.16), rgba(45, 50, 80, 0.12))',
              color: 'var(--koto-text-primary)',
              borderBottom: '1px solid var(--koto-border)'
            }}
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--koto-text-primary)' }}>
                  Manage Brand Voices
                </h2>
                <p className="mt-2 text-base leading-snug" style={{ color: 'var(--koto-text-secondary)' }}>
                  Create, edit, and organize your brand voices
                </p>
              </div>
              <button
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-xl transition koto-button-hover"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  color: 'var(--koto-text-primary)',
                  border: '1px solid rgba(255, 255, 255, 0.25)'
                }}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div
                className="mb-4 rounded-2xl border px-4 py-3 text-sm shadow-sm koto-animate-fadeIn"
                style={{
                  borderColor: 'var(--koto-error)',
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  color: 'var(--koto-error)'
                }}
              >
                {error}
              </div>
            )}

            <div className="stack">
              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleCreate}
                  className="flex-1 rounded-2xl px-6 py-5 text-base font-semibold shadow-lg transition koto-button-hover"
                  style={{
                    border: 'none',
                    background: 'linear-gradient(135deg, rgba(232, 92, 143, 0.98), rgba(232, 92, 143, 0.78))',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(232, 92, 143, 0.3)'
                  }}
                >
                  + Create New Brand Voice
                </button>
                <button
                  onClick={() => setViewMode('templates')}
                  className="flex-1 rounded-2xl border px-6 py-5 text-base font-semibold transition koto-button-hover"
                  style={{
                    borderColor: 'rgba(232, 92, 143, 0.45)',
                    backgroundColor: 'rgba(232, 92, 143, 0.08)',
                    color: 'var(--koto-sakura-pink)'
                  }}
                >
                  Browse Templates
                </button>
              </div>

              {/* Import Button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-2xl border px-4 py-2 text-xs font-semibold transition koto-button-hover"
                  style={{
                    borderColor: 'var(--koto-border)',
                    color: 'var(--koto-text-secondary)'
                  }}
                >
                  Import from JSON
                </button>
              </div>

              {voices.length === 0 ? (
                <div
                  className="rounded-2xl border px-6 py-8 text-center"
                  style={{
                    borderColor: 'var(--koto-border)',
                    backgroundColor: 'rgba(26, 29, 46, 0.3)'
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--koto-text-secondary)' }}>
                    No brand voices yet. Create one or start with a template!
                  </p>
                </div>
              ) : (
                <div className="stack-sm">
                  {voices.map((voice) => (
                    <div
                      key={voice.id}
                      className="rounded-2xl border p-4 shadow-sm transition"
                      style={{
                        borderColor: 'var(--koto-border)',
                        backgroundColor: 'var(--koto-bg-dark)'
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold" style={{ color: 'var(--koto-text-primary)' }}>
                              {voice.name}
                            </h3>
                            {voice.isTemplate && (
                              <span
                                className="rounded-full px-2 py-0.5 text-xs font-medium"
                                style={{
                                  backgroundColor: 'rgba(232, 92, 143, 0.1)',
                                  color: 'var(--koto-sakura-pink)'
                                }}
                              >
                                Template
                              </span>
                            )}
                          </div>
                          {voice.description && (
                            <p className="mt-1 text-sm" style={{ color: 'var(--koto-text-secondary)' }}>
                              {voice.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2 text-xs" style={{ color: 'var(--koto-text-secondary)' }}>
                            <span>Formality: {voice.toneAttributes.formality}</span>
                            <span>???</span>
                            <span>Humor: {voice.toneAttributes.humor}</span>
                            <span>???</span>
                            <span>Technical: {voice.toneAttributes.technicality}</span>
                            <span>???</span>
                            <span>Energy: {voice.toneAttributes.energy}</span>
                          </div>
                          <p className="mt-1 text-xs" style={{ color: 'var(--koto-text-secondary)' }}>
                            {voice.exampleTweets.length} example{voice.exampleTweets.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(voice)}
                              className="rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition koto-button-hover"
                              style={{
                                background: 'linear-gradient(135deg, rgba(232, 92, 143, 1), rgba(232, 92, 143, 0.82))',
                                color: '#ffffff',
                                boxShadow: '0 12px 26px rgba(232, 92, 143, 0.28)'
                              }}
                            >
                              Edit
                            </button>
                            {!voice.isTemplate && (
                              <button
                                onClick={() => handleDelete(voice.id, voice.name)}
                                className="rounded-full px-5 py-2 text-sm font-semibold transition koto-button-hover"
                                style={{
                                  backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                  color: 'var(--koto-error)',
                                  border: '1px solid rgba(244, 67, 54, 0.25)'
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleExportJSON(voice)}
                              className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition koto-button-hover"
                              style={{
                                backgroundColor: 'rgba(148, 163, 184, 0.12)',
                                border: '1px solid rgba(148, 163, 184, 0.35)',
                                color: 'var(--koto-text-secondary)'
                              }}
                              title="Export as JSON"
                            >
                              JSON
                            </button>
                            <button
                              onClick={() => handleExportMarkdown(voice)}
                              className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition koto-button-hover"
                              style={{
                                backgroundColor: 'rgba(148, 163, 184, 0.12)',
                                border: '1px solid rgba(148, 163, 184, 0.35)',
                                color: 'var(--koto-text-secondary)'
                              }}
                              title="Export as Markdown"
                            >
                              MD
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandVoiceManager;
