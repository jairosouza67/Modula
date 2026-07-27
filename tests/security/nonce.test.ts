import { describe, it, expect } from "vitest";
import {
  cspNonceStore,
  generateCspNonce,
  getCspNonce,
  withCspNonce,
} from "@/lib/security/nonce";
import { cspNonceMiddleware } from "@/start";
import { AsyncLocalStorage } from "node:async_hooks";

describe("CSP Nonce System", () => {
  describe("Nonce Library Utility", () => {
    it("should generate a valid non-empty string nonce", () => {
      const nonce = generateCspNonce();
      expect(nonce).toBeTypeOf("string");
      expect(nonce.length).toBeGreaterThan(0);
    });

    it("should generate unique nonces", () => {
      const nonce1 = generateCspNonce();
      const nonce2 = generateCspNonce();
      expect(nonce1).not.toBe(nonce2);
    });

    it("should manage request-scoped nonces using AsyncLocalStorage", () => {
      const targetNonce = "test-nonce-123";

      // Outside context, should be undefined
      expect(getCspNonce()).toBeUndefined();

      // Inside context, should return targetNonce
      withCspNonce(targetNonce, () => {
        expect(getCspNonce()).toBe(targetNonce);

        // Nested contexts or changes
        const nestedNonce = "nested-nonce-456";
        withCspNonce(nestedNonce, () => {
          expect(getCspNonce()).toBe(nestedNonce);
        });

        // Restores to parent context value
        expect(getCspNonce()).toBe(targetNonce);
      });

      // Cleans up after exit
      expect(getCspNonce()).toBeUndefined();
    });

    it("should verify that the singleton cspNonceStore exists on globalThis in server environments", () => {
      expect(cspNonceStore).toBeInstanceOf(AsyncLocalStorage);

      // Verify it's bound to globalThis using the Symbol
      const globalStoreKey = Symbol.for("cspNonceStore");
      const globalStore = (globalThis as any)[globalStoreKey];
      expect(globalStore).toBe(cspNonceStore);
    });
  });

  describe("CSP Nonce Middleware", () => {
    it("should define a valid server middleware", () => {
      expect(cspNonceMiddleware).toBeDefined();
      expect(cspNonceMiddleware.options.server).toBeTypeOf("function");
    });

    it("should generate a new nonce and run next() within its context when no nonce exists", async () => {
      let called = false;
      let nonceInNext: string | undefined;

      const mockNext = async () => {
        called = true;
        nonceInNext = getCspNonce();
        return { response: new Response("ok") };
      };

      // Ensure no nonce context initially
      expect(getCspNonce()).toBeUndefined();

      // Call server middleware handler
      const result = await cspNonceMiddleware.options.server({
        next: mockNext,
      } as any);

      expect(called).toBe(true);
      expect(nonceInNext).toBeTypeOf("string");
      expect(nonceInNext?.length).toBeGreaterThan(0);
      expect(result).toEqual({ response: expect.any(Response) });

      // After middleware execution, the context is cleared
      expect(getCspNonce()).toBeUndefined();
    });

    it("should reuse an existing nonce and not generate a new one if it already exists", async () => {
      const existingNonce = "pre-existing-nonce-999";
      let called = false;
      let nonceInNext: string | undefined;

      const mockNext = async () => {
        called = true;
        nonceInNext = getCspNonce();
        return { response: new Response("ok") };
      };

      // Wrap middleware execution in an existing context
      await withCspNonce(existingNonce, async () => {
        const result = await cspNonceMiddleware.options.server({
          next: mockNext,
        } as any);

        expect(result).toEqual({ response: expect.any(Response) });
      });

      expect(called).toBe(true);
      expect(nonceInNext).toBe(existingNonce);
      expect(getCspNonce()).toBeUndefined(); // cleared after withCspNonce context
    });
  });
});
