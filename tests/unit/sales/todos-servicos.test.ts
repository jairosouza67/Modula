import { describe, expect, it } from "vitest";
import { calcularValorTotalLinha } from "@/lib/sales/calculadoraModula";
import { listarCodigosServicos, resolverServico } from "@/lib/sales/resolverServico";

describe("T2.11 — Todos os serviços", () => {
  it("todos os 27 serviços calculam sem erro", () => {
    const codigos = listarCodigosServicos();
    expect(codigos).toHaveLength(27);

    for (const codigo of codigos) {
      const servico = resolverServico(codigo);
      const calculo = calcularValorTotalLinha(
        { codigoServico: codigo, largura: 1, altura: 1, quantidade: 1, adicional: 0 },
        servico,
      );

      expect(calculo.valorTotal).toBeGreaterThan(0);
      expect(calculo.precoUnitario).toBeGreaterThan(0);
    }
  });
});

