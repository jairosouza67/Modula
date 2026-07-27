import { Database } from '../supabase/types';

export type CategoriaFinanceira = Database['public']['Tables']['categorias_financeiras']['Row'];
export type ContaBancaria = Database['public']['Tables']['contas_bancarias']['Row'];
export type Lancamento = Database['public']['Tables']['lancamentos']['Row'];
export type ContaPagarReceber = Database['public']['Tables']['contas_pagar_receber']['Row'];

export type TipoCategoria = 'RECEITA' | 'DESPESA' | 'CUSTO';
export type TipoConta = 'BANCO' | 'CAIXA' | 'APLICAÇÃO';
export type TipoLancamento = 'ENTRADA' | 'SAIDA';
export type StatusTitulo = 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'ATRASADO';

export interface FinanceiroSummary {
  saldoTotal: number;
  contasPagarHoje: number;
  contasReceberHoje: number;
  fluxoMensal: {
    mes: string;
    entradas: number;
    saidas: number;
  }[];
}

export interface LancamentoInsert {
  empresa_id: string;
  conta_id: string;
  categoria_id: string;
  data_pagamento: string;
  valor: number;
  tipo: TipoLancamento;
  descricao: string;
  documento_ref?: string;
  conciliado?: boolean;
}

export interface TituloInsert {
  empresa_id: string;
  cliente_id?: string;
  fornecedor_id?: string;
  categoria_id: string;
  data_vencimento: string;
  data_competencia: string;
  valor_previsto: number;
  status: StatusTitulo;
  observacoes?: string;
}
