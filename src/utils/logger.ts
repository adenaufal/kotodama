/**
 * Diagnostic logging that never forwards arbitrary text or objects to the console.
 * Those values can contain prompts, generated text, credentials, or provider errors.
 */
export function redactLogValue(value: unknown): unknown {
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (value === undefined) return '[redacted]';
  if (value instanceof Error) return '[redacted error]';
  if (Array.isArray(value)) return `[redacted array: ${value.length} items]`;
  if (typeof value === 'object') return '[redacted object]';
  return '[redacted text]';
}

const isDevelopment = (): boolean => {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      return !chrome.runtime.getManifest?.()?.update_url;
    }
    return typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
  } catch {
    return false;
  }
};

const DEV_MODE = isDevelopment();

type LogMethod = (...args: unknown[]) => void;

interface Logger {
  debug: LogMethod;
  info: LogMethod;
  log: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
  group: (label: string) => void;
  groupEnd: () => void;
}

const redact = (method: (...args: unknown[]) => void): LogMethod => (...args) => {
  method('[Kotodama] Diagnostic details redacted', ...args.map(redactLogValue));
};

export const logger: Logger = {
  debug: (...args) => { if (DEV_MODE) redact(console.debug)(...args); },
  info: (...args) => { if (DEV_MODE) redact(console.info)(...args); },
  log: (...args) => { if (DEV_MODE) redact(console.log)(...args); },
  warn: (...args) => { if (DEV_MODE) redact(console.warn)(...args); },
  error: (...args) => redact(console.error)(...args),
  time: () => { if (DEV_MODE) console.time('[Kotodama] [redacted]'); },
  timeEnd: () => { if (DEV_MODE) console.timeEnd('[Kotodama] [redacted]'); },
  group: () => { if (DEV_MODE) console.group('[Kotodama] [redacted]'); },
  groupEnd: () => { if (DEV_MODE) console.groupEnd(); },
};

const performanceNames = new Map<string, string>();
let nextPerformanceId = 0;

function safePerformanceName(label: string): string {
  let safeName = performanceNames.get(label);
  if (!safeName) {
    safeName = `kotodama-metric-${++nextPerformanceId}`;
    performanceNames.set(label, safeName);
  }
  return safeName;
}

// Performance timing utility
export const perf = {
  start: (label: string): (() => number) => {
    if (!DEV_MODE) return () => 0;
    const safeName = safePerformanceName(label);
    const start = performance.now();
    performance.mark(`${safeName}-start`);
    return () => {
      const duration = performance.now() - start;
      performance.mark(`${safeName}-end`);
      return duration;
    };
  },
  mark: (label: string): void => {
    if (DEV_MODE) performance.mark(safePerformanceName(label));
  },
  measure: (name: string, startMark: string, endMark: string): number => {
    if (!DEV_MODE) return 0;
    try {
      const measure = performance.measure(
        safePerformanceName(name),
        safePerformanceName(startMark),
        safePerformanceName(endMark),
      );
      return measure.duration;
    } catch {
      return 0;
    }
  },
};

export default logger;
