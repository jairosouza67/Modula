import { describe, expect, it } from "vitest";
import { montarModeloPdfOrcamento } from "@/lib/sales/pdfOrcamento";

describe("T5.4 — data automática", () => {
  it("preenche data de emissão com a data fornecida", () => {
    const modelo = montarModeloPdfOrcamento(
      {
        numero: "ORC-1001",
        descricao: "Projeto teste",
        status: "Aberto",
        data_validade: null,
        area_total: null,
        valor_total: null,
        itens: [],
        cliente: { nome: "Cliente Teste" },
      },
      [],
      [],
      new Date("2026-05-18T12:00:00.000Z"),
    );

    expect(modelo.dataEmissao).toBe("18/05/2026");
  });
});

