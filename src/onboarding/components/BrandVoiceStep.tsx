import React, { useState } from 'react';
import { VOICE_TEMPLATES, VoiceTemplate } from '../constants/voiceTemplates';

interface BrandVoiceStepProps {
    brandName: string;
    setBrandName: (val: string) => void;
    description: string;
    setDescription: (val: string) => void;
    exampleTweets: string[];
    setExampleTweets: (val: string[]) => void;
    onBack: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    error?: string;
}

export const BrandVoiceStep: React.FC<BrandVoiceStepProps> = ({
    brandName,
    setBrandName,
    description,
    setDescription,
    exampleTweets,
    setExampleTweets,
    onBack,
    onSubmit,
    isSubmitting,
    error
}) => {
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    const handleTemplateSelect = (template: VoiceTemplate) => {
        setSelectedTemplate(template.id);
        if (template.id !== 'custom') {
            setBrandName(template.name);
            setDescription(template.description + ' ' + template.guidelines);
            setExampleTweets(template.exampleTweets);
        } else {
            // Clear or keep previous? Let's clear to be safe if switching to custom
            setBrandName('');
            setDescription('');
            setExampleTweets(['', '', '']);
        }
    };

    const handleTweetChange = (index: number, value: string) => {
        const newTweets = [...exampleTweets];
        newTweets[index] = value;
        setExampleTweets(newTweets);
    };

    if (!selectedTemplate) {
        return (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-3">
                    <h2 className="text-3xl font-bold text-slate-900">Choose Your Vibe</h2>
                    <p className="text-base font-medium text-slate-500">
                        Select a starting point for your AI's personality.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {VOICE_TEMPLATES.map((template) => (
                        <button
                            key={template.id}
                            onClick={() => handleTemplateSelect(template)}
                            className="group text-left p-6 rounded-2xl border-2 border-slate-100 bg-white hover:border-[var(--koto-sakura-pink)] hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300"
                        >
                            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{template.icon}</div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{template.name}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{template.description}</p>
                        </button>
                    ))}
                </div>

                <button
                    onClick={onBack}
                    className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-200 text-slate-400 hover:bg-slate-50 mt-4"
                >
                    Back
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Fine-tune Your Voice</h2>
                <p className="text-sm font-medium text-slate-500">
                    Make it truly yours.
                </p>
            </div>

            <div className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-4 -mr-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Voice Name</label>
                        <input
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            placeholder="e.g. Professional, Casual, Tech Wit"
                            className="w-full rounded-xl px-5 py-4 text-base outline-none transition-all duration-200 border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-[var(--koto-sakura-pink)] text-slate-900 placeholder:text-slate-400"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your tone..."
                            rows={3}
                            className="w-full rounded-xl px-5 py-4 text-base outline-none transition-all duration-200 border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-[var(--koto-sakura-pink)] resize-none text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Examples */}
                <div className="space-y-4 pt-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 block">
                        Example Tweets
                    </label>

                    {exampleTweets.map((tweet, i) => (
                        <div key={i} className="relative group">
                            <span className="absolute left-4 top-4 text-xs font-mono font-bold text-slate-300 select-none">0{i + 1}</span>
                            <textarea
                                value={tweet}
                                onChange={(e) => handleTweetChange(i, e.target.value)}
                                placeholder="Paste a tweet implementation..."
                                rows={2}
                                className="w-full rounded-xl pl-12 pr-5 py-4 text-base outline-none transition-all duration-200 border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-[var(--koto-sakura-pink)] resize-none text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="text-sm font-medium text-red-600 text-center p-3 bg-red-50 rounded-xl border border-red-100">
                        {error}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                    onClick={() => setSelectedTemplate(null)}
                    className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-200 text-slate-500 hover:bg-slate-100 border-2 border-transparent"
                >
                    Back
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-widest text-white shadow-xl shadow-emerald-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1 bg-emerald-500"
                >
                    {isSubmitting ? 'Setting up...' : 'Finish Setup'}
                </button>
            </div>
        </div>
    );
};
