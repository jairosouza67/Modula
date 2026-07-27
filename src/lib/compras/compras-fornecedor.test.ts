import { describe, it, expect } from 'vitest';
import { agregarComprasPorFornecedor } from './compras';
import type { EtapaPedidoCompra } from './types';

describe('RPT-04: Relatório de Compras por Fornecedor', () => {
  it('deve agregar pedidos corretamente por fornecedor e calcular KPIs', () => {
    const pedidos = [
      {
        fornecedor_id: 'forn-1',
        fornecedor_nome: 'Vidros SA',
        area_total_m2: 10.5,
        valor_total: 1050.0,
        previsao_entrega: '2026-06-10',
        data_conclusao: '2026-06-09',
        status: 'concluido' as EtapaPedidoCompra,
      },
      {
        fornecedor_id: 'forn-1',
        fornecedor_nome: 'Vidros SA',
        area_total_m2: 5.0,
        valor_total: 500.0,
        previsao_entrega: '2026-06-15',
        data_conclusao: '2026-06-16', // atrasado
        status: 'concluido' as EtapaPedidoCompra,
      },
      {
        fornecedor_id: 'forn-2',
        fornecedor_nome: 'Acessórios Tech',
        area_total_m2: 0,
        valor_total: 300.0,
        previsao_entrega: '2026-06-20',
        status: 'em_transito' as EtapaPedidoCompra,
      },
    ];

    const relatorio = agregarComprasPorFornecedor(pedidos);

    expect(relatorio).toHaveLength(2);

    // Valida Fornecedor 1
    const forn1 = relatorio.find((r) => r.fornecedor_id === 'forn-1');
    expect(forn1).toBeDefined();
    expect(forn1?.volume_m2).toBe(15.5);
    expect(forn1?.valor_total).toBe(1550.0);
    expect(forn1?.total_pedidos).toBe(2);
    expect(forn1?.entregues_no_prazo).toBe(1);
    expect(forn1?.cumprimento_prazo_pct).toBe(50.0);

    // Valida Fornecedor 2
    const forn2 = relatorio.find((r) => r.fornecedor_id === 'forn-2');
    expect(forn2).toBeDefined();
    expect(forn2?.volume_m2).toBe(0);
    expect(forn2?.valor_total).toBe(300.0);
    expect(forn2?.total_pedidos).toBe(1);
    expect(forn2?.entregues_no_prazo).toBe(0);
    expect(forn2?.cumprimento_prazo_pct).toBe(0);
  });
});
