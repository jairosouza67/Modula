import { describe, it, expect } from 'vitest';
import { calcularGiroEstoque } from '../../../src/lib/bi/relatorios';

describe('RPT-02: Giro de Estoque', () => {
  it('deve calcular o giro de estoque corretamente', () => {
    const itens = [
      {
        id: '1',
        nome: 'Vidro Incolor 8mm',
        cmv: 5000,
        estoqueInicial: 1000,
        estoqueFinal: 1000,
        dataUltimaMovimentacao: new Date().toISOString()
      }
    ];

    const resultado = calcularGiroEstoque(itens);
    expect(resultado[0].giro).toBe(5); // 5000 / 1000 = 5
    expect(resultado[0].diasParado).toBe(0);
  });

  it('deve calcular dias parado corretamente', () => {
    const dataPassada = new Date();
    dataPassada.setDate(dataPassada.getDate() - 45); // 45 dias atras

    const itens = [
      {
        id: '2',
        nome: 'Perfil Aluminio Branco',
        cmv: 2000,
        estoqueInicial: 500,
        estoqueFinal: 500,
        dataUltimaMovimentacao: dataPassada.toISOString()
      }
    ];

    const resultado = calcularGiroEstoque(itens);
    expect(resultado[0].diasParado).toBe(45);
  });
});
