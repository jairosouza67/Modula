const MUTATING_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

function resolveAllowedOrigin(override?: string): string | null {
  if (override) {
    return override.trim();
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const fromEnv =
    import.meta.env.VITE_SITE_URL ??
    (typeof process !== "undefined" ? process.env.SITE_URL : undefined);
  return fromEnv?.trim() || null;
}

export function isCsrfSafe(request: Request, allowedOrigin?: string): boolean {
  if (!MUTATING_METHODS.has(request.method.toUpperCase())) {
    return true;
  }

  const origin = resolveAllowedOrigin(allowedOrigin);

  if (!origin) {
    return Boolean(import.meta.env.DEV);
  }

  const requestOrigin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const checkValue = requestOrigin ?? referer;

  if (!checkValue) {
    return false;
  }

  try {
    const url = new URL(checkValue);
    return url.origin === origin;
  } catch {
    return false;
  }
}
