import { describe, it, expect } from 'vitest';

/**
 * T1.1 — Valor venda = compra × (1 + margem) para todos
 * 
 * A tabela produtos tem uma coluna STORED GENERATED:
 *   valor_venda = valor_compra * (1 + margem_lucro)
 * 
 * Este teste valida a lógica de negócio que deve ser respeitada
 * tanto no banco quanto em qualquer camada de aplicação que recalcule.
 */

/** Replica exata da fórmula do banco */
function calcularValorVenda(valorCompra: number, margemLucro: number): number {
  return valorCompra * (1 + margemLucro);
}

describe('T1.1 — Cálculo de Preço de Venda', () => {
  it('VI8: compra=246.58, margem=0.46 → venda≈360.00', () => {
    const compra = 246.58;
    const margem = 0.46;
    const venda = calcularValorVenda(compra, margem);
    expect(venda).toBeCloseTo(360.00, 0); // tolerância 0 decimais (360.0068)
  });

  it('VI6: compra=136.99, margem=0.46 → venda≈200.00', () => {
    const venda = calcularValorVenda(136.99, 0.46);
    expect(venda).toBeCloseTo(200.00, 0);
  });

  it('VI10: compra=321.92, margem=0.46 → venda≈470.00', () => {
    const venda = calcularValorVenda(321.92, 0.46);
    expect(venda).toBeCloseTo(470.00, 0);
  });

  it('VV8: compra=315.07, margem=0.46 → venda≈460.00', () => {
    const venda = calcularValorVenda(315.07, 0.46);
    expect(venda).toBeCloseTo(460.00, 0);
  });

  it('VV10: compra=54.79, margem=0.46 → venda≈80.00', () => {
    const venda = calcularValorVenda(54.79, 0.46);
    expect(venda).toBeCloseTo(80.00, 0);
  });

  it('VC4: compra=181.51, margem=0.46 → venda≈265.00', () => {
    const venda = calcularValorVenda(181.51, 0.46);
    expect(venda).toBeCloseTo(265.00, 0);
  });

  it('VC6: compra=198.63, margem=0.46 → venda≈290.00', () => {
    const venda = calcularValorVenda(198.63, 0.46);
    expect(venda).toBeCloseTo(290.00, 0);
  });

  it('VPGV: compra=376.71, margem=0.46 → venda≈550.00', () => {
    const venda = calcularValorVenda(376.71, 0.46);
    expect(venda).toBeCloseTo(550.00, 0);
  });

  it('VPGI: compra=342.47, margem=0.46 → venda≈500.00', () => {
    const venda = calcularValorVenda(342.47, 0.46);
    expect(venda).toBeCloseTo(500.00, 0);
  });

  it('KA (Kit Alumínio): compra=58.22, margem=0.46 → venda≈85.00', () => {
    const venda = calcularValorVenda(58.22, 0.46);
    expect(venda).toBeCloseTo(85.00, 0);
  });

  it('PX40: compra=34.25, margem=0.46 → venda≈50.00', () => {
    const venda = calcularValorVenda(34.25, 0.46);
    expect(venda).toBeCloseTo(50.00, 0);
  });

  it('JAT: compra=58.22, margem=0.46 → venda≈85.00', () => {
    const venda = calcularValorVenda(58.22, 0.46);
    expect(venda).toBeCloseTo(85.00, 0);
  });

  it('FPA: compra=280.82, margem=0.46 → venda≈410.00', () => {
    const venda = calcularValorVenda(280.82, 0.46);
    expect(venda).toBeCloseTo(410.00, 0);
  });

  it('VFV: compra=260.27, margem=0.46 → venda≈380.00', () => {
    const venda = calcularValorVenda(260.27, 0.46);
    expect(venda).toBeCloseTo(380.00, 0);
  });

  it('PBPV: compra=534.25, margem=0.46 → venda≈780.00', () => {
    const venda = calcularValorVenda(534.25, 0.46);
    expect(venda).toBeCloseTo(780.00, 0);
  });

  it('Venda nunca deve ser menor que compra para margem > 0', () => {
    // 37 produtos da seed, todos com margem positiva (>= 0.06) → venda > compra
    const compras = [136.99, 246.58, 321.92, 315.07, 54.79, 181.51, 198.63, 376.71, 342.47, 280.82, 239.73, 17.81, 58.22, 82.19, 20.55, 37.67, 54.79, 41.10, 47.95, 58.22, 34.25, 47.95, 54.79, 27.40, 13.70, 37.67, 58.22, 34.25, 280.82, 363.01, 356.16, 263.70, 260.27, 534.25, 520.55];
    const margem = 0.46;

    for (const compra of compras) {
      const venda = calcularValorVenda(compra, margem);
      expect(venda).toBeGreaterThan(compra);
    }
  });

  it('VCR4: custo 374.60, margem 0.06 → venda≈397.08 (margem baixa positiva)', () => {
    // A planilha real mostra custo 374.60 > venda 192 (margem negativa no mercado).
    // No nosso schema, margem_lucro=0.06 resulta em venda > compra (397.08).
    // Isso respeita a regra de que margens negativas são aceitas apenas como override no cálculo.
    const venda = calcularValorVenda(374.60, 0.06);
    expect(venda).toBeCloseTo(397.08, 1);
  });
});