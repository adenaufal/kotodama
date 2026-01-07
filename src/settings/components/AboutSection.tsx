import React from 'react';

export const AboutSection: React.FC = () => {
    const manifestVersion = chrome.runtime.getManifest().version;

    return (
        <div className="space-y-6 pt-8 border-t border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">About Kotodama</h2>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                <p className="text-sm leading-relaxed text-slate-600">
                    <strong className="text-slate-900">Kotodama (言霊)</strong> implies that words hold magical power.
                    This extension empowers your digital communication by blending your unique human voice with AI capabilities.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-500">
                        <span>Version</span>
                        <span className="text-[var(--koto-sakura-pink)] font-bold">{manifestVersion}</span>
                    </div>
                    <a href="https://github.com/adenaufal/kotodama" target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 transition-colors">
                        GitHub
                    </a>
                    <a href="https://github.com/adenaufal/kotodama/issues" target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 transition-colors">
                        Report Issue
                    </a>
                </div>
            </div>

            <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Privacy Focused • Local Storage • Open Source
                </p>
            </div>
        </div>
    );
};
