import { describe, it, expect } from 'vitest';
import { historicoPrecosCompra } from './compras';

describe('RPT-05: Histórico de Preços de Compra', () => {
  it('deve calcular a variação de preço por produto e fornecedor', () => {
    const itens = [
      {
        produto: 'Vidro Temperado Incolor 8mm',
        fornecedor_id: 'forn-1',
        fornecedor_nome: 'Vidros SA',
        preco_m2: 100.0,
        data: '2025-01-10',
      },
      {
        produto: 'Vidro Temperado Incolor 8mm',
        fornecedor_id: 'forn-1',
        fornecedor_nome: 'Vidros SA',
        preco_m2: 110.0, // aumento de 10%
        data: '2025-06-15',
      },
      {
        produto: 'Vidro Temperado Incolor 8mm',
        fornecedor_id: 'forn-1',
        fornecedor_nome: 'Vidros SA',
        preco_m2: 115.0, // aumento total de 15% em relação ao inicial
        data: '2026-01-20',
      },
      {
        produto: 'Mola Hidráulica',
        fornecedor_id: 'forn-2',
        fornecedor_nome: 'Acessórios Tech',
        preco_m2: 85.0,
        data: '2026-02-01',
      },
    ];

    const historico = historicoPrecosCompra(itens);

    expect(historico).toHaveLength(2);

    const vidro = historico.find((h) => h.produto === 'Vidro Temperado Incolor 8mm');
    expect(vidro).toBeDefined();
    expect(vidro?.historico).toHaveLength(3);
    expect(vidro?.variacao_pct).toBe(15.0);

    const mola = historico.find((h) => h.produto === 'Mola Hidráulica');
    expect(mola).toBeDefined();
    expect(mola?.historico).toHaveLength(1);
    expect(mola?.variacao_pct).toBe(0.0); // apenas um preço, sem variação
  });
});
