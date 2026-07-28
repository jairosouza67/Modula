import { describe, expect, it } from "vitest";
import { calcularValorTotalLinha } from "@/lib/sales/calculadoraModula";
import { resolverServico } from "@/lib/sales/resolverServico";

describe("T2.2 — PPI8", () => {
  it("composição e valor total da linha seguem a planilha", () => {
    const servico = resolverServico("PPI8");
    const calculo = calcularValorTotalLinha(
      { codigoServico: "PPI8", largura: 1, altura: 2.1, quantidade: 1, adicional: 0 },
      servico,
    );

    expect(servico.vlM2).toBe(360);
    expect(servico.pcFx).toBe(120);
    expect(calculo.valorTotal).toBe(876);
  });
});

