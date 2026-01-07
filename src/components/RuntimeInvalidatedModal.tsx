import React from 'react';

interface RuntimeInvalidatedModalProps {
  isOpen: boolean;
}

/**
 * Modal component that appears when the extension runtime is invalidated
 * Prompts the user to reload the page
 */
export const RuntimeInvalidatedModal: React.FC<RuntimeInvalidatedModalProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[100000] flex items-center justify-center p-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-yellow-500"
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
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          Extension Reloaded
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The Kotodama extension was updated or reloaded. Please refresh this page to continue.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};
