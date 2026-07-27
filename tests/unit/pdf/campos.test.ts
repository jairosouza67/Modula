import { describe, expect, it } from "vitest";
import { montarModeloPdfOrcamento, renderHtmlOrcamentoProfissional } from "@/lib/sales/pdfOrcamento";

describe("T5.1 — campos obrigatórios do PDF", () => {
  it("gera layout com cabeçalho, cliente e tabela", () => {
    const modelo = montarModeloPdfOrcamento({
      numero: "ORC-1001",
      descricao: "Projeto teste",
      status: "Aberto",
      data_validade: "2026-05-30T00:00:00.000Z",
      area_total: 1,
      valor_total: 100,
      itens: [{ codigoServico: "PPI8", nomeServico: "Porta Pivotante", largura: 1000, altura: 2000, quantidade: 1 }],
      cliente: { nome: "Cliente Teste" },
    });
    const html = renderHtmlOrcamentoProfissional(modelo);

    expect(html).toContain("Cliente:");
    expect(html).toContain("CNPJ / CPF:");
    expect(html).toContain("Código");
    expect(html).toContain("VL TOTAL");
    expect(html).toContain("TOTAL GERAL:");
  });
});

