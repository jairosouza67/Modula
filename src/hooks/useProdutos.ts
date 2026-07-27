import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { userFriendlyError } from "@/lib/errors/sanitize";
import { Database } from "@/lib/supabase/types";
import { sanitizeTextFields } from "@/lib/validation/inputSanitizer";
import { toast } from "sonner";

export type Produto = Database["public"]["Tables"]["produtos"]["Row"] & {
  fornecedor?: { id: string; nome: string } | null;
};
export type ProdutoInsert = Database["public"]["Tables"]["produtos"]["Insert"];
export type ProdutoUpdate = Database["public"]["Tables"]["produtos"]["Update"];

export type ServicoComposto = Database["public"]["Tables"]["servicos_compostos"]["Row"];
export type ServicoComponente = Database["public"]["Tables"]["servico_componentes"]["Row"];

/** Produto com seus servicos compostos (componentes expandidos) */
export type ServicoCompostoCompleto = ServicoComposto & {
  componentes: (ServicoComponente & {
    produto: Produto;
  })[];
};

/**
 * Hook para listar produtos do catalogo.
 */
export function useProdutos() {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["produtos", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*, fornecedor:fornecedores(id, nome)")
        .eq("empresa_id", empresaId)
        .eq("ativo", true)
        .order("codigo", { ascending: true });

      if (error) throw error;
      return data as Produto[];
    },
    enabled: !!empresaId,
  });

  const createMutation = useMutation({
    mutationFn: async (produto: Omit<ProdutoInsert, "empresa_id">) => {
      sanitizeTextFields(produto as Record<string, unknown>, [
        "codigo",
        "descricao",
        "unidade",
        "categoria",
        "ncm",
      ]);
      const { data, error } = await supabase
        .from("produtos")
        .insert({
          empresa_id: empresaId,
          codigo: produto.codigo,
          descricao: produto.descricao,
          unidade: produto.unidade,
          valor_compra: produto.valor_compra,
          margem_lucro: produto.margem_lucro,
          categoria: produto.categoria,
          fornecedor_id: produto.fornecedor_id,
          ncm: produto.ncm,
          cfop: produto.cfop,
          unidade_fiscal: produto.unidade_fiscal,
          origem: produto.origem,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Produto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos", empresaId] });
      toast.success("Produto cadastrado!");
    },
    onError: (error) => {
      toast.error(userFriendlyError("Erro ao cadastrar produto", error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...changes }: { id: string } & ProdutoUpdate) => {
      sanitizeTextFields(changes as Record<string, unknown>, [
        "codigo",
        "descricao",
        "unidade",
        "categoria",
        "ncm",
      ]);
      const { data, error } = await supabase
        .from("produtos")
        .update({
          codigo: changes.codigo,
          descricao: changes.descricao,
          unidade: changes.unidade,
          valor_compra: changes.valor_compra,
          margem_lucro: changes.margem_lucro,
          categoria: changes.categoria,
          fornecedor_id: changes.fornecedor_id,
          ncm: changes.ncm,
          cfop: changes.cfop,
          unidade_fiscal: changes.unidade_fiscal,
          origem: changes.origem,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Produto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos", empresaId] });
      toast.success("Produto atualizado!");
    },
    onError: (error) => {
      toast.error(userFriendlyError("Erro ao atualizar produto", error));
    },
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("produtos").update({ ativo }).eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos", empresaId] });
      toast.success("Status do produto alterado!");
    },
    onError: (error) => {
      toast.error(userFriendlyError("Erro ao alterar status", error));
    },
  });

  return {
    ...query,
    createProduto: createMutation.mutateAsync,
    updateProduto: updateMutation.mutateAsync,
    toggleAtivo: toggleAtivo.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

/**
 * Hook para listar servicos compostos com seus componentes expandidos.
 */
export function useServicosCompostos() {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  return useQuery({
    queryKey: ["servicos_compostos", empresaId],
    queryFn: async () => {
      const { data: servicos, error } = await supabase
        .from("servicos_compostos")
        .select(
          `
          *,
          componentes:servico_componentes(
            *,
            produto:produtos(*)
          )
        `,
        )
        .eq("empresa_id", empresaId)
        .order("codigo", { ascending: true });

      if (error) throw error;
      return (servicos || []) as unknown as ServicoCompostoCompleto[];
    },
    enabled: !!empresaId,
  });
}

/**
 * Busca um produto por codigo.
 */
export function useProdutoPorCodigo(codigo: string | null) {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  return useQuery({
    queryKey: ["produto", empresaId, codigo],
    queryFn: async () => {
      if (!codigo) return null;
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("codigo", codigo)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as Produto | null;
    },
    enabled: !!empresaId && !!codigo,
  });
}
