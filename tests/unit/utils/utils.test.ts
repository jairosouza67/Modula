import { describe, it, expect } from "vitest";
import { cn, formatCurrency } from "@/lib/utils";

describe("cn — combinação de classes tailwind", () => {
  it("concatena classes falsy ignoradas por clsx", () => {
    expect(cn("a", false && "b", null, undefined, "c")).toBe("a c");
  });

  it("lida com condição class-variance-authority", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("deduplica classes conflitantes via tailwind-merge", () => {
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("preserva classes independentes", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("retorna string vazia sem argumentos", () => {
    expect(cn()).toBe("");
  });
});

describe("formatCurrency — BRL", () => {
  it("formata valores em PT-BR com símbolo R$", () => {
    expect(formatCurrency(1234.56)).toContain("R$");
    expect(formatCurrency(1234.56)).toContain("1.234,56");
  });

  it("formata zero", () => {
    expect(formatCurrency(0)).toContain("0,00");
  });

  it("formata valores grandes", () => {
    const formatted = formatCurrency(1_500_000);
    expect(formatted).toContain("1.500.000,00");
  });

  it("formata valores com sinal negativo", () => {
    expect(formatCurrency(-50)).toContain("50,00");
  });
});