export interface CustoItem {
  codigoServico: string;
  largura: number;
  altura: number;
  quantidade: number;
  valorVenda: number;
  custoM2: number;
  pcFxCusto: number;
  pcMlCusto: number;
}

export interface CustoResultado {
  codigoServico: string;
  custoReal: number;
  lucro: number;
  valorVenda: number;
}

export interface TotaisCusto {
  totalBruto: number;
  custoTotal: number;
  lucroTotal: number;
  valorComDesconto: number;
  lucroAposDesconto: number;
}

const round2 = (value: number) => Number(value.toFixed(2));

export function calcularCustoReal(item: CustoItem): number {
  const areaTotal = item.largura * item.altura * item.quantidade;
  const custoArea = item.custoM2 * areaTotal;
  const custoFixo = item.pcFxCusto * item.quantidade;
  const custoLinear = item.pcMlCusto * item.largura;

  return round2(custoArea + custoFixo + custoLinear);
}

export function calcularLucro(valorVenda: number, custoReal: number): number {
  return round2(valorVenda - custoReal);
}

export function calcularTotaisCusto(itens: CustoItem[]): TotaisCusto {
  const resultados = itens.map((item) => {
    const custoReal = calcularCustoReal(item);
    return {
      valorVenda: item.valorVenda,
      custoReal,
      lucro: calcularLucro(item.valorVenda, custoReal),
    };
  });

  const totalBruto = round2(resultados.reduce((acc, item) => acc + item.valorVenda, 0));
  const custoTotal = round2(resultados.reduce((acc, item) => acc + item.custoReal, 0));
  const lucroTotal = round2(resultados.reduce((acc, item) => acc + item.lucro, 0));
  const valorComDesconto = round2(totalBruto * 0.83);
  const lucroAposDesconto = round2(valorComDesconto - custoTotal);

  return {
    totalBruto,
    custoTotal,
    lucroTotal,
    valorComDesconto,
    lucroAposDesconto,
  };
}
