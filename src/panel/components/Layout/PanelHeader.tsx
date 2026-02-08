import React from 'react';
import { Settings, X, MessageCircle } from 'lucide-react';
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
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
    onClose,
    onOpenSettings,
    context
}) => {
    const isReply = context?.type === 'reply';
    const username = context?.tweetContext?.username;

    return (
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/50 bg-[#000000] text-white">
            {/* Left: Context Indicator */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Logo */}
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-zinc-900 rounded-lg border border-zinc-800">
                    <BrandLogo size={20} />
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

