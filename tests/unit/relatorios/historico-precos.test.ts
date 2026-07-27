import { describe, it, expect } from 'vitest';
import { calcularEvolucaoPrecos } from '../../../src/lib/bi/relatorios';

describe('RPT-05: Historico de Preços', () => {
  it('deve calcular a variação de preços corretamente', () => {
    const compras = [
      { data: '2026-01-01', precoUnitario: 100 },
      { data: '2026-02-01', precoUnitario: 110 }, // +10%
      { data: '2026-03-01', precoUnitario: 99 }    // -10%
    ];

    const resultado = calcularEvolucaoPrecos(compras);
    
    expect(resultado[0].variacao).toBe(0);
    expect(resultado[1].variacao).toBe(10);
    expect(resultado[2].variacao).toBe(-10);
  });
});
