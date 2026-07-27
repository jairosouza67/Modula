import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import type { Produto } from "./useProdutos";

/**
 * Item de tipo de vidro formatado para os modais de orçamento.
 * Substitui o antigo `tiposVidroPrecos` do mock.
 */
export interface TipoVidroSupabase {
  codigo: string;
  label: string;
  preco: number; // valor_venda (calculado: valor_compra * (1 + margem_lucro))
  unidade: string;
}

/**
 * Item de processamento formatado para os modais de orçamento.
 * Substitui o antigo `processamentos` do mock.
 */
export interface ProcessamentoSupabase {
  codigo: string;
  label: string;
  custo: number;
}

/**
 * Categorias de produto que representam "tipos de vidro" para orçamento.
 */
const CATEGORIAS_VIDRO = ["vidro", "kit", "ferragem", "servico"] as const;

/**
 * Códigos de produtos usados como processamento.
 * JAT e AD são produtos na tabela, LAP/BST/FUR são adicionados pela migration.
 */
const CODIGOS_PROCESSAMENTO = ["JAT", "AD", "LAP", "BST", "FUR"];

/**
 * Hook que busca todos os produtos do Supabase e os separa em
 * "tipos de vidro" (para seleção principal) e "processamentos" (acabamentos).
 *
 * Substitui completamente:
 * - `tiposVidroPrecos` de mock/data.ts
 * - `processamentos` de mock/data.ts
 */
export function useProdutosOrcamento() {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  const query = useQuery({
    queryKey: ["produtos_orcamento", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("ativo", true)
        .order("descricao", { ascending: true });

      if (error) throw error;

      const produtos = (data ?? []) as Produto[];

      // Separar vidros/materiais dos processamentos
      const tiposVidro: TipoVidroSupabase[] = produtos
        .filter(
          (p) =>
            CATEGORIAS_VIDRO.includes(p.categoria as (typeof CATEGORIAS_VIDRO)[number]) &&
            !CODIGOS_PROCESSAMENTO.includes(p.codigo),
        )
        .map((p) => ({
          codigo: p.codigo,
          label: p.descricao,
          preco: Number(p.valor_venda) || 0,
          unidade: p.unidade,
        }));

      const processamentosRaw: ProcessamentoSupabase[] = produtos
        .filter((p) => p.categoria === "processamento" || CODIGOS_PROCESSAMENTO.includes(p.codigo))
        .map((p) => ({
          codigo: p.codigo,
          label: p.descricao,
          custo: Number(p.valor_venda) || 0,
        }));

      // Adicionar "Nenhum" como primeira opção de processamento
      const processamentos: ProcessamentoSupabase[] = [
        { codigo: "", label: "Nenhum", custo: 0 },
        ...processamentosRaw,
      ];

      return { tiposVidro, processamentos };
    },
    enabled: !!empresaId,
    staleTime: 5 * 60 * 1000, // 5 min — catálogo muda raramente
  });

  return {
    tiposVidro: query.data?.tiposVidro ?? [],
    processamentos: query.data?.processamentos ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
