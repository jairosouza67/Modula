import { describe, expect, it } from "vitest";
import { calcularTotaisCusto } from "@/lib/sales/calculoCusto";

describe("T3.4 — lucro pós desconto", () => {
  it("lucro pós-desconto = (bruto×0.83) - custoTotal", () => {
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

    expect(totais.lucroAposDesconto).toBe(330);
  });
});

