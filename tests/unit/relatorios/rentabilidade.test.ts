import { describe, it, expect } from 'vitest';
import { calcularRentabilidade } from '../../../src/lib/bi/relatorios';

describe('RPT-07: Rentabilidade por OS', () => {
  it('deve calcular a rentabilidade correta', () => {
    // Valor: 1000, CMV: 400, Instalação: 200
    // Margem: 1000 - 400 - 200 = 400
    // %: (400/1000) * 100 = 40%
    const resultado = calcularRentabilidade(1000, 400, 200);
    
    expect(resultado.margemBruta).toBe(400);
    expect(resultado.percentual).toBe(40);
  });

  it('deve lidar com valor zero sem erro', () => {
    const resultado = calcularRentabilidade(0, 400, 200);
    expect(resultado.percentual).toBe(0);
  });
});
