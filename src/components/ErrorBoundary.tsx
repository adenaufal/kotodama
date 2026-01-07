import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully.
 * Prevents white screen of death when components fail.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('React Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex flex-col items-center justify-center p-6 text-center"
          style={{
            minHeight: '200px',
            backgroundColor: 'var(--koto-bg-surface, #1a1a2e)',
            borderRadius: '12px',
            margin: '16px',
          }}
        >
          <svg
            className="w-12 h-12 mb-4"
            style={{ color: 'var(--koto-error, #f44336)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--koto-text-primary, #ffffff)' }}
          >
            Something went wrong
          </h3>
          <p
            className="text-sm mb-4"
            style={{ color: 'var(--koto-text-secondary, #a0a0a0)' }}
          >
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: 'var(--koto-primary, #6366f1)',
              color: '#ffffff',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--koto-primary-hover, #4f46e5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--koto-primary, #6366f1)';
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
