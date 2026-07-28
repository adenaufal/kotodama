import React from 'react';
import { Settings, X } from 'lucide-react';

interface PanelHeaderProps {
    onClose: () => void;
    onOpenSettings: () => void;
    username?: string;
}

/**
 * Zone 1: 44px, never scrolls. Title left, icon-only actions right, hairline under.
 */
export const PanelHeader: React.FC<PanelHeaderProps> = ({ onClose, onOpenSettings, username }) => (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-line pl-4 pr-2">
        <h1 className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
            {username ? (
                <>
                    Reply to <span className="font-normal text-muted">@{username}</span>
                </>
            ) : (
                'Kotodama'
            )}
        </h1>

        <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="grid size-7 place-items-center rounded-md text-faint transition-colors duration-150 ease-out hover:bg-raise hover:text-ink active:scale-[0.96]"
        >
            <Settings className="size-4" strokeWidth={1.5} />
        </button>

        <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="grid size-7 place-items-center rounded-md text-faint transition-colors duration-150 ease-out hover:bg-raise hover:text-ink active:scale-[0.96]"
        >
            <X className="size-4" strokeWidth={1.5} />
        </button>
    </header>
);
