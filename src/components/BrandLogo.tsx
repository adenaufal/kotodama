import React from 'react';

interface BrandLogoProps {
    size?: number;
    className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 32, className = '' }) => {
    return (
        <img
            src="/icons/icon128.png"
            alt="Kotodama Logo"
            width={size}
            height={size}
            className={className}
        />
    );
};
