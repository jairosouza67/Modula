import { describe, expect, it } from "vitest";
import { calcularLucro } from "@/lib/sales/calculoCusto";

describe("T3.6 — VCR4 negativo aceito", () => {
  it("permite custo acima da venda", () => {
    const lucro = calcularLucro(192, 374.6);
    expect(lucro).toBe(-182.6);
  });
});

