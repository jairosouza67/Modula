import { describe, expect, it } from "vitest";
import { calcularValorTotalLinha } from "@/lib/sales/calculadoraVidracaria";
import { resolverServico } from "@/lib/sales/resolverServico";

describe("T2.7 — VCR4", () => {
  it("mantém preço operacional da planilha (R$ 192/m²)", () => {
    const servico = resolverServico("VCR4");
    const calculo = calcularValorTotalLinha(
      { codigoServico: "VCR4", largura: 1, altura: 1, quantidade: 1, adicional: 0 },
      servico,
    );

    expect(servico.vlM2).toBe(192);
    expect(calculo.valorTotal).toBe(192);
  });
});

