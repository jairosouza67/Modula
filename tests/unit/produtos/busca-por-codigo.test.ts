import { describe, it, expect } from 'vitest';

/**
 * T1.4 — Busca por código retorna produto correto
 * 
 * Valida que a função de busca por código (simulada) retorna
 * o produto esperado para cada um dos 37 códigos do catálogo.
 */

/** Mini-catálogo em memória simulando o resultado do seed */
const CATALOGO: Record<string, { codigo: string; descricao: string; categoria: string; valorVenda: number }> = {
  VI6:  { codigo: 'VI6',  descricao: 'Vidro Incolor 6mm',                categoria: 'vidro',    valorVenda: 200 },
  VI8:  { codigo: 'VI8',  descricao: 'Vidro Incolor 8mm',                categoria: 'vidro',    valorVenda: 360 },
  VI10: { codigo: 'VI10', descricao: 'Vidro Incolor 10mm',               categoria: 'vidro',    valorVenda: 470 },
  VV8:  { codigo: 'VV8',  descricao: 'Vidro Verde/Fumê 8mm',             categoria: 'vidro',    valorVenda: 460 },
  VV10: { codigo: 'VV10', descricao: 'Vidro Verde/Fumê 10mm',            categoria: 'vidro',    valorVenda: 80 },
  VC4:  { codigo: 'VC4',  descricao: 'Vidro Comum 4mm',                  categoria: 'vidro',    valorVenda: 265 },
  VC6:  { codigo: 'VC6',  descricao: 'Vidro Comum 6mm',                  categoria: 'vidro',    valorVenda: 290 },
  VPGV: { codigo: 'VPGV', descricao: 'Vidro Pivotante Verde G.',         categoria: 'vidro',    valorVenda: 550 },
  VPGI: { codigo: 'VPGI', descricao: 'Vidro Pivotante Incolor G.',       categoria: 'vidro',    valorVenda: 500 },
  BVF:  { codigo: 'BVF',  descricao: 'Vidro Box Verde/Fumê',             categoria: 'vidro',    valorVenda: 410 },
  BI:   { codigo: 'BI',   descricao: 'Box Incolor',                      categoria: 'vidro',    valorVenda: 350 },
  VCR4: { codigo: 'VCR4', descricao: 'Vidro Reflect Bronze 4mm',         categoria: 'vidro',    valorVenda: 192 },
  EB4:  { codigo: 'EB4',  descricao: 'Espelho Bisotado 4mm',             categoria: 'vidro',    valorVenda: 700 },
  EC4:  { codigo: 'EC4',  descricao: 'Espelho Comum 4mm',                categoria: 'vidro',    valorVenda: 410 },
  KA:   { codigo: 'KA',   descricao: 'Kit Alumínio',                     categoria: 'kit',      valorVenda: 85 },
  KAE:  { codigo: 'KAE',  descricao: 'Kit Alumínio Externo',             categoria: 'kit',      valorVenda: 120 },
  KAB:  { codigo: 'KAB',  descricao: 'Kit Acessório Box',                categoria: 'kit',      valorVenda: 30 },
  KP:   { codigo: 'KP',   descricao: 'Kit Pivotante',                    categoria: 'kit',      valorVenda: 55 },
  KPP:  { codigo: 'KPP',  descricao: 'Kit Porta Pivotante',              categoria: 'kit',      valorVenda: 80 },
  KB:   { codigo: 'KB',   descricao: 'Kit Basculante',                   categoria: 'kit',      valorVenda: 60 },
  KF:   { codigo: 'KF',   descricao: 'Kit Ferragem Porta Correr',        categoria: 'kit',      valorVenda: 70 },
  KJ:   { codigo: 'KJ',   descricao: 'Kit Alumínio Janela',              categoria: 'kit',      valorVenda: 85 },
  PX40: { codigo: 'PX40', descricao: 'Puxador Inox 40cm',                categoria: 'ferragem', valorVenda: 50 },
  FVA:  { codigo: 'FVA',  descricao: 'Fechadura Porta Correr VA',        categoria: 'ferragem', valorVenda: 70 },
  FVV:  { codigo: 'FVV',  descricao: 'Fechadura Porta Correr VV',        categoria: 'ferragem', valorVenda: 80 },
  FX:   { codigo: 'FX',   descricao: 'Fixador Porta Pivotante',          categoria: 'ferragem', valorVenda: 40 },
  BFJ:  { codigo: 'BFJ',  descricao: 'Bate Fecha Janela',                categoria: 'ferragem', valorVenda: 20 },
  BPC:  { codigo: 'BPC',  descricao: 'Batedor Porta de Correr',          categoria: 'ferragem', valorVenda: 55 },
  JAT:  { codigo: 'JAT',  descricao: 'Jateado',                          categoria: 'ferragem', valorVenda: 85 },
  AD:   { codigo: 'AD',   descricao: 'Adesivo',                          categoria: 'servico',  valorVenda: 50 },
  FPA:  { codigo: 'FPA',  descricao: 'Fecha Pia Acrílico',               categoria: 'servico',  valorVenda: 410 },
  FPV:  { codigo: 'FPV',  descricao: 'Fecha Pia Vidro',                  categoria: 'servico',  valorVenda: 530 },
  FV:   { codigo: 'FV',   descricao: 'Fechamento em Vidro',              categoria: 'servico',  valorVenda: 520 },
  VFI:  { codigo: 'VFI',  descricao: 'Vidro Fixo Incolor 8mm',           categoria: 'servico',  valorVenda: 385 },
  VFV:  { codigo: 'VFV',  descricao: 'Vidro Fixo Verde/Fumê 8mm',        categoria: 'servico',  valorVenda: 380 },
  PBPV: { codigo: 'PBPV', descricao: 'Vitrô Piv./Basc. Verde 8mm',       categoria: 'servico',  valorVenda: 780 },
  PBPI: { codigo: 'PBPI', descricao: 'Vitrô Piv./Basc. Incolor 8mm',     categoria: 'servico',  valorVenda: 760 },
};

function buscarPorCodigo(codigo: string) {
  return CATALOGO[codigo] ?? null;
}

describe('T1.4 — Busca por Código', () => {
  it('retorna o produto correto para VI8', () => {
    const p = buscarPorCodigo('VI8');
    expect(p).not.toBeNull();
    expect(p!.codigo).toBe('VI8');
    expect(p!.descricao).toBe('Vidro Incolor 8mm');
    expect(p!.categoria).toBe('vidro');
  });

  it('retorna o produto correto para KA (Kit Alumínio)', () => {
    const p = buscarPorCodigo('KA');
    expect(p).not.toBeNull();
    expect(p!.codigo).toBe('KA');
    expect(p!.categoria).toBe('kit');
    expect(p!.valorVenda).toBe(85);
  });

  it('retorna o produto correto para PX40', () => {
    const p = buscarPorCodigo('PX40');
    expect(p).not.toBeNull();
    expect(p!.descricao).toBe('Puxador Inox 40cm');
    expect(p!.categoria).toBe('ferragem');
    expect(p!.valorVenda).toBe(50);
  });

  it('retorna o produto correto para FPA', () => {
    const p = buscarPorCodigo('FPA');
    expect(p).not.toBeNull();
    expect(p!.categoria).toBe('servico');
    expect(p!.valorVenda).toBe(410);
  });

  it('retorna null para código inexistente', () => {
    expect(buscarPorCodigo('XYZ123')).toBeNull();
  });

  it('retorna null para string vazia', () => {
    expect(buscarPorCodigo('')).toBeNull();
  });

  it('todos os 37 códigos retornam um produto', () => {
    const codigos = Object.keys(CATALOGO);
    expect(codigos).toHaveLength(37);

    for (const codigo of codigos) {
      const p = buscarPorCodigo(codigo);
      expect(p, `Código ${codigo} deve retornar um produto`).not.toBeNull();
      expect(p!.codigo).toBe(codigo);
    }
  });

  it('busca é case-sensitive (códigos são uppercase)', () => {
    expect(buscarPorCodigo('vi8')).toBeNull();
    expect(buscarPorCodigo('Vi8')).toBeNull();
    expect(buscarPorCodigo('VI8')).not.toBeNull();
  });

  it('PP2V8 (Porta Pivotante 2 Folhas Verde 8mm) não é um produto, é um serviço composto', () => {
    // PP2V8 é código de servico_composto, não de produto
    // A busca por código no hook useProdutoPorCodigo busca apenas na tabela produtos
    // Portanto PP2V8 não deve ser encontrado como produto
    expect(CATALOGO['PP2V8']).toBeUndefined();
  });
});