import { describe, it, expect } from "vitest";
import {
  maskPhone,
  isValidPhone,
  isValidEmail,
  maskCurrency,
  parseCurrency,
} from "@/lib/formatters/contact";

describe("Contact — maskPhone", () => {
  it("aplica máscara progressiva enquanto digita", () => {
    expect(maskPhone("1")).toBe("(1");
    expect(maskPhone("11")).toBe("(11");
    expect(maskPhone("119")).toBe("(11) 9");
    expect(maskPhone("1198")).toBe("(11) 98");
  });

  it("formata celular com 11 dígitos", () => {
    expect(maskPhone("11987654321")).toBe("(11) 98765-4321");
  });

  it("formata telefone fixo com 10 dígitos", () => {
    expect(maskPhone("1133334444")).toBe("(11) 3333-4444");
  });

  it("ignora caracteres não numéricos da entrada", () => {
    expect(maskPhone("(11) 98765-4321")).toBe("(11) 98765-4321");
  });

  it("trunca entradas acima de 11 dígitos", () => {
    expect(maskPhone("119876543210999")).toBe("(11) 98765-4321");
  });

  it("retorna string vazia para entrada vazia", () => {
    expect(maskPhone("")).toBe("");
  });
});

describe("Contact — isValidPhone", () => {
  it("aceita campo vazio como válido (opcional)", () => {
    expect(isValidPhone("")).toBe(true);
    expect(isValidPhone("   ")).toBe(true);
  });

  it("aceita 10 e 11 dígitos", () => {
    expect(isValidPhone("(11) 3333-4444")).toBe(true);
    expect(isValidPhone("(11) 98765-4321")).toBe(true);
  });

  it("rejeita quantidades de dígitos inválidas", () => {
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("123456789")).toBe(false);
    expect(isValidPhone("123456789012")).toBe(false);
  });

  it("considera apenas dígitos, ignorando máscara", () => {
    expect(isValidPhone("(11) 98765-4321")).toBe(true);
    expect(isValidPhone("abc")).toBe(false);
  });
});

describe("Contact — isValidEmail", () => {
  it("aceita campo vazio como válido (opcional)", () => {
    expect(isValidEmail("")).toBe(true);
    expect(isValidEmail("  ")).toBe(true);
  });

  it("aceita e-mails válidos comuns", () => {
    const validos = [
      "contato@modula.com.br",
      "ana.souza@empresa.com",
      "financeiro+modula@dominio.com.br",
      "user_name@sub.dominio.co",
    ];
    for (const email of validos) {
      expect(isValidEmail(email)).toBe(true);
    }
  });

  it("rejeita e-mails malformados", () => {
    const invalidos = [
      "sem-arroba.com",
      "@dominio.com",
      "usuario@",
      "usuario@dominio",
      "usuario@@dominio.com",
      "usuario @dominio.com",
    ];
    for (const email of invalidos) {
      expect(isValidEmail(email)).toBe(false);
    }
  });
});

describe("Contact — máscara de moeda", () => {
  it("converte dígitos em real formatado", () => {
    expect(maskCurrency("123456")).toBe("1.234,56");
  });

  it("formata valores com menos de dois dígitos", () => {
    expect(maskCurrency("1")).toBe("0,01");
    expect(maskCurrency("12")).toBe("0,12");
    expect(maskCurrency("123")).toBe("1,23");
  });

  it("ignora separadores já existentes na entrada", () => {
    // Entrada digitada como "1.234,56" -> dígitos "123456" -> "1.234,56"
    expect(maskCurrency("R$ 1.234,56")).toBe("1.234,56");
    expect(maskCurrency("1.234,56")).toBe("1.234,56");
  });

  it("retorna vazio quando não há dígitos", () => {
    expect(maskCurrency("")).toBe("");
    expect(maskCurrency("abc")).toBe("");
  });
});

describe("Contact — parseCurrency", () => {
  it("converte string formatada em número", () => {
    expect(parseCurrency("1.234,56")).toBeCloseTo(1234.56, 2);
  });

  it("converte valor sem separador de milhar", () => {
    expect(parseCurrency("1234,56")).toBeCloseTo(1234.56, 2);
  });

  it("retorna 0 para entradas inválidas ou vazias", () => {
    expect(parseCurrency("")).toBe(0);
    expect(parseCurrency("abc")).toBe(0);
    expect(parseCurrency("R$")).toBe(0);
  });

  it("faz round-trip com maskCurrency", () => {
    const original = 98765.43;
    const masked = maskCurrency(String(Math.round(original * 100)));
    expect(parseCurrency(masked)).toBeCloseTo(original, 2);
  });
});