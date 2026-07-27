import type { ServicoDef, ServicoResolvido, OrcamentoComponente } from "./types";

interface ProdutoPreco {
  venda: number;
  custo: number;
}

const PRECOS_PRODUTOS: Record<string, ProdutoPreco> = {
  VI6: { venda: 200, custo: 136.99 },
  VI8: { venda: 360, custo: 246.58 },
  VI10: { venda: 470, custo: 321.92 },
  VV8: { venda: 460, custo: 315.07 },
  VV10: { venda: 80, custo: 54.79 },
  VC4: { venda: 265, custo: 181.51 },
  VC6: { venda: 290, custo: 198.63 },
  VPGV: { venda: 550, custo: 376.71 },
  VPGI: { venda: 500, custo: 342.47 },
  BVF: { venda: 410, custo: 280.82 },
  BI: { venda: 350, custo: 239.73 },
  VCR4: { venda: 192, custo: 374.6 }, // regra operacional CALCULO prevalece
  EB4: { venda: 700, custo: 479.45 },
  EC4: { venda: 410, custo: 280.82 },
  KA: { venda: 85, custo: 58.22 },
  KAE: { venda: 120, custo: 82.19 },
  KAB: { venda: 30, custo: 20.55 },
  KP: { venda: 55, custo: 37.67 },
  KPP: { venda: 80, custo: 54.79 },
  PX40: { venda: 50, custo: 34.25 },
  FVA: { venda: 70, custo: 47.95 },
  FVV: { venda: 80, custo: 54.79 },
  FX: { venda: 40, custo: 27.4 },
  BFJ: { venda: 20, custo: 13.7 },
  BPC: { venda: 55, custo: 37.67 },
  JAT: { venda: 85, custo: 58.22 },
  FPA: { venda: 410, custo: 205 },
  FPV: { venda: 530, custo: 265 },
  FV: { venda: 520, custo: 260 },
  VFI: { venda: 385, custo: 192.5 },
  VFV: { venda: 380, custo: 190 },
  PBPV: { venda: 780, custo: 390 },
  PBPI: { venda: 760, custo: 380 },
};

const SERVICOS: Record<string, ServicoDef> = {
  PPI8: {
    codigo: "PPI8",
    nome: "Porta Pivotante Incolor 8mm",
    categoria: "porta_pivotante",
    componentes: [
      { codigoProduto: "VI8", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "PX40", quantidade: 1, tipoPreco: "PC_FX" },
      { codigoProduto: "KPP", quantidade: 1, tipoPreco: "PC_FX" },
      { codigoProduto: "FX", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  PPV8: {
    codigo: "PPV8",
    nome: "Porta Pivotante Verde 8mm",
    categoria: "porta_pivotante",
    componentes: [
      { codigoProduto: "VV8", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "PX40", quantidade: 1, tipoPreco: "PC_FX" },
      { codigoProduto: "KPP", quantidade: 1, tipoPreco: "PC_FX" },
      { codigoProduto: "FX", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  PP2V8: {
    codigo: "PP2V8",
    nome: "Porta Pivotante 2 Folhas Verde 8mm",
    categoria: "porta_pivotante",
    componentes: [
      { codigoProduto: "VV8", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "PX40", quantidade: 2, tipoPreco: "PC_FX" },
      { codigoProduto: "KPP", quantidade: 2, tipoPreco: "PC_FX" },
    ],
  },
  PPI10: {
    codigo: "PPI10",
    nome: "Porta Pivotante Incolor 10mm",
    categoria: "porta_pivotante",
    componentes: [
      { codigoProduto: "VI10", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "PX40", quantidade: 1, tipoPreco: "PC_FX" },
      { codigoProduto: "KPP", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  PCI2: {
    codigo: "PCI2",
    nome: "Porta Correr 2 Folhas Incolor 8mm",
    categoria: "porta_correr",
    componentes: [
      { codigoProduto: "VI8", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "KA", quantidade: 1, tipoPreco: "PC_ML" },
      { codigoProduto: "PX40", quantidade: 1, tipoPreco: "PC_FX" },
      { codigoProduto: "FVA", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  PCV2: {
    codigo: "PCV2",
    nome: "Porta Correr 2 Folhas Verde 8mm",
    categoria: "porta_correr",
    componentes: [
      { codigoProduto: "VV8", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "KA", quantidade: 1, tipoPreco: "PC_ML" },
      { codigoProduto: "PX40", quantidade: 1, tipoPreco: "PC_FX" },
      { codigoProduto: "FVA", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  PCI4: {
    codigo: "PCI4",
    nome: "Porta Correr 4 Folhas Incolor 8mm",
    categoria: "porta_correr",
    componentes: [
      { codigoProduto: "VI8", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "KA", quantidade: 1, tipoPreco: "PC_ML" },
      { codigoProduto: "PX40", quantidade: 2, tipoPreco: "PC_FX" },
      { codigoProduto: "FVV", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  PCV4: {
    codigo: "PCV4",
    nome: "Porta Correr 4 Folhas Verde 8mm",
    categoria: "porta_correr",
    componentes: [
      { codigoProduto: "VV8", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "KA", quantidade: 1, tipoPreco: "PC_ML" },
      { codigoProduto: "PX40", quantidade: 2, tipoPreco: "PC_FX" },
      { codigoProduto: "FVV", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  PCEI: {
    codigo: "PCEI",
    nome: "Porta Correr Externa Incolor 8mm",
    categoria: "porta_correr",
    componentes: [
      { codigoProduto: "VI8", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "KAE", quantidade: 1, tipoPreco: "PC_FX" },
      { codigoProduto: "PX40", quantidade: 1, tipoPreco: "PC_FX" },
      { codigoProduto: "FVA", quantidade: 1, tipoPreco: "PC_FX" },
      { codigoProduto: "BPC", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  PCEV: {
    codigo: "PCEV",
    nome: "Porta Correr Externa Verde 8mm",
    categoria: "porta_correr",
    componentes: [
      { codigoProduto: "VV8", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "KAE", quantidade: 1, tipoPreco: "PC_FX" },
      { codigoProduto: "PX40", quantidade: 1, tipoPreco: "PC_FX" },
      { codigoProduto: "FVA", quantidade: 1, tipoPreco: "PC_FX" },
      { codigoProduto: "BPC", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  JI8: {
    codigo: "JI8",
    nome: "Janela Incolor 8mm",
    categoria: "janela",
    componentes: [
      { codigoProduto: "VI8", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "KA", quantidade: 1, tipoPreco: "PC_ML" },
      { codigoProduto: "BFJ", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  JV8: {
    codigo: "JV8",
    nome: "Janela Verde/Fumê 8mm",
    categoria: "janela",
    componentes: [
      { codigoProduto: "VV8", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "KA", quantidade: 1, tipoPreco: "PC_ML" },
      { codigoProduto: "BFJ", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  PGV: {
    codigo: "PGV",
    nome: "Pivotante/Basc. Verde",
    categoria: "porta_pivotante",
    componentes: [
      { codigoProduto: "VPGV", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "KP", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  PGI: {
    codigo: "PGI",
    nome: "Pivotante/Basc. Incolor",
    categoria: "porta_pivotante",
    componentes: [
      { codigoProduto: "VPGI", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "KP", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  BI: {
    codigo: "BI",
    nome: "Box Incolor 8mm",
    categoria: "box",
    componentes: [
      { codigoProduto: "BI", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "KA", quantidade: 1, tipoPreco: "PC_ML" },
      { codigoProduto: "KAB", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  BV: {
    codigo: "BV",
    nome: "Box Verde/Fumê 8mm",
    categoria: "box",
    componentes: [
      { codigoProduto: "BVF", quantidade: 1, tipoPreco: "M2" },
      { codigoProduto: "KA", quantidade: 1, tipoPreco: "PC_ML" },
      { codigoProduto: "KAB", quantidade: 1, tipoPreco: "PC_FX" },
    ],
  },
  JT: {
    codigo: "JT",
    nome: "Jateamento",
    categoria: "especial",
    componentes: [{ codigoProduto: "JAT", quantidade: 1, tipoPreco: "M2" }],
  },
  PBPV: {
    codigo: "PBPV",
    nome: "Vitrô Piv./Basc. Verde 8mm",
    categoria: "especial",
    componentes: [{ codigoProduto: "PBPV", quantidade: 1, tipoPreco: "M2" }],
  },
  PBPI: {
    codigo: "PBPI",
    nome: "Vitrô Piv./Basc. Incolor 8mm",
    categoria: "especial",
    componentes: [{ codigoProduto: "PBPI", quantidade: 1, tipoPreco: "M2" }],
  },
  FPA: {
    codigo: "FPA",
    nome: "Fecha Pia Acrílico",
    categoria: "especial",
    componentes: [{ codigoProduto: "FPA", quantidade: 1, tipoPreco: "M2" }],
  },
  FPV: {
    codigo: "FPV",
    nome: "Fecha Pia Vidro",
    categoria: "especial",
    componentes: [{ codigoProduto: "FPV", quantidade: 1, tipoPreco: "M2" }],
  },
  FV: {
    codigo: "FV",
    nome: "Fechamento em Vidro",
    categoria: "especial",
    componentes: [{ codigoProduto: "FV", quantidade: 1, tipoPreco: "M2" }],
  },
  VFI: {
    codigo: "VFI",
    nome: "Vidro Fixo/Bandeira Incolor 8mm",
    categoria: "especial",
    componentes: [{ codigoProduto: "VFI", quantidade: 1, tipoPreco: "M2" }],
  },
  VFV: {
    codigo: "VFV",
    nome: "Vidro Fixo/Bandeira Verde 8mm",
    categoria: "especial",
    componentes: [{ codigoProduto: "VFV", quantidade: 1, tipoPreco: "M2" }],
  },
  VC4: {
    codigo: "VC4",
    nome: "Vidro Comum 4mm",
    categoria: "especial",
    componentes: [{ codigoProduto: "VC4", quantidade: 1, tipoPreco: "M2" }],
  },
  VC6: {
    codigo: "VC6",
    nome: "Vidro Comum 6mm",
    categoria: "especial",
    componentes: [{ codigoProduto: "VC6", quantidade: 1, tipoPreco: "M2" }],
  },
  VCR4: {
    codigo: "VCR4",
    nome: "Vidro Reflect Bronze 4mm",
    categoria: "especial",
    componentes: [{ codigoProduto: "VCR4", quantidade: 1, tipoPreco: "M2" }],
  },
};

const OVERRIDES_VENDA: Partial<Record<string, Partial<Pick<ServicoResolvido, "vlM2" | "pcFx" | "pcMl">>>> = {
  PPI8: { pcFx: 120 },
  PPV8: { pcFx: 160 },
};

const CUSTO_M2_POR_SERVICO: Partial<Record<string, number>> = {
  PPI8: 314.4,
  PPV8: 408.4,
  PP2V8: 768.4,
  PPI10: 383.8,
  PCI2: 329.4,
  PCV2: 383.4,
  PCI4: 459.4,
  PCV4: 513.4,
  PCEI: 489.4,
  PCEV: 543.4,
  JI8: 299.4,
  JV8: 353.4,
  PGV: 352,
  PGI: 280,
  BI: 307.5,
  BV: 344.6,
  JT: 60.01,
  PBPV: 390,
  PBPI: 380,
  FPA: 205,
  FPV: 265,
  FV: 260,
  VFI: 192.5,
  VFV: 190,
  VCR4: 374.6,
};

const round2 = (value: number) => Number(value.toFixed(2));

export function listarServicosDisponiveis() {
  return Object.values(SERVICOS).map((servico) => ({
    codigo: servico.codigo,
    nome: servico.nome,
    categoria: servico.categoria,
  }));
}

export function listarCodigosServicos() {
  return Object.keys(SERVICOS);
}

export function listarCodigosProdutosOperacionais() {
  return Object.keys(PRECOS_PRODUTOS);
}

/** Mapa de nome legível por código de produto operacional */
const NOMES_PRODUTOS: Record<string, string> = {
  VI6: "Vidro Incolor 6mm",
  VI8: "Vidro Incolor 8mm",
  VI10: "Vidro Incolor 10mm",
  VV8: "Vidro Verde 8mm",
  VV10: "Vidro Verde 10mm",
  VC4: "Vidro Canelado 4mm",
  VC6: "Vidro Canelado 6mm",
  VPGV: "Vidro Ponto Goiás Verde",
  VPGI: "Vidro Ponto Goiás Incolor",
  BVF: "Box Vidro Fumê",
  BI: "Box Incolor",
  VCR4: "Vidro Cristal 4mm",
  EB4: "Espelho Bisotado 4mm",
  EC4: "Espelho Cristal 4mm",
  KA: "Kit Alumínio",
  KAE: "Kit Alumínio Especial",
  KAB: "Kit Alumínio Box",
  KP: "Kit Padrão",
  KPP: "Kit Pivô Premium",
  PX40: "Pivô 40kg",
  FVA: "Fechadura VA",
  FVV: "Fechadura VV",
  FX: "Fecho",
  BFJ: "Borda/Fita J",
  BPC: "Borda PC",
  JAT: "Junta AT",
  FPA: "Fundo Para Armação",
  FPV: "Fundo Para Vidro",
  FV: "Fundo Vidro",
  VFI: "Vidro Float Incolor",
  VFV: "Vidro Float Verde",
  PBPV: "Painel Box PV",
  PBPI: "Painel Box PI",
};

/**
 * Retorna os componentes detalhados de um serviço composto.
 * Usado para expandir um kit no modal de orçamento com nome legível.
 */
export function obterComponentesServico(
  codigoServico: string
): Array<{ codigoProduto: string; descricao: string; quantidade: number; tipoPreco: "M2" | "PC_FX" | "PC_ML" }> {
  const servico = SERVICOS[codigoServico];
  if (!servico) return [];
  return servico.componentes.map((c) => ({
    codigoProduto: c.codigoProduto,
    descricao: NOMES_PRODUTOS[c.codigoProduto] ?? c.codigoProduto,
    quantidade: c.quantidade,
    tipoPreco: c.tipoPreco as "M2" | "PC_FX" | "PC_ML",
  }));
}

export function obterPrecoProdutoOperacional(codigo: string) {
  const preco = PRECOS_PRODUTOS[codigo];
  if (!preco) {
    throw new Error(`Produto operacional não encontrado: ${codigo}`);
  }
  return preco;
}

export function resolverServico(codigo: string): ServicoResolvido {
  const servico = SERVICOS[codigo];
  if (!servico) {
    throw new Error(`Serviço não encontrado: ${codigo}`);
  }

  let vlM2 = 0;
  let pcFx = 0;
  let pcMl = 0;

  let custoM2 = 0;
  let pcFxCusto = 0;
  let pcMlCusto = 0;

  for (const componente of servico.componentes) {
    const preco = PRECOS_PRODUTOS[componente.codigoProduto];
    if (!preco) {
      throw new Error(`Produto sem preço operacional: ${componente.codigoProduto}`);
    }

    const venda = preco.venda * componente.quantidade;
    const custo = preco.custo * componente.quantidade;

    if (componente.tipoPreco === "M2") {
      vlM2 += venda;
      custoM2 += custo;
      continue;
    }

    if (componente.tipoPreco === "PC_FX") {
      pcFx += venda;
      pcFxCusto += custo;
      continue;
    }

    pcMl += venda;
    pcMlCusto += custo;
  }

  const vendaOverride = OVERRIDES_VENDA[codigo];
  if (vendaOverride) {
    vlM2 = vendaOverride.vlM2 ?? vlM2;
    pcFx = vendaOverride.pcFx ?? pcFx;
    pcMl = vendaOverride.pcMl ?? pcMl;
  }

  const custoM2Override = CUSTO_M2_POR_SERVICO[codigo];
  if (typeof custoM2Override === "number") {
    custoM2 = custoM2Override;
    pcFxCusto = 0;
    pcMlCusto = 0;
  }

  return {
    codigo: servico.codigo,
    nome: servico.nome,
    vlM2: round2(vlM2),
    pcFx: round2(pcFx),
    pcMl: round2(pcMl),
    custoM2: round2(custoM2),
    pcFxCusto: round2(pcFxCusto),
    pcMlCusto: round2(pcMlCusto),
  };
}

export function resolverServicoComComponentes(
  codigo: string,
  componentes?: OrcamentoComponente[]
): ServicoResolvido {
  if (!componentes || componentes.length === 0) {
    return resolverServico(codigo);
  }

  const servico = SERVICOS[codigo];
  if (!servico) {
    throw new Error(`Serviço não encontrado: ${codigo}`);
  }

  const baseResolvido = resolverServico(codigo);

  let vlM2 = baseResolvido.vlM2;
  let pcFx = baseResolvido.pcFx;
  let pcMl = baseResolvido.pcMl;
  let custoM2 = baseResolvido.custoM2;
  let pcFxCusto = baseResolvido.pcFxCusto;
  let pcMlCusto = baseResolvido.pcMlCusto;

  let hasActiveM2 = false;
  let hasActivePcFx = false;
  let hasActivePcMl = false;

  for (const componente of servico.componentes) {
    const userComp = componentes.find((c) => c.codigoProduto === componente.codigoProduto);
    const incluido = userComp ? userComp.incluido : true;

    if (incluido) {
      if (componente.tipoPreco === "M2") hasActiveM2 = true;
      else if (componente.tipoPreco === "PC_FX") hasActivePcFx = true;
      else if (componente.tipoPreco === "PC_ML") hasActivePcMl = true;
    } else {
      const preco = PRECOS_PRODUTOS[componente.codigoProduto];
      if (!preco) {
        throw new Error(`Produto sem preço operacional: ${componente.codigoProduto}`);
      }

      const vendaExcluida = preco.venda * componente.quantidade;
      const custoExcluido = preco.custo * componente.quantidade;

      if (componente.tipoPreco === "M2") {
        vlM2 -= vendaExcluida;
        custoM2 -= custoExcluido;
      } else if (componente.tipoPreco === "PC_FX") {
        pcFx -= vendaExcluida;
        pcFxCusto -= custoExcluido;
      } else if (componente.tipoPreco === "PC_ML") {
        pcMl -= vendaExcluida;
        pcMlCusto -= custoExcluido;
      }
    }
  }

  vlM2 = Math.max(0, vlM2);
  pcFx = Math.max(0, pcFx);
  pcMl = Math.max(0, pcMl);
  custoM2 = Math.max(0, custoM2);
  pcFxCusto = Math.max(0, pcFxCusto);
  pcMlCusto = Math.max(0, pcMlCusto);

  if (!hasActiveM2) {
    vlM2 = 0;
    custoM2 = 0;
  }
  if (!hasActivePcFx) {
    pcFx = 0;
    pcFxCusto = 0;
  }
  if (!hasActivePcMl) {
    pcMl = 0;
    pcMlCusto = 0;
  }

  return {
    codigo: servico.codigo,
    nome: servico.nome,
    vlM2: round2(vlM2),
    pcFx: round2(pcFx),
    pcMl: round2(pcMl),
    custoM2: round2(custoM2),
    pcFxCusto: round2(pcFxCusto),
    pcMlCusto: round2(pcMlCusto),
  };
}
