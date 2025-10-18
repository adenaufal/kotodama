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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="relative mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 px-6 py-6 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_55%)]" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {isEditing ? (isCreating ? 'Create Brand Voice' : 'Edit Brand Voice') : 'Manage Brand Voices'}
              </h2>
              <p className="mt-1 text-sm text-white/80">
                {isEditing ? 'Configure your unique writing style' : 'Edit or remove your brand voices'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg text-white transition hover:bg-white/25"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-600 shadow-sm">
              {error}
            </div>
          )}

          {isEditing ? (
            <div className="stack">
              <div className="stack-sm">
                <label className="text-sm font-semibold text-slate-700">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Professional Tech Expert"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
                />
              </div>

              <div className="stack-sm">
                <label className="text-sm font-semibold text-slate-700">
                  Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this voice"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
                />
              </div>

              <div className="stack-sm">
                <label className="text-sm font-semibold text-slate-700">Guidelines (optional)</label>
                <textarea
                  value={formData.guidelines || ''}
                  onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })}
                  placeholder="e.g., Always use emojis, Keep it casual, Focus on tech topics"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
                />
              </div>

              <div className="stack-sm">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Example Tweets</label>
                  <button
                    onClick={addExampleTweet}
                    className="text-xs font-semibold text-indigo-500 transition hover:text-indigo-600"
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
                        className="flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
                      />
                      {(formData.exampleTweets?.length || 0) > 1 && (
                        <button
                          onClick={() => removeExampleTweet(index)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
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
                <label className="text-sm font-semibold text-slate-700">Tone Attributes</label>
                <div className="stack-sm rounded-2xl bg-slate-50/80 p-4">
                  <div className="stack-sm">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600">
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
                    />
                  </div>

                  <div className="stack-sm">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600">
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
                    />
                  </div>

                  <div className="stack-sm">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600">
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
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="stack">
              <button
                onClick={handleCreate}
                className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-4 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600"
              >
                + Create New Brand Voice
              </button>

              {voices.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 px-6 py-8 text-center">
                  <p className="text-sm text-slate-500">No brand voices yet. Create one to get started!</p>
                </div>
              ) : (
                <div className="stack-sm">
                  {voices.map((voice) => (
                    <div
                      key={voice.id}
                      className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{voice.name}</h3>
                        {voice.description && (
                          <p className="mt-1 text-sm text-slate-600">{voice.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>Formality: {voice.toneAttributes.formality}</span>
                          <span>•</span>
                          <span>Humor: {voice.toneAttributes.humor}</span>
                          <span>•</span>
                          <span>Technicality: {voice.toneAttributes.technicality}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {voice.exampleTweets.length} example{voice.exampleTweets.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(voice)}
                          className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(voice.id)}
                          className="rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
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
