import React from 'react';
import '../../styles/pages.css';
import { BrandLogo } from '../BrandLogo';

const maxWidthClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    full: 'max-w-full',
};

const paddingTopClasses = {
    none: 'pt-0',
    sm: 'pt-8',
    md: 'pt-16',
    lg: 'pt-24',
};

interface PageLayoutProps {
    children: React.ReactNode;
    variant?: 'default' | 'dashboard' | 'split';
    sidebar?: React.ReactNode;
    sidebarContent?: React.ReactNode;
    showLogo?: boolean;
    title?: string;
    subtitle?: string;
    logoIcon?: React.ReactNode;
    className?: string;
    maxWidth?: keyof typeof maxWidthClasses;
    centerContent?: boolean;
    paddingTop?: keyof typeof paddingTopClasses;
}

/**
 * Unified page layout supporting Default (Centered), Dashboard (Sidebar), and Split (Onboarding) modes.
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
    children,
    variant = 'default',
    sidebar,
    sidebarContent,
    showLogo = true,
    title,
    subtitle,
    logoIcon = <BrandLogo />,
    className = '',
    maxWidth = 'lg',
    centerContent = true,
    paddingTop = 'md',
}) => {
    // === DASHBOARD LAYOUT (Settings) ===
    if (variant === 'dashboard') {
        return (
            <div className={`koto-page flex h-screen overflow-hidden bg-[var(--koto-bg-secondary)] ${className}`}>
                {/* Sidebar */}
                <aside className="w-64 flex-shrink-0 bg-[var(--koto-bg-primary)] border-r border-[var(--koto-border-light)] flex flex-col">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--koto-accent)] to-purple-500 flex items-center justify-center text-white font-bold">
                                {logoIcon}
                            </div>
                            <span className="font-bold text-lg tracking-tight">Kotodama</span>
                        </div>
                        {sidebar}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto relative">
                    <div className="max-w-5xl mx-auto p-8 pt-12">
                        {children}
                    </div>
                </main>
            </div>
        );
    }

    // === SPLIT LAYOUT (Onboarding) ===
    if (variant === 'split') {
        return (
            <div className={`koto-page flex h-screen overflow-hidden bg-[var(--koto-bg-primary)] ${className}`}>
                {/* Left Panel (Visual/Context) */}
                <div className="w-1/3 bg-[var(--koto-bg-secondary)] border-r border-[var(--koto-border-light)] p-12 flex flex-col justify-between relative overflow-hidden">
                    {/* Background blob for left panel only */}
                    <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,var(--koto-accent-muted)_0%,transparent_70%)] blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--koto-accent)] to-purple-500 flex items-center justify-center text-2xl mb-8 shadow-lg shadow-[var(--koto-shadow-accent)]">
                            {logoIcon}
                        </div>
                        {title && <h1 className="text-3xl font-bold mb-3 text-[var(--koto-text-primary)] tracking-tight">{title}</h1>}
                        {subtitle && <p className="text-[var(--koto-text-secondary)] text-lg leading-relaxed">{subtitle}</p>}

                        <div className="mt-12">
                            {sidebarContent}
                        </div>
                    </div>

                    <div className="relative z-10 text-xs text-[var(--koto-text-tertiary)] font-medium">
                        © Kotodama AI
                    </div>
                </div>

                {/* Right Panel (Action/Form) */}
                <div className="flex-1 overflow-y-auto bg-[var(--koto-bg-primary)]">
                    <div className="max-w-2xl mx-auto p-12 min-h-full flex flex-col justify-center">
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    // === DEFAULT LAYOUT (Centered) ===
    return (
        <div className={`koto-page ${className}`}>
            {/* Background decorations */}
            <div className="koto-page-bg" aria-hidden="true" />

            {/* Main content container */}
            <div
                className={`
                    relative z-10 
                    ${paddingTopClasses[paddingTop]} 
                    pb-20 px-4 md:px-8
                    ${centerContent ? 'flex flex-col items-center' : ''}
                `}
            >
                <div className={`w-full ${maxWidthClasses[maxWidth]}`}>
                    {/* Optional header with logo */}
                    {showLogo && (
                        <header className="koto-page-header koto-animate-float-in">
                            <div className="koto-page-logo" role="img" aria-label="Kotodama">
                                <span>{logoIcon}</span>
                            </div>
                            {title && <h1 className="koto-page-title">{title}</h1>}
                            {subtitle && <p className="koto-page-subtitle">{subtitle}</p>}
                        </header>
                    )}

                    {/* Content */}
                    {children}
                </div>
            </div>

            {/* Footer */}
            <footer className="koto-page-footer">
                <p className="koto-page-footer-text">
                    © {new Date().getFullYear()} Kotodama. Privacy-first AI assistant.
                </p>
            </footer>
        </div>
    );
};

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    animate?: boolean;
    animationDelay?: 1 | 2 | 3;
}

/**
 * Glassmorphism card container for page content sections.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    animate = true,
    animationDelay,
}) => {
    const animationClasses = animate
        ? `koto-animate-scale-in ${animationDelay ? `koto-animate-delay-${animationDelay}` : ''}`
        : '';

    return (
        <div className={`koto-glass-card ${animationClasses} ${className}`}>
            <div className="koto-glass-card-inner">
                {children}
            </div>
        </div>
    );
};

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
    labels?: string[];
}

/**
 * Step indicator for multi-step flows like onboarding.
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({
    currentStep,
    totalSteps,
    labels,
}) => {
    return (
        <div className="koto-steps" role="navigation" aria-label="Progress">
            {Array.from({ length: totalSteps }).map((_, index) => {
                const stepNum = index + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;

                return (
                    <React.Fragment key={stepNum}>
                        <div
                            className={`
                                koto-step-dot
                                ${isActive ? 'koto-step-dot-active' : ''}
                                ${isCompleted ? 'koto-step-dot-completed' : ''}
                                ${!isActive && !isCompleted ? 'koto-step-dot-inactive' : ''}
                            `}
                            aria-current={isActive ? 'step' : undefined}
                            aria-label={labels?.[index] || `Step ${stepNum}`}
                        >
                            {isCompleted ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                stepNum
                            )}
                        </div>

                        {index < totalSteps - 1 && (
                            <div
                                className={`
                                    koto-step-line
                                    ${isCompleted ? 'koto-step-line-active' : ''}
                                `}
                                aria-hidden="true"
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

interface NavPillsProps {
    items: Array<{
        id: string;
        label: string;
        icon?: React.ReactNode;
    }>;
    activeId: string;
    onSelect: (id: string) => void;
    className?: string;
}

/**
 * Navigation pills for settings-like pages with multiple sections.
 */
export const NavPills: React.FC<NavPillsProps> = ({
    items,
    activeId,
    onSelect,
    className = '',
}) => {
    return (
        <nav className={`koto-nav-pills ${className}`} role="tablist">
            {items.map((item) => {
                const isActive = item.id === activeId;
                return (
                    <button
                        key={item.id}
                        onClick={() => onSelect(item.id)}
                        className={`
                            koto-nav-pill
                            ${isActive ? 'koto-nav-pill-active' : ''}
                        `}
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`panel-${item.id}`}
                    >
                        {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};

interface SectionHeaderProps {
    title: string;
    icon?: React.ReactNode;
}

/**
 * Section header for form sections within a glass card.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon }) => {
    return (
        <div className="koto-section-header">
            {icon && <div className="koto-section-icon">{icon}</div>}
            <h2 className="koto-section-title">{title}</h2>
        </div>
    );
};
