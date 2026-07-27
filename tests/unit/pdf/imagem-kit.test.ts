import { describe, expect, it } from "vitest";
import { montarModeloPdfOrcamento, renderHtmlOrcamentoProfissional } from "@/lib/sales/pdfOrcamento";

describe("T5.3 — imagem do kit ocupa espaço no PDF", () => {
  it("aumenta a célula da imagem e usa rowspan quando há componentes", () => {
    const modelo = montarModeloPdfOrcamento({
      numero: "ORC-1002",
      descricao: "Projeto teste",
      status: "Aberto",
      data_validade: "2026-05-30T00:00:00.000Z",
      area_total: 1,
      valor_total: 100,
      itens: [{
        codigoServico: "PCI2",
        nomeServico: "Porta Correr 2 Folhas",
        largura: 1.8,
        altura: 2.1,
        quantidade: 1,
        componentes: [
          { descricao: "Vidro Incolor 8mm", quantidade: 1, incluido: true },
          { descricao: "Kit Alumínio", quantidade: 1, incluido: true },
        ],
      }],
      cliente: { nome: "Cliente Teste" },
    });

    const html = renderHtmlOrcamentoProfissional(modelo, "", {
      "/images/pci2_pcv2_pci4_pcv4_-_porta_de_correr_interna.png": "data:image/png;base64,iVBORw0KGgo=",
    });

    expect(html).toContain("class=\"center img-col\" rowspan=\"3\"");
    expect(html).toContain("class=\"kit-img\"");
    expect(html).not.toMatch(/<tr class="componente-row">\s*<td><\/td>/);
  });

  it("mantém célula vazia na primeira coluna quando não há imagem", () => {
    const modelo = montarModeloPdfOrcamento({
      numero: "ORC-1003",
      descricao: "Projeto teste",
      status: "Aberto",
      data_validade: "2026-05-30T00:00:00.000Z",
      area_total: 1,
      valor_total: 100,
      itens: [{
        codigoServico: "PCI2",
        nomeServico: "Porta Correr 2 Folhas",
        largura: 1.8,
        altura: 2.1,
        quantidade: 1,
        componentes: [
          { descricao: "Vidro Incolor 8mm", quantidade: 1, incluido: true },
        ],
      }],
      cliente: { nome: "Cliente Teste" },
    });

    const html = renderHtmlOrcamentoProfissional(modelo);

    expect(html).toMatch(/<tr class="componente-row">\s*<td><\/td>\s*<td colspan="2">↳ Vidro Incolor 8mm<\/td>/);
    expect(html).not.toContain("rowspan");
  });
});
