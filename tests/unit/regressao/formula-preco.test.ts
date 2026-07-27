import { describe, expect, it } from "vitest";

function calcularPrecoVenda(compra: number, margem: number) {
  return compra * (1 + margem);
}

describe("T6.2 — fórmula de preço de venda", () => {
  it("preço = compra × (1 + margem)", () => {
    expect(calcularPrecoVenda(100, 0.46)).toBe(146);
    expect(calcularPrecoVenda(374.6, 0.06)).toBeCloseTo(397.08, 2);
  });
});

