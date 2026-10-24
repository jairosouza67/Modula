import { describe, it, expect } from "vitest";
import {
  maskDocument,
  normalizeDocument,
  isValidDocument,
} from "@/lib/documents/validation";

describe("maskDocument — CPF e CNPJ", () => {
  it("aplica máscara de CPF progressiva", () => {
    expect(maskDocument("123", "cpf")).toBe("123");
    expect(maskDocument("123456", "cpf")).toBe("123.456");
    expect(maskDocument("12345678900", "cpf")).toBe("123.456.789-00");
  });

  it("aplica máscara de CNPJ", () => {
    expect(maskDocument("12345678000199", "cnpj")).toBe("12.345.678/0001-99");
  });

  it("trunca CPFs maiores que 11 dígitos", () => {
    expect(maskDocument("12345678900999", "cpf")).toBe("123.456.789-00");
  });

  it("trunca CNPJs maiores que 14 dígitos", () => {
    expect(maskDocument("12345678000199999", "cnpj")).toBe("12.345.678/0001-99");
  });

  it("remove caracteres não numéricos antes de aplicar máscara", () => {
    expect(maskDocument("123.456.789-00", "cpf")).toBe("123.456.789-00");
    expect(maskDocument("12.345.678/0001-99", "cnpj")).toBe("12.345.678/0001-99");
  });
});

describe("normalizeDocument", () => {
  it("remove toda pontuação", () => {
    expect(normalizeDocument("123.456.789-00")).toBe("12345678900");
    expect(normalizeDocument("12.345.678/0001-99")).toBe("12345678000199");
  });

  it("retorna vazio para entrada vazia", () => {
    expect(normalizeDocument("")).toBe("");
  });
});

describe("isValidDocument — CPFs", () => {
  const cpfsValidos = [
    "529.982.247-25",
    "52998224725",
    "111.444.777-35",
    "11144477735",
  ];

  it.each(cpfsValidos)("aceita CPF válido %s", (cpf) => {
    expect(isValidDocument(cpf, "cpf")).toBe(true);
  });

  it("rejeita CPF com todos dígitos iguais", () => {
    for (const d of ["0", "1", "2", "9"]) {
      const pad = d.repeat(11);
      expect(isValidDocument(pad, "cpf")).toBe(false);
    }
  });

  it("rejeita CPF com tamanho diferente de 11", () => {
    expect(isValidDocument("1234567890", "cpf")).toBe(false);
    expect(isValidDocument("123456789012", "cpf")).toBe(false);
  });

  it("rejeita CPF com dígitos verificadores inválidos", () => {
    expect(isValidDocument("52998224721", "cpf")).toBe(false);
    expect(isValidDocument("111.444.777-00", "cpf")).toBe(false);
  });
});

describe("isValidDocument — CNPJs", () => {
  const cnpjsValidos = [
    "11.222.333/0001-81",
    "11222333000181",
    "04.337.168/0001-48",
    "04337168000148",
  ];

  it.each(cnpjsValidos)("aceita CNPJ válido %s", (cnpj) => {
    expect(isValidDocument(cnpj, "cnpj")).toBe(true);
  });

  it("rejeita CNPJ com todos dígitos iguais", () => {
    expect(isValidDocument("11111111111111", "cnpj")).toBe(false);
  });

  it("rejeita CNPJ com tamanho diferente de 14", () => {
    expect(isValidDocument("1234567890123", "cnpj")).toBe(false);
    expect(isValidDocument("123456780001990", "cnpj")).toBe(false);
  });

  it("rejeita CNPJ com dígitos verificadores inválidos", () => {
    expect(isValidDocument("11.222.333/0001-00", "cnpj")).toBe(false);
  });
});