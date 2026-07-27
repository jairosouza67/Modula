import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { applySecurityHeaders } from "./lib/security/headers";
import { isCsrfSafe } from "./lib/security/csrf";
import { generateCspNonce, withCspNonce, getCspNonce } from "./lib/security/nonce";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return applySecurityHeaders(
      new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );
  }
});

const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next();
  return applySecurityHeaders(result.response);
});

const csrfMiddleware = createMiddleware().server(async ({ request, next }) => {
  if (!isCsrfSafe(request)) {
    return applySecurityHeaders(
      new Response(JSON.stringify({ error: "Requisição rejeitada: origem não confiável." }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    );
  }
  return await next();
});

export const cspNonceMiddleware = createMiddleware().server(async ({ next }) => {
  const existingNonce = getCspNonce();
  if (existingNonce) {
    return await next();
  }
  return withCspNonce(generateCspNonce(), () => next());
});

export const startInstance = createStart(() => ({
  requestMiddleware: [
    cspNonceMiddleware,
    securityHeadersMiddleware,
    csrfMiddleware,
    errorMiddleware,
  ],
}));
