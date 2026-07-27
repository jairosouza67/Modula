import { describe, expect, it } from "vitest";
import { calcularValorTotalLinha } from "@/lib/sales/calculadoraVidracaria";
import { resolverServico } from "@/lib/sales/resolverServico";

describe("T2.3 — BI", () => {
  it("box + kit ML + acessório FX", () => {
    const servico = resolverServico("BI");
    const calculo = calcularValorTotalLinha(
      { codigoServico: "BI", largura: 1, altura: 2, quantidade: 1, adicional: 0 },
      servico,
    );

    expect(servico.vlM2).toBe(350);
    expect(servico.pcMl).toBe(85);
    expect(servico.pcFx).toBe(30);
    expect(calculo.valorTotal).toBe(815);
  });
});

