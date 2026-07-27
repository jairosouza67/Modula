import { describe, it, expect } from 'vitest';
import { calcularNPS } from '../../../src/lib/bi/nps';

describe('NMAP-01: NPS Interno', () => {
  it('deve calcular NPS corretamente com mix de notas', () => {
    const notas = [10, 9, 8, 7, 6, 5, 10, 9, 10, 8]; // 10 notas
    // Promotores (9-10): 10, 9, 10, 9, 10 = 5 (50%)
    // Neutros (7-8): 8, 7, 8 = 3 (30%)
    // Detratores (0-6): 6, 5 = 2 (20%)
    // NPS = 50 - 20 = 30
    
    const resultado = calcularNPS(notas);
    expect(resultado.nps).toBe(30);
    expect(resultado.promotores).toBe(5);
    expect(resultado.detratores).toBe(2);
    expect(resultado.totalRespostas).toBe(10);
  });

  it('deve retornar zero para lista vazia', () => {
    const resultado = calcularNPS([]);
    expect(resultado.nps).toBe(0);
  });
});
