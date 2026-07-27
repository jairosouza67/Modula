// ─────────────────────────────────────────────────────────────
// Vidraçaria Ornamental — Módulo Compras — Lógica de Negócio (Fase 2.5)
// Sprint 12A: Pedido de Compra, Liberação e Tracker 8 Etapas
// ─────────────────────────────────────────────────────────────

import {
  type EtapaPedidoCompra,
  type ItemPedidoCompra,
  type PedidoCompra,
  type ItemRomaneio,
  type NFeXMLDados,
  type CondicaoPagamento,
  type ParcelaPagamento,
  type CreditoFornecedor,
  type TabelaPrecoFornecedor,
  type ComparativoPreco,
  ETAPAS_PEDIDO,
} from './types';

// ─── Sprint 12A: Cálculos de Pedido de Compra ────────────────

/**
 * Calcula a área em m² de um item do pedido de compra.
 * Fórmula: (largura_mm × altura_mm × quantidade) ÷ 1.000.000
 */
export function calcularM2PedidoCompra(
  largura_mm: number,
  altura_mm: number,
  quantidade: number
): number {
  if (largura_mm <= 0 || altura_mm <= 0 || quantidade <= 0) return 0;
  return (largura_mm * altura_mm * quantidade) / 1_000_000;
}

/**
 * Calcula o valor total de um item com base nos m² e preço por m².
 */
export function calcularTotalItem(m2: number, preco_m2: number): number {
  return parseFloat((m2 * preco_m2).toFixed(2));
}

/**
 * Calcula os totalizadores do pedido: área total, qtd total, valor total.
 */
export function calcularTotaisPedido(itens: ItemPedidoCompra[]): {
  area_total_m2: number;
  qtd_total_pecas: number;
  valor_total: number;
} {
  return itens.reduce(
    (acc, item) => ({
      area_total_m2: parseFloat((acc.area_total_m2 + item.m2_calculado).toFixed(4)),
      qtd_total_pecas: acc.qtd_total_pecas + item.quantidade,
      valor_total: parseFloat((acc.valor_total + item.total).toFixed(2)),
    }),
    { area_total_m2: 0, qtd_total_pecas: 0, valor_total: 0 }
  );
}

/**
 * Determina o status inicial de um pedido baseado no valor e limite configurado.
 * Pedidos acima do limite → 'aguardando_liberacao'
 * Pedidos abaixo ou igual → 'autorizado' (avança direto)
 */
export function determinarStatusInicial(
  valor_total: number,
  limite_liberacao: number
): EtapaPedidoCompra {
  return valor_total > limite_liberacao ? 'aguardando_aprovacao' : 'aprovado';
}

/**
 * Valida se uma transição de etapa é permitida.
 * Regra: não pode avançar para 'enviado_fornecedor' sem estar em 'autorizado'.
 */
export function validarAvancoEtapa(
  etapa_atual: EtapaPedidoCompra,
  etapa_destino: EtapaPedidoCompra
): { valido: boolean; motivo?: string } {
  const indice_atual = ETAPAS_PEDIDO.indexOf(etapa_atual);
  const indice_destino = ETAPAS_PEDIDO.indexOf(etapa_destino);

  // Bloqueio: não pode pular para enviado sem aprovado
  if (etapa_destino === 'enviado' && etapa_atual !== 'aprovado') {
    return {
      valido: false,
      motivo: 'O pedido precisa estar "Aprovado" antes de ser enviado ao fornecedor.',
    };
  }

  // Bloqueio: não pode retroceder etapas
  if (indice_destino < indice_atual) {
    return {
      valido: false,
      motivo: 'Não é possível retroceder uma etapa do pedido.',
    };
  }

  // Bloqueio: não pode pular mais de uma etapa de vez
  if (indice_destino > indice_atual + 1) {
    return {
      valido: false,
      motivo: 'Não é possível pular etapas no fluxo de compras.',
    };
  }

  return { valido: true };
}

/**
 * Verifica se um pedido está aguardando liberação há mais de 48 horas.
 * Usado para gerar alertas no dashboard.
 */
export function pedidoAtrasadoNaLiberacao(pedido: PedidoCompra): boolean {
  if (pedido.status !== 'aguardando_aprovacao') return false;
  const criado = new Date(pedido.criado_em);
  const agora = new Date();
  const horas = (agora.getTime() - criado.getTime()) / (1000 * 60 * 60);
  return horas > 48;
}

/**
 * Calcula o índice de cumprimento de prazo para relatório RPT-04.
 * cumprimento_prazo = count(entregues_no_prazo) / total_pedidos × 100
 */
export function calcularCumprimentoPrazo(
  pedidos: Array<{ previsao_entrega: string; data_conclusao?: string }>
): number {
  const concluidos = pedidos.filter((p) => p.data_conclusao);
  if (concluidos.length === 0) return 0;

  const no_prazo = concluidos.filter((p) => {
    const previsao = new Date(p.previsao_entrega);
    const conclusao = new Date(p.data_conclusao!);
    return conclusao <= previsao;
  });

  return parseFloat(((no_prazo.length / concluidos.length) * 100).toFixed(1));
}

/**
 * Pré-preenche preços dos itens com base na tabela vigente do fornecedor.
 */
export function prePreencherPrecos(
  itens: ItemPedidoCompra[],
  tabela: TabelaPrecoFornecedor[],
  data_referencia: string = new Date().toISOString().slice(0, 10)
): ItemPedidoCompra[] {
  const tabelaVigente = filtrarPrecosVigentes(tabela, data_referencia);

  return itens.map((item) => {
    const preco = tabelaVigente.find(
      (t) => t.produto.toLowerCase() === item.produto.toLowerCase()
    );
    if (preco) {
      const m2 = calcularM2PedidoCompra(item.largura_mm, item.altura_mm, item.quantidade);
      return {
        ...item,
        preco_m2: preco.preco,
        m2_calculado: m2,
        total: calcularTotalItem(m2, preco.preco),
      };
    }
    return item;
  });
}

// ─── Sprint 12B: Romaneios ────────────────────────────────────

/**
 * Detecta divergências em um item de romaneio.
 * Retorna 'faltante' se qtd recebida < encomendada.
 */
export function detectarDivergencia(item: ItemRomaneio): ItemRomaneio['situacao'] {
  if (item.qtd_recebida < item.qtd_encomendada) return 'faltante';
  if (item.qtd_recebida === item.qtd_encomendada) return 'ok';
  return 'ok'; // qtd maior que encomendada → aceitar mas logar
}

/**
 * Calcula quais itens devem gerar movimentação de entrada no estoque.
 * Apenas itens com situação 'ok' geram entrada.
 */
export function calcularEntradaEstoque(
  itens: ItemRomaneio[]
): Array<{ produto: string; quantidade: number; m2: number }> {
  return itens
    .filter((item) => item.situacao === 'ok')
    .map((item) => ({
      produto: item.produto,
      quantidade: item.qtd_recebida,
      m2: item.m2,
    }));
}

/**
 * Verifica se o romaneio pode ser concluído (todos os itens com situação definida).
 */
export function romaneioPoderConcluir(itens: ItemRomaneio[]): boolean {
  return itens.every((item) =>
    ['ok', 'faltante', 'quebrado', 'fora_especificacao'].includes(item.situacao)
  );
}

// ─── Sprint 12C: NFe de Entrada ──────────────────────────────

/**
 * Validação simulada de estrutura XSD (NF-e 4.0).
 * Verifica a presença de tags obrigatórias mínimas.
 */
export function validarXSDNFe(xmlContent: string): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  const requiredTags = ['nNF', 'dhEmi', 'emit', 'dest', 'det', 'vNF'];

  for (const tag of requiredTags) {
    if (!xmlContent.includes(`<${tag}`) && !xmlContent.includes(`</${tag}>`)) {
      erros.push(`Tag obrigatória ausente: <${tag}>`);
    }
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Extrai dados relevantes de um XML de NFe (simulado — parser de texto).
 * Em produção: usar biblioteca xml2js ou DOMParser.
 */
export function parseXMLNFe(xmlContent: string): NFeXMLDados | null {
  try {
    const getTag = (tag: string): string => {
      const match = xmlContent.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
      return match ? match[1].trim() : '';
    };

    const numero = getTag('nNF');
    const serie = getTag('serie');
    const chave = xmlContent.match(/chNFe[">]+([0-9]{44})/)?.[1] ?? '';
    const cnpj_emit = getTag('CNPJ');
    const nome_emit = getTag('xNome');
    const data_emissao = getTag('dhEmi') || getTag('dEmi');
    const valor_nf = parseFloat(getTag('vNF') || '0');

    if (!numero || !chave) return null;

    // Extrai itens (simplificado)
    const itemMatches = [...xmlContent.matchAll(/<det[^>]*>([\s\S]*?)<\/det>/g)];
    const itens = itemMatches.map((m) => {
      const block = m[1];
      const getInBlock = (tag: string): string => {
        const match = block.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
        return match ? match[1].trim() : '';
      };
      return {
        codigo: getInBlock('cProd'),
        descricao: getInBlock('xProd'),
        ncm: getInBlock('NCM'),
        cfop: getInBlock('CFOP'),
        unidade: getInBlock('uCom'),
        quantidade: parseFloat(getInBlock('qCom') || '0'),
        valor_unitario: parseFloat(getInBlock('vUnCom') || '0'),
        valor_total: parseFloat(getInBlock('vProd') || '0'),
      };
    });

    return {
      numero,
      serie,
      chave_acesso: chave,
      fornecedor_cnpj: cnpj_emit,
      fornecedor_nome: nome_emit,
      data_emissao,
      valor_total: valor_nf,
      itens,
    };
  } catch {
    return null;
  }
}

/**
 * Tenta vincular uma NFe a um pedido de compra por número e fornecedor.
 */
export function vincularNFePedido(
  nfe: NFeXMLDados,
  pedidos: Array<{ id: string; numero: string; fornecedor_cnpj?: string }>
): string | null {
  const pedido = pedidos.find(
    (p) =>
      p.fornecedor_cnpj === nfe.fornecedor_cnpj
  );
  return pedido?.id ?? null;
}

/**
 * Verifica se uma NFe está sem lançamento SPED há mais de 7 dias.
 */
export function nfeAtrasadaSPED(data_emissao: string, status_sped: 'pendente' | 'lancada'): boolean {
  if (status_sped === 'lancada') return false;
  const emissao = new Date(data_emissao);
  const agora = new Date();
  const dias = (agora.getTime() - emissao.getTime()) / (1000 * 60 * 60 * 24);
  return dias > 7;
}

// ─── Sprint 12C: Condições de Pagamento ──────────────────────

/**
 * Calcula as datas de vencimento com base na condição de pagamento e data base.
 * Ex: prazos [30, 60, 90] + data base 01/06 → [01/07, 31/07, 30/08]
 */
export function calcularVencimentos(
  condicao: CondicaoPagamento,
  data_base: string,
  valor_total: number
): ParcelaPagamento[] {
  const base = new Date(data_base);
  const qtd_parcelas = condicao.prazos_dias.length;
  const valor_parcela = parseFloat((valor_total / qtd_parcelas).toFixed(2));

  return condicao.prazos_dias.map((prazo, index) => {
    const vencimento = new Date(base);
    vencimento.setDate(vencimento.getDate() + prazo);
    return {
      numero: index + 1,
      data_vencimento: vencimento.toISOString().slice(0, 10),
      valor: valor_parcela,
    };
  });
}

/**
 * Filtra formas de pagamento ativas.
 */
export function filtrarFormasAtivas<T extends { ativo: boolean }>(formas: T[]): T[] {
  return formas.filter((f) => f.ativo);
}

// ─── Sprint 12D: Créditos de Fornecedores ────────────────────

/**
 * Verifica créditos disponíveis de um fornecedor.
 */
export function verificarCreditoDisponivel(
  creditos: CreditoFornecedor[],
  fornecedor_id: string
): CreditoFornecedor[] {
  return creditos.filter(
    (c) =>
      c.fornecedor_id === fornecedor_id &&
      c.valor_disponivel > 0 &&
      c.status !== 'vencido' &&
      c.status !== 'utilizado'
  );
}

/**
 * Aplica um crédito em um pedido de compra.
 * Retorna o crédito atualizado com valor_disponivel decrementado.
 */
export function aplicarCredito(
  credito: CreditoFornecedor,
  valor_a_usar: number,
  pedido_id: string,
  pedido_numero: string
): { credito: CreditoFornecedor; sucesso: boolean; motivo?: string } {
  if (valor_a_usar > credito.valor_disponivel) {
    return {
      credito,
      sucesso: false,
      motivo: `Valor solicitado (R$ ${valor_a_usar.toFixed(2)}) maior que o disponível (R$ ${credito.valor_disponivel.toFixed(2)}).`,
    };
  }

  const novo_disponivel = parseFloat(
    (credito.valor_disponivel - valor_a_usar).toFixed(2)
  );
  const novo_status: CreditoFornecedor['status'] =
    novo_disponivel === 0
      ? 'utilizado'
      : 'parcialmente_utilizado';

  const uso = {
    id: crypto.randomUUID(),
    credito_id: credito.id,
    pedido_compra_id: pedido_id,
    pedido_numero,
    valor_utilizado: valor_a_usar,
    data_uso: new Date().toISOString(),
  };

  return {
    credito: {
      ...credito,
      valor_disponivel: novo_disponivel,
      status: novo_status,
      historico_uso: [...credito.historico_uso, uso],
    },
    sucesso: true,
  };
}

/**
 * Verifica se um fornecedor tem crédito ativo para alertar ao criar novo pedido.
 */
export function alertaCreditoNovoPedido(
  creditos: CreditoFornecedor[],
  fornecedor_id: string
): { tem_credito: boolean; valor_disponivel: number; mensagem?: string } {
  const disponiveis = verificarCreditoDisponivel(creditos, fornecedor_id);
  const total = disponiveis.reduce((acc, c) => acc + c.valor_disponivel, 0);

  if (disponiveis.length === 0) return { tem_credito: false, valor_disponivel: 0 };

  return {
    tem_credito: true,
    valor_disponivel: total,
    mensagem: `Atenção: este fornecedor possui R$ ${total.toFixed(2)} em créditos disponíveis. Deseja aplicar no pedido?`,
  };
}

// ─── Sprint 12D: Tabela de Preços Vigentes ───────────────────

/**
 * Filtra apenas os preços com vigência que abrange a data de referência.
 */
export function filtrarPrecosVigentes(
  tabela: TabelaPrecoFornecedor[],
  data_referencia: string = new Date().toISOString().slice(0, 10)
): TabelaPrecoFornecedor[] {
  const ref = new Date(data_referencia);
  return tabela.filter((t) => {
    const inicio = new Date(t.vigencia_inicio);
    const fim = new Date(t.vigencia_fim);
    return ref >= inicio && ref <= fim;
  });
}

/**
 * Verifica se alguma tabela de preços está expirando em ≤ 30 dias.
 */
export function alertaVigenciaTabela(
  tabela: TabelaPrecoFornecedor[]
): TabelaPrecoFornecedor[] {
  const hoje = new Date();
  return tabela.filter((t) => {
    const fim = new Date(t.vigencia_fim);
    const dias = (fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
    return dias >= 0 && dias <= 30;
  });
}

/**
 * Gera comparativo de preços entre fornecedores para um produto (RPT-05).
 */
export function comparativoPrecos(
  produto: string,
  tabelasTodos: Array<TabelaPrecoFornecedor & { fornecedor_id: string; fornecedor_nome: string }>,
  data_referencia: string = new Date().toISOString().slice(0, 10)
): ComparativoPreco {
  const vigentes = filtrarPrecosVigentes(tabelasTodos, data_referencia) as Array<
    TabelaPrecoFornecedor & { fornecedor_id: string; fornecedor_nome: string }
  >;
  const dosProduto = vigentes
    .filter((t) => t.produto.toLowerCase() === produto.toLowerCase())
    .sort((a, b) => a.preco - b.preco)
    .slice(0, 5)
    .map((t) => ({
      fornecedor_id: t.fornecedor_id,
      fornecedor_nome: t.fornecedor_nome,
      preco: t.preco,
      vigencia_fim: t.vigencia_fim,
    }));

  return { produto, fornecedores: dosProduto };
}

// ─── KPIs de Compras (RPT-04) ────────────────────────────────

/**
 * Agrega dados de compras por fornecedor para relatório RPT-04.
 */
export function agregarComprasPorFornecedor(
  pedidos: Array<{
    fornecedor_id: string;
    fornecedor_nome: string;
    area_total_m2: number;
    valor_total: number;
    previsao_entrega: string;
    data_conclusao?: string;
    status: EtapaPedidoCompra;
  }>
): Array<{
  fornecedor_id: string;
  fornecedor_nome: string;
  volume_m2: number;
  valor_total: number;
  total_pedidos: number;
  entregues_no_prazo: number;
  cumprimento_prazo_pct: number;
}> {
  const grupos = new Map<string, typeof pedidos>();

  for (const p of pedidos) {
    if (!grupos.has(p.fornecedor_id)) grupos.set(p.fornecedor_id, []);
    grupos.get(p.fornecedor_id)!.push(p);
  }

  return [...grupos.entries()].map(([forn_id, ps]) => {
    const entregues = ps.filter((p) => p.status === 'recebido_total' && p.data_conclusao);
    const no_prazo = entregues.filter((p) => {
      const prev = new Date(p.previsao_entrega);
      const concl = new Date(p.data_conclusao!);
      return concl <= prev;
    });

    return {
      fornecedor_id: forn_id,
      fornecedor_nome: ps[0].fornecedor_nome,
      volume_m2: parseFloat(ps.reduce((a, p) => a + p.area_total_m2, 0).toFixed(4)),
      valor_total: parseFloat(ps.reduce((a, p) => a + p.valor_total, 0).toFixed(2)),
      total_pedidos: ps.length,
      entregues_no_prazo: no_prazo.length,
      cumprimento_prazo_pct:
        entregues.length > 0
          ? parseFloat(((no_prazo.length / entregues.length) * 100).toFixed(1))
          : 0,
    };
  });
}

/**
 * Gera histórico de variação de preços por produto/fornecedor (RPT-05).
 */
export function historicoPrecosCompra(
  itens_pedidos: Array<{
    produto: string;
    fornecedor_id: string;
    fornecedor_nome: string;
    preco_m2: number;
    data: string;
  }>
): Array<{
  produto: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  historico: Array<{ data: string; preco: number }>;
  variacao_pct: number;
}> {
  const chave = (p: string, f: string) => `${p}__${f}`;
  const grupos = new Map<string, typeof itens_pedidos>();

  for (const item of itens_pedidos) {
    const k = chave(item.produto, item.fornecedor_id);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(item);
  }

  return [...grupos.entries()].map(([, items]) => {
    const sorted = [...items].sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );
    const historico = sorted.map((i) => ({ data: i.data, preco: i.preco_m2 }));
    const variacao =
      historico.length >= 2
        ? parseFloat(
            (
              ((historico[historico.length - 1].preco - historico[0].preco) /
                historico[0].preco) *
              100
            ).toFixed(1)
          )
        : 0;

    return {
      produto: items[0].produto,
      fornecedor_id: items[0].fornecedor_id,
      fornecedor_nome: items[0].fornecedor_nome,
      historico,
      variacao_pct: variacao,
    };
  });
}

/**
 * Agrega créditos de fornecedores para relatório RPT-06.
 */
export function agregarCreditosFornecedores(
  creditos: CreditoFornecedor[]
): Array<{
  fornecedor_id: string;
  fornecedor_nome: string;
  total_disponivel: number;
  total_utilizado: number;
  total_vencido: number;
}> {
  const grupos = new Map<string, CreditoFornecedor[]>();

  for (const c of creditos) {
    if (!grupos.has(c.fornecedor_id)) grupos.set(c.fornecedor_id, []);
    grupos.get(c.fornecedor_id)!.push(c);
  }

  return [...grupos.entries()].map(([forn_id, cs]) => {
    const disponiveis = cs.filter((c) =>
      ['disponivel', 'parcialmente_utilizado'].includes(c.status)
    );
    const utilizados = cs.filter((c) => c.status === 'utilizado');
    const vencidos = cs.filter((c) => c.status === 'vencido');

    return {
      fornecedor_id: forn_id,
      fornecedor_nome: cs[0].fornecedor_nome,
      total_disponivel: parseFloat(
        disponiveis.reduce((a, c) => a + c.valor_disponivel, 0).toFixed(2)
      ),
      total_utilizado: parseFloat(
        utilizados.reduce((a, c) => a + c.valor_original, 0).toFixed(2)
      ),
      total_vencido: parseFloat(
        vencidos.reduce((a, c) => a + c.valor_original, 0).toFixed(2)
      ),
    };
  });
}
