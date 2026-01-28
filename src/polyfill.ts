import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  globalThis.Buffer = Buffer;
  globalThis.process = { env: {} } as any;
}
