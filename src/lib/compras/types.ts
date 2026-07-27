// ─────────────────────────────────────────────────────────────
// Vidraçaria Ornamental — Módulo Compras — Tipos (Fase 2.5)
// ─────────────────────────────────────────────────────────────

export type EtapaPedidoCompra =
  | 'rascunho'
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'enviado'
  | 'recebido_parcial'
  | 'recebido_total'
  | 'cancelado';

export const ETAPAS_PEDIDO: EtapaPedidoCompra[] = [
  'rascunho',
  'aguardando_aprovacao',
  'aprovado',
  'enviado',
  'recebido_parcial',
  'recebido_total',
  'cancelado'
];

export const ETAPA_LABELS: Record<EtapaPedidoCompra, string> = {
  rascunho: 'Rascunho',
  aguardando_aprovacao: 'Aguardando Aprovação',
  aprovado: 'Aprovado',
  enviado: 'Enviado ao Fornecedor',
  recebido_parcial: 'Recebido (Parcial)',
  recebido_total: 'Recebido (Total)',
  cancelado: 'Cancelado'
};

export type StatusLiberacao = 'pendente' | 'liberado' | 'reprovado' | 'revisao';
export type SituacaoRomaneioItem = 'ok' | 'faltante' | 'quebrado' | 'fora_especificacao';
export type StatusRomaneio = 'pendente' | 'em_conferencia' | 'concluido' | 'divergencia';
export type StatusSPED = 'pendente' | 'lancada';
export type TipoCredito = 'devolucao' | 'bonificacao' | 'desconto_futuro' | 'nota_credito';
export type StatusCredito =
  | 'disponivel'
  | 'parcialmente_utilizado'
  | 'utilizado'
  | 'vencido';

// ─── Pedido de Compra ───────────────────────────────────────

export interface ItemPedidoCompra {
  id: string;
  pedido_id: string;
  produto: string;
  projeto_vinculado?: string;
  os_vinculada?: string;
  largura_mm: number;
  altura_mm: number;
  quantidade: number;
  m2_calculado: number;
  preco_m2: number;
  total: number;
}

export interface EtapaPedido {
  id: string;
  pedido_id: string;
  etapa: EtapaPedidoCompra;
  data_hora: string;
  usuario: string;
  observacao?: string;
}

export interface PedidoCompra {
  id: string;
  numero: string; // PC-0001
  empresa_id: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  condicao_pagamento_id?: string;
  forma_pagamento_id?: string;
  previsao_entrega: string;
  observacoes?: string;
  status: EtapaPedidoCompra;
  status_liberacao: StatusLiberacao;
  limite_liberacao: number;
  valor_total: number;
  area_total_m2: number;
  qtd_total_pecas: number;
  itens: ItemPedidoCompra[];
  etapas: EtapaPedido[];
  criado_em: string;
  atualizado_em: string;
  anexos?: string[];
}

// ─── Romaneio ───────────────────────────────────────────────

export interface ItemRomaneio {
  id: string;
  romaneio_id: string;
  produto: string;
  espessura_mm: number;
  largura_mm: number;
  altura_mm: number;
  qtd_encomendada: number;
  qtd_recebida: number;
  m2: number;
  peso_kg?: number;
  situacao: SituacaoRomaneioItem;
}

export interface Romaneio {
  id: string;
  pedido_compra_id: string;
  numero_nfe?: string;
  numero_oe?: string;
  data_emissao: string;
  data_recebimento?: string;
  status: StatusRomaneio;
  itens: ItemRomaneio[];
  criado_em: string;
}

// ─── NFe de Entrada ─────────────────────────────────────────

export interface NFeEntrada {
  id: string;
  empresa_id: string;
  numero: string;
  serie: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  chave_acesso: string;
  data_emissao: string;
  valor_total: number;
  pedido_compra_id?: string;
  status_sped: StatusSPED;
  xml_url?: string;
  dados_xml?: NFeXMLDados;
  criado_em: string;
}

export interface NFeXMLDados {
  numero: string;
  serie: string;
  chave_acesso: string;
  fornecedor_cnpj: string;
  fornecedor_nome: string;
  data_emissao: string;
  valor_total: number;
  itens: NFeXMLItem[];
}

export interface NFeXMLItem {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

// ─── Condições e Formas de Pagamento ───────────────────────

export interface CondicaoPagamento {
  id: string;
  codigo: string;
  descricao: string;
  prazos_dias: number[]; // ex: [30, 60, 90]
  desconto_pct: number;
  acrescimo_pct: number;
  aplicacao: 'venda' | 'compra' | 'ambos';
  ativo: boolean;
}

export interface FormaPagamento {
  id: string;
  codigo: string;
  descricao: string;
  aplicacao: 'venda' | 'compra' | 'ambos';
  ativo: boolean;
}

export interface ParcelaPagamento {
  numero: number;
  data_vencimento: string;
  valor: number;
}

// ─── Créditos de Fornecedores ────────────────────────────────

export interface CreditoFornecedor {
  id: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  tipo?: TipoCredito;
  numero?: string;
  nfe_referencia?: string;
  valor_original: number;
  valor_disponivel: number;
  data_emissao: string;
  data_vencimento: string;
  descricao?: string;
  status: StatusCredito;
  historico_uso: CreditoUso[];
}

export interface CreditoUso {
  id: string;
  credito_id: string;
  pedido_compra_id: string;
  pedido_numero: string;
  valor_utilizado: number;
  data_uso: string;
}

// ─── Fornecedor Avançado ─────────────────────────────────────

export interface RepresentanteComercial {
  id: string;
  fornecedor_id: string;
  nome: string;
  telefone: string;
  email: string;
  regiao?: string;
  observacoes?: string;
}

export interface TabelaPrecoFornecedor {
  id: string;
  fornecedor_id: string;
  produto: string;
  unidade: string;
  preco: number;
  vigencia_inicio: string;
  vigencia_fim: string;
}

export interface ComparativoPreco {
  produto: string;
  fornecedores: {
    fornecedor_id: string;
    fornecedor_nome: string;
    preco: number;
    vigencia_fim: string;
  }[];
}

// ─── KPIs ────────────────────────────────────────────────────

export interface KPIsCompras {
  pedidos_abertos: number;
  pedidos_aguardando_liberacao: number;
  pedidos_em_transporte: number;
  valor_total_mes: number;
  area_total_mes_m2: number;
  cumprimento_prazo_pct: number;
  creditos_disponiveis: number;
  nfe_pendentes_sped: number;
}
