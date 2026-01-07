import React from 'react';
import { UserSettings } from '../../types';
import { getModelById } from '../../constants/models';

interface PanelHeaderProps {
    theme: 'light' | 'dark';
    settings: UserSettings | null;
    onToggleTheme: () => void;
    onOpenSettings: () => void;
    onClose: () => void;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
    theme,
    settings,
    onToggleTheme,
    onOpenSettings,
    onClose,
}) => {
    return (
        <div className="relative overflow-hidden rounded-b-3xl px-8 pb-10 pt-6 shadow-2xl z-20" style={{
            backgroundColor: 'var(--koto-deep-indigo)',
            boxShadow: 'var(--koto-shadow-lg)',
            color: theme === 'light' ? 'var(--koto-text-primary)' : 'white'
        }}>
            {/* Aesthetic Background Elements */}
            <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_top_right,_rgba(244,114,182,0.15),_transparent_40%),radial-gradient(circle_at_top_left,_rgba(96,165,250,0.1),_transparent_40%)]' : 'bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent_60%)]'}`} />

            <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-70 mb-1" style={{ color: theme === 'light' ? 'var(--koto-text-secondary)' : 'rgba(255,255,255,0.7)' }}>Kotodama</p>
                        <h1 className="text-2xl font-bold leading-none tracking-tight bg-gradient-to-r from-[var(--koto-text-primary)] to-[var(--koto-text-secondary)] bg-clip-text text-transparent">
                            AI Composer
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium px-3 py-1.5 rounded-full koto-glass w-fit">
                        {settings?.defaultProvider && (
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--koto-accent-blue)]"></span>
                                <span className="opacity-80">Provider:</span>
                                <span className="font-semibold">{settings.defaultProvider}</span>
                            </span>
                        )}
                        <span className="opacity-30">|</span>
                        <span className="flex items-center gap-1.5">
                            <span className="opacity-80">Model:</span>
                            <span className="font-semibold text-[var(--koto-sakura-pink)]">
                                {settings?.defaultModel ? getModelById(settings.defaultModel)?.name : 'Auto'}
                            </span>
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <HeaderButton
                        onClick={onToggleTheme}
                        theme={theme}
                        label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )}
                    </HeaderButton>

                    <HeaderButton
                        onClick={onOpenSettings}
                        theme={theme}
                        label="Open settings"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </HeaderButton>

                    <HeaderButton
                        onClick={onClose}
                        theme={theme}
                        label="Close panel"
                        className="hover:bg-red-500/10 hover:text-red-500"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </HeaderButton>
                </div>
            </div>
        </div>
    );
};

const HeaderButton: React.FC<{
    onClick: () => void;
    theme: 'light' | 'dark';
    label: string;
    children: React.ReactNode;
    className?: string;
}> = ({ onClick, theme, label, children, className = '' }) => (
    <button
        onClick={onClick}
        className={`
      inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200
      ${className}
    `}
        style={{
            backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.1)',
            color: theme === 'light' ? 'var(--koto-text-primary)' : 'white'
        }}
        aria-label={label}
        title={label}
    >
        {children}
    </button>
);
