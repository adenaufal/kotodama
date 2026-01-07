import { useState, useEffect, useCallback } from 'react';
import { sendRuntimeMessage, isRuntimeValid, watchRuntimeValidity, createUserErrorMessage, RuntimeMessage } from '../utils/runtime';

interface UseRuntimeMessagingReturn {
  sendMessage: <T = any>(message: RuntimeMessage) => Promise<T>;
  isInvalidated: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * React hook for handling runtime messaging with automatic error handling
 * and context invalidation detection
 */
export function useRuntimeMessaging(): UseRuntimeMessagingReturn {
  const [isInvalidated, setIsInvalidated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check runtime validity on mount
    if (!isRuntimeValid()) {
      setIsInvalidated(true);
      setError('Extension context invalidated. Please reload this page.');
      return;
    }

    // Watch for runtime invalidation
    const stopWatching = watchRuntimeValidity(() => {
      setIsInvalidated(true);
      setError('Extension was reloaded. Please refresh this page to continue.');
    });

    return () => {
      stopWatching();
    };
  }, []);

  const sendMessage = useCallback(async <T = any>(message: RuntimeMessage): Promise<T> => {
    try {
      const response = await sendRuntimeMessage(message, {
        onRetry: (attempt, err) => {
          console.log(`[Kotodama] Retrying message ${message.type} (attempt ${attempt})...`, err);
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Request failed');
      }

      return response.data as T;
    } catch (err: any) {
      const userMessage = createUserErrorMessage(err);
      setError(userMessage);

      // Mark runtime as invalidated if it's a context error
      if (userMessage.includes('reload') || userMessage.includes('refresh')) {
        setIsInvalidated(true);
      }

      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendMessage,
    isInvalidated,
    error,
    clearError,
  };
}
