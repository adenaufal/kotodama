import React, { ReactNode } from 'react';

interface SettingsLayoutProps {
    children: ReactNode;
}

/**
 * Simplified SettingsLayout - now only handles content organization.
 * The main page chrome (background, header, footer) is handled by PageLayout in App.tsx.
 */
export const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
    return (
        <div className="space-y-10">
            {children}
        </div>
    );
};
