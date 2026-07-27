import { describe, expect, it } from "vitest";
import { calcularCustoReal } from "@/lib/sales/calculoCusto";

describe("T6.3 — fórmula de custo", () => {
  it("custo = (custo_m2 × L × A × Q) + (fx × Q) + (ml × L)", () => {
    const custo = calcularCustoReal({
      codigoServico: "X",
      largura: 2,
      altura: 1.5,
      quantidade: 2,
      valorVenda: 0,
      custoM2: 100,
      pcFxCusto: 10,
      pcMlCusto: 20,
    });

    // área=6 => 600 + fx(20) + ml(40)
    expect(custo).toBe(660);
  });
});

