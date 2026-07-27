import { describe, it, expect, vi } from "vitest";
import {
  validateInput,
  recordLoginAttempt,
} from "@/lib/auth/security";
import { isCsrfSafe } from "@/lib/security/csrf";

describe("Security Framework (SEC-01 a SEC-08)", () => {
  describe("SEC-01 & SEC-02: SQL Injection & XSS Validation", () => {
    it("should block SQL injection patterns", () => {
      const inputs = [
        "1' OR '1'='1",
        "'; DROP TABLE users; --",
        "admin'--",
        "1 UNION SELECT * FROM passwords",
        "1; EXEC xp_cmdshell('dir')",
      ];

      inputs.forEach((input) => {
        const result = validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain("SQL Injection");
      });
    });

    it("should block XSS patterns", () => {
      const inputs = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert(1)>",
        "javascript:alert(1)",
        "<iframe src='malicious.com'></iframe>",
        "<svg onload=alert(1)>",
      ];

      inputs.forEach((input) => {
        const result = validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain("XSS");
      });
    });

    it("should allow safe inputs", () => {
      const inputs = [
        "Vidraçaria Teste",
        "Rua das Flores, 123",
        "Valor: R$ 1.200,50",
        "Pedido #456",
        "Email: teste@exemplo.com",
      ];

      inputs.forEach((input) => {
        const result = validateInput(input);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe("SEC-07: Brute Force Protection", () => {
    it("should allow up to 10 attempts and then block", () => {
      const userId = "user_test_brute";

      // 10 tentativas permitidas
      for (let i = 0; i < 10; i++) {
        expect(recordLoginAttempt(userId).allowed).toBe(true);
      }

      // 11ª tentativa bloqueada
      expect(recordLoginAttempt(userId).allowed).toBe(false);
    });
  });

  describe("SEC-09: CSRF Origin/Referer validation", () => {
    const ALLOWED = "https://example.com";
    const createRequest = (method: string, headers: Record<string, string> = {}): Request =>
      new Request("https://example.com/api", { method, headers });

    it("should allow safe methods without origin check", () => {
      expect(isCsrfSafe(createRequest("GET"), ALLOWED)).toBe(true);
      expect(isCsrfSafe(createRequest("HEAD"), ALLOWED)).toBe(true);
      expect(isCsrfSafe(createRequest("OPTIONS"), ALLOWED)).toBe(true);
    });

    it("should reject mutating requests without origin or referer", () => {
      expect(isCsrfSafe(createRequest("POST"), ALLOWED)).toBe(false);
      expect(isCsrfSafe(createRequest("PUT"), ALLOWED)).toBe(false);
      expect(isCsrfSafe(createRequest("DELETE"), ALLOWED)).toBe(false);
      expect(isCsrfSafe(createRequest("PATCH"), ALLOWED)).toBe(false);
    });

    it("should allow mutating requests from allowed origin", () => {
      expect(isCsrfSafe(createRequest("POST", { origin: "https://example.com" }), ALLOWED)).toBe(
        true,
      );
    });

    it("should reject mutating requests from foreign origin", () => {
      expect(isCsrfSafe(createRequest("POST", { origin: "https://evil.com" }), ALLOWED)).toBe(
        false,
      );
    });

    it("should fall back to referer header", () => {
      expect(
        isCsrfSafe(createRequest("POST", { referer: "https://example.com/page" }), ALLOWED),
      ).toBe(true);
      expect(isCsrfSafe(createRequest("POST", { referer: "https://evil.com/page" }), ALLOWED)).toBe(
        false,
      );
    });
  });
});
