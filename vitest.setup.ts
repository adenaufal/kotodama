import { webcrypto } from 'node:crypto';

declare global {
  // eslint-disable-next-line no-var
  var btoa: (data: string) => string;
  // eslint-disable-next-line no-var
  var atob: (data: string) => string;
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
