import { describe, expect, it } from "vitest";
import { calcularValorTotalLinha } from "@/lib/sales/calculadoraModula";
import { resolverServico } from "@/lib/sales/resolverServico";

describe("T2.5 — PCI4", () => {
  it("porta 4 folhas com 2 puxadores", () => {
    const servico = resolverServico("PCI4");
    const calculo = calcularValorTotalLinha(
      { codigoServico: "PCI4", largura: 1, altura: 2, quantidade: 1, adicional: 0 },
      servico,
    );

    expect(servico.pcFx).toBe(180);
    expect(calculo.valorTotal).toBe(985);
  });
});

