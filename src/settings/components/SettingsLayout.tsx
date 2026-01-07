import React, { ReactNode } from 'react';

interface SettingsLayoutProps {
    children: ReactNode;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
    return (
        <div className="animate-in fade-in duration-500">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-white shadow-lg shadow-slate-200/50 border border-slate-100">
                    <span className="text-3xl">🌸</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-slate-900">
                    Kotodama Settings
                </h1>
                <p className="text-slate-500 text-sm font-medium">
                    Manage your AI companion's configuration
                </p>
            </div>

            {/* Content Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/50 shadow-2xl shadow-slate-200/50 p-2">
                <div className="rounded-[24px] bg-white/50 p-6 md:p-10">
                    {children}
                </div>
            </div>
        </div>
    );
};
