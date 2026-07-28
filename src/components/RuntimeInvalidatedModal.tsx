import React from 'react';

interface RuntimeInvalidatedModalProps {
  isOpen: boolean;
}

/**
 * Shown when the extension runtime is invalidated (reload/update) and every
 * message would fail. Prompts a page refresh.
 */
export const RuntimeInvalidatedModal: React.FC<RuntimeInvalidatedModalProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-labelledby="koto-invalidated-title"
      className="fixed inset-0 z-[100000] grid place-items-center bg-black/50 p-8"
    >
      <div className="max-w-sm rounded-koto border border-line bg-surface p-6 text-center">
        <h3 id="koto-invalidated-title" className="text-sm font-medium text-ink">
          Extension was reloaded
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Kotodama was updated or reloaded, so this page lost its connection. Refresh to continue.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="koto-btn koto-btn-primary mt-5"
        >
          Refresh page
        </button>
      </div>
    </div>
  );
};
