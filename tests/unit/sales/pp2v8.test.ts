import { describe, expect, it } from "vitest";
import { calcularValorTotalLinha } from "@/lib/sales/calculadoraModula";
import { resolverServico } from "@/lib/sales/resolverServico";

describe("T2.6 — PP2V8", () => {
  it("retorna valor calculado mesmo em cenário de margem negativa no custo", () => {
    const servico = resolverServico("PP2V8");
    const calculo = calcularValorTotalLinha(
      { codigoServico: "PP2V8", largura: 1, altura: 2.1, quantidade: 1, adicional: 0 },
      servico,
    );

    expect(calculo.valorTotal).toBe(1226);
  });
});

