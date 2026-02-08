import React from 'react';
import { Settings, X, MessageCircle, ChevronDown, Check } from 'lucide-react';
import { OPENAI_MODELS } from '../../../constants/models';
import { BrandLogo } from '../../../components/BrandLogo';

interface PanelHeaderProps {
    onClose: () => void;
    onOpenSettings: () => void;
    context?: {
        type: 'compose' | 'reply' | null;
        tweetContext?: {
            text: string;
            username: string;
        };
    };
    selectedModelId: string;
    onSelectModel: (modelId: string) => void;
    customModelId?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
    onClose,
    onOpenSettings,
    context,
    selectedModelId,
    onSelectModel,
    customModelId
}) => {
    const isReply = context?.type === 'reply';
    const username = context?.tweetContext?.username;
    // const tweetPreview = context?.tweetContext?.text?.slice(0, 50); // Unused

    // Combine standard models with custom model if present
    const availableModels = [...OPENAI_MODELS];
    if (customModelId) {
        // Avoid duplicate if custom model is one of the standard ones
        if (!availableModels.some(m => m.id === customModelId)) {
            availableModels.unshift({
                id: customModelId,
                name: 'Custom',
                description: customModelId,
                provider: 'openai',
                category: 'quality'
            });
        }
    }

    const selectedModel = availableModels.find(m => m.id === selectedModelId) || availableModels[0];

    return (
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/50 bg-[#000000] text-white">
            {/* Left: Context Indicator */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Logo */}
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <BrandLogo size={20} className="w-full h-full object-cover" />
                </div>

                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                        {isReply && <MessageCircle className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                        <span className="text-sm font-medium text-zinc-200">
                            {isReply ? 'Reply to' : 'New Post'}
                        </span>
                        {isReply && username && (
                            <span className="text-sm text-zinc-500">@{username}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {/* Model Selector Dropdown */}
                <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all text-xs font-medium text-zinc-300">
                        <span>{selectedModel?.name}</span>
                        <ChevronDown className="w-3 h-3 text-zinc-500" />
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50">
                        <div className="p-1">
                            {availableModels.map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => onSelectModel(model.id)}
                                    className={`
                                        w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors
                                        ${selectedModelId === model.id
                                            ? 'bg-zinc-800 text-white'
                                            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                                        }
                                    `}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{model.name}</span>
                                        <span className="text-[10px] text-zinc-500 truncate max-w-[140px]">{model.description}</span>
                                    </div>
                                    {selectedModelId === model.id && <Check className="w-3 h-3 text-blue-400" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={onOpenSettings}
                    className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all"
                    title="Settings"
                >
                    <Settings className="w-4 h-4" />
                </button>

                <button
                    onClick={onClose}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

