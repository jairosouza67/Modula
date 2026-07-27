import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { OrcamentoItemUnificado, OrcamentoItemV2 } from "@/lib/sales/types";
import { resolverServico } from "@/lib/sales/resolverServico";

interface BaixaItem {
  codigoProduto: string;
  quantidade: number;
  codigoServico: string;
}

interface ResultadoBaixa {
  sucesso: boolean;
  baixados: string[];
  semEstoque: string[];
  erros: string[];
}

/**
 * Resolve os componentes de um item de orçamento.
 * Suporta tanto o formato novo (OrcamentoItemUnificado com componentes)
 * quanto o formato legado (OrcamentoItemV2 sem componentes).
 */
function resolverComponentes(item: any): BaixaItem[] {
  const largura = Number(item.largura) || 0;
  const altura = Number(item.altura) || 0;
  const quantidade = Number(item.quantidade) || 1;

  // Formato novo: item já vem com componentes expandidos
  if (item.componentes && Array.isArray(item.componentes)) {
    const componentes = item.componentes as Array<{
      codigoProduto: string;
      quantidade: number;
      tipoPreco: string;
      incluido: boolean;
      descricao: string;
    }>;

    return componentes
      .filter((c) => c.incluido !== false) // inclui por padrão
      .map((c) => {
        let qtdBaixa: number;
        if (c.tipoPreco === "M2") {
          const m2 = largura * altura * quantidade;
          qtdBaixa = m2 * c.quantidade;
        } else if (c.tipoPreco === "PC_ML") {
          qtdBaixa = largura * c.quantidade * quantidade;
        } else {
          // PC_FX
          qtdBaixa = c.quantidade * quantidade;
        }
        return {
          codigoProduto: c.codigoProduto,
          quantidade: Number(qtdBaixa.toFixed(4)),
          codigoServico: item.codigoServico ?? item.produtoCodigo ?? "",
        };
      })
      .filter((b) => b.quantidade > 0);
  }

  // Formato legado OrcamentoItemV2: resolve via resolverServico (dados estáticos)
  const codigoServico: string = item.codigoServico ?? item.produtoCodigo ?? "";
  if (!codigoServico) return [];

  try {
    const servicoDef = resolverServico(codigoServico);
    // resolverServico retorna ServicoResolvido (agregado), não os componentes individuais.
    // Para o legado, montamos uma baixa simplificada pelo código do serviço em si.
    // Precisamos acessar o SERVICOS dict internamente — importar listarServicosDisponiveis não resolve.
    // Fallback: baixa apenas o código do serviço com m² calculado.
    const m2 = largura * altura * quantidade;
    return [
      {
        codigoProduto: codigoServico,
        quantidade: Number(m2.toFixed(4)),
        codigoServico,
      },
    ];
  } catch {
    // Serviço não encontrado no dict estático — pode ser produto avulso
    return [
      {
        codigoProduto: codigoServico,
        quantidade: quantidade,
        codigoServico,
      },
    ];
  }
}

/**
 * Processa a baixa automática de estoque ao aprovar um orçamento.
 *
 * Para cada item do orçamento, resolve os componentes do serviço composto
 * e insere movimentações de Saída no estoque. O trigger do banco de dados
 * (trg_aplicar_movimentacao) atualiza automaticamente a quantidade.
 *
 * Estoque insuficiente gera WARNING, não erro — a aprovação não é bloqueada.
 *
 * @param orcamentoId UUID do orçamento aprovado
 * @param orcamentoNumero Número do orçamento (ex: ORC-1234) para referência
 * @param itens Array de itens do orçamento (do JSONB)
 * @param empresaId UUID da empresa
 * @returns Resultado com itens baixados, sem estoque e erros
 */
export async function processarBaixaEstoque(
  orcamentoId: string,
  orcamentoNumero: string,
  itens: unknown[],
  empresaId: string
): Promise<ResultadoBaixa> {
  const supabase = getSupabaseBrowserClient();
  const baixados: string[] = [];
  const semEstoque: string[] = [];
  const erros: string[] = [];

  for (const item of itens) {
    const componentes = resolverComponentes(item);

    for (const comp of componentes) {
      if (comp.quantidade <= 0) continue;

      // Buscar item no estoque por produto_id (FK) ou por código
      const { data: estoqueItem, error: buscaError } = await supabase
        .from("estoque_itens")
        .select("id, codigo, descricao, quantidade")
        .eq("empresa_id", empresaId)
        .eq("codigo", comp.codigoProduto)
        .is("deleted_at", null)
        .maybeSingle();

      if (buscaError) {
        erros.push(`${comp.codigoProduto}: erro ao buscar estoque`);
        continue;
      }

      if (!estoqueItem) {
        semEstoque.push(comp.codigoProduto);
        continue;
      }

      // Registrar saída — o trigger DB cuida de decrementar a quantidade
      const { error: movError } = await supabase
        .from("estoque_movimentacoes")
        .insert({
          empresa_id: empresaId,
          item_id: estoqueItem.id,
          tipo: "Saída",
          quantidade: comp.quantidade,
          os_referencia: orcamentoNumero,
          observacao: `Baixa automática — ${comp.codigoServico}`,
          orcamento_id: orcamentoId,
        });

      if (movError) {
        // Estoque insuficiente gera erro no trigger — registrar como warning
        if (movError.message?.includes("Estoque insuficiente")) {
          semEstoque.push(`${comp.codigoProduto} (insuficiente)`);
        } else {
          erros.push(`${comp.codigoProduto}: ${movError.message}`);
        }
      } else {
        baixados.push(`${estoqueItem.descricao} (−${comp.quantidade})`);
      }
    }
  }

  return {
    sucesso: erros.length === 0,
    baixados,
    semEstoque,
    erros,
  };
}

/**
 * Reverte as baixas de estoque de um orçamento específico.
 * Usado ao "Remover da produção" — busca movimentações de Saída
 * vinculadas ao orçamento e cria Devoluções correspondentes.
 *
 * @param orcamentoId UUID do orçamento sendo revertido
 * @param orcamentoNumero Número do orçamento para referência
 * @param empresaId UUID da empresa
 */
export async function reverterBaixaEstoque(
  orcamentoId: string,
  orcamentoNumero: string,
  empresaId: string
): Promise<ResultadoBaixa> {
  const supabase = getSupabaseBrowserClient();
  const baixados: string[] = [];
  const semEstoque: string[] = [];
  const erros: string[] = [];

  // Buscar todas as saídas vinculadas a este orçamento
  const { data: saidas, error: buscaError } = await supabase
    .from("estoque_movimentacoes")
    .select("id, item_id, quantidade, observacao")
    .eq("empresa_id", empresaId)
    .eq("orcamento_id", orcamentoId)
    .eq("tipo", "Saída");

  if (buscaError) {
    return {
      sucesso: false,
      baixados: [],
      semEstoque: [],
      erros: [`Erro ao buscar movimentações: ${buscaError.message}`],
    };
  }

  if (!saidas || saidas.length === 0) {
    // Nada a reverter — orçamento pode ter sido criado antes da feature
    return { sucesso: true, baixados: [], semEstoque: [], erros: [] };
  }

  for (const saida of saidas) {
    const { error: devError } = await supabase
      .from("estoque_movimentacoes")
      .insert({
        empresa_id: empresaId,
        item_id: saida.item_id,
        tipo: "Devolução",
        quantidade: saida.quantidade,
        os_referencia: orcamentoNumero,
        observacao: `Devolução automática — produção cancelada`,
        orcamento_id: orcamentoId,
      });

    if (devError) {
      erros.push(`item_id ${saida.item_id}: ${devError.message}`);
    } else {
      baixados.push(`Devolvido: ${saida.quantidade}`);
    }
  }

  return {
    sucesso: erros.length === 0,
    baixados,
    semEstoque,
    erros,
  };
}
