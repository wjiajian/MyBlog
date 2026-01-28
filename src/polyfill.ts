import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  (globalThis as any).Buffer = Buffer;
  (globalThis as any).process = { env: {} } as any;
}
