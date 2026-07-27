import type { OrcamentoItemV2 } from "@/lib/sales/types";
import type { CustoItem } from "@/lib/sales/calculoCusto";
import { resolverServico } from "@/lib/sales/resolverServico";

interface ProdutoFake {
  codigo: string;
  descricao: string;
  venda: number;
  custo: number;
}

interface ServicoFake {
  codigo: string;
  componentes: { codigoProduto: string; quantidade: number; tipoPreco: "M2" | "PC_FX" | "PC_ML" }[];
}

export function criarProdutoFake(overrides?: Partial<ProdutoFake>): ProdutoFake {
  return {
    codigo: overrides?.codigo ?? "VI8",
    descricao: overrides?.descricao ?? "Vidro Incolor 8mm",
    venda: overrides?.venda ?? 360,
    custo: overrides?.custo ?? 246.58,
  };
}

export function criarServicoFake(codigo: string, componentes: ServicoFake["componentes"]): ServicoFake {
  return {
    codigo,
    componentes,
  };
}

export function criarOrcamentoItemFake(overrides?: Partial<OrcamentoItemV2>): OrcamentoItemV2 {
  return {
    codigoServico: overrides?.codigoServico ?? "PPI8",
    largura: overrides?.largura ?? 1,
    altura: overrides?.altura ?? 1,
    quantidade: overrides?.quantidade ?? 1,
    adicional: overrides?.adicional ?? 0,
  };
}

export function criarCustoItemFake(servico: string): CustoItem {
  const resolvido = resolverServico(servico);
  return {
    codigoServico: servico,
    largura: 1,
    altura: 1,
    quantidade: 1,
    valorVenda: resolvido.vlM2 + resolvido.pcFx + resolvido.pcMl,
    custoM2: resolvido.custoM2,
    pcFxCusto: resolvido.pcFxCusto,
    pcMlCusto: resolvido.pcMlCusto,
  };
}
