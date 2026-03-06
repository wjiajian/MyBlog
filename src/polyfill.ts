import { Buffer } from 'buffer';

interface BrowserPolyfillTarget {
  Buffer?: typeof Buffer;
  process?: {
    env: Record<string, string | undefined>;
  };
}

if (typeof window !== 'undefined') {
  const polyfilledGlobal = globalThis as unknown as BrowserPolyfillTarget;
  polyfilledGlobal.Buffer = Buffer;
  polyfilledGlobal.process = { env: {} };
}
