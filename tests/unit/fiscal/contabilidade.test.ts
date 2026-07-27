import { describe, it, expect } from 'vitest';
import { gerarEstruturaSPED, gerarOFXExport } from '../../../src/lib/fiscal/contabilidade';

describe('FIS-22: Exportação Contábil', () => {
  it('deve gerar estrutura SPED básica', () => {
    const sped = gerarEstruturaSPED({});
    expect(sped).toContain('|0000|');
    expect(sped).toContain('|9999|');
  });

  it('deve gerar arquivo OFX válido', () => {
    const lancamentos = [
      { data: '2026-05-12', valor: 150.50, desc: 'Venda Teste' }
    ];
    const ofx = gerarOFXExport(lancamentos);
    expect(ofx).toContain('<OFX>');
    expect(ofx).toContain('<TRNAMT>150.5');
    expect(ofx).toContain('<MEMO>Venda Teste');
  });
});
