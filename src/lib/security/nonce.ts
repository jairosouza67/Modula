const AsyncLocalStorage = typeof window === "undefined"
  ? (await import(/* @vite-ignore */ "node:async_hooks")).AsyncLocalStorage
  : null;

const globalStoreKey = Symbol.for("cspNonceStore");

export const cspNonceStore =
  typeof window === "undefined" && AsyncLocalStorage
    ? (globalThis as any)[globalStoreKey] ||
      ((globalThis as any)[globalStoreKey] = new AsyncLocalStorage())
    : null;

export function generateCspNonce(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getCspNonce(): string | undefined {
  return cspNonceStore?.getStore();
}

export function withCspNonce<T>(nonce: string, callback: () => T): T {
  if (cspNonceStore) {
    return cspNonceStore.run(nonce, callback);
  }
  return callback();
}
