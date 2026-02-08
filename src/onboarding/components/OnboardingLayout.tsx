import React from 'react';
import { PageLayout, StepIndicator } from '../../components/Layout/PageLayout';
import { BrandLogo } from '../../components/BrandLogo';

interface OnboardingLayoutProps {
    children: React.ReactNode;
    currentStep: number;
    totalSteps: number;
    stepLabels?: string[];
}

/**
 * Onboarding-specific layout wrapping the base PageLayout.
 * Adds step indicator and centered content flow.
 */
export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
    children,
    currentStep,
    totalSteps,
    stepLabels = ['Connect API', 'Define Voice'],
}) => {
    return (
        <PageLayout
            variant="split"
            title="Welcome to Kotodama"
            subtitle="Let's set up your personal AI companion."
            logoIcon={<BrandLogo size={40} />}
            sidebarContent={
                <div className="space-y-8">
                    <StepIndicator
                        currentStep={currentStep}
                        totalSteps={totalSteps}
                        labels={stepLabels}
                    />

                    <div className="p-6 rounded-2xl bg-[var(--koto-bg-primary)]/50 backdrop-blur-sm border border-[var(--koto-border-light)] mt-12">
                        <h3 className="font-semibold text-[var(--koto-text-primary)] mb-2">Why Kotodama?</h3>
                        <ul className="space-y-3 text-sm text-[var(--koto-text-secondary)]">
                            <li className="flex gap-2">
                                <span className="text-[var(--koto-accent)]">✓</span>
                                Privacy-first & Local keys
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[var(--koto-accent)]">✓</span>
                                Matches your unique voice
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[var(--koto-accent)]">✓</span>
                                Works locally in Chrome
                            </li>
                        </ul>
                    </div>
                </div>
            }
        >
            <div className="w-full">
                {children}
            </div>
        </PageLayout>
    );
};
