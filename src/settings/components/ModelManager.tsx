import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface ModelManagerProps {
    customModels: { id: string; name: string }[];
    onUpdateModels: (models: { id: string; name: string }[]) => void;
}

export const ModelManager: React.FC<ModelManagerProps> = ({
    customModels,
    onUpdateModels
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newModelId, setNewModelId] = useState('');
    const [newModelName, setNewModelName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const handleAdd = () => {
        if (!newModelId.trim() || !newModelName.trim()) return;

        // Prevent duplicates
        if (customModels.some(m => m.id === newModelId)) {
            alert('Model ID already exists');
            return;
        }

        const updated = [...customModels, { id: newModelId.trim(), name: newModelName.trim() }];
        onUpdateModels(updated);
        setNewModelId('');
        setNewModelName('');
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to remove this model?')) {
            const updated = customModels.filter(m => m.id !== id);
            onUpdateModels(updated);
        }
    };

    const startEdit = (model: { id: string; name: string }) => {
        setEditingId(model.id);
        setEditName(model.name);
    };

    const saveEdit = (id: string) => {
        const updated = customModels.map(m =>
            m.id === id ? { ...m, name: editName } : m
        );
        onUpdateModels(updated);
        setEditingId(null);
    };

    return (
        <section className="space-y-4">
            <div>
                <h3 className="text-lg font-medium text-[var(--koto-text-primary)]">Custom Models</h3>
                <p className="text-sm text-[var(--koto-text-secondary)]">
                    Add specific model IDs that aren't in the default list.
                </p>
            </div>

            <div className="space-y-2">
                {customModels.map(model => (
                    <div key={model.id} className="flex items-center justify-between p-3 bg-[var(--koto-bg-elevated)] border border-[var(--koto-border)] rounded-lg group">
                        <div className="flex-1 min-w-0 mr-4">
                            {editingId === model.id ? (
                                <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full bg-[var(--koto-bg)] border border-[var(--koto-border)] px-2 py-1 rounded text-sm"
                                    autoFocus
                                />
                            ) : (
                                <div>
                                    <div className="font-medium text-sm text-[var(--koto-text-primary)]">{model.name}</div>
                                    <div className="text-xs text-[var(--koto-text-tertiary)] font-mono">{model.id}</div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {editingId === model.id ? (
                                <>
                                    <button onClick={() => saveEdit(model.id)} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded">
                                        <Check size={14} />
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded">
                                        <X size={14} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => startEdit(model)} className="p-1.5 text-[var(--koto-text-tertiary)] hover:text-blue-400 hover:bg-blue-400/10 rounded opacity-0 group-hover:opacity-100 transition-all">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(model.id)} className="p-1.5 text-[var(--koto-text-tertiary)] hover:text-red-400 hover:bg-red-400/10 rounded opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {isAdding ? (
                    <div className="p-4 bg-[var(--koto-bg-elevated)] border border-[var(--koto-border)] rounded-lg space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-[var(--koto-text-secondary)] mb-1">Model ID</label>
                            <input
                                value={newModelId}
                                onChange={e => setNewModelId(e.target.value)}
                                placeholder="e.g. gpt-4-turbo-preview"
                                className="w-full bg-[var(--koto-bg)] border border-[var(--koto-border)] px-3 py-2 rounded-md text-sm font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--koto-text-secondary)] mb-1">Display Name</label>
                            <input
                                value={newModelName}
                                onChange={e => setNewModelName(e.target.value)}
                                placeholder="e.g. GPT-4 Turbo"
                                className="w-full bg-[var(--koto-bg)] border border-[var(--koto-border)] px-3 py-2 rounded-md text-sm"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs text-[var(--koto-text-secondary)] hover:bg-[var(--koto-bg)] rounded">
                                Cancel
                            </button>
                            <button onClick={handleAdd} className="px-3 py-1.5 text-xs bg-[var(--koto-accent)] text-white rounded hover:opacity-90">
                                Add Model
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-2 flex items-center justify-center gap-2 border border-dashed border-[var(--koto-border)] rounded-lg text-sm text-[var(--koto-text-secondary)] hover:border-[var(--koto-accent)] hover:text-[var(--koto-accent)] transition-colors"
                    >
                        <Plus size={14} />
                        Add Custom Model
                    </button>
                )}
            </div>
        </section>
    );
};
