import type { TipoVidroSupabase, ProcessamentoSupabase } from "@/hooks/useProdutosOrcamento";

/**
 * Item de orçamento — agora referencia produtos por código (Supabase)
 * ao invés de índice fixo (mock antigo).
 */
export interface OrcamentoItem {
  produtoCodigo: string;       // código do produto no Supabase (ex: "VI8")
  largura: number;             // em mm
  altura: number;              // em mm
  quantidade: number;
  processamentoCodigo: string; // código do processamento ("LAP", "JAT", "" = nenhum)
}

/** Resultado do cálculo de um item. */
export interface CalculoItem {
  area: number;       // em m²
  precoBase: number;
  procTotal: number;
  total: number;
}

/**
 * Formato legado (tipoIdx / procIdx) — para compatibilidade com
 * orçamentos salvos antes desta migração.
 */
export interface OrcamentoItemLegacy {
  tipoIdx: number;
  largura: number;
  altura: number;
  quantidade: number;
  procIdx: number;
}

export const calcularArea = (largura: number, altura: number, quantidade: number): number => {
  return (largura * altura * quantidade) / 1_000_000;
};

export const calcularItem = (
  item: OrcamentoItem,
  precoBase: number,
  custoProc: number
): CalculoItem => {
  const area = calcularArea(item.largura, item.altura, item.quantidade);
  const procTotal = custoProc * item.quantidade;
  const total = area * precoBase + procTotal;

  return {
    area,
    precoBase,
    procTotal,
    total,
  };
};

/**
 * Calcula um item a partir de listas de produtos e processamentos do Supabase.
 */
export const calcularItemComDados = (
  item: OrcamentoItem,
  tiposVidro: TipoVidroSupabase[],
  processamentos: ProcessamentoSupabase[]
): CalculoItem => {
  const produto = tiposVidro.find((t) => t.codigo === item.produtoCodigo);
  const proc = processamentos.find((p) => p.codigo === item.processamentoCodigo);
  return calcularItem(item, produto?.preco ?? 0, proc?.custo ?? 0);
};

export const calcularTotalOrcamento = (itensCalculados: CalculoItem[]): number => {
  return itensCalculados.reduce((acc, item) => acc + item.total, 0);
};

export const calcularAreaTotal = (itensCalculados: CalculoItem[]): number => {
  return itensCalculados.reduce((acc, item) => acc + item.area, 0);
};

/**
 * Detecta se um item salvo está no formato legado (índices).
 */
export function isLegacyItem(item: unknown): item is OrcamentoItemLegacy {
  if (!item || typeof item !== "object") return false;
  const candidate = item as Partial<OrcamentoItemLegacy>;
  return (
    typeof candidate.tipoIdx === "number" &&
    typeof candidate.largura === "number" &&
    typeof candidate.altura === "number" &&
    typeof candidate.quantidade === "number" &&
    typeof candidate.procIdx === "number"
  );
}

/**
 * Detecta se um item salvo está no formato novo (códigos).
 */
export function isNewFormatItem(item: unknown): item is OrcamentoItem {
  if (!item || typeof item !== "object") return false;
  const candidate = item as Partial<OrcamentoItem>;
  return (
    typeof candidate.produtoCodigo === "string" &&
    typeof candidate.largura === "number" &&
    typeof candidate.altura === "number" &&
    typeof candidate.quantidade === "number" &&
    typeof candidate.processamentoCodigo === "string"
  );
}
