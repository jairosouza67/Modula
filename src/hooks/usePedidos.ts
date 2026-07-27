import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { userFriendlyError } from "@/lib/errors/sanitize";
import { Database } from "@/lib/supabase/types";
import { sanitizeTextFields } from "@/lib/validation/inputSanitizer";
import { toast } from "sonner";

type Pedido = Database["public"]["Tables"]["ordens_servico"]["Row"];
type PedidoInsert = Database["public"]["Tables"]["ordens_servico"]["Insert"];
type PedidoUpdate = Database["public"]["Tables"]["ordens_servico"]["Update"];

export function usePedidos() {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  return useQuery({
    queryKey: ["pedidos", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(
          `
          *,
          cliente:clientes(nome),
          orcamento:orcamentos(numero)
        `,
        )
        .eq("empresa_id", empresaId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (Pedido & {
        cliente: { nome: string } | null;
        orcamento: { numero: string } | null;
      })[];
    },
    enabled: !!empresaId,
  });
}

export function usePedido(id: string) {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["pedidos", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(
          `
          *,
          cliente:clientes(*),
          orcamento:orcamentos(*)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Pedido & {
        cliente: Database["public"]["Tables"]["clientes"]["Row"] | null;
        orcamento: Database["public"]["Tables"]["orcamentos"]["Row"] | null;
      };
    },
    enabled: !!id,
  });
}

export function usePedidoMutations() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const empresaId = getDefaultEmpresaId();

  const createMutation = useMutation({
    mutationFn: async (pedido: Omit<PedidoInsert, "empresa_id">) => {
      sanitizeTextFields(pedido as Record<string, unknown>, [
        "numero",
        "status",
        "observacoes",
        "descricao",
        "prioridade",
      ]);
      const { data, error } = await supabase
        .from("ordens_servico")
        .insert([{ ...pedido, empresa_id: empresaId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success("Pedido/OS criado com sucesso! 📦");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao criar pedido", error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...changes }: PedidoUpdate & { id: string }) => {
      sanitizeTextFields(changes as Record<string, unknown>, [
        "numero",
        "status",
        "observacoes",
        "descricao",
        "prioridade",
      ]);
      const { data, error } = await supabase
        .from("ordens_servico")
        .update(changes)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos", data.id] });
      toast.success("Status do pedido atualizado! ⚙️");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao atualizar pedido", error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ordens_servico")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success("Pedido removido! 🗑️");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao remover pedido", error));
    },
  });

  return {
    createPedido: createMutation.mutateAsync,
    updatePedido: updateMutation.mutateAsync,
    deletePedido: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
