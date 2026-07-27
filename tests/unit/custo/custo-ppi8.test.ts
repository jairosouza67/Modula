import { describe, expect, it } from "vitest";
import { calcularCustoReal } from "@/lib/sales/calculoCusto";

describe("T3.1 — custo PPI8", () => {
  it("custo base por m² é aplicado corretamente", () => {
    const custo = calcularCustoReal({
      codigoServico: "PPI8",
      largura: 1,
      altura: 1,
      quantidade: 1,
      valorVenda: 480,
      custoM2: 314.4,
      pcFxCusto: 0,
      pcMlCusto: 0,
    });

    expect(custo).toBeCloseTo(314.4, 2);
  });
});

