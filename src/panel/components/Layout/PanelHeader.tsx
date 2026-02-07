import React from 'react';
import { Settings, X, Cpu, Zap, MessageCircle } from 'lucide-react';

interface PanelHeaderProps {
    onClose: () => void;
    onOpenSettings: () => void;
    modelMode?: 'fast' | 'smart';
    toggleModel?: () => void;
    context?: {
        type: 'compose' | 'reply' | null;
        tweetContext?: {
            text: string;
            username: string;
        };
    };
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
    onClose,
    onOpenSettings,
    modelMode = 'fast',
    toggleModel,
    context
}) => {
    const isReply = context?.type === 'reply';
    const username = context?.tweetContext?.username;
    const tweetPreview = context?.tweetContext?.text?.slice(0, 50);

    return (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            {/* Left: Context Indicator */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Logo */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-400 to-pink-500 flex-shrink-0 flex items-center justify-center shadow-sm">
                    <span className="font-bold text-xs text-white">KD</span>
                </div>

                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                        {isReply && <MessageCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                        <span className="text-sm font-medium text-slate-700">
                            {isReply ? 'Reply to' : 'New Post'}
                        </span>
                        {isReply && username && (
                            <span className="text-sm font-semibold text-blue-600">@{username}</span>
                        )}
                    </div>
                    {isReply && tweetPreview && (
                        <span className="text-xs text-slate-400 truncate max-w-[180px]">
                            "{tweetPreview}..."
                        </span>
                    )}
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Model Toggle */}
                <button
                    onClick={toggleModel}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                    title={modelMode === 'fast' ? 'Fast Mode (GPT-3.5)' : 'Smart Mode (GPT-4o)'}
                >
                    {modelMode === 'fast' ? (
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                        <Cpu className="w-3.5 h-3.5 text-blue-500" />
                    )}
                    <span className="text-xs font-medium text-slate-600">
                        {modelMode === 'fast' ? 'Fast' : 'Smart'}
                    </span>
                </button>

                <button
                    onClick={onOpenSettings}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    title="Settings"
                >
                    <Settings className="w-4 h-4" />
                </button>

                <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

