import type { NfeSaida } from "@/hooks/useFiscalData";

export interface EmpresaData {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  telefone?: string;
}

export interface NfeItemLinha {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
}

const fmtCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const fmtDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
};

const onlyNumbers = (value: string) => value.replace(/\D/g, "");

export function formatarChaveAcesso(chave?: string): string {
  if (!chave) return "—";
  const nums = onlyNumbers(chave);
  return nums.match(/.{1,4}/g)?.join(" ") ?? nums;
}

function formatarCnpjCpf(doc?: string): string {
  if (!doc) return "—";
  const nums = onlyNumbers(doc);
  if (nums.length === 11) {
    return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (nums.length === 14) {
    return nums.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return doc;
}

function extrairDescricaoItem(item: unknown): string {
  if (!item || typeof item !== "object") return "Serviço / Produto";
  const candidate = item as Record<string, unknown>;

  if (typeof candidate.descricao === "string" && candidate.descricao.length > 0) {
    return candidate.descricao;
  }
  if (typeof candidate.nomeServico === "string" && candidate.nomeServico.length > 0) {
    return candidate.nomeServico;
  }
  if (typeof candidate.produtoCodigo === "string" && candidate.produtoCodigo.length > 0) {
    const parts: string[] = [candidate.produtoCodigo];
    if (typeof candidate.processamentoCodigo === "string" && candidate.processamentoCodigo.length > 0) {
      parts.push(candidate.processamentoCodigo);
    }
    return parts.join(" — ");
  }
  if (typeof candidate.tipoIdx === "number") {
    return `Item de vidro #${candidate.tipoIdx}`;
  }
  return "Serviço / Produto";
}

function extrairValorItem(item: unknown): number {
  if (!item || typeof item !== "object") return 0;
  const candidate = item as Record<string, unknown>;

  if (typeof candidate.valorTotal === "number" && candidate.valorTotal > 0) {
    return candidate.valorTotal;
  }
  const qtd = typeof candidate.quantidade === "number" ? candidate.quantidade : 1;
  if (typeof candidate.precoUnitario === "number" && candidate.precoUnitario > 0) {
    return candidate.precoUnitario * qtd;
  }
  if (typeof candidate.preco_unitario === "number" && candidate.preco_unitario > 0) {
    return candidate.preco_unitario * qtd;
  }
  if (typeof candidate.valor === "number" && candidate.valor > 0) {
    return candidate.valor * qtd;
  }
  return 0;
}

export function normalizarItensNfe(nfe: NfeSaida): NfeItemLinha[] {
  // Se houver descrição geral informada, emite uma única linha descritiva.
  if (nfe.descricao_itens && nfe.descricao_itens.trim().length > 0) {
    return [
      {
        codigo: "001",
        descricao: nfe.descricao_itens.trim(),
        quantidade: 1,
        unidade: "UN",
        valor_unitario: nfe.valor_total,
        valor_total: nfe.valor_total,
      },
    ];
  }

  const itens = Array.isArray(nfe.itens) ? nfe.itens : [];
  if (itens.length === 0) {
    return [
      {
        codigo: "001",
        descricao: "Serviços de vidraçaria conforme Ordem de Serviço",
        quantidade: 1,
        unidade: "UN",
        valor_unitario: nfe.valor_total,
        valor_total: nfe.valor_total,
      },
    ];
  }

  return itens.map((item, index) => {
    const valor = extrairValorItem(item);
    return {
      codigo: String(index + 1).padStart(3, "0"),
      descricao: extrairDescricaoItem(item),
      quantidade: typeof item === "object" && item !== null && "quantidade" in item ? Number((item as Record<string, unknown>).quantidade) || 1 : 1,
      unidade: "UN",
      valor_unitario: valor,
      valor_total: valor,
    };
  });
}

function logoSvgInline(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 110" fill="none" width="180" height="72">
  <rect width="260" height="110" fill="white"/>
  <rect x="4" y="4" width="36" height="28" rx="2" stroke="#A7A9AC" stroke-width="2" fill="none"/>
  <rect x="20" y="14" width="36" height="28" rx="2" stroke="#1B9E3E" stroke-width="2" fill="none"/>
  <g transform="translate(28, 34)">
    <rect x="0" y="0" width="28" height="28" rx="3" stroke="#A7A9AC" stroke-width="2" fill="white"/>
    <path d="M5 24 L10 8 L14 18 L18 8 L23 24" stroke="#1B9E3E" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="72" y="38" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" letter-spacing="0.5">
    <tspan fill="#231F20">MODU</tspan><tspan fill="#231F20">LA</tspan>
  </text>
  <text x="72" y="72" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="bold" letter-spacing="1.5">
    <tspan fill="#1B9E3E">A</tspan><tspan fill="#231F20">PP</tspan>
  </text>
  <text x="105" y="92" font-family="Georgia, 'Times New Roman', serif" font-size="9" font-style="italic" fill="#6D6E71" letter-spacing="0.3">
    A natureza cria nós transformamos
  </text>
</svg>`;
}

export function renderHtmlNfe(nfe: NfeSaida, empresa: EmpresaData): string {
  const itens = normalizarItensNfe(nfe);
  const totalItens = itens.reduce((acc, item) => acc + item.valor_total, 0);
  const baseCalculo = Math.max(totalItens, nfe.valor_total);
  const impostos = nfe.valor_impostos || 0;

  const linhas = itens
    .map(
      (item) => `
      <tr>
        <td class="center">${item.codigo}</td>
        <td>${item.descricao}</td>
        <td class="center">${item.quantidade}</td>
        <td class="center">${item.unidade}</td>
        <td class="right">${fmtCurrency(item.valor_unitario)}</td>
        <td class="right">${fmtCurrency(item.valor_total)}</td>
      </tr>`
    )
    .join("");

  const statusCor = nfe.status === "EMITIDA" ? "#1B9E3E" : nfe.status === "CANCELADA" ? "#DC2626" : "#6D6E71";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>NF-e ${nfe.numero}</title>
  <style>
    @page { margin: 10mm; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #231F20; }

    .container { border: 1px solid #A7A9AC; padding: 8px; }

    /* Cabeçalho DANFE */
    .danfe-header {
      display: flex;
      border: 1px solid #A7A9AC;
      margin-bottom: 6px;
    }
    .danfe-logo {
      flex-shrink: 0;
      padding: 6px;
      border-right: 1px solid #A7A9AC;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .danfe-title {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6px;
      border-right: 1px solid #A7A9AC;
    }
    .danfe-title h1 {
      font-size: 20px;
      letter-spacing: 4px;
      color: #231F20;
    }
    .danfe-title span {
      font-size: 9px;
      color: #6D6E71;
      text-transform: uppercase;
    }
    .danfe-number {
      flex-shrink: 0;
      width: 150px;
      padding: 6px;
      text-align: center;
    }
    .danfe-number .label {
      font-size: 9px;
      color: #6D6E71;
      text-transform: uppercase;
    }
    .danfe-number .value {
      font-size: 18px;
      font-weight: bold;
      color: #231F20;
    }

    /* Chave de acesso */
    .chave-box {
      border: 1px solid #A7A9AC;
      border-top: none;
      padding: 6px;
      text-align: center;
      margin-bottom: 6px;
    }
    .chave-box .label {
      font-size: 9px;
      color: #6D6E71;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
    }
    .chave-box .value {
      font-family: "Courier New", monospace;
      font-size: 12px;
      letter-spacing: 1px;
      font-weight: bold;
    }

    /* Grid de campos */
    .field-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
      border: 1px solid #A7A9AC;
      border-top: none;
      margin-bottom: 6px;
    }
    .field {
      padding: 5px 6px;
      border-right: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
    }
    .field:nth-child(3n) { border-right: none; }
    .field:nth-last-child(-n+3) { border-bottom: none; }
    .field.wide { grid-column: span 2; }
    .field .label {
      font-size: 8px;
      color: #6D6E71;
      text-transform: uppercase;
      display: block;
    }
    .field .value {
      font-size: 10px;
      font-weight: bold;
      color: #231F20;
    }

    /* Tabela de itens */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    th {
      background: #e8e8e8;
      font-size: 8px;
      font-weight: bold;
      text-transform: uppercase;
      padding: 5px 4px;
      border: 1px solid #A7A9AC;
      color: #231F20;
    }
    td {
      padding: 5px 4px;
      border: 1px solid #ddd;
      font-size: 10px;
    }
    .center { text-align: center; }
    .right { text-align: right; }

    /* Totais */
    .totals {
      display: flex;
      justify-content: flex-end;
      border: 1px solid #A7A9AC;
      border-top: none;
      padding: 6px;
      margin-bottom: 6px;
    }
    .totals table {
      width: 260px;
      margin: 0;
    }
    .totals td {
      border: none;
      padding: 3px 0;
    }
    .totals .total-row td {
      font-size: 12px;
      font-weight: bold;
      border-top: 1px solid #A7A9AC;
      padding-top: 6px;
    }

    /* Status e rodapé */
    .status-box {
      border: 1px solid ${statusCor};
      color: ${statusCor};
      text-align: center;
      padding: 6px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .footer {
      text-align: center;
      font-size: 8px;
      color: #6D6E71;
      margin-top: 8px;
    }
    .qr-placeholder {
      width: 80px;
      height: 80px;
      border: 1px dashed #A7A9AC;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: #6D6E71;
      text-align: center;
      margin: 0 auto 6px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="danfe-header">
      <div class="danfe-logo">${logoSvgInline()}</div>
      <div class="danfe-title">
        <h1>DANFE</h1>
        <span>Documento Auxiliar da Nota Fiscal Eletrônica</span>
        <span style="margin-top:4px; font-weight:bold;">Simples Nacional</span>
      </div>
      <div class="danfe-number">
        <div class="label">Nº</div>
        <div class="value">${nfe.numero.padStart(9, "0")}</div>
        <div class="label" style="margin-top:4px;">Série</div>
        <div class="value">${nfe.serie}</div>
      </div>
    </div>

    <div class="chave-box">
      <span class="label">Chave de Acesso</span>
      <span class="value">${formatarChaveAcesso(nfe.chave_acesso)}</span>
    </div>

    <div class="field-grid">
      <div class="field wide">
        <span class="label">Razão Social do Emitente</span>
        <span class="value">${empresa.razao_social || empresa.nome_fantasia}</span>
      </div>
      <div class="field">
        <span class="label">CNPJ</span>
        <span class="value">${formatarCnpjCpf(empresa.cnpj)}</span>
      </div>
      <div class="field wide">
        <span class="label">Endereço</span>
        <span class="value">${empresa.endereco || "—"}</span>
      </div>
      <div class="field">
        <span class="label">Cidade / UF</span>
        <span class="value">${empresa.cidade || "—"}</span>
      </div>
    </div>

    <div style="background:#A7A9AC; color:#fff; font-weight:bold; text-align:center; padding:4px; font-size:10px; text-transform:uppercase;">
      Destinatário / Tomador
    </div>
    <div class="field-grid">
      <div class="field wide">
        <span class="label">Nome / Razão Social</span>
        <span class="value">${nfe.cliente_nome || "—"}</span>
      </div>
      <div class="field">
        <span class="label">CPF / CNPJ</span>
        <span class="value">${formatarCnpjCpf(nfe.cliente_documento)}</span>
      </div>
    </div>

    <div style="background:#A7A9AC; color:#fff; font-weight:bold; text-align:center; padding:4px; font-size:10px; text-transform:uppercase;">
      Dados da NF-e
    </div>
    <div class="field-grid">
      <div class="field">
        <span class="label">Data de Emissão</span>
        <span class="value">${fmtDate(nfe.criado_em)}</span>
      </div>
      <div class="field">
        <span class="label">Natureza da Operação</span>
        <span class="value">Venda de Mercadoria / Prestação de Serviço</span>
      </div>
      <div class="field">
        <span class="label">Modelo</span>
        <span class="value">55</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Descrição do Produto / Serviço</th>
          <th>Qtd</th>
          <th>Un</th>
          <th>Vl. Unitário</th>
          <th>Vl. Total</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>

    <div class="totals">
      <table>
        <tbody>
          <tr>
            <td>Base de Cálculo:</td>
            <td class="right">${fmtCurrency(baseCalculo)}</td>
          </tr>
          <tr>
            <td>Impostos (Simples Nacional):</td>
            <td class="right">${fmtCurrency(impostos)}</td>
          </tr>
          <tr class="total-row">
            <td>Valor Total da Nota:</td>
            <td class="right">${fmtCurrency(nfe.valor_total)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="status-box">
      Status: ${nfe.status}
    </div>

    <div class="qr-placeholder">
      QR Code<br/>simulado
    </div>

    <div class="footer">
      Documento de controle interno gerado pelo ModulaAPP. Sem valor fiscal perante a SEFAZ.<br/>
      Emissão legal requer certificado digital A1 e integração com webservice autorizador.
    </div>
  </div>
</body>
</html>`;
}

export function imprimirNfe(nfe: NfeSaida, empresa: EmpresaData) {
  const html = renderHtmlNfe(nfe, empresa);
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
