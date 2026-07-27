import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { userFriendlyError } from "@/lib/errors/sanitize";
import { CategoriaEstoque, TipoMovimentacao } from "@/lib/inventory/estoque";
import { Database } from "@/lib/supabase/types";
import { sanitizeTextFields } from "@/lib/validation/inputSanitizer";
import { toast } from "sonner";

type EstoqueItem = Database["public"]["Tables"]["estoque_itens"]["Row"];
type EstoqueItemInsert = Database["public"]["Tables"]["estoque_itens"]["Insert"];
type EstoqueItemUpdate = Database["public"]["Tables"]["estoque_itens"]["Update"];
type Movimentacao = Database["public"]["Tables"]["estoque_movimentacoes"]["Row"];
type MovimentacaoInsert = Database["public"]["Tables"]["estoque_movimentacoes"]["Insert"];

export function useEstoque() {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  return useQuery({
    queryKey: ["estoque", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque_itens")
        .select("*")
        .eq("empresa_id", empresaId)
        .is("deleted_at", null)
        .order("descricao", { ascending: true });

      if (error) throw error;

      return data.map((item) => ({
        id: item.id,
        codigo: item.codigo,
        descricao: item.descricao,
        categoria: item.categoria as CategoriaEstoque,
        unidade: item.unidade,
        quantidade: item.quantidade || 0,
        estoqueMinimo: item.estoque_minimo || 0,
        custoUnitario: item.custo_unitario || 0,
      }));
    },
    enabled: !!empresaId,
  });
}

export function useMovimentacoes(itemId?: string) {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  return useQuery({
    queryKey: ["estoque-movimentacoes", empresaId, itemId],
    queryFn: async () => {
      let query = supabase
        .from("estoque_movimentacoes")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });

      if (itemId) {
        query = query.eq("item_id", itemId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map((m) => ({
        id: m.id,
        itemId: m.item_id,
        tipo: m.tipo as TipoMovimentacao,
        quantidade: m.quantidade || 0,
        osReferencia: m.os_referencia,
        observacao: m.observacao,
        createdAt: m.created_at,
      }));
    },
    enabled: !!empresaId,
  });
}

export function useEstoqueMutations() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const empresaId = getDefaultEmpresaId();

  const createItemMutation = useMutation({
    mutationFn: async (item: {
      codigo: string;
      descricao: string;
      categoria: string;
      unidade: string;
      quantidade: number;
      estoqueMinimo: number;
      custoUnitario: number;
    }) => {
      sanitizeTextFields(item as Record<string, unknown>, [
        "codigo",
        "descricao",
        "categoria",
        "unidade",
      ]);
      const { data, error } = await supabase
        .from("estoque_itens")
        .insert([
          {
            empresa_id: empresaId,
            codigo: item.codigo,
            descricao: item.descricao,
            categoria: item.categoria,
            unidade: item.unidade,
            quantidade: item.quantidade,
            estoque_minimo: item.estoqueMinimo,
            custo_unitario: item.custoUnitario,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque"] });
      toast.success("Item de estoque criado! 📦");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao criar item", error));
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (item: {
      id: string;
      codigo?: string;
      descricao?: string;
      categoria?: string;
      unidade?: string;
      quantidade?: number;
      estoqueMinimo?: number;
      custoUnitario?: number;
    }) => {
      const { id, ...changes } = item;
      sanitizeTextFields(changes as Record<string, unknown>, [
        "codigo",
        "descricao",
        "categoria",
        "unidade",
      ]);
      const dbChanges: any = {};
      if (changes.codigo !== undefined) dbChanges.codigo = changes.codigo;
      if (changes.descricao !== undefined) dbChanges.descricao = changes.descricao;
      if (changes.categoria !== undefined) dbChanges.categoria = changes.categoria;
      if (changes.unidade !== undefined) dbChanges.unidade = changes.unidade;
      if (changes.quantidade !== undefined) dbChanges.quantidade = changes.quantidade;
      if (changes.estoqueMinimo !== undefined) dbChanges.estoque_minimo = changes.estoqueMinimo;
      if (changes.custoUnitario !== undefined) dbChanges.custo_unitario = changes.custoUnitario;

      const { data, error } = await supabase
        .from("estoque_itens")
        .update(dbChanges)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque"] });
      toast.success("Item atualizado! ✅");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao atualizar item", error));
    },
  });

  const createMovimentacaoMutation = useMutation({
    mutationFn: async (mov: {
      itemId: string;
      tipo: string;
      quantidade: number;
      osReferencia?: string;
      observacao?: string;
    }) => {
      sanitizeTextFields(mov as Record<string, unknown>, ["tipo", "osReferencia", "observacao"]);
      const { data: movimentacao, error: movError } = await supabase
        .from("estoque_movimentacoes")
        .insert([
          {
            empresa_id: empresaId,
            item_id: mov.itemId,
            tipo: mov.tipo,
            quantidade: mov.quantidade,
            os_referencia: mov.osReferencia,
            observacao: mov.observacao,
          },
        ])
        .select()
        .single();

      if (movError) throw movError;

      return movimentacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque"] });
      queryClient.invalidateQueries({ queryKey: ["estoque-movimentacoes"] });
      toast.success("Movimentação registrada com sucesso! 🔄");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao registrar movimentação", error));
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("estoque_itens")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque"] });
      toast.success("Item removido do estoque! 🗑️");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao remover item", error));
    },
  });

  return {
    createItem: createItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    createMovimentacao: createMovimentacaoMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,
    isCreatingItem: createItemMutation.isPending,
    isUpdatingItem: updateItemMutation.isPending,
    isMoving: createMovimentacaoMutation.isPending,
  };
}
