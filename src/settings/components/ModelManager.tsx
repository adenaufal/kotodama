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
    const [error, setError] = useState<string | null>(null);

    const handleAdd = () => {
        if (!newModelId.trim() || !newModelName.trim()) {
            setError('Both fields are required.');
            return;
        }

        if (customModels.some(m => m.id === newModelId.trim())) {
            setError('That model ID is already in the list.');
            return;
        }

        onUpdateModels([...customModels, { id: newModelId.trim(), name: newModelName.trim() }]);
        setNewModelId('');
        setNewModelName('');
        setError(null);
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Remove this model?')) {
            onUpdateModels(customModels.filter(m => m.id !== id));
        }
    };

    const startEdit = (model: { id: string; name: string }) => {
        setEditingId(model.id);
        setEditName(model.name);
    };

    const saveEdit = (id: string) => {
        onUpdateModels(customModels.map(m => (m.id === id ? { ...m, name: editName } : m)));
        setEditingId(null);
    };

    return (
        <div className="mt-8">
            <h3 className="koto-label">Custom models</h3>

            {customModels.length > 0 && (
                <ul className="divide-y divide-line border-y border-line">
                    {customModels.map(model => (
                        <li key={model.id} className="group flex items-center gap-3 py-2.5">
                            {editingId === model.id ? (
                                <>
                                    <input
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && saveEdit(model.id)}
                                        className="koto-field h-8 min-h-0 flex-1 py-1 text-xs"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => saveEdit(model.id)}
                                        aria-label="Save name"
                                        className="grid size-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:text-ink"
                                    >
                                        <Check size={14} strokeWidth={1.5} />
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        aria-label="Cancel"
                                        className="grid size-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:text-ink"
                                    >
                                        <X size={14} strokeWidth={1.5} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-ink">{model.name}</p>
                                        <p className="truncate font-mono text-xs text-faint">{model.id}</p>
                                    </div>
                                    {/* Visible on focus too — hover-only actions are unreachable by keyboard. */}
                                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                                        <button
                                            onClick={() => startEdit(model)}
                                            aria-label={`Rename ${model.name}`}
                                            className="grid size-7 place-items-center rounded-md text-faint transition-colors hover:text-ink"
                                        >
                                            <Edit2 size={14} strokeWidth={1.5} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(model.id)}
                                            aria-label={`Remove ${model.name}`}
                                            className="grid size-7 place-items-center rounded-md text-faint transition-colors hover:text-danger"
                                        >
                                            <Trash2 size={14} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {isAdding ? (
                <div className="mt-3 space-y-3 rounded-koto border border-line p-3">
                    <div>
                        <label htmlFor="new-model-id" className="koto-label">Model ID</label>
                        <input
                            id="new-model-id"
                            value={newModelId}
                            onChange={e => { setNewModelId(e.target.value); setError(null); }}
                            placeholder="gpt-4-turbo-preview"
                            className="koto-field h-9 min-h-0 font-mono text-xs"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="new-model-name" className="koto-label">Display name</label>
                        <input
                            id="new-model-name"
                            value={newModelName}
                            onChange={e => { setNewModelName(e.target.value); setError(null); }}
                            placeholder="GPT-4 Turbo"
                            className="koto-field h-9 min-h-0 text-xs"
                        />
                    </div>
                    {error && <p role="alert" className="text-xs text-danger">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <button onClick={() => { setIsAdding(false); setError(null); }} className="koto-btn koto-btn-ghost h-8 text-xs">
                            Cancel
                        </button>
                        <button onClick={handleAdd} className="koto-btn koto-btn-primary h-8 text-xs">
                            Add
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
                >
                    <Plus size={13} strokeWidth={1.5} />
                    Add a model ID
                </button>
            )}
        </div>
    );
};
