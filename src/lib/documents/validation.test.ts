import { describe, it, expect } from "vitest";
import { isValidDocument, maskDocument, normalizeDocument } from "./validation";

describe("Document Validation", () => {
  describe("CPF Validation", () => {
    it("should validate a valid CPF", () => {
      expect(isValidDocument("12345678909", "cpf")).toBe(true);
      expect(isValidDocument("11144477735", "cpf")).toBe(true);
    });

    it("should reject an invalid CPF", () => {
      expect(isValidDocument("12345678900", "cpf")).toBe(false);
      expect(isValidDocument("11111111111", "cpf")).toBe(false); // Repeated digits
      expect(isValidDocument("123", "cpf")).toBe(false); // Incomplete
    });

    it("should mask CPF correctly", () => {
      expect(maskDocument("12345678909", "cpf")).toBe("123.456.789-09");
      expect(maskDocument("1234567", "cpf")).toBe("123.456.7");
    });
  });

  describe("CNPJ Validation", () => {
    it("should validate a valid CNPJ", () => {
      expect(isValidDocument("11222333000181", "cnpj")).toBe(true);
      expect(isValidDocument("00000000000191", "cnpj")).toBe(true);
    });

    it("should reject an invalid CNPJ", () => {
      expect(isValidDocument("11222333000180", "cnpj")).toBe(false);
      expect(isValidDocument("11111111111111", "cnpj")).toBe(false); // Repeated digits
      expect(isValidDocument("123", "cnpj")).toBe(false); // Incomplete
    });

    it("should mask CNPJ correctly", () => {
      expect(maskDocument("11222333000181", "cnpj")).toBe("11.222.333/0001-81");
      expect(maskDocument("1122233300", "cnpj")).toBe("11.222.333/00");
    });
  });

  describe("Document Normalization", () => {
    it("should strip non-numeric characters", () => {
      expect(normalizeDocument("123.456.789-09")).toBe("12345678909");
      expect(normalizeDocument("11.222.333/0001-81")).toBe("11222333000181");
      expect(normalizeDocument("  a12- 3  ")).toBe("123");
    });
  });
});
