import {
  calcularItem,
  isLegacyItem,
  isNewFormatItem,
  type OrcamentoItem,
  type OrcamentoItemLegacy,
} from "./calculator";
import type { TipoVidroSupabase, ProcessamentoSupabase } from "@/hooks/useProdutosOrcamento";
import { obterImagemKit, carregarImagemBase64 } from "./kitImages";

export const MAX_ITENS_PDF = 23;

interface OSParaPDF {
  numero: string | null;
  status: string;
  data_previsao: string | null;
  created_at?: string | null;
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

export interface PdfLinhaItemOS {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  largura: number;
  altura: number;
  m2: number;
  componentes?: { descricao: string; quantidade: number }[];
  /** Caminho da imagem do kit (apenas para exibição no PDF) */
  imagemPath?: string | null;
}

export interface ModeloPdfOS {
  numero: string;
  status: string;
  dataEmissao: string;
  previsao: string;
  cliente: Required<NonNullable<OSParaPDF["cliente"]>>;
  empresa: Required<NonNullable<OSParaPDF["empresa"]>>;
  itens: PdfLinhaItemOS[];
}

const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR");

function normalizarLinhaNew(
  item: OrcamentoItem,
  index: number,
  tiposVidro: TipoVidroSupabase[],
  processamentos: ProcessamentoSupabase[],
): PdfLinhaItemOS {
  const produto = tiposVidro.find((t) => t.codigo === item.produtoCodigo);
  const proc = processamentos.find((p) => p.codigo === item.processamentoCodigo);
  const calculo = calcularItem(item, 0, 0); // não precisamos de preço para OS
  const larguraM = item.largura / 1000;
  const alturaM = item.altura / 1000;

  return {
    codigo: item.produtoCodigo || `ITM-${index + 1}`,
    descricao:
      `${produto?.label ?? "Produto"} ${proc?.label && proc.label !== "Nenhum" ? `— ${proc.label}` : ""}`.trim(),
    quantidade: item.quantidade,
    unidade: produto?.unidade ?? "m²",
    largura: larguraM,
    altura: alturaM,
    m2: calculo.area,
  };
}

function normalizarLinhaLegacy(
  item: OrcamentoItemLegacy,
  index: number,
  tiposVidro: TipoVidroSupabase[],
  processamentos: ProcessamentoSupabase[],
): PdfLinhaItemOS {
  const orcItem: OrcamentoItem = {
    produtoCodigo: tiposVidro[item.tipoIdx]?.codigo ?? "",
    largura: item.largura,
    altura: item.altura,
    quantidade: item.quantidade,
    processamentoCodigo: processamentos[item.procIdx]?.codigo ?? "",
  };
  const calculo = calcularItem(orcItem, 0, 0);
  const larguraM = item.largura / 1000;
  const alturaM = item.altura / 1000;

  return {
    codigo: `ITM-${index + 1}`,
    descricao:
      `${tiposVidro[item.tipoIdx]?.label ?? "Vidro"} ${processamentos[item.procIdx]?.label ?? ""}`.trim(),
    quantidade: item.quantidade,
    unidade: "und",
    largura: larguraM,
    altura: alturaM,
    m2: calculo.area,
  };
}

function normalizarLinha(
  item: unknown,
  index: number,
  tiposVidro: TipoVidroSupabase[],
  processamentos: ProcessamentoSupabase[],
): PdfLinhaItemOS {
  // Verificar se é um item de kit
  if (item && typeof item === "object") {
    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.codigoServico === "string" &&
      candidate.codigoServico.length > 0 &&
      typeof candidate.largura === "number" &&
      typeof candidate.altura === "number" &&
      typeof candidate.quantidade === "number"
    ) {
      const kitItem = item as {
        codigoServico: string;
        nomeServico?: string;
        largura: number;
        altura: number;
        quantidade: number;
        componentes?: Array<{ descricao: string; quantidade: number; incluido?: boolean }>;
      };

      const componentesInclusos = (kitItem.componentes || [])
        .filter((c) => c.incluido !== false)
        .map((c) => ({
          descricao: c.descricao,
          quantidade: c.quantidade * kitItem.quantidade,
        }));

      return {
        codigo: kitItem.codigoServico,
        descricao: kitItem.nomeServico || kitItem.codigoServico,
        quantidade: kitItem.quantidade,
        unidade: "und",
        largura: kitItem.largura,
        altura: kitItem.altura,
        m2: kitItem.largura * kitItem.altura * kitItem.quantidade,
        componentes: componentesInclusos.length > 0 ? componentesInclusos : undefined,
        imagemPath: obterImagemKit(kitItem.codigoServico),
      };
    }
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
  };
}

export function limitarItensPdf<T>(itens: T[]): T[] {
  return itens.slice(0, MAX_ITENS_PDF);
}

export function montarModeloPdfOS(
  os: OSParaPDF,
  tiposVidro: TipoVidroSupabase[],
  processamentos: ProcessamentoSupabase[],
  hoje = new Date(),
): ModeloPdfOS {
  const itensBrutos = Array.isArray(os.itens) ? os.itens : [];
  const itensNormalizados = limitarItensPdf(itensBrutos).map((item, i) =>
    normalizarLinha(item, i, tiposVidro, processamentos),
  );

  return {
    numero: os.numero ?? "S/N",
    status: os.status,
    dataEmissao: fmtDate(hoje),
    previsao: os.data_previsao ? fmtDate(new Date(os.data_previsao)) : "—",
    cliente: {
      nome: os.cliente?.nome ?? "Consumidor Final",
      documento: os.cliente?.documento ?? "—",
      endereco: os.cliente?.endereco ?? "—",
      representante: os.cliente?.representante ?? "—",
      cidade: os.cliente?.cidade ?? "—",
      contato: os.cliente?.contato ?? "—",
      referencia: os.cliente?.referencia ?? "—",
      telefone: os.cliente?.telefone ?? "—",
    },
    empresa: {
      nome: os.empresa?.nome ?? "Vidraçaria Ornamental",
      cnpj: os.empresa?.cnpj ?? "14.032.864/0001-08",
      endereco: os.empresa?.endereco ?? "Av. Gil Ferreira Pessoa, Nº 70 — Matinha",
      cidade: os.empresa?.cidade ?? "Livramento de Nossa Senhora — BA",
      telefone: os.empresa?.telefone ?? "(77) 9.9995-9280 / (77) 3444-1022 / (77) 9.8145-5902",
    },
    itens: itensNormalizados,
  };
}

/**
 * Gera o SVG inline do logo Vidraçaria Ornamental para uso em PDFs.
 */
function logoSvgInline(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 110" fill="none" width="220" height="90">
  <rect width="260" height="110" fill="white"/>
  <rect x="4" y="4" width="36" height="28" rx="2" stroke="#A7A9AC" stroke-width="2" fill="none"/>
  <rect x="20" y="14" width="36" height="28" rx="2" stroke="#1B9E3E" stroke-width="2" fill="none"/>
  <g transform="translate(28, 34)">
    <rect x="0" y="0" width="28" height="28" rx="3" stroke="#A7A9AC" stroke-width="2" fill="white"/>
    <path d="M7 6 L14 22 L21 6" stroke="#1B9E3E" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="72" y="38" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" letter-spacing="0.5">
    <tspan fill="#231F20">IDRA</tspan><tspan fill="#231F20">Ç</tspan><tspan fill="#231F20">ARIA</tspan>
  </text>
  <text x="72" y="72" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="bold" letter-spacing="1.5">
    <tspan fill="#1B9E3E">O</tspan><tspan fill="#231F20">RNAMENT</tspan><tspan fill="#231F20">A</tspan><tspan fill="#1B9E3E">L</tspan>
  </text>
  <text x="105" y="92" font-family="Georgia, 'Times New Roman', serif" font-size="9" font-style="italic" fill="#6D6E71" letter-spacing="0.3">
    A natureza cria nós transformamos
  </text>
</svg>`;
}

export function renderHtmlOS(modelo: ModeloPdfOS, kitImagens: Record<string, string> = {}): string {
  const linhas = modelo.itens
    .map(
      (item) => {
        const isKit = item.componentes && item.componentes.length > 0;
        // Thumbnail da imagem do kit (base64 carregada previamente)
        const imgBase64 = item.imagemPath ? (kitImagens[item.imagemPath] ?? '') : '';
        const imgTag = imgBase64
          ? `<img src="${imgBase64}" alt="${item.descricao}" class="kit-img" />`
          : '';

        const kitRow = `
      <tr class="${isKit ? 'kit-header' : ''}">
        <td>${item.codigo}</td>
        <td class="td-descricao">${imgTag}<span>${item.descricao}</span></td>
        <td class="center">${item.quantidade}</td>
        <td class="center">${item.unidade}</td>
        <td class="center">${item.largura.toFixed(2)}</td>
        <td class="center">${item.altura.toFixed(2)}</td>
        <td class="center">${item.m2.toFixed(2)}</td>
      </tr>`;

        if (!item.componentes || item.componentes.length === 0) {
          return kitRow;
        }

        // Renderizar componentes como sub-linhas
        const componentesRows = item.componentes
          .map(
            (comp) => `
      <tr class="componente-row">
        <td colspan="2">↳ ${comp.descricao}</td>
        <td class="center">${comp.quantidade.toFixed(1)}</td>
        <td class="center" colspan="4"></td>
      </tr>`
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
  <title>Ordem de Serviço ${modelo.numero}</title>
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

    /* ═══ TÍTULO ═══ */
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
    .td-descricao {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .kit-img {
      width: 48px;
      height: 36px;
      object-fit: cover;
      border-radius: 3px;
      border: 1px solid #ccc;
      flex-shrink: 0;
    }

    /* ═══ RODAPÉ ═══ */
    .observacoes {
      margin-top: 12px;
      color: #6D6E71;
      font-size: 9px;
      line-height: 1.5;
    }
    .assinatura {
      margin-top: 60px;
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
      ${logoSvgInline()}
    </div>
    <div class="header-info">
      <div class="cidade-uf">${modelo.empresa.cidade}</div>
      <div class="cnpj">CNPJ: ${modelo.empresa.cnpj}</div>
      <div class="telefones">${modelo.empresa.telefone}</div>
      <div class="endereco">${modelo.empresa.endereco}</div>
    </div>
  </div>

  <!-- DADOS DO CLIENTE -->
  <div class="section-title">Ordem de Serviço — ${modelo.numero} — ${modelo.status}</div>
  <div class="cliente-grid">
    <div class="field"><strong>Cliente:</strong> ${modelo.cliente.nome}</div>
    <div class="field"><strong>CNPJ / CPF:</strong> ${modelo.cliente.documento}</div>
    <div class="field"><strong>Endereço:</strong> ${modelo.cliente.endereco}</div>
    <div class="field"><strong>Representante:</strong> ${modelo.cliente.representante}</div>
    <div class="field"><strong>Cidade:</strong> ${modelo.cliente.cidade}</div>
    <div class="field"><strong>Contato:</strong> ${modelo.cliente.contato}</div>
    <div class="field"><strong>Ref.:</strong> ${modelo.cliente.referencia}</div>
    <div class="field"><strong>Tel:</strong> (77) ${modelo.cliente.telefone}</div>
  </div>
  <div class="data-direita">Emissão: ${modelo.dataEmissao} &nbsp;|&nbsp; Previsão: ${modelo.previsao}</div>

  <!-- ITENS -->
  <div class="titulo-pedido">DETALHAMENTO DA ORDEM DE SERVIÇO</div>

  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Descrição</th>
        <th>Qtd</th>
        <th>Unid</th>
        <th>Larg</th>
        <th>Alt</th>
        <th>M²</th>
      </tr>
    </thead>
    <tbody>${linhas}</tbody>
  </table>

  <div class="observacoes">
    Documento interno para produção e instalação. Sem valor fiscal.
  </div>

  <div class="assinatura">
    <div class="linha">Assinatura do Técnico / Responsável</div>
  </div>
</body>
</html>`;
}

export async function exportarOsPDF(
  os: OSParaPDF,
  tiposVidro: TipoVidroSupabase[],
  processamentos: ProcessamentoSupabase[],
) {
  const modelo = montarModeloPdfOS(os, tiposVidro, processamentos);

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

  const html = renderHtmlOS(modelo, kitImagens);
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
