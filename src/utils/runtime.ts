/**
 * Runtime utilities for handling extension context invalidation
 * Provides robust error handling and recovery for Chrome extension messaging
 */

export interface RuntimeMessage {
  type: string;
  payload?: any;
}

export interface RuntimeResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Checks if the extension runtime is valid and available
 */
export function isRuntimeValid(): boolean {
  try {
    return !!(chrome?.runtime?.id);
  } catch {
    return false;
  }
}

/**
 * Checks if an error is a context invalidation error
 */
export function isContextInvalidatedError(error: any): boolean {
  if (!error) return false;

  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('extension context invalidated') ||
    message.includes('extension context destroyed') ||
    message.includes('message port closed') ||
    message.includes('receiving end does not exist') ||
    message.includes('could not establish connection')
  );
}

/**
 * Sends a message to the extension runtime with retry logic and error handling
 */
export async function sendRuntimeMessage(
  message: RuntimeMessage,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<RuntimeResponse> {
  const { maxRetries = 2, retryDelay = 500, onRetry } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if runtime is valid before attempting to send
      if (!isRuntimeValid()) {
        throw new Error('Extension context invalidated. Please reload the page.');
      }

      // Send message with promise wrapper for better error handling
      const response = await new Promise<RuntimeResponse>((resolve, reject) => {
        try {
          chrome.runtime.sendMessage(message, (response: RuntimeResponse) => {
            // Check for Chrome runtime errors
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }

            // Validate response
            if (!response) {
              reject(new Error('No response received from extension'));
              return;
            }

            resolve(response);
          });
        } catch (error) {
          reject(error);
        }
      });

      return response;

    } catch (error: any) {
      lastError = error;

      // If this is a context invalidation error and we've tried all retries, fail fast
      if (isContextInvalidatedError(error)) {
        if (attempt === maxRetries) {
          throw new Error('Extension context invalidated. Please reload the page to continue using Kotodama.');
        }
      }

      // If we have retries left, wait and try again
      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt + 1, error);
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      // No retries left, throw the error
      throw error;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Failed to send message');
}

/**
 * Safely gets a URL from the extension runtime
 */
export function getExtensionURL(path: string): string | null {
  try {
    if (!isRuntimeValid()) {
      return null;
    }
    return chrome.runtime.getURL(path);
  } catch {
    return null;
  }
}

/**
 * Creates a user-friendly error message for runtime errors
 */
export function createUserErrorMessage(error: any): string {
  if (isContextInvalidatedError(error)) {
    return 'Extension was reloaded. Please refresh this page to continue using Kotodama.';
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Monitors runtime validity and calls callback when context is invalidated
 */
export function watchRuntimeValidity(
  onInvalidated: () => void,
  checkInterval = 5000
): () => void {
  const intervalId = setInterval(() => {
    if (!isRuntimeValid()) {
      onInvalidated();
      clearInterval(intervalId);
    }
  }, checkInterval);

  return () => clearInterval(intervalId);
}
