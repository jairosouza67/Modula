import { describe, expect, it } from "vitest";
import { calcularValorTotalLinha } from "@/lib/sales/calculadoraVidracaria";
import { resolverServico } from "@/lib/sales/resolverServico";

describe("T6.4 — edge cases", () => {
  it("dimensões zero retornam m2=0", () => {
    const calculo = calcularValorTotalLinha(
      { codigoServico: "PPI8", largura: 0, altura: 2, quantidade: 1, adicional: 0 },
      resolverServico("PPI8"),
    );
    expect(calculo.m2).toBe(0);
  });

  it("dimensões negativas são normalizadas para zero", () => {
    const calculo = calcularValorTotalLinha(
      { codigoServico: "PPI8", largura: -1, altura: 2, quantidade: 1, adicional: 0 },
      resolverServico("PPI8"),
    );
    expect(calculo.m2).toBe(0);
    expect(calculo.valorTotal).toBeGreaterThanOrEqual(0);
  });

  it("dimensões altas (>10m) ainda calculam sem erro", () => {
    const calculo = calcularValorTotalLinha(
      { codigoServico: "PPI8", largura: 12, altura: 3, quantidade: 1, adicional: 0 },
      resolverServico("PPI8"),
    );
    expect(calculo.valorTotal).toBeGreaterThan(0);
  });
});

