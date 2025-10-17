import { webcrypto } from 'node:crypto';

declare global {
  var btoa: (data: string) => string;
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
