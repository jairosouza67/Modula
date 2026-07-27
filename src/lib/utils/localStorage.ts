const isBrowser = (): boolean => typeof window !== "undefined";

export const readJson = <T>(key: string): T | null => {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
};

export const writeJson = (key: string, value: unknown): void => {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export { isBrowser };
