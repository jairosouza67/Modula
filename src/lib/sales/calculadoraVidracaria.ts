import type { CalculoResultado, OrcamentoItemV2, ServicoResolvido } from "./types";

const round2 = (value: number) => Number(value.toFixed(2));
const round4 = (value: number) => Number(value.toFixed(4));

export function calcularM2(largura: number, altura: number, quantidade: number): number {
  if (largura <= 0 || altura <= 0 || quantidade <= 0) return 0;
  return round4(largura * altura * quantidade);
}

export function calcularPrecoUnitario(valorTotal: number, quantidade: number): number {
  if (quantidade <= 0) return 0;
  return round2(valorTotal / quantidade);
}

export function calcularValorTotalLinha(
  item: OrcamentoItemV2,
  servico: ServicoResolvido,
): CalculoResultado {
  if (item.quantidade <= 0) {
    return {
      codigoServico: item.codigoServico,
      largura: item.largura,
      altura: item.altura,
      quantidade: item.quantidade,
      m2: 0,
      vlM2: servico.vlM2,
      pcFx: servico.pcFx,
      pcMl: servico.pcMl,
      adicional: item.adicional,
      valorTotal: 0,
      precoUnitario: 0,
    };
  }

  const largura = Math.max(item.largura, 0);
  const altura = Math.max(item.altura, 0);
  const m2 = calcularM2(largura, altura, item.quantidade);
  const valorTotalBruto =
    servico.pcMl * largura * item.quantidade +
    servico.pcFx * item.quantidade +
    m2 * servico.vlM2 +
    item.adicional;

  const valorTotal = round2(valorTotalBruto);

  return {
      codigoServico: item.codigoServico,
      largura,
      altura,
    quantidade: item.quantidade,
    m2,
    vlM2: servico.vlM2,
    pcFx: servico.pcFx,
    pcMl: servico.pcMl,
    adicional: item.adicional,
    valorTotal,
    precoUnitario: calcularPrecoUnitario(valorTotal, item.quantidade),
  };
}

export function calcularTotalOrcamento(itens: CalculoResultado[]): number {
  return round2(itens.reduce((total, item) => total + item.valorTotal, 0));
}
