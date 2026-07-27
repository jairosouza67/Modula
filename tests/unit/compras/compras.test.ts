import { describe, it, expect } from 'vitest';
import {
  calcularM2PedidoCompra,
  calcularTotaisPedido,
  determinarStatusInicial,
  validarAvancoEtapa,
  pedidoAtrasadoNaLiberacao,
  calcularCumprimentoPrazo,
  prePreencherPrecos,
  detectarDivergencia,
  calcularEntradaEstoque,
  romaneioPoderConcluir,
  parseXMLNFe,
  vincularNFePedido,
  nfeAtrasadaSPED,
  calcularVencimentos,
  filtrarFormasAtivas,
  verificarCreditoDisponivel,
  aplicarCredito,
  alertaCreditoNovoPedido,
  filtrarPrecosVigentes,
  alertaVigenciaTabela,
  comparativoPrecos,
  agregarComprasPorFornecedor,
  historicoPrecosCompra,
  agregarCreditosFornecedores,
} from '../../../src/lib/compras/compras';
import type {
  ItemPedidoCompra,
  ItemRomaneio,
  CondicaoPagamento,
  CreditoFornecedor,
  TabelaPrecoFornecedor,
  PedidoCompra,
} from '../../../src/lib/compras/types';

// ─── Helpers ────────────────────────────────────────────────

const makeItem = (overrides: Partial<ItemPedidoCompra> = {}): ItemPedidoCompra => ({
  id: '1',
  pedido_id: 'pc-1',
  produto: 'Vidro Temperado 8mm',
  largura_mm: 1000,
  altura_mm: 2000,
  quantidade: 2,
  m2_calculado: 4,
  preco_m2: 150,
  total: 600,
  ...overrides,
});

const makeCredito = (overrides: Partial<CreditoFornecedor> = {}): CreditoFornecedor => ({
  id: 'c-1',
  fornecedor_id: 'f-1',
  fornecedor_nome: 'Vidros SA',
  tipo: 'devolucao',
  numero: 'NC-001',
  valor_original: 500,
  valor_disponivel: 500,
  data_emissao: '2026-01-01',
  data_vencimento: '2026-12-31',
  status: 'disponivel',
  historico_uso: [],
  ...overrides,
});

const makeTabela = (overrides: Partial<TabelaPrecoFornecedor & { fornecedor_id: string; fornecedor_nome: string }> = {}) => ({
  id: 't-1',
  fornecedor_id: 'f-1',
  fornecedor_nome: 'Vidros SA',
  produto: 'Vidro Temperado 8mm',
  unidade: 'm2',
  preco: 150,
  vigencia_inicio: '2026-01-01',
  vigencia_fim: '2026-12-31',
  ...overrides,
});

// ─── Sprint 12A: calcularM2PedidoCompra ─────────────────────

describe('calcularM2PedidoCompra', () => {
  it('calcula m² corretamente: 1000×2000×2 = 4m²', () => {
    expect(calcularM2PedidoCompra(1000, 2000, 2)).toBe(4);
  });

  it('retorna 0 para dimensões negativas', () => {
    expect(calcularM2PedidoCompra(-100, 2000, 1)).toBe(0);
  });

  it('retorna 0 para quantidade zero', () => {
    expect(calcularM2PedidoCompra(1000, 2000, 0)).toBe(0);
  });

  it('calcula frações corretamente: 500×800×1 = 0.4m²', () => {
    expect(calcularM2PedidoCompra(500, 800, 1)).toBeCloseTo(0.4);
  });
});

// ─── Sprint 12A: calcularTotaisPedido ───────────────────────

describe('calcularTotaisPedido', () => {
  it('soma área, quantidade e valor de múltiplos itens', () => {
    const itens = [
      makeItem({ m2_calculado: 4, quantidade: 2, total: 600 }),
      makeItem({ id: '2', m2_calculado: 2, quantidade: 1, total: 300 }),
    ];
    const totais = calcularTotaisPedido(itens);
    expect(totais.area_total_m2).toBeCloseTo(6);
    expect(totais.qtd_total_pecas).toBe(3);
    expect(totais.valor_total).toBeCloseTo(900);
  });

  it('retorna zeros para lista vazia', () => {
    const totais = calcularTotaisPedido([]);
    expect(totais.area_total_m2).toBe(0);
    expect(totais.qtd_total_pecas).toBe(0);
    expect(totais.valor_total).toBe(0);
  });
});

// ─── Sprint 12A: determinarStatusInicial ────────────────────

describe('determinarStatusInicial', () => {
  it('pedido acima do limite → aguardando_liberacao', () => {
    expect(determinarStatusInicial(10000, 5000)).toBe('aguardando_liberacao');
  });

  it('pedido abaixo do limite → autorizado direto', () => {
    expect(determinarStatusInicial(3000, 5000)).toBe('autorizado');
  });

  it('pedido exatamente no limite → autorizado', () => {
    expect(determinarStatusInicial(5000, 5000)).toBe('autorizado');
  });
});

// ─── Sprint 12A: validarAvancoEtapa ─────────────────────────

describe('validarAvancoEtapa', () => {
  it('bloqueia envio ao fornecedor sem autorização', () => {
    const result = validarAvancoEtapa('aguardando_liberacao', 'enviado_fornecedor');
    expect(result.valido).toBe(false);
    expect(result.motivo).toContain('Autorizado');
  });

  it('permite avançar de autorizado para enviado_fornecedor', () => {
    const result = validarAvancoEtapa('autorizado', 'enviado_fornecedor');
    expect(result.valido).toBe(true);
  });

  it('bloqueia retrocesso de etapa', () => {
    const result = validarAvancoEtapa('em_transporte', 'autorizado');
    expect(result.valido).toBe(false);
  });

  it('bloqueia pulo de mais de uma etapa', () => {
    const result = validarAvancoEtapa('emissao', 'autorizado');
    expect(result.valido).toBe(false);
  });
});

// ─── Sprint 12A: pedidoAtrasadoNaLiberacao ──────────────────

describe('pedidoAtrasadoNaLiberacao', () => {
  it('detecta pedido aguardando há mais de 48h', () => {
    const data = new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString();
    const pedido = { status: 'aguardando_liberacao', criado_em: data } as PedidoCompra;
    expect(pedidoAtrasadoNaLiberacao(pedido)).toBe(true);
  });

  it('não alerta pedido recente', () => {
    const data = new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString();
    const pedido = { status: 'aguardando_liberacao', criado_em: data } as PedidoCompra;
    expect(pedidoAtrasadoNaLiberacao(pedido)).toBe(false);
  });

  it('não alerta pedido já concluído', () => {
    const data = new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString();
    const pedido = { status: 'concluido', criado_em: data } as PedidoCompra;
    expect(pedidoAtrasadoNaLiberacao(pedido)).toBe(false);
  });
});

// ─── Sprint 12A: calcularCumprimentoPrazo (RPT-04) ──────────

describe('calcularCumprimentoPrazo — RPT-04', () => {
  it('calcula 100% quando todos entregues no prazo', () => {
    const pedidos = [
      { previsao_entrega: '2026-06-10', data_conclusao: '2026-06-08' },
      { previsao_entrega: '2026-06-15', data_conclusao: '2026-06-14' },
    ];
    expect(calcularCumprimentoPrazo(pedidos)).toBe(100);
  });

  it('calcula 50% quando metade entregue no prazo', () => {
    const pedidos = [
      { previsao_entrega: '2026-06-10', data_conclusao: '2026-06-08' },
      { previsao_entrega: '2026-06-10', data_conclusao: '2026-06-12' },
    ];
    expect(calcularCumprimentoPrazo(pedidos)).toBe(50);
  });

  it('retorna 0 quando nenhum pedido concluído', () => {
    const pedidos = [{ previsao_entrega: '2026-06-10' }];
    expect(calcularCumprimentoPrazo(pedidos)).toBe(0);
  });
});

// ─── Sprint 12A: prePreencherPrecos ─────────────────────────

describe('prePreencherPrecos', () => {
  it('preenche preço e m² automaticamente da tabela vigente', () => {
    const tabela = [makeTabela({ produto: 'Vidro Temperado 8mm', preco: 150 })];
    const itens = [makeItem({ preco_m2: 0, m2_calculado: 0, total: 0 })];
    const result = prePreencherPrecos(itens, tabela, '2026-06-01');
    expect(result[0].preco_m2).toBe(150);
    expect(result[0].m2_calculado).toBeCloseTo(4);
  });

  it('não altera item se produto não encontrado na tabela', () => {
    const tabela = [makeTabela({ produto: 'Outro Produto' })];
    const itens = [makeItem({ preco_m2: 99 })];
    const result = prePreencherPrecos(itens, tabela, '2026-06-01');
    expect(result[0].preco_m2).toBe(99);
  });
});

// ─── Sprint 12B: detectarDivergencia ────────────────────────

describe('detectarDivergencia', () => {
  it('retorna faltante quando qtd recebida < encomendada', () => {
    const item = { qtd_encomendada: 10, qtd_recebida: 7 } as ItemRomaneio;
    expect(detectarDivergencia(item)).toBe('faltante');
  });

  it('retorna ok quando quantidades iguais', () => {
    const item = { qtd_encomendada: 10, qtd_recebida: 10 } as ItemRomaneio;
    expect(detectarDivergencia(item)).toBe('ok');
  });
});

// ─── Sprint 12B: calcularEntradaEstoque ─────────────────────

describe('calcularEntradaEstoque', () => {
  it('apenas itens OK geram movimentação', () => {
    const itens: ItemRomaneio[] = [
      { situacao: 'ok', produto: 'A', qtd_recebida: 5, m2: 2 } as ItemRomaneio,
      { situacao: 'quebrado', produto: 'B', qtd_recebida: 2, m2: 1 } as ItemRomaneio,
      { situacao: 'faltante', produto: 'C', qtd_recebida: 0, m2: 0 } as ItemRomaneio,
    ];
    const result = calcularEntradaEstoque(itens);
    expect(result).toHaveLength(1);
    expect(result[0].produto).toBe('A');
  });
});

// ─── Sprint 12B: romaneioPoderConcluir ──────────────────────

describe('romaneioPoderConcluir', () => {
  it('bloqueia conclusão se algum item sem situação definida', () => {
    const itens = [
      { situacao: 'ok' },
      { situacao: undefined },
    ] as ItemRomaneio[];
    expect(romaneioPoderConcluir(itens)).toBe(false);
  });

  it('permite conclusão quando todos têm situação', () => {
    const itens = [
      { situacao: 'ok' },
      { situacao: 'faltante' },
    ] as ItemRomaneio[];
    expect(romaneioPoderConcluir(itens)).toBe(true);
  });
});

// ─── Sprint 12C: parseXMLNFe (FIS-05) ───────────────────────

describe('parseXMLNFe — FIS-05', () => {
  const xmlValido = `
    <nfeProc>
      <NFe>
        <infNFe>
          <ide><nNF>1234</nNF><serie>1</serie></ide>
          <emit><CNPJ>12345678000195</CNPJ><xNome>Vidros SA</xNome></emit>
          <ide><dhEmi>2026-06-01T10:00:00</dhEmi></ide>
          <total><ICMSTot><vNF>15000.00</vNF></ICMSTot></total>
        </infNFe>
      </NFe>
      <protNFe><infProt><chNFe>12345678901234567890123456789012345678901234</chNFe></infProt></protNFe>
    </nfeProc>
  `;

  it('extrai número, série, CNPJ e valor de XML válido', () => {
    const result = parseXMLNFe(xmlValido);
    expect(result).not.toBeNull();
    expect(result?.numero).toBe('1234');
    expect(result?.serie).toBe('1');
    expect(result?.valor_total).toBe(15000);
  });

  it('retorna null para XML sem chave de acesso', () => {
    const xmlInvalido = '<nfeProc><NFe><infNFe><nNF>123</nNF></infNFe></NFe></nfeProc>';
    const result = parseXMLNFe(xmlInvalido);
    expect(result).toBeNull();
  });
});

// ─── Sprint 12C: nfeAtrasadaSPED ────────────────────────────

describe('nfeAtrasadaSPED', () => {
  it('detecta NFe sem lançamento há mais de 7 dias', () => {
    const data = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    expect(nfeAtrasadaSPED(data, 'pendente')).toBe(true);
  });

  it('não alerta NFe já lançada', () => {
    const data = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    expect(nfeAtrasadaSPED(data, 'lancada')).toBe(false);
  });
});

// ─── Sprint 12C: calcularVencimentos ────────────────────────

describe('calcularVencimentos', () => {
  const condicao: CondicaoPagamento = {
    id: '1', codigo: '30/60/90', descricao: '30/60/90 dias',
    prazos_dias: [30, 60, 90],
    desconto_pct: 0, acrescimo_pct: 0,
    aplicacao: 'ambos', ativo: true,
  };

  it('gera 3 parcelas para condição 30/60/90', () => {
    const parcelas = calcularVencimentos(condicao, '2026-06-01', 3000);
    expect(parcelas).toHaveLength(3);
    expect(parcelas[0].numero).toBe(1);
    expect(parcelas[0].valor).toBeCloseTo(1000);
  });

  it('data base 01/06 + 30 dias = 01/07', () => {
    const parcelas = calcularVencimentos(condicao, '2026-06-01', 900);
    expect(parcelas[0].data_vencimento).toBe('2026-07-01');
  });
});

// ─── Sprint 12C: filtrarFormasAtivas ────────────────────────

describe('filtrarFormasAtivas', () => {
  it('retorna apenas formas ativas', () => {
    const formas = [
      { id: '1', ativo: true },
      { id: '2', ativo: false },
      { id: '3', ativo: true },
    ];
    expect(filtrarFormasAtivas(formas)).toHaveLength(2);
  });
});

// ─── Sprint 12D: verificarCreditoDisponivel ─────────────────

describe('verificarCreditoDisponivel', () => {
  it('retorna créditos disponíveis do fornecedor', () => {
    const creditos = [
      makeCredito({ fornecedor_id: 'f-1', valor_disponivel: 200, status: 'disponivel' }),
      makeCredito({ id: 'c-2', fornecedor_id: 'f-1', valor_disponivel: 0, status: 'utilizado' }),
      makeCredito({ id: 'c-3', fornecedor_id: 'f-2', valor_disponivel: 500, status: 'disponivel' }),
    ];
    const result = verificarCreditoDisponivel(creditos, 'f-1');
    expect(result).toHaveLength(1);
    expect(result[0].valor_disponivel).toBe(200);
  });
});

// ─── Sprint 12D: aplicarCredito ─────────────────────────────

describe('aplicarCredito', () => {
  it('decrementa valor_disponivel corretamente', () => {
    const credito = makeCredito({ valor_disponivel: 500 });
    const { credito: atualizado, sucesso } = aplicarCredito(credito, 200, 'pc-1', 'PC-0001');
    expect(sucesso).toBe(true);
    expect(atualizado.valor_disponivel).toBe(300);
    expect(atualizado.status).toBe('parcialmente_utilizado');
  });

  it('muda status para utilizado quando valor zerado', () => {
    const credito = makeCredito({ valor_disponivel: 500 });
    const { credito: atualizado } = aplicarCredito(credito, 500, 'pc-1', 'PC-0001');
    expect(atualizado.status).toBe('utilizado');
    expect(atualizado.valor_disponivel).toBe(0);
  });

  it('rejeita quando valor maior que disponível', () => {
    const credito = makeCredito({ valor_disponivel: 100 });
    const { sucesso, motivo } = aplicarCredito(credito, 200, 'pc-1', 'PC-0001');
    expect(sucesso).toBe(false);
    expect(motivo).toContain('maior que o disponível');
  });
});

// ─── Sprint 12D: alertaCreditoNovoPedido ────────────────────

describe('alertaCreditoNovoPedido', () => {
  it('emite alerta quando há crédito ativo', () => {
    const creditos = [makeCredito({ fornecedor_id: 'f-1', valor_disponivel: 300 })];
    const result = alertaCreditoNovoPedido(creditos, 'f-1');
    expect(result.tem_credito).toBe(true);
    expect(result.valor_disponivel).toBe(300);
    expect(result.mensagem).toContain('R$ 300.00');
  });

  it('não emite alerta sem crédito', () => {
    const result = alertaCreditoNovoPedido([], 'f-1');
    expect(result.tem_credito).toBe(false);
  });
});

// ─── Sprint 12D: filtrarPrecosVigentes ──────────────────────

describe('filtrarPrecosVigentes', () => {
  it('retorna apenas preços cuja vigência abrange a data', () => {
    const tabela = [
      makeTabela({ produto: 'A', vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31' }),
      makeTabela({ id: 't-2', produto: 'B', vigencia_inicio: '2025-01-01', vigencia_fim: '2025-12-31' }),
    ];
    const result = filtrarPrecosVigentes(tabela, '2026-06-01');
    expect(result).toHaveLength(1);
    expect(result[0].produto).toBe('A');
  });
});

// ─── Sprint 12D: alertaVigenciaTabela ───────────────────────

describe('alertaVigenciaTabela', () => {
  it('detecta tabela expirando em 25 dias', () => {
    const em25dias = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const tabela = [makeTabela({ vigencia_fim: em25dias })];
    expect(alertaVigenciaTabela(tabela)).toHaveLength(1);
  });

  it('não alerta tabela com validade longa', () => {
    const em90dias = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const tabela = [makeTabela({ vigencia_fim: em90dias })];
    expect(alertaVigenciaTabela(tabela)).toHaveLength(0);
  });
});

// ─── Sprint 12D: comparativoPrecos (RPT-05 helper) ──────────

describe('comparativoPrecos', () => {
  it('ordena fornecedores por preço crescente', () => {
    const tabelas = [
      makeTabela({ fornecedor_id: 'f-1', fornecedor_nome: 'Caro SA', produto: 'Vidro', preco: 200 }),
      makeTabela({ id: 't-2', fornecedor_id: 'f-2', fornecedor_nome: 'Barato SA', produto: 'Vidro', preco: 120 }),
    ];
    const result = comparativoPrecos('Vidro', tabelas, '2026-06-01');
    expect(result.fornecedores[0].fornecedor_nome).toBe('Barato SA');
    expect(result.fornecedores[0].preco).toBe(120);
  });

  it('limita a 5 fornecedores no comparativo', () => {
    const tabelas = Array.from({ length: 7 }, (_, i) =>
      makeTabela({ id: `t-${i}`, fornecedor_id: `f-${i}`, fornecedor_nome: `F${i}`, produto: 'Vidro', preco: 100 + i })
    );
    const result = comparativoPrecos('Vidro', tabelas, '2026-06-01');
    expect(result.fornecedores.length).toBeLessThanOrEqual(5);
  });
});

// ─── RPT-04: agregarComprasPorFornecedor ────────────────────

describe('agregarComprasPorFornecedor — RPT-04', () => {
  it('agrega volume, valor e cumprimento_prazo corretamente', () => {
    const pedidos = [
      { fornecedor_id: 'f-1', fornecedor_nome: 'A SA', area_total_m2: 10, valor_total: 1000, previsao_entrega: '2026-06-10', data_conclusao: '2026-06-08', status: 'concluido' as const },
      { fornecedor_id: 'f-1', fornecedor_nome: 'A SA', area_total_m2: 5, valor_total: 500, previsao_entrega: '2026-06-10', data_conclusao: '2026-06-12', status: 'concluido' as const },
    ];
    const result = agregarComprasPorFornecedor(pedidos);
    expect(result).toHaveLength(1);
    expect(result[0].volume_m2).toBeCloseTo(15);
    expect(result[0].valor_total).toBeCloseTo(1500);
    expect(result[0].cumprimento_prazo_pct).toBe(50);
  });
});

// ─── RPT-05: historicoPrecosCompra ──────────────────────────

describe('historicoPrecosCompra — RPT-05', () => {
  it('calcula variação percentual entre dois pontos de preço', () => {
    const itens = [
      { produto: 'Vidro 8mm', fornecedor_id: 'f-1', fornecedor_nome: 'A SA', preco_m2: 100, data: '2026-01-01' },
      { produto: 'Vidro 8mm', fornecedor_id: 'f-1', fornecedor_nome: 'A SA', preco_m2: 120, data: '2026-06-01' },
    ];
    const result = historicoPrecosCompra(itens);
    expect(result[0].historico).toHaveLength(2);
    expect(result[0].variacao_pct).toBe(20);
  });

  it('variação zero com apenas um ponto de preço', () => {
    const itens = [
      { produto: 'Vidro 6mm', fornecedor_id: 'f-1', fornecedor_nome: 'A SA', preco_m2: 90, data: '2026-06-01' },
    ];
    const result = historicoPrecosCompra(itens);
    expect(result[0].variacao_pct).toBe(0);
  });
});

// ─── RPT-06: agregarCreditosFornecedores ────────────────────

describe('agregarCreditosFornecedores — RPT-06', () => {
  it('agrega total disponível por fornecedor', () => {
    const creditos = [
      makeCredito({ fornecedor_id: 'f-1', valor_disponivel: 300, status: 'disponivel' }),
      makeCredito({ id: 'c-2', fornecedor_id: 'f-1', valor_disponivel: 100, status: 'parcialmente_utilizado' }),
      makeCredito({ id: 'c-3', fornecedor_id: 'f-1', valor_original: 200, valor_disponivel: 0, status: 'utilizado' }),
    ];
    const result = agregarCreditosFornecedores(creditos);
    expect(result).toHaveLength(1);
    expect(result[0].total_disponivel).toBe(400);
    expect(result[0].total_utilizado).toBe(200);
  });
});
