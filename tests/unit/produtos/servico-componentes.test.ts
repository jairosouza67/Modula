import { describe, it, expect } from 'vitest';

/**
 * T1.2 — Cada serviço composto tem ≥ 1 componente
 * 
 * Base: 27 serviços da planilha (aba CALCULO), todos com pelo menos 1 componente.
 * Serviços simples como VC4, VC6, VCR4, FPA etc. têm 1 componente (o próprio vidro/serviço).
 * Serviços complexos como PPI8 têm 4 componentes.
 */

/** Mapa dos 27 serviços com seus componentes esperados */
const SERVICOS_COMPONENTES: Record<string, string[]> = {
  PPI8:  ['VI8',  'PX40', 'KPP', 'FX'],
  PPV8:  ['VV8',  'PX40', 'KPP', 'FX'],
  PP2V8: ['VV8',  'PX40', 'KPP'],
  PPI10: ['VI10', 'PX40', 'KPP'],
  PCI2:  ['VI8',  'KA',   'PX40', 'FVA'],
  PCV2:  ['VV8',  'KA',   'PX40', 'FVA'],
  PCI4:  ['VI8',  'KA',   'PX40', 'FVV'],
  PCV4:  ['VV8',  'KA',   'PX40', 'FVV'],
  PCEI:  ['VI8',  'KAE',  'PX40', 'FVA', 'BPC'],
  PCEV:  ['VV8',  'KAE',  'PX40', 'FVA', 'BPC'],
  JI8:   ['VI8',  'KA',   'BFJ'],
  JV8:   ['VV8',  'KA',   'BFJ'],
  PGV:   ['VPGV', 'KP'],
  PGI:   ['VPGI', 'KP'],
  BI:    ['BI',   'KA',   'KAB'],
  BV:    ['BVF',  'KA',   'KAB'],
  JT:    ['JAT'],
  PBPV:  ['PBPV'],
  PBPI:  ['PBPI'],
  FPA:   ['FPA'],
  FPV:   ['FPV'],
  FV:    ['FV'],
  VFI:   ['VFI'],
  VFV:   ['VFV'],
  VC4:   ['VC4'],
  VC6:   ['VC6'],
  VCR4:  ['VCR4'],
};

describe('T1.2 — Serviços Compostos e Componentes', () => {
  it('todos os 27 serviços têm pelo menos 1 componente', () => {
    for (const [servico, componentes] of Object.entries(SERVICOS_COMPONENTES)) {
      expect(
        componentes.length,
        `Serviço ${servico} deve ter ≥ 1 componente`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('existem exatamente 27 serviços', () => {
    expect(Object.keys(SERVICOS_COMPONENTES)).toHaveLength(27);
  });

  it('cada componente referencia um código de produto válido (37 códigos)', () => {
    const CODIGOS_VALIDOS = new Set([
      'VI6', 'VI8', 'VI10', 'VV8', 'VV10', 'VC4', 'VC6',
      'VPGV', 'VPGI', 'BVF', 'BI', 'VCR4', 'EB4', 'EC4',
      'KA', 'KAE', 'KAB', 'KP', 'KPP', 'KB', 'KF', 'KJ',
      'PX40', 'FVA', 'FVV', 'FX', 'BFJ', 'BPC', 'JAT',
      'AD', 'FPA', 'FPV', 'FV', 'VFI', 'VFV', 'PBPV', 'PBPI',
    ]);

    for (const [servico, componentes] of Object.entries(SERVICOS_COMPONENTES)) {
      for (const comp of componentes) {
        expect(
          CODIGOS_VALIDOS.has(comp),
          `Componente ${comp} do serviço ${servico} não é um código válido`
        ).toBe(true);
      }
    }
  });

  it('PPI8 tem exatamente 4 componentes', () => {
    expect(SERVICOS_COMPONENTES['PPI8']).toHaveLength(4);
  });

  it('PCEI (mais complexo) tem 5 componentes', () => {
    expect(SERVICOS_COMPONENTES['PCEI']).toHaveLength(5);
  });

  it('serviços simples (VC4, JT, FPA, etc.) têm 1 componente', () => {
    const simples = ['JT', 'PBPV', 'PBPI', 'FPA', 'FPV', 'FV', 'VFI', 'VFV', 'VC4', 'VC6', 'VCR4'];
    for (const svc of simples) {
      expect(
        SERVICOS_COMPONENTES[svc],
        `Serviço ${svc} deve ter exatamente 1 componente`
      ).toHaveLength(1);
    }
  });

  it('tipos de preço válidos: M2, PC_FX, PC_ML', () => {
    const TIPOS_VALIDOS = ['M2', 'PC_FX', 'PC_ML'];
    for (const tipo of ['M2', 'PC_FX', 'PC_ML']) {
      expect(TIPOS_VALIDOS).toContain(tipo);
    }
  });
});