import { describe, expect, it } from "vitest";
import { calcularValorTotalLinha } from "@/lib/sales/calculadoraVidracaria";
import { resolverServico } from "@/lib/sales/resolverServico";

describe("T2.9 — Adicional", () => {
  it("adicional soma no valor final da linha", () => {
    const semAdicional = calcularValorTotalLinha(
      { codigoServico: "PPI8", largura: 1, altura: 2.1, quantidade: 1, adicional: 0 },
      resolverServico("PPI8"),
    );
    const comAdicional = calcularValorTotalLinha(
      { codigoServico: "PPI8", largura: 1, altura: 2.1, quantidade: 1, adicional: 50 },
      resolverServico("PPI8"),
    );

    expect(comAdicional.valorTotal).toBe(semAdicional.valorTotal + 50);
  });
});

