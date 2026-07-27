import { describe, expect, it } from "vitest";
import { calcularTotaisCusto } from "@/lib/sales/calculoCusto";

describe("T3.3 — desconto 17%", () => {
  it("valor com desconto = bruto × 0.83", () => {
    const totais = calcularTotaisCusto([
      {
        codigoServico: "PPI8",
        largura: 1,
        altura: 1,
        quantidade: 1,
        valorVenda: 1000,
        custoM2: 500,
        pcFxCusto: 0,
        pcMlCusto: 0,
      },
    ]);

    expect(totais.valorComDesconto).toBe(830);
  });
});

