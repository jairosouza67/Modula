import { describe, expect, it } from "vitest";
import { calcularValorTotalLinha } from "@/lib/sales/calculadoraModula";
import { resolverServico } from "@/lib/sales/resolverServico";

describe("T2.10 — Quantidade zero", () => {
  it("retorna total e preço unitário iguais a zero", () => {
    const calculo = calcularValorTotalLinha(
      { codigoServico: "PPI8", largura: 1, altura: 2.1, quantidade: 0, adicional: 40 },
      resolverServico("PPI8"),
    );

    expect(calculo.valorTotal).toBe(0);
    expect(calculo.precoUnitario).toBe(0);
  });
});

