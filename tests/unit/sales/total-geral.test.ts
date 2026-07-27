import { describe, expect, it } from "vitest";
import { calcularTotalOrcamento, calcularValorTotalLinha } from "@/lib/sales/calculadoraVidracaria";
import { resolverServico } from "@/lib/sales/resolverServico";

describe("T2.8 — Total geral", () => {
  it("soma de todas as linhas", () => {
    const linha1 = calcularValorTotalLinha(
      { codigoServico: "PPI8", largura: 1, altura: 2.1, quantidade: 1, adicional: 0 },
      resolverServico("PPI8"),
    );
    const linha2 = calcularValorTotalLinha(
      { codigoServico: "JI8", largura: 1, altura: 1.2, quantidade: 1, adicional: 0 },
      resolverServico("JI8"),
    );

    expect(calcularTotalOrcamento([linha1, linha2])).toBe(1413);
  });
});

