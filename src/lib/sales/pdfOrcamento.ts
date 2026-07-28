import {
  calcularItem,
  isLegacyItem,
  isNewFormatItem,
  type OrcamentoItem,
  type OrcamentoItemLegacy,
} from "./calculator";
import type {
  TipoVidroSupabase,
  ProcessamentoSupabase,
} from "@/hooks/useProdutosOrcamento";
import type { OrcamentoComponente } from "./types";
import { resolverServicoComComponentes } from "./resolverServico";
import { calcularValorTotalLinha } from "./calculadoraModula";
import { obterImagemKit, carregarImagemBase64 } from "./kitImages";

export const MAX_ITENS_PDF = 23;

interface OrcamentoParaPDF {
  numero: string | null;
  descricao: string | null;
  status: string;
  data_validade: string | null;
  created_at?: string | null;
  area_total: number | null;
  valor_total: number | null;
  itens: unknown[] | null;
  cliente?: {
    nome?: string;
    documento?: string;
    endereco?: string;
    representante?: string;
    cidade?: string;
    contato?: string;
    referencia?: string;
    telefone?: string;
  } | null;
  empresa?: {
    nome?: string;
    cnpj?: string;
    endereco?: string;
    cidade?: string;
    telefone?: string;
  };
}

export interface PdfLinhaItem {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  largura: number;
  altura: number;
  m2: number;
  valorUnitario: number;
  pcFx: number;
  pcMl: number;
  vlM2: number;
  valorTotal: number;
  componentes?: { descricao: string; quantidade: number }[];
  /** Caminho da imagem do kit (apenas para exibição no PDF) */
  imagemPath?: string | null;
}

export interface ModeloPdfOrcamento {
  numero: string;
  descricao: string;
  status: string;
  dataEmissao: string;
  validade: string;
  cliente: Required<NonNullable<OrcamentoParaPDF["cliente"]>>;
  empresa: Required<NonNullable<OrcamentoParaPDF["empresa"]>>;
  itens: PdfLinhaItem[];
  totalGeral: number;
}

const fmtMoney = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR");

/**
 * Normaliza um item do novo formato (código) para linha do PDF.
 */
function normalizarLinhaNew(
  item: OrcamentoItem,
  index: number,
  tiposVidro: TipoVidroSupabase[],
  processamentos: ProcessamentoSupabase[]
): PdfLinhaItem {
  const produto = tiposVidro.find((t) => t.codigo === item.produtoCodigo);
  const proc = processamentos.find((p) => p.codigo === item.processamentoCodigo);
  const precoBase = produto?.preco ?? 0;
  const custoProc = proc?.custo ?? 0;
  const calculo = calcularItem(item, precoBase, custoProc);
  const larguraM = item.largura / 1000;
  const alturaM = item.altura / 1000;

  return {
    codigo: item.produtoCodigo || `ITM-${index + 1}`,
    descricao: `${produto?.label ?? "Produto"} ${proc?.label && proc.label !== "Nenhum" ? `— ${proc.label}` : ""}`.trim(),
    quantidade: item.quantidade,
    unidade: produto?.unidade ?? "m²",
    largura: larguraM,
    altura: alturaM,
    m2: calculo.area,
    valorUnitario: item.quantidade > 0 ? calculo.total / item.quantidade : 0,
    pcFx: custoProc,
    pcMl: 0,
    vlM2: precoBase,
    valorTotal: calculo.total,
  };
}

/**
 * Normaliza um item do formato legado (índice) para linha do PDF.
 * Fallback para orçamentos antigos que ainda usam tipoIdx/procIdx.
 */
function normalizarLinhaLegacy(
  item: OrcamentoItemLegacy,
  index: number,
  tiposVidro: TipoVidroSupabase[],
  processamentos: ProcessamentoSupabase[]
): PdfLinhaItem {
  const precoBase = tiposVidro[item.tipoIdx]?.preco ?? 0;
  const custoProc = processamentos[item.procIdx]?.custo ?? 0;
  const orcItem: OrcamentoItem = {
    produtoCodigo: tiposVidro[item.tipoIdx]?.codigo ?? "",
    largura: item.largura,
    altura: item.altura,
    quantidade: item.quantidade,
    processamentoCodigo: processamentos[item.procIdx]?.codigo ?? "",
  };
  const calculo = calcularItem(orcItem, precoBase, custoProc);
  const larguraM = item.largura / 1000;
  const alturaM = item.altura / 1000;

  return {
    codigo: `ITM-${index + 1}`,
    descricao: `${tiposVidro[item.tipoIdx]?.label ?? "Vidro"} ${processamentos[item.procIdx]?.label ?? ""}`.trim(),
    quantidade: item.quantidade,
    unidade: "und",
    largura: larguraM,
    altura: alturaM,
    m2: calculo.area,
    valorUnitario: item.quantidade > 0 ? calculo.total / item.quantidade : 0,
    pcFx: custoProc,
    pcMl: 0,
    vlM2: precoBase,
    valorTotal: calculo.total,
  };
}

/**
 * Detecta se um item salvo é um kit/serviço composto (com codigoServico).
 */
function isKitItem(item: unknown): item is { codigoServico: string; nomeServico?: string; largura: number; altura: number; quantidade: number; adicional?: number; componentes?: OrcamentoComponente[] } {
  if (!item || typeof item !== "object") return false;
  const candidate = item as Record<string, unknown>;
  return (
    typeof candidate.codigoServico === "string" &&
    candidate.codigoServico.length > 0 &&
    typeof candidate.largura === "number" &&
    typeof candidate.altura === "number" &&
    typeof candidate.quantidade === "number"
  );
}

/**
 * Normaliza um item de kit/serviço composto para linha do PDF.
 */
function normalizarLinhaKit(
  item: { codigoServico: string; nomeServico?: string; largura: number; altura: number; quantidade: number; adicional?: number; componentes?: OrcamentoComponente[] },
  index: number
): PdfLinhaItem {
  try {
    const servico = resolverServicoComComponentes(
      item.codigoServico,
      item.componentes
    );
    const calculo = calcularValorTotalLinha(
      {
        codigoServico: item.codigoServico,
        largura: item.largura,
        altura: item.altura,
        quantidade: item.quantidade,
        adicional: item.adicional ?? 0,
      },
      servico
    );

    const componentesInclusos = (item.componentes || [])
      .filter((c) => c.incluido)
      .map((c) => ({
        descricao: c.descricao,
        quantidade: c.quantidade * item.quantidade,
      }));

    return {
      codigo: item.codigoServico,
      descricao: item.nomeServico || servico.nome,
      quantidade: item.quantidade,
      unidade: "und",
      largura: item.largura,
      altura: item.altura,
      m2: calculo.m2,
      valorUnitario: calculo.precoUnitario,
      pcFx: servico.pcFx,
      pcMl: servico.pcMl,
      vlM2: servico.vlM2,
      valorTotal: calculo.valorTotal,
      componentes: componentesInclusos.length > 0 ? componentesInclusos : undefined,
      imagemPath: obterImagemKit(item.codigoServico),
    };
  } catch {
    return {
      codigo: item.codigoServico || `ITM-${index + 1}`,
      descricao: item.nomeServico || "Serviço",
      quantidade: item.quantidade,
      unidade: "und",
      largura: item.largura,
      altura: item.altura,
      m2: item.largura * item.altura * item.quantidade,
      valorUnitario: 0,
      pcFx: 0,
      pcMl: 0,
      vlM2: 0,
      valorTotal: 0,
    };
  }
}

/**
 * Normaliza qualquer formato de item para linha do PDF.
 */
function normalizarLinha(
  item: unknown,
  index: number,
  tiposVidro: TipoVidroSupabase[],
  processamentos: ProcessamentoSupabase[]
): PdfLinhaItem {
  // Kit/serviço composto (Janela, Porta, Box, etc.)
  if (isKitItem(item)) {
    return normalizarLinhaKit(item, index);
  }

  if (isNewFormatItem(item)) {
    return normalizarLinhaNew(item, index, tiposVidro, processamentos);
  }

  if (isLegacyItem(item)) {
    return normalizarLinhaLegacy(item, index, tiposVidro, processamentos);
  }

  return {
    codigo: `ITM-${index + 1}`,
    descricao: "Item não estruturado",
    quantidade: 1,
    unidade: "und",
    largura: 0,
    altura: 0,
    m2: 0,
    valorUnitario: 0,
    pcFx: 0,
    pcMl: 0,
    vlM2: 0,
    valorTotal: 0,
  };
}

export function limitarItensPdf<T>(itens: T[]): T[] {
  return itens.slice(0, MAX_ITENS_PDF);
}

export function montarModeloPdfOrcamento(
  orcamento: OrcamentoParaPDF,
  tiposVidro: TipoVidroSupabase[],
  processamentos: ProcessamentoSupabase[],
  hoje = new Date()
): ModeloPdfOrcamento {
  const itensBrutos = Array.isArray(orcamento.itens) ? orcamento.itens : [];
  const itensNormalizados = limitarItensPdf(itensBrutos).map((item, i) =>
    normalizarLinha(item, i, tiposVidro, processamentos)
  );
  const totalGeral = Number(itensNormalizados.reduce((acc, item) => acc + item.valorTotal, 0).toFixed(2));

  return {
    numero: orcamento.numero ?? "S/N",
    descricao: orcamento.descricao ?? "—",
    status: orcamento.status,
    dataEmissao: fmtDate(hoje),
    validade: orcamento.data_validade ? fmtDate(new Date(orcamento.data_validade)) : "—",
    cliente: {
      nome: orcamento.cliente?.nome ?? "Consumidor Final",
      documento: orcamento.cliente?.documento ?? "—",
      endereco: orcamento.cliente?.endereco ?? "—",
      representante: orcamento.cliente?.representante ?? "—",
      cidade: orcamento.cliente?.cidade ?? "—",
      contato: orcamento.cliente?.contato ?? "—",
      referencia: orcamento.cliente?.referencia ?? "—",
      telefone: orcamento.cliente?.telefone ?? "—",
    },
    empresa: {
      nome: orcamento.empresa?.nome ?? "ModulaAPP",
      cnpj: orcamento.empresa?.cnpj ?? "14.032.864/0001-08",
      endereco: orcamento.empresa?.endereco ?? "Av. Gil Ferreira Pessoa, Nº 70 - Matinha",
      cidade: orcamento.empresa?.cidade ?? "Livramento de Nossa Senhora - BA",
      telefone: orcamento.empresa?.telefone ?? "(77) 9.9995-9280 / (77) 3444-1022 / (77) 9.8145-5902",
    },
    itens: itensNormalizados,
    totalGeral,
  };
}

/**
 * Carrega a imagem do logo como base64 para embutir no PDF.
 */
async function carregarLogoBase64(): Promise<string> {
  try {
    const response = await fetch('/images/logo-modula.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

function logoImgTag(base64: string): string {
  if (!base64) return '';
  return `<img src="${base64}" alt="ModulaAPP" style="width: 220px; height: auto;" />`;
}

export function renderHtmlOrcamentoProfissional(
  modelo: ModeloPdfOrcamento,
  logoBase64: string = '',
  kitImagens: Record<string, string> = {}
): string {
  const linhas = modelo.itens
    .map(
      (item) => {
        const isKit = item.componentes && item.componentes.length > 0;
        const componentesCount = item.componentes?.length ?? 0;
        // Thumbnail da imagem do kit (base64 carregada previamente)
        const imgBase64 = item.imagemPath ? (kitImagens[item.imagemPath] ?? '') : '';
        const imgTag = imgBase64
          ? `<img src="${imgBase64}" alt="${item.descricao}" class="kit-img" />`
          : '';
        const hasImagem = !!imgTag;
        const imgRowspan = hasImagem && componentesCount > 0
          ? ` rowspan="${componentesCount + 1}"`
          : '';

        const kitRow = `
      <tr class="${isKit ? 'kit-header' : ''}">
        <td class="center img-col"${imgRowspan}>${imgTag}</td>
        <td>${item.codigo}</td>
        <td class="td-descricao"><span>${item.descricao}</span></td>
        <td class="center">${item.quantidade}</td>
        <td class="center">${item.unidade}</td>
        <td class="center">${item.largura.toFixed(2)}</td>
        <td class="center">${item.altura.toFixed(2)}</td>
        <td class="center">${item.m2.toFixed(2)}</td>
        <td class="right">${fmtMoney(item.valorUnitario)}</td>
        <td class="right">${fmtMoney(item.pcFx)}</td>
        <td class="right">${fmtMoney(item.pcMl)}</td>
        <td class="right">${fmtMoney(item.vlM2)}</td>
        <td class="right">${fmtMoney(item.valorTotal)}</td>
      </tr>`;

        if (!item.componentes || item.componentes.length === 0) {
          return kitRow;
        }

        // Renderizar componentes como sub-linhas
        const componentesRows = item.componentes
          .map(
            (comp) => {
              const imgCell = hasImagem ? '' : '<td></td>';
              const emptyColspan = hasImagem ? 10 : 9;
              return `
      <tr class="componente-row">
        ${imgCell}<td colspan="2">↳ ${comp.descricao}</td>
        <td class="center">${comp.quantidade.toFixed(1)}</td>
        <td class="center" colspan="${emptyColspan}"></td>
      </tr>`;
            }
          )
          .join("");

        return kitRow + componentesRows;
      },
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Orçamento ${modelo.numero}</title>
  <style>
    @page { margin: 12mm 10mm; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #231F20; }

    /* ═══ CABEÇALHO EMPRESA ═══ */
    .header-empresa {
      display: flex;
      border: 2px solid #A7A9AC;
      margin-bottom: 0;
    }
    .header-logo {
      flex-shrink: 0;
      padding: 6px 10px;
      border-right: 2px solid #A7A9AC;
      display: flex;
      align-items: center;
      background: #fff;
    }
    .header-info {
      flex: 1;
      padding: 6px 12px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2px;
    }
    .header-info .cidade-uf {
      font-size: 13px;
      font-weight: bold;
      text-transform: uppercase;
      text-align: center;
      color: #231F20;
    }
    .header-info .cnpj {
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      color: #231F20;
    }
    .header-info .telefones {
      font-size: 11px;
      text-align: center;
      color: #231F20;
      margin-top: 2px;
    }
    .header-info .endereco {
      font-size: 10px;
      text-align: center;
      color: #6D6E71;
      margin-top: 1px;
    }

    /* ═══ DADOS DO CLIENTE ═══ */
    .section-title {
      background: #A7A9AC;
      color: #fff;
      font-weight: bold;
      text-align: center;
      padding: 3px 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border: 1px solid #A7A9AC;
    }
    .cliente-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1px solid #A7A9AC;
      border-top: none;
    }
    .cliente-grid .field {
      padding: 3px 8px;
      font-size: 10px;
      border-bottom: 1px solid #ddd;
      border-right: 1px solid #ddd;
    }
    .cliente-grid .field:nth-child(even) { border-right: none; }
    .cliente-grid .field:nth-last-child(-n+2) { border-bottom: none; }
    .cliente-grid .field strong {
      font-size: 9px;
      text-transform: uppercase;
      color: #6D6E71;
    }
    .data-direita {
      text-align: right;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: bold;
      color: #231F20;
      border: 1px solid #A7A9AC;
      border-top: none;
    }

    /* ═══ DETALHAMENTO DO PEDIDO ═══ */
    .titulo-pedido {
      background: #fff;
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      letter-spacing: 2px;
      padding: 8px 0;
      border: 1px solid #A7A9AC;
      border-top: none;
      color: #231F20;
    }

    /* ═══ TABELA ITENS ═══ */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0;
    }
    th {
      background: #e8e8e8;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      padding: 4px 4px;
      border: 1px solid #A7A9AC;
      color: #231F20;
      text-align: center;
    }
    td {
      padding: 4px 4px;
      border: 1px solid #ddd;
      font-size: 10px;
    }
    .center { text-align: center; }
    .right { text-align: right; }

    /* ═══ ITENS DO KIT (SUB-LINHAS) ═══ */
    tr.kit-header {
      background: #e8f5e9;
      font-weight: bold;
    }
    tr.kit-header td {
      border-top: 2px solid #1B9E3E;
      border-bottom: 1px solid #A7A9AC;
    }
    tr.componente-row {
      background: #fafafa;
    }
    tr.componente-row td {
      padding: 2px 6px;
      font-size: 9px;
      color: #6D6E71;
      border: 1px dashed #ddd;
    }
    tr.componente-row td:first-child {
      padding-left: 20px;
    }

    /* ═══ IMAGEM DO KIT ═══ */
    .img-col {
      width: 150px;
      min-width: 150px;
      vertical-align: middle;
    }
    .kit-img {
      width: 140px;
      height: 105px;
      object-fit: contain;
      border-radius: 4px;
      border: 1px solid #bbb;
      background: #fff;
      display: block;
      margin: 0 auto;
    }

    /* ═══ TOTAIS ═══ */
    .total-geral {
      text-align: right;
      font-size: 16px;
      font-weight: bold;
      margin-top: 10px;
      padding: 8px;
      border: 2px solid #1B9E3E;
      background: #f0faf3;
      color: #1B9E3E;
    }
    .observacoes {
      margin-top: 8px;
      color: #6D6E71;
      font-size: 9px;
      line-height: 1.5;
    }

    /* ═══ ASSINATURA ═══ */
    .assinatura {
      margin-top: 50px;
      text-align: center;
    }
    .assinatura .linha {
      border-top: 1px solid #231F20;
      width: 280px;
      margin: 0 auto;
      padding-top: 6px;
      font-size: 10px;
      color: #6D6E71;
    }
  </style>
</head>
<body>
  <!-- CABEÇALHO EMPRESA -->
  <div class="header-empresa">
    <div class="header-logo">
      ${logoImgTag(logoBase64)}
    </div>
    <div class="header-info">
      <div class="cidade-uf">${modelo.empresa.cidade}</div>
      <div class="cnpj">CNPJ: ${modelo.empresa.cnpj}</div>
      <div class="telefones">${modelo.empresa.telefone}</div>
      <div class="endereco">${modelo.empresa.endereco}</div>
    </div>
  </div>

  <!-- DADOS DO CLIENTE -->
  <div class="section-title">Dados do Cliente</div>
  <div class="cliente-grid">
    <div class="field"><strong>Cliente:</strong> ${modelo.cliente.nome}</div>
    <div class="field"><strong>CNPJ / CPF:</strong> ${modelo.cliente.documento}</div>
    <div class="field"><strong>Endereço:</strong> ${modelo.cliente.endereco}</div>
    <div class="field"><strong>Representante:</strong> ${modelo.cliente.representante}</div>
    <div class="field"><strong>Cidade:</strong> ${modelo.cliente.cidade}</div>
    <div class="field"><strong>Contato:</strong> ${modelo.cliente.contato}</div>
    <div class="field"><strong>Ref.:</strong> ${modelo.cliente.referencia}</div>
    <div class="field"><strong>Tel:</strong> ${modelo.cliente.telefone}</div>
  </div>
  <div class="data-direita">${modelo.dataEmissao}</div>

  <!-- DETALHAMENTO DO PEDIDO -->
  <div class="titulo-pedido">DETALHAMENTO DO PEDIDO</div>

  <table>
    <thead>
      <tr>
        <th class="img-col">Imagem</th>
        <th>Código</th>
        <th>Descrição</th>
        <th>Qtd</th>
        <th>Unid</th>
        <th>Larg</th>
        <th>Alt</th>
        <th>M²</th>
        <th>Unt VL</th>
        <th>PÇ FX</th>
        <th>PÇ ML</th>
        <th>VL M²</th>
        <th>VL TOTAL</th>
      </tr>
    </thead>
    <tbody>${linhas}</tbody>
  </table>

  <div class="total-geral">TOTAL GERAL: ${fmtMoney(modelo.totalGeral)}</div>

  <div class="observacoes">
    Validade do orçamento: ${modelo.validade}<br/>
    Observações gerais: documento comercial sem valor fiscal.
  </div>

  <div class="assinatura">
    <div class="linha">Assinatura do Cliente / Responsável</div>
  </div>

</body>
</html>`;
}

export async function exportarOrcamentoPDF(
  orcamento: OrcamentoParaPDF,
  tiposVidro: TipoVidroSupabase[],
  processamentos: ProcessamentoSupabase[]
) {
  const logoBase64 = await carregarLogoBase64();
  const modelo = montarModeloPdfOrcamento(orcamento, tiposVidro, processamentos);

  // Pré-carrega imagens únicas de kits como base64
  const pathsUnicos = [...new Set(
    modelo.itens
      .map((i) => i.imagemPath)
      .filter((p): p is string => !!p)
  )];
  const kitImagens: Record<string, string> = {};
  await Promise.all(
    pathsUnicos.map(async (path) => {
      kitImagens[path] = await carregarImagemBase64(path);
    })
  );

  const html = renderHtmlOrcamentoProfissional(modelo, logoBase64, kitImagens);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) return;
  win.onload = () => {
    win.print();
  };
  win.onafterprint = () => {
    URL.revokeObjectURL(url);
    win.close();
  };
}
