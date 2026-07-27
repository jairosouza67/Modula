import { describe, it, expect } from 'vitest';
import { validarXSDNFe } from './compras';

describe('FIS-05: Validação XSD XML (Simulada)', () => {
  it('deve validar um XML de NFe estruturado corretamente', () => {
    const xmlValido = `
      <nfeProc>
        <NFe>
          <infNFe>
            <ide>
              <nNF>12345</nNF>
              <dhEmi>2026-06-01T10:00:00-03:00</dhEmi>
            </ide>
            <emit>
              <CNPJ>12345678000199</CNPJ>
              <xNome>Vidros SA</xNome>
            </emit>
            <dest>
              <CNPJ>98765432000111</CNPJ>
            </dest>
            <det nItem="1">
              <prod>
                <cProd>001</cProd>
                <xProd>Vidro 8mm</xProd>
                <vProd>100.00</vProd>
              </prod>
            </det>
            <total>
              <ICMSTot>
                <vNF>100.00</vNF>
              </ICMSTot>
            </total>
          </infNFe>
        </NFe>
      </nfeProc>
    `;

    const resultado = validarXSDNFe(xmlValido);
    expect(resultado.valido).toBe(true);
    expect(resultado.erros).toHaveLength(0);
  });

  it('deve rejeitar um XML de NFe com tags obrigatórias faltando', () => {
    // Falta a tag <dest> e a tag <vNF>
    const xmlInvalido = `
      <nfeProc>
        <NFe>
          <infNFe>
            <ide>
              <nNF>12345</nNF>
              <dhEmi>2026-06-01T10:00:00-03:00</dhEmi>
            </ide>
            <emit>
              <CNPJ>12345678000199</CNPJ>
              <xNome>Vidros SA</xNome>
            </emit>
            <det nItem="1">
              <prod>
                <cProd>001</cProd>
                <xProd>Vidro 8mm</xProd>
              </prod>
            </det>
          </infNFe>
        </NFe>
      </nfeProc>
    `;

    const resultado = validarXSDNFe(xmlInvalido);
    expect(resultado.valido).toBe(false);
    expect(resultado.erros).toContain('Tag obrigatória ausente: <dest>');
    expect(resultado.erros).toContain('Tag obrigatória ausente: <vNF>');
  });
});
