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
globalThis.chrome = {
  storage: {
    local: {
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
  },
  runtime: {
    id: 'test-extension-id',
    getManifest: () => ({}),
  },
} as unknown as typeof chrome;
