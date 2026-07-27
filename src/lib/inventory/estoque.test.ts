import { describe, it, expect } from "vitest";
import {
  calcularStatusEstoque,
  calcularKpisEstoque,
  filtrarEstoque,
  aplicarMovimentacao,
  type EstoqueItem,
} from "./estoque";

// ─── Fixtures ────────────────────────────────────────────────────────────

const mockItens: EstoqueItem[] = [
  { id: "1", codigo: "TMP-10", descricao: "Chapa temperado 10mm", categoria: "Chapas", unidade: "pç", quantidade: 2, estoqueMinimo: 5, custoUnitario: 1890 },
  { id: "2", codigo: "TMP-08", descricao: "Chapa temperado 8mm", categoria: "Chapas", unidade: "pç", quantidade: 9, estoqueMinimo: 5, custoUnitario: 1420 },
  { id: "3", codigo: "LAM-88", descricao: "Chapa laminado 8+8mm", categoria: "Chapas", unidade: "pç", quantidade: 4, estoqueMinimo: 4, custoUnitario: 2180 },
  { id: "4", codigo: "FER-BX1", descricao: "Kit ferragem box", categoria: "Ferragens", unidade: "kit", quantidade: 8, estoqueMinimo: 4, custoUnitario: 240 },
];

// ─── Status ──────────────────────────────────────────────────────────────

describe("calcularStatusEstoque", () => {
  it("retorna Crítico quando quantidade <= 0", () => {
    expect(calcularStatusEstoque(0, 5)).toBe("Crítico");
  });

  it("retorna Crítico quando quantidade < mínimo", () => {
    expect(calcularStatusEstoque(2, 5)).toBe("Crítico");
  });

  it("retorna Atenção quando quantidade === mínimo", () => {
    expect(calcularStatusEstoque(4, 4)).toBe("Atenção");
  });

  it("retorna Atenção quando quantidade <= mínimo * 1.3", () => {
    expect(calcularStatusEstoque(6, 5)).toBe("Atenção");
  });

  it("retorna OK quando quantidade está acima do mínimo", () => {
    expect(calcularStatusEstoque(9, 5)).toBe("OK");
  });
});

// ─── KPIs ────────────────────────────────────────────────────────────────

describe("calcularKpisEstoque", () => {
  it("calcula valor total correto", () => {
    const kpis = calcularKpisEstoque(mockItens);
    // 2*1890 + 9*1420 + 4*2180 + 8*240 = 3780 + 12780 + 8720 + 1920 = 27200
    expect(kpis.valorTotal).toBe(27200);
  });

  it("conta itens críticos corretamente", () => {
    const kpis = calcularKpisEstoque(mockItens);
    expect(kpis.itensCriticos).toBe(1); // TMP-10 com qtd=2 < min=5
  });

  it("conta total de itens", () => {
    const kpis = calcularKpisEstoque(mockItens);
    expect(kpis.totalItens).toBe(4);
  });

  it("retorna 0 para lista vazia", () => {
    const kpis = calcularKpisEstoque([]);
    expect(kpis.totalItens).toBe(0);
    expect(kpis.valorTotal).toBe(0);
    expect(kpis.custoMedio).toBe(0);
  });
});

// ─── Filtros ─────────────────────────────────────────────────────────────

describe("filtrarEstoque", () => {
  it("filtra por busca no código", () => {
    const result = filtrarEstoque(mockItens, { busca: "TMP-10" });
    expect(result).toHaveLength(1);
    expect(result[0].codigo).toBe("TMP-10");
  });

  it("filtra por busca na descrição", () => {
    const result = filtrarEstoque(mockItens, { busca: "laminado" });
    expect(result).toHaveLength(1);
    expect(result[0].codigo).toBe("LAM-88");
  });

  it("filtra por categoria", () => {
    const result = filtrarEstoque(mockItens, { categoria: "Ferragens" });
    expect(result).toHaveLength(1);
    expect(result[0].codigo).toBe("FER-BX1");
  });

  it("filtra apenas críticos", () => {
    const result = filtrarEstoque(mockItens, { apenasCriticos: true });
    // TMP-10 crítico, LAM-88 atenção
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((i) => i.codigo === "TMP-10")).toBe(true);
  });

  it("retorna todos quando sem filtros", () => {
    const result = filtrarEstoque(mockItens, {});
    expect(result).toHaveLength(4);
  });
});

// ─── Movimentações ───────────────────────────────────────────────────────

describe("aplicarMovimentacao", () => {
  const item = mockItens[1]; // TMP-08, qtd=9

  it("entrada aumenta quantidade", () => {
    const { novoItem } = aplicarMovimentacao(item, { tipo: "Entrada", quantidade: 3 });
    expect(novoItem.quantidade).toBe(12);
  });

  it("saída reduz quantidade", () => {
    const { novoItem } = aplicarMovimentacao(item, { tipo: "Saída", quantidade: 4 });
    expect(novoItem.quantidade).toBe(5);
  });

  it("devolução aumenta quantidade", () => {
    const { novoItem } = aplicarMovimentacao(item, { tipo: "Devolução", quantidade: 2 });
    expect(novoItem.quantidade).toBe(11);
  });

  it("saída inválida retorna erro", () => {
    const { novoItem, erro } = aplicarMovimentacao(item, { tipo: "Saída", quantidade: 99 });
    expect(erro).toBeDefined();
    expect(novoItem.quantidade).toBe(9); // não muda
  });

  it("saída com referência de OS funciona", () => {
    const { novoItem, erro } = aplicarMovimentacao(item, {
      tipo: "Saída",
      quantidade: 2,
      osReferencia: "#0348",
    });
    expect(erro).toBeUndefined();
    expect(novoItem.quantidade).toBe(7);
  });
});

// ─── Ponto de Pedido (Sprint 10) ─────────────────────────────────────────

import { gerarSugestoesCompra, gerarPedidoDeSugestoes } from "./estoque";

describe("Sprint 10: Ponto de Pedido e Sugestões", () => {
  const itens: EstoqueItem[] = [
    { id: "1", codigo: "IT-01", descricao: "Item 1", categoria: "Consumíveis", unidade: "pç", quantidade: 2, estoqueMinimo: 5, estoqueMaximo: 15, custoUnitario: 10 },
    { id: "2", codigo: "IT-02", descricao: "Item 2", categoria: "Consumíveis", unidade: "pç", quantidade: 10, estoqueMinimo: 5, custoUnitario: 10 },
    { id: "3", codigo: "IT-03", descricao: "Item 3", categoria: "Consumíveis", unidade: "pç", quantidade: 3, estoqueMinimo: 10, custoUnitario: 10 },
  ];

  it("EST-01: identifica ponto de pedido corretamente", () => {
    const sugestoes = gerarSugestoesCompra(itens);
    
    // Devem aparecer Item 1 (qtd 2 < min 5) e Item 3 (qtd 3 < min 10)
    expect(sugestoes).toHaveLength(2);
    
    const sug1 = sugestoes.find(s => s.itemId === "1")!;
    expect(sug1.quantidadeAtual).toBe(2);
    expect(sug1.estoqueMaximo).toBe(15);
    expect(sug1.quantidadeReposicao).toBe(13); // 15 - 2
    
    const sug3 = sugestoes.find(s => s.itemId === "3")!;
    expect(sug3.estoqueMaximo).toBe(20); // Dobro do mínimo (10 * 2) já que não tem máximo definido
    expect(sug3.quantidadeReposicao).toBe(17); // 20 - 3
  });

  it("EST-02: sugestão ignorada sem gerar pedido", () => {
    const sugestoes = gerarSugestoesCompra(itens);
    sugestoes[0].ignorada = true; // Ignora Item 1
    
    const pedido = gerarPedidoDeSugestoes(sugestoes);
    expect(pedido).not.toBeNull();
    expect(pedido!.itens).toHaveLength(1);
    expect(pedido!.itens[0].itemId).toBe("3"); // Apenas o Item 3 virou pedido
  });

  it("EST-03: múltiplas sugestões geradas em lote", () => {
    const sugestoes = gerarSugestoesCompra(itens);
    const pedido = gerarPedidoDeSugestoes(sugestoes);
    
    expect(pedido).not.toBeNull();
    expect(pedido!.id).toContain("PC-");
    expect(pedido!.itens).toHaveLength(2);
    expect(pedido!.itens.find(i => i.itemId === "1")?.quantidade).toBe(13);
    expect(pedido!.itens.find(i => i.itemId === "3")?.quantidade).toBe(17);
  });
});

