import { describe, it, expect } from 'vitest';
import { agregarCreditosFornecedores } from './compras';
import type { CreditoFornecedor } from './types';

describe('RPT-06: Relatório de Créditos de Fornecedores', () => {
  it('deve agregar os créditos disponíveis, utilizados e vencidos por fornecedor', () => {
    const creditos: CreditoFornecedor[] = [
      {
        id: 'c1',
        fornecedor_id: 'forn-1',
        fornecedor_nome: 'Vidros SA',
        nfe_referencia: '1234',
        data_emissao: '2026-05-01',
        data_vencimento: '2026-12-31',
        valor_original: 500.0,
        valor_disponivel: 500.0,
        status: 'disponivel',
        historico_uso: [],
      },
      {
        id: 'c2',
        fornecedor_id: 'forn-1',
        fornecedor_nome: 'Vidros SA',
        nfe_referencia: '1235',
        data_emissao: '2026-01-01',
        data_vencimento: '2026-06-01',
        valor_original: 300.0,
        valor_disponivel: 100.0,
        status: 'parcialmente_utilizado',
        historico_uso: [],
      },
      {
        id: 'c3',
        fornecedor_id: 'forn-1',
        fornecedor_nome: 'Vidros SA',
        nfe_referencia: '1236',
        data_emissao: '2025-01-01',
        data_vencimento: '2025-12-31',
        valor_original: 200.0,
        valor_disponivel: 200.0,
        status: 'vencido',
        historico_uso: [],
      },
      {
        id: 'c4',
        fornecedor_id: 'forn-2',
        fornecedor_nome: 'Acessórios Tech',
        nfe_referencia: '5678',
        data_emissao: '2026-02-01',
        data_vencimento: '2026-08-01',
        valor_original: 1000.0,
        valor_disponivel: 0,
        status: 'utilizado',
        historico_uso: [],
      },
    ];

    const relatorio = agregarCreditosFornecedores(creditos);

    expect(relatorio).toHaveLength(2);

    const forn1 = relatorio.find((r) => r.fornecedor_id === 'forn-1');
    expect(forn1).toBeDefined();
    // disponiveis = 500 + 100
    expect(forn1?.total_disponivel).toBe(600.0);
    // utilizados = 0 (nenhum status 'utilizado' completo)
    expect(forn1?.total_utilizado).toBe(0.0);
    // vencido = c3 (valor original 200)
    expect(forn1?.total_vencido).toBe(200.0);

    const forn2 = relatorio.find((r) => r.fornecedor_id === 'forn-2');
    expect(forn2).toBeDefined();
    expect(forn2?.total_disponivel).toBe(0.0);
    // utilizados = c4 (valor original 1000)
    expect(forn2?.total_utilizado).toBe(1000.0);
    expect(forn2?.total_vencido).toBe(0.0);
  });
});
