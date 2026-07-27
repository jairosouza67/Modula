import { getCspNonce } from "./nonce";

const BASE_CSP =
  "default-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; script-src 'self' {SCRIPT_NONCE}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

function buildCsp(): string {
  const nonce = getCspNonce();
  const scriptSrc = nonce ? `'nonce-${nonce}'` : "";
  return BASE_CSP.replace("{SCRIPT_NONCE}", scriptSrc).replace(/\s+/g, " ").trim();
}

export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
  if (!headers.has("Content-Security-Policy")) {
    headers.set("Content-Security-Policy", buildCsp());
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
