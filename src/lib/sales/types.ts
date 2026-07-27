export type TipoPreco = "M2" | "PC_FX" | "PC_ML";

// ─── Categorias de Kits (servicos_compostos) ─────────────────────────────────

export const CATEGORIAS_KIT = [
  "porta_pivotante",
  "porta_correr",
  "box",
  "janela",
  "espelho",
  "fachada",
  "painel",
] as const;

export type CategoriaKit = (typeof CATEGORIAS_KIT)[number];

export const CATEGORIA_KIT_LABELS: Record<CategoriaKit, string> = {
  porta_pivotante: "Porta Pivotante",
  porta_correr: "Porta de Correr",
  box: "Box de Banheiro",
  janela: "Janela",
  espelho: "Espelho",
  fachada: "Fachada",
  painel: "Painel",
};

export interface OrcamentoItemV2 {
  codigoServico: string;
  largura: number; // metros
  altura: number; // metros
  quantidade: number;
  adicional: number;
}

export interface ServicoComponenteDef {
  codigoProduto: string;
  quantidade: number;
  tipoPreco: TipoPreco;
}

export interface ServicoDef {
  codigo: string;
  nome: string;
  categoria: string;
  componentes: ServicoComponenteDef[];
}

export interface ServicoResolvido {
  codigo: string;
  nome: string;
  vlM2: number;
  pcFx: number;
  pcMl: number;
  custoM2: number;
  pcFxCusto: number;
  pcMlCusto: number;
}

export interface CalculoResultado {
  codigoServico: string;
  largura: number;
  altura: number;
  quantidade: number;
  m2: number;
  vlM2: number;
  pcFx: number;
  pcMl: number;
  adicional: number;
  valorTotal: number;
  precoUnitario: number;
}

/**
 * Componente individual de um kit de serviço, com flag de inclusão
 * controlada pelo usuário no modal de orçamento.
 */
export interface OrcamentoComponente extends ServicoComponenteDef {
  descricao: string;
  incluido: boolean; // toggle do usuário (padrão: true)
}

/**
 * Item unificado de orçamento — suporta tanto serviços compostos (kits)
 * quanto produtos avulsos. Salvo no JSONB de orcamentos.itens.
 *
 * Para serviços compostos: codigoServico preenchido, componentes expandidos.
 * Para produtos avulsos (legado): codigoServico pode ser o próprio código do produto.
 */
export interface OrcamentoItemUnificado {
  codigoServico: string;
  nomeServico: string;
  largura: number; // metros
  altura: number; // metros
  quantidade: number;
  adicional: number;
  componentes: OrcamentoComponente[];
}
