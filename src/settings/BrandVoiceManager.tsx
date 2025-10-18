import React, { useState } from 'react';
import { BrandVoice } from '../types';

interface BrandVoiceManagerProps {
  voices: BrandVoice[];
  onClose: () => void;
  onRefresh: () => void;
}

const BrandVoiceManager: React.FC<BrandVoiceManagerProps> = ({ voices, onClose, onRefresh }) => {
  const [editingVoice, setEditingVoice] = useState<BrandVoice | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<BrandVoice>>({
    name: '',
    description: '',
    exampleTweets: ['', '', ''],
    guidelines: '',
    toneAttributes: {
      formality: 50,
      humor: 50,
      technicality: 50,
    },
  });

  const handleEdit = (voice: BrandVoice) => {
    setEditingVoice(voice);
    setIsCreating(false);
    setFormData({
      ...voice,
      exampleTweets: [...voice.exampleTweets],
    });
    setError(null);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingVoice(null);
    setFormData({
      name: '',
      description: '',
      exampleTweets: ['', '', ''],
      guidelines: '',
      toneAttributes: {
        formality: 50,
        humor: 50,
        technicality: 50,
      },
    });
    setError(null);
  };

  const handleDelete = async (voiceId: string) => {
    if (!confirm('Are you sure you want to delete this brand voice? This action cannot be undone.')) {
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

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      setError('Please enter a name for your brand voice');
      return;
    }

    if (!formData.description?.trim()) {
      setError('Please enter a description for your brand voice');
      return;
    }

    const validExamples = formData.exampleTweets?.filter((tweet) => tweet.trim().length > 0) || [];
    if (validExamples.length === 0) {
      setError('Please provide at least one example tweet');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const voiceToSave: BrandVoice = {
        id: editingVoice?.id || `voice_${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        exampleTweets: validExamples,
        guidelines: formData.guidelines?.trim() || '',
        toneAttributes: formData.toneAttributes || {
          formality: 50,
          humor: 50,
          technicality: 50,
        },
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
    setError(null);
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

  const isEditing = editingVoice !== null || isCreating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(26, 29, 46, 0.7)' }}>
      <div className="relative mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border shadow-2xl koto-animate-fadeIn" style={{
        borderColor: 'var(--koto-border)',
        backgroundColor: 'var(--koto-surface)',
        boxShadow: 'var(--koto-shadow-lg)'
      }}>
        <div className="relative overflow-hidden px-6 py-6 text-white" style={{ backgroundColor: 'var(--koto-deep-indigo)' }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--koto-text-primary)' }}>
                {isEditing ? (isCreating ? 'Create Brand Voice' : 'Edit Brand Voice') : 'Manage Brand Voices'}
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--koto-text-secondary)' }}>
                {isEditing ? 'Configure your unique writing style' : 'Edit or remove your brand voices'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg text-white transition hover:bg-white/25 koto-button-hover"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-2xl border px-4 py-3 text-sm shadow-sm koto-animate-fadeIn" style={{
              borderColor: 'var(--koto-error)',
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              color: 'var(--koto-error)'
            }}>
              {error}
            </div>
          )}

          {isEditing ? (
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
                <label className="text-sm font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Guidelines (optional)</label>
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
                  <label className="text-sm font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Example Tweets</label>
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
                <label className="text-sm font-semibold" style={{ color: 'var(--koto-text-primary)' }}>Tone Attributes</label>
                <div className="stack-sm rounded-2xl p-4" style={{ backgroundColor: 'rgba(26, 29, 46, 0.5)' }}>
                  <div className="stack-sm">
                    <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--koto-text-secondary)' }}>
                      <span>Formality</span>
                      <span>{formData.toneAttributes?.formality || 50}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.toneAttributes?.formality || 50}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          toneAttributes: {
                            ...(formData.toneAttributes || { formality: 50, humor: 50, technicality: 50 }),
                            formality: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-full"
                      style={{ accentColor: 'var(--koto-sakura-pink)' }}
                    />
                  </div>

                  <div className="stack-sm">
                    <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--koto-text-secondary)' }}>
                      <span>Humor</span>
                      <span>{formData.toneAttributes?.humor || 50}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.toneAttributes?.humor || 50}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          toneAttributes: {
                            ...(formData.toneAttributes || { formality: 50, humor: 50, technicality: 50 }),
                            humor: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-full"
                      style={{ accentColor: 'var(--koto-sakura-pink)' }}
                    />
                  </div>

                  <div className="stack-sm">
                    <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--koto-text-secondary)' }}>
                      <span>Technicality</span>
                      <span>{formData.toneAttributes?.technicality || 50}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.toneAttributes?.technicality || 50}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          toneAttributes: {
                            ...(formData.toneAttributes || { formality: 50, humor: 50, technicality: 50 }),
                            technicality: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-full"
                      style={{ accentColor: 'var(--koto-sakura-pink)' }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition koto-button-hover disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--koto-sakura-pink)',
                    boxShadow: '0 4px 12px rgba(232, 92, 143, 0.3)'
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
          ) : (
            <div className="stack">
              <button
                onClick={handleCreate}
                className="w-full rounded-2xl border-2 border-dashed px-6 py-4 text-sm font-semibold transition koto-button-hover"
                style={{
                  borderColor: 'var(--koto-border)',
                  backgroundColor: 'rgba(26, 29, 46, 0.3)',
                  color: 'var(--koto-text-secondary)'
                }}
              >
                + Create New Brand Voice
              </button>

              {voices.length === 0 ? (
                <div className="rounded-2xl border px-6 py-8 text-center" style={{
                  borderColor: 'var(--koto-border)',
                  backgroundColor: 'rgba(26, 29, 46, 0.3)'
                }}>
                  <p className="text-sm" style={{ color: 'var(--koto-text-secondary)' }}>No brand voices yet. Create one to get started!</p>
                </div>
              ) : (
                <div className="stack-sm">
                  {voices.map((voice) => (
                    <div
                      key={voice.id}
                      className="flex items-start gap-4 rounded-2xl border p-4 shadow-sm transition"
                      style={{
                        borderColor: 'var(--koto-border)',
                        backgroundColor: 'var(--koto-bg-dark)'
                      }}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold" style={{ color: 'var(--koto-text-primary)' }}>{voice.name}</h3>
                        {voice.description && (
                          <p className="mt-1 text-sm" style={{ color: 'var(--koto-text-secondary)' }}>{voice.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs" style={{ color: 'var(--koto-text-secondary)' }}>
                          <span>Formality: {voice.toneAttributes.formality}</span>
                          <span>•</span>
                          <span>Humor: {voice.toneAttributes.humor}</span>
                          <span>•</span>
                          <span>Technicality: {voice.toneAttributes.technicality}</span>
                        </div>
                        <p className="mt-1 text-xs" style={{ color: 'var(--koto-text-secondary)' }}>
                          {voice.exampleTweets.length} example{voice.exampleTweets.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(voice)}
                          className="rounded-full px-4 py-2 text-xs font-semibold transition koto-button-hover"
                          style={{
                            backgroundColor: 'rgba(26, 29, 46, 0.5)',
                            color: 'var(--koto-text-primary)'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(voice.id)}
                          className="rounded-full px-4 py-2 text-xs font-semibold transition koto-button-hover"
                          style={{
                            backgroundColor: 'rgba(244, 67, 54, 0.1)',
                            color: 'var(--koto-error)'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandVoiceManager;
