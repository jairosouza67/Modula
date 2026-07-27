import { describe, it, expect } from 'vitest';

/**
 * T1.3 — Códigos únicos por empresa
 * 
 * A constraint UNIQUE(empresa_id, codigo) garante que não pode haver
 * dois produtos com o mesmo código na mesma empresa.
 * 
 * Este teste valida:
 * 1. Que todos os 37 códigos de seed são únicos
 * 2. Que a lógica de detecção de duplicata funciona
 */

/** 37 códigos do seed */
const CODIGOS_SEED: string[] = [
  'VI6',  'VI8',  'VI10', 'VV8',  'VV10', 'VC4',  'VC6',
  'VPGV', 'VPGI', 'BVF',  'BI',   'VCR4', 'EB4',  'EC4',
  'KA',   'KAE',  'KAB',  'KP',   'KPP',  'KB',   'KF',
  'KJ',   'PX40', 'FVA',  'FVV',  'FX',   'BFJ',  'BPC',
  'JAT',  'AD',   'FPA',  'FPV',  'FV',   'VFI',  'VFV',
  'PBPV', 'PBPI',
];

/** 27 códigos de serviços compostos do seed (alguns repetem códigos de produtos, ex: BI) */
const CODIGOS_SERVICOS: string[] = [
  'PPI8', 'PPV8', 'PP2V8', 'PPI10', 'PCI2', 'PCV2', 'PCI4', 'PCV4',
  'PCEI', 'PCEV', 'JI8', 'JV8',   'PGV',  'PGI',  'BI',   'BV',
  'JT',   'PBPV', 'PBPI', 'FPA',   'FPV',  'FV',   'VFI',  'VFV',
  'VC4',  'VC6',  'VCR4',
];

describe('T1.3 — Unicidade de Códigos', () => {
  it('todos os 37 códigos de produtos são únicos', () => {
    const unicos = new Set(CODIGOS_SEED);
    expect(unicos.size).toBe(37);
  });

  it('todos os 27 códigos de serviços compostos são únicos', () => {
    const unicos = new Set(CODIGOS_SERVICOS);
    expect(unicos.size).toBe(27);
  });

  it('detecta duplicata em array com repetição', () => {
    const comDuplicata = [...CODIGOS_SEED, 'VI8'];
    const unicos = new Set(comDuplicata);
    expect(unicos.size).toBe(37); // VI8 repetido não aumenta o Set
    expect(comDuplicata.length).toBe(38); // array tem 38 elementos
  });

  it('unicidade é por empresa — mesmo código em empresas diferentes é permitido', () => {
    // A constraint é UNIQUE(empresa_id, codigo), então (emp1, VI8) e (emp2, VI8) são válidos.
    // Este teste apenas documenta a regra.
    const registros = [
      { empresa: 'emp-1', codigo: 'VI8' },
      { empresa: 'emp-2', codigo: 'VI8' },
    ];

    const chaveComposta = registros.map(r => `${r.empresa}|${r.codigo}`);
    const unicos = new Set(chaveComposta);

    // Ambas as combinações são únicas
    expect(unicos.size).toBe(2);
  });

  it('mesmo código na mesma empresa é inválido', () => {
    const registros = [
      { empresa: 'emp-1', codigo: 'VI8' },
      { empresa: 'emp-1', codigo: 'VI8' },
    ];

    const chaveComposta = registros.map(r => `${r.empresa}|${r.codigo}`);
    const unicos = new Set(chaveComposta);

    // Colisão detectada: só 1 combinação única
    expect(unicos.size).toBe(1);
  });

  it('sobreposição de códigos entre produtos e serviços é permitida (ex: BI, VC4, VC6, VCR4)', () => {
    // BI existe tanto em produtos quanto em servicos_compostos — tabelas diferentes, OK
    const sobrepostos = CODIGOS_SERVICOS.filter(c => CODIGOS_SEED.includes(c));
    expect(sobrepostos).toEqual(['BI', 'PBPV', 'PBPI', 'FPA', 'FPV', 'FV', 'VFI', 'VFV', 'VC4', 'VC6', 'VCR4']);
    // Isso é esperado e válido, pois são tabelas diferentes
  });
});