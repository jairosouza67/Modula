export type CategoriaEstoque = "Chapas" | "Ferragens" | "Perfis" | "Consumíveis" | "Outros";
export type TipoMovimentacao = "Entrada" | "Saída" | "Devolução" | "Ajuste";

export interface EstoqueItem {
  id: string;
  codigo: string;
  descricao: string;
  categoria: CategoriaEstoque;
  unidade: string;
  quantidade: number;
  estoqueMinimo: number;
  custoUnitario: number; // em reais
  estoqueMaximo?: number; // Para cálculo de reposição
  osId?: string; // vinculo com OS
}

export interface MovimentacaoEstoque {
  id: string;
  itemId: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  osReferencia?: string;
  observacao?: string;
  createdAt: string;
}

// ─── Status ─────────────────────────────────────────────────────────────────

export type StatusEstoque = "OK" | "Atenção" | "Crítico";

export function calcularStatusEstoque(qtd: number, minimo: number): StatusEstoque {
  if (qtd <= 0) return "Crítico";
  if (qtd <= minimo) return qtd < minimo ? "Crítico" : "Atenção";
  if (qtd <= minimo * 1.3) return "Atenção";
  return "OK";
}

// ─── KPIs ────────────────────────────────────────────────────────────────

export interface EstoqueKpis {
  totalItens: number;
  valorTotal: number;
  itensCriticos: number;
  itensAtencao: number;
  custoMedio: number;
}

export function calcularKpisEstoque(itens: EstoqueItem[]): EstoqueKpis {
  const totalItens = itens.length;
  const valorTotal = itens.reduce((sum, i) => sum + i.quantidade * i.custoUnitario, 0);
  const itensCriticos = itens.filter((i) => calcularStatusEstoque(i.quantidade, i.estoqueMinimo) === "Crítico").length;
  const itensAtencao = itens.filter((i) => calcularStatusEstoque(i.quantidade, i.estoqueMinimo) === "Atenção").length;
  const custoMedio = totalItens > 0 ? valorTotal / totalItens : 0;

  return { totalItens, valorTotal, itensCriticos, itensAtencao, custoMedio };
}

// ─── Filtros ─────────────────────────────────────────────────────────────

export interface EstoqueFiltros {
  busca?: string;
  categoria?: CategoriaEstoque | "Todas";
  apenasCriticos?: boolean;
}

export function filtrarEstoque(itens: EstoqueItem[], filtros: EstoqueFiltros): EstoqueItem[] {
  let result = [...itens];

  if (filtros.busca) {
    const q = filtros.busca.toLowerCase();
    result = result.filter(
      (i) =>
        i.codigo.toLowerCase().includes(q) ||
        i.descricao.toLowerCase().includes(q) ||
        i.categoria.toLowerCase().includes(q)
    );
  }

  if (filtros.categoria && filtros.categoria !== "Todas") {
    result = result.filter((i) => i.categoria === filtros.categoria);
  }

  if (filtros.apenasCriticos) {
    result = result.filter((i) => calcularStatusEstoque(i.quantidade, i.estoqueMinimo) !== "OK");
  }

  return result;
}

// ─── Movimentação ────────────────────────────────────────────────────────

export function aplicarMovimentacao(
  item: EstoqueItem,
  mov: Omit<MovimentacaoEstoque, "id" | "itemId" | "createdAt">
): { novoItem: EstoqueItem; erro?: string } {
  if (mov.tipo === "Saída" && mov.quantidade > item.quantidade) {
    return { novoItem: item, erro: `Estoque insuficiente. Disponível: ${item.quantidade} ${item.unidade}.` };
  }

  const novaQuantidade = mov.tipo === "Ajuste" 
    ? mov.quantidade 
    : mov.tipo === "Entrada" || mov.tipo === "Devolução"
      ? item.quantidade + mov.quantidade
      : item.quantidade - mov.quantidade;

  return {
    novoItem: {
      ...item,
      quantidade: Math.max(0, novaQuantidade),
    },
  };
}

// ─── Valor formatado ─────────────────────────────────────────────────────

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Ponto de Pedido (Sprint 10) ─────────────────────────────────────────

export interface SugestaoCompra {
  itemId: string;
  codigo: string;
  descricao: string;
  quantidadeAtual: number;
  estoqueMinimo: number;
  estoqueMaximo: number;
  quantidadeReposicao: number;
  ignorada: boolean;
}

export function gerarSugestoesCompra(itens: EstoqueItem[]): SugestaoCompra[] {
  return itens
    .filter((i) => i.quantidade < i.estoqueMinimo)
    .map((i) => {
      // Se não tiver estoque máximo definido, sugere o dobro do mínimo como default
      const maximo = i.estoqueMaximo && i.estoqueMaximo > i.estoqueMinimo ? i.estoqueMaximo : i.estoqueMinimo * 2;
      return {
        itemId: i.id,
        codigo: i.codigo,
        descricao: i.descricao,
        quantidadeAtual: i.quantidade,
        estoqueMinimo: i.estoqueMinimo,
        estoqueMaximo: maximo,
        quantidadeReposicao: maximo - i.quantidade,
        ignorada: false,
      };
    });
}

export interface PedidoCompraEstoque {
  id: string;
  itens: Array<{ itemId: string; quantidade: number }>;
  dataCriacao: string;
}

export function gerarPedidoDeSugestoes(sugestoes: SugestaoCompra[]): PedidoCompraEstoque | null {
  const sugestoesValidas = sugestoes.filter((s) => !s.ignorada && s.quantidadeReposicao > 0);
  
  if (sugestoesValidas.length === 0) return null;

  return {
    id: `PC-${Date.now()}`,
    itens: sugestoesValidas.map((s) => ({
      itemId: s.itemId,
      quantidade: s.quantidadeReposicao,
    })),
    dataCriacao: new Date().toISOString(),
  };
}
