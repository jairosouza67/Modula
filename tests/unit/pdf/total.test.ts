import { describe, expect, it } from "vitest";
import { montarModeloPdfOrcamento } from "@/lib/sales/pdfOrcamento";

describe("T5.3 — total do PDF", () => {
  it("total geral é a soma dos VL TOTAL", () => {
    const modelo = montarModeloPdfOrcamento({
      numero: "ORC-1001",
      descricao: "Projeto teste",
      status: "Aberto",
      data_validade: null,
      area_total: null,
      valor_total: null,
      itens: [
        { codigoServico: "PPI8", nomeServico: "Porta Pivotante", largura: 1000, altura: 2000, quantidade: 1 },
        { codigoServico: "PPI8", nomeServico: "Porta Pivotante", largura: 1000, altura: 2000, quantidade: 1 },
      ],
      cliente: { nome: "Cliente Teste" },
    });

    const soma = modelo.itens.reduce((acc, item) => acc + item.valorTotal, 0);
    expect(modelo.totalGeral).toBeCloseTo(soma, 2);
  });
});

