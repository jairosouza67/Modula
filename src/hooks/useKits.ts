import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { userFriendlyError } from "@/lib/errors/sanitize";
import { sanitizeTextFields } from "@/lib/validation/inputSanitizer";
import { toast } from "sonner";
import type { TipoPreco } from "@/lib/sales/types";

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface KitComponente {
  id: string;
  servico_id: string;
  produto_id: string;
  quantidade: number;
  tipo_preco: TipoPreco;
  ordem: number;
  produto: {
    id: string;
    codigo: string;
    descricao: string;
    unidade: string;
  };
}

export interface KitCompleto {
  id: string;
  empresa_id: string;
  codigo: string;
  nome: string;
  categoria: string;
  created_at: string;
  componentes: KitComponente[];
}

export interface KitFormData {
  codigo: string;
  nome: string;
  categoria: string;
  componentes: {
    produto_id: string;
    quantidade: number;
    tipo_preco: TipoPreco;
  }[];
}

// ─── Query: listar kits ─────────────────────────────────────────────────────

const KITS_KEY = "servicos_compostos";

export function useKits() {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [KITS_KEY, empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos_compostos")
        .select(
          `
          *,
          componentes:servico_componentes(
            *,
            produto:produtos(id, codigo, descricao, unidade)
          )
        `,
        )
        .eq("empresa_id", empresaId)
        .order("codigo", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as KitCompleto[];
    },
    enabled: !!empresaId,
  });

  // ─── Create ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (kit: KitFormData) => {
      sanitizeTextFields(kit, ["codigo", "nome", "categoria"]);
      // 1. Inserir o kit
      const { data: novoKit, error: kitError } = await supabase
        .from("servicos_compostos")
        .insert({
          empresa_id: empresaId,
          codigo: kit.codigo,
          nome: kit.nome,
          categoria: kit.categoria,
        })
        .select()
        .single();

      if (kitError) throw kitError;

      // 2. Inserir componentes
      if (kit.componentes.length > 0) {
        const { error: compError } = await supabase.from("servico_componentes").insert(
          kit.componentes.map((c, idx) => ({
            servico_id: novoKit.id,
            produto_id: c.produto_id,
            quantidade: c.quantidade,
            tipo_preco: c.tipo_preco,
            ordem: idx,
          })),
        );

        if (compError) throw compError;
      }

      return novoKit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KITS_KEY, empresaId] });
      toast.success("Kit criado com sucesso!");
    },
    onError: (error) => {
      toast.error(userFriendlyError("Erro ao criar kit", error));
    },
  });

  // ─── Update ─────────────────────────────────────────────────────────────

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...kit }: KitFormData & { id: string }) => {
      sanitizeTextFields(kit, ["codigo", "nome", "categoria"]);
      // 1. Atualizar dados do kit
      const { error: kitError } = await supabase
        .from("servicos_compostos")
        .update({
          codigo: kit.codigo,
          nome: kit.nome,
          categoria: kit.categoria,
        })
        .eq("id", id);

      if (kitError) throw kitError;

      // 2. Deletar componentes antigos
      const { error: deleteError } = await supabase
        .from("servico_componentes")
        .delete()
        .eq("servico_id", id);

      if (deleteError) throw deleteError;

      // 3. Inserir novos componentes
      if (kit.componentes.length > 0) {
        const { error: compError } = await supabase.from("servico_componentes").insert(
          kit.componentes.map((c, idx) => ({
            servico_id: id,
            produto_id: c.produto_id,
            quantidade: c.quantidade,
            tipo_preco: c.tipo_preco,
            ordem: idx,
          })),
        );

        if (compError) throw compError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KITS_KEY, empresaId] });
      toast.success("Kit atualizado!");
    },
    onError: (error) => {
      toast.error(userFriendlyError("Erro ao atualizar kit", error));
    },
  });

  // ─── Delete ─────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // 1. Deletar componentes
      const { error: compError } = await supabase
        .from("servico_componentes")
        .delete()
        .eq("servico_id", id);

      if (compError) throw compError;

      // 2. Deletar o kit
      const { error: kitError } = await supabase.from("servicos_compostos").delete().eq("id", id);

      if (kitError) throw kitError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KITS_KEY, empresaId] });
      toast.success("Kit excluído!");
    },
    onError: (error) => {
      toast.error(userFriendlyError("Erro ao excluir kit", error));
    },
  });

  return {
    ...query,
    createKit: createMutation.mutateAsync,
    updateKit: updateMutation.mutateAsync,
    deleteKit: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
