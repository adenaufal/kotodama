/**
 * Production-safe logging utility.
 * Only logs in development mode (when loaded as unpacked extension).
 */

// Detect if we're in development mode
// In development, the extension is loaded as unpacked and has a different ID pattern
const isDevelopment = (): boolean => {
  try {
    // Check if we're in a Chrome extension context
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      // Unpacked extensions have IDs that start with specific patterns or are temporary
      // Also check for common development indicators
      const manifest = chrome.runtime.getManifest?.();
      // Development builds typically don't have update_url
      return !manifest?.update_url;
    }
    // Fallback: check for common dev environment indicators
    return typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
  } catch {
    // If anything fails, assume production for safety
    return false;
  }
};

const DEV_MODE = isDevelopment();

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
  group: (label: string) => void;
  groupEnd: () => void;
}

const noop = () => {};

const createLogger = (): Logger => {
  if (DEV_MODE) {
    return {
      debug: (...args) => console.debug('[Kotodama]', ...args),
      info: (...args) => console.info('[Kotodama]', ...args),
      log: (...args) => console.log('[Kotodama]', ...args),
      warn: (...args) => console.warn('[Kotodama]', ...args),
      error: (...args) => console.error('[Kotodama]', ...args),
      time: (label) => console.time(`[Kotodama] ${label}`),
      timeEnd: (label) => console.timeEnd(`[Kotodama] ${label}`),
      group: (label) => console.group(`[Kotodama] ${label}`),
      groupEnd: () => console.groupEnd(),
    };
  }

  // In production, only log errors
  return {
    debug: noop,
    info: noop,
    log: noop,
    warn: noop,
    error: (...args) => console.error('[Kotodama]', ...args),
    time: noop,
    timeEnd: noop,
    group: noop,
    groupEnd: noop,
  };
};

export const logger = createLogger();

// Performance timing utility
export const perf = {
  start: (label: string): (() => number) => {
    if (!DEV_MODE) return () => 0;
    const start = performance.now();
    logger.time(label);
    return () => {
      const duration = performance.now() - start;
      logger.timeEnd(label);
      return duration;
    };
  },
  mark: (label: string): void => {
    if (DEV_MODE) {
      performance.mark(`kotodama-${label}`);
    }
  },
  measure: (name: string, startMark: string, endMark: string): number => {
    if (!DEV_MODE) return 0;
    try {
      const measure = performance.measure(
        `kotodama-${name}`,
        `kotodama-${startMark}`,
        `kotodama-${endMark}`
      );
      return measure.duration;
    } catch {
      return 0;
    }
  },
};

export default logger;
