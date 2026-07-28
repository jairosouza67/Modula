import { describe, expect, it } from "vitest";
import { calcularValorTotalLinha } from "@/lib/sales/calculadoraModula";
import { resolverServico } from "@/lib/sales/resolverServico";

describe("T2.4 — JI8", () => {
  it("janela + kit ML + bate-fecha", () => {
    const servico = resolverServico("JI8");
    const calculo = calcularValorTotalLinha(
      { codigoServico: "JI8", largura: 1, altura: 1.2, quantidade: 1, adicional: 0 },
      servico,
    );

    expect(calculo.valorTotal).toBe(537);
  });
});

