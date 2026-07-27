import { describe, it, expect } from 'vitest';
import { 
  calcularComissaoVendedor, 
  calcularComissaoTecnico, 
  calcularBonusMeta 
} from '../../../src/lib/bi/comissoes';

describe('COM-01 a COM-03: Comissoes e Metas', () => {
  it('deve calcular comissao do vendedor corretamente (COM-01)', () => {
    const resultado = calcularComissaoVendedor(10000, 5); // 5% de 10.000
    expect(resultado.valorComissao).toBe(500);
    expect(resultado.baseCalculo).toBe(10000);
  });

  it('deve calcular comissao do tecnico com adicional fixo (COM-02)', () => {
    const resultado = calcularComissaoTecnico(5000, 2, 50); // 2% de 5000 + 50 fixo
    expect(resultado.valorComissao).toBe(150); // 100 + 50
  });

  it('deve calcular bonus de meta sobre o excedente (COM-03)', () => {
    const bonus = calcularBonusMeta(120000, 100000, 10); // Meta 100k, vendeu 120k, 10% sobre 20k
    expect(bonus).toBe(2000);
  });

  it('não deve dar bonus se a meta não foi atingida', () => {
    const bonus = calcularBonusMeta(80000, 100000, 10);
    expect(bonus).toBe(0);
  });
});
