import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  tone = 'default',
  className = '',
  children,
  ...props
}) => {
  const toneStyles = {
    default: 'glass-card',
    success: 'glass-card border-l-4 border-l-green-500',
    warning: 'glass-card border-l-4 border-l-yellow-500',
    danger: 'glass-card border-l-4 border-l-red-500'
  };

  return (
    <div
      className={`rounded-xl ${toneStyles[tone]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`p-6 pb-4 border-b border-gray-200 dark:border-gray-800 ${className}`} {...props}>
      {children}
    </div>
  );
};

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardBody: React.FC<CardBodyProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`p-6 pt-4 border-t border-gray-200 dark:border-gray-800 ${className}`} {...props}>
      {children}
    </div>
  );
};
