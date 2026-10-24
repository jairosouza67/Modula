import { describe, it, expect, vi, beforeEach } from "vitest";
import { SECURITY_HEADERS, applySecurityHeaders } from "@/lib/security/headers";
import { generateCspNonce } from "@/lib/security/nonce";

describe("SECURITY_HEADERS — constantes", () => {
  it("inclui os cabeçalhos defensivos esperados", () => {
    expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
    expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    expect(SECURITY_HEADERS["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(SECURITY_HEADERS["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=()");
    expect(SECURITY_HEADERS["Strict-Transport-Security"]).toContain("max-age=31536000");
  });
});

describe("applySecurityHeaders", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("aplica todos os cabeçalhos em uma resposta vazia", () => {
    const response = new Response("ok");
    const result = applySecurityHeaders(response);

    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      expect(result.headers.get(key)).toBe(value);
    }
  });

  it("preserva corpo e status da resposta original", () => {
    const response = new Response("payload", { status: 201, statusText: "Created" });
    const result = applySecurityHeaders(response);

    expect(result.status).toBe(201);
    expect(result.statusText).toBe("Created");
    expect(result.body).not.toBeNull();
  });

  it("preserva status de erro", () => {
    const response = new Response("erro", { status: 500, statusText: "Internal Server Error" });
    const result = applySecurityHeaders(response);
    expect(result.status).toBe(500);
  });

  it("não sobrescreve cabeçalho já presente na resposta", () => {
    const existing = new Response("ok", {
      headers: { "X-Frame-Options": "SAMEORIGIN" },
    });
    const result = applySecurityHeaders(existing);
    expect(result.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
  });

  it("não sobrescreve CSP já presente na resposta", () => {
    const existing = new Response("ok", {
      headers: { "Content-Security-Policy": "default-src 'none'" },
    });
    const result = applySecurityHeaders(existing);
    expect(result.headers.get("Content-Security-Policy")).toBe("default-src 'none'");
  });

  it("gera CSP com diretivas de segurança", () => {
    const result = applySecurityHeaders(new Response("ok"));
    const csp = result.headers.get("Content-Security-Policy") ?? "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it("remove o placeholder {SCRIPT_NONCE} da CSP", () => {
    const result = applySecurityHeaders(new Response("ok"));
    const csp = result.headers.get("Content-Security-Policy") ?? "";
    expect(csp).not.toContain("{SCRIPT_NONCE}");
  });

  it("normaliza espaços em branco na CSP (regex \\s+ -> espaço único)", () => {
    const result = applySecurityHeaders(new Response("ok"));
    const csp = result.headers.get("Content-Security-Policy") ?? "";
    expect(csp).not.toMatch(/\s{2,}/);
  });

  it("usa o nonce quando disponível via AsyncLocalStorage", async () => {
    // Simula um nonce ativo injetando-o no store
    const nonce = generateCspNonce();
    const { cspNonceStore } = await import("@/lib/security/nonce");

    if (!cspNonceStore) {
      // Em ambiente browser (sem ALS), a CSP fica sem nonce — comportamento aceitável
      const result = applySecurityHeaders(new Response("ok"));
      const csp = result.headers.get("Content-Security-Policy") ?? "";
      expect(csp).toContain("script-src 'self'");
      return;
    }

    await cspNonceStore.run(nonce, async () => {
      const result = applySecurityHeaders(new Response("ok"));
      const csp = result.headers.get("Content-Security-Policy") ?? "";
      expect(csp).toContain(`'nonce-${nonce}'`);
    });
  });
});