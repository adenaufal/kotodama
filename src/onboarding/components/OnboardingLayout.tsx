import React from 'react';

interface OnboardingLayoutProps {
    children: React.ReactNode;
    currentStep: number;
    totalSteps: number;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
    children,
    currentStep,
    totalSteps,
}) => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-8 md:p-12 relative overflow-hidden light-mode font-sans"
            style={{ backgroundColor: '#FAFAFA' }}>
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[100px] opacity-60"
                    style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.1) 0%, rgba(255,255,255,0) 70%)' }}></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full blur-[100px] opacity-50"
                    style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.1) 0%, rgba(255,255,255,0) 70%)' }}></div>
            </div>

            <div className="w-full max-w-2xl relative z-10 flex flex-col items-center gap-12">
                {/* Logo / Header */}
                <div className="text-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="inline-flex items-center justify-center p-4 mb-5 rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100">
                        <span className="text-4xl text-slate-800">🌸</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-3 text-slate-900">
                        Welcome to Kotodama
                    </h1>
                    <p className="text-slate-500 max-w-lg mx-auto text-base leading-relaxed font-medium">
                        Let's set up your personal AI companion.
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="w-full max-w-sm">
                    <div className="relative flex items-center justify-between">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 w-full h-[3px] -translate-y-1/2 rounded-full overflow-hidden bg-slate-100">
                            <div className="h-full transition-all duration-500 ease-out bg-[var(--koto-sakura-pink)]"
                                style={{
                                    width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`
                                }} />
                        </div>

                        {/* Steps */}
                        {Array.from({ length: totalSteps }).map((_, i) => {
                            const stepNum = i + 1;
                            const isActive = stepNum <= currentStep;
                            const isCurrent = stepNum === currentStep;

                            return (
                                <div key={stepNum} className="relative z-10">
                                    <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-base font-bold transition-all duration-500 shadow-sm
                    ${isActive ? 'scale-100' : 'scale-90 opacity-40 bg-white text-slate-300'}
                    ${isCurrent ? 'ring-4 ring-[var(--koto-sakura-pink)]/10 shadow-lg shadow-[var(--koto-sakura-pink)]/20' : ''}
                  `}
                                        style={{
                                            backgroundColor: isActive ? 'var(--koto-sakura-pink)' : '#FFFFFF',
                                            color: isActive ? 'white' : undefined,
                                            border: isActive ? 'none' : '2px solid #F1F5F9'
                                        }}>
                                        {isActive && stepNum < currentStep ? (
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            stepNum
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content Card */}
                <div className="w-full bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/50 shadow-2xl shadow-slate-200/50 p-2 animate-in fade-in zoom-in-95 duration-500">
                    <div className="rounded-[24px] bg-white/50 p-8 md:p-12">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
