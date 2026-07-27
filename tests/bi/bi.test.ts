import { describe, it, expect } from 'vitest';
import { calcularRentabilidade, gerarRankingClientes, calcularKPIsVendas } from '../../src/lib/bi/relatorios';

describe('Módulo de BI e Relatórios (RPT-01, RPT-04, RPT-06)', () => {
  
  describe('Cálculo de Rentabilidade (RPT-04)', () => {
    it('deve calcular margem positiva corretamente', () => {
      const res = calcularRentabilidade(1000, 400, 100);
      expect(res.margemBruta).toBe(500);
      expect(res.percentual).toBe(50);
    });

    it('deve retornar margem negativa se custo exceder valor', () => {
      const res = calcularRentabilidade(1000, 800, 300);
      expect(res.margemBruta).toBe(-100);
      expect(res.percentual).toBe(-10);
    });
  });

  describe('Ranking de Clientes (RPT-06)', () => {
    it('deve ordenar clientes por valor total decrescente', () => {
      const vendas = [
        { clienteId: 'C1', clienteNome: 'Empresa A', valor: 500 },
        { clienteId: 'C2', clienteNome: 'Empresa B', valor: 1500 },
        { clienteId: 'C1', clienteNome: 'Empresa A', valor: 200 }
      ];
      
      const ranking = gerarRankingClientes(vendas);
      expect(ranking[0].id).toBe('C2');
      expect(ranking[0].valorTotal).toBe(1500);
      expect(ranking[1].id).toBe('C1');
      expect(ranking[1].valorTotal).toBe(700);
    });
  });

  describe('KPIs de Vendas (RPT-01)', () => {
    it('deve calcular totais e ticket médio corretamente', () => {
      const vendas = [
        { valor: 100, data: '2026-01-01' },
        { valor: 200, data: '2026-01-02' }
      ];
      
      const kpis = calcularKPIsVendas(vendas);
      expect(kpis.totalBruto).toBe(300);
      expect(kpis.quantidade).toBe(2);
      expect(kpis.ticketMedio).toBe(150);
    });
  });
});
