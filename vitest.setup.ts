import { webcrypto } from 'node:crypto';

declare global {
  var btoa: (data: string) => string;
  var atob: (data: string) => string;
  var chrome: typeof chrome;
}

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as unknown as Crypto;
}

if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = (data: string): string =>
    Buffer.from(data, 'binary').toString('base64');
}

if (typeof globalThis.atob === 'undefined') {
  globalThis.atob = (data: string): string =>
    Buffer.from(data, 'base64').toString('binary');
}

// Mock chrome storage for tests
const storageData: Record<string, unknown> = {};
const sessionData: Record<string, unknown> = {};
globalThis.chrome = {
  storage: {
    local: {
      get: (keys: string[] | null, callback?: (result: Record<string, unknown>) => void) => {
        const requested = keys === null ? Object.keys(storageData) : keys;
        const result: Record<string, unknown> = {};
        for (const key of requested) {
          if (key in storageData) {
            result[key] = storageData[key];
          }
        }
        callback?.(result);
        return Promise.resolve(result);
      },
      set: (items: Record<string, unknown>, callback?: () => void) => {
        Object.assign(storageData, items);
        callback?.();
        return Promise.resolve();
      },
      remove: (keys: string | string[], callback?: () => void) => {
        for (const key of typeof keys === 'string' ? [keys] : keys) delete storageData[key];
        callback?.();
        return Promise.resolve();
      },
      clear: (callback?: () => void) => {
        for (const key of Object.keys(storageData)) delete storageData[key];
        callback?.();
        return Promise.resolve();
      },
    },
    sync: {
      get: (keys: string[], callback: (result: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {};
        for (const key of keys) {
          if (key in storageData) {
            result[key] = storageData[key];
          }
        }
        callback(result);
      },
      set: (items: Record<string, unknown>, callback?: () => void) => {
        Object.assign(storageData, items);
        callback?.();
      },
    },
    session: {
      get: (keys: string | string[] | null, callback?: (result: Record<string, unknown>) => void) => {
        const requested = keys === null ? Object.keys(sessionData) : typeof keys === 'string' ? [keys] : keys;
        const result: Record<string, unknown> = {};
        for (const key of requested) if (key in sessionData) result[key] = sessionData[key];
        callback?.(result);
        return Promise.resolve(result);
      },
      set: (items: Record<string, unknown>, callback?: () => void) => {
        Object.assign(sessionData, items);
        callback?.();
        return Promise.resolve();
      },
      remove: (keys: string | string[], callback?: () => void) => {
        for (const key of typeof keys === 'string' ? [keys] : keys) delete sessionData[key];
        callback?.();
        return Promise.resolve();
      },
      clear: (callback?: () => void) => {
        for (const key of Object.keys(sessionData)) delete sessionData[key];
        callback?.();
        return Promise.resolve();
      },
      setAccessLevel: () => Promise.resolve(),
    },
  },
  runtime: {
    id: 'test-extension-id',
    getManifest: () => ({}),
  },
} as unknown as typeof chrome;
