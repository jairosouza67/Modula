import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { userFriendlyError } from "@/lib/errors/sanitize";
import { Database } from "@/lib/supabase/types";
import { sanitizeTextFields } from "@/lib/validation/inputSanitizer";
import { toast } from "sonner";

type Orcamento = Database["public"]["Tables"]["orcamentos"]["Row"];
type OrcamentoInsert = Database["public"]["Tables"]["orcamentos"]["Insert"];
type OrcamentoUpdate = Database["public"]["Tables"]["orcamentos"]["Update"];

export function useOrcamentos() {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  return useQuery({
    queryKey: ["orcamentos", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select(
          `
          *,
          cliente:clientes(nome, documento, telefone, endereco, contato, cidade, representante, referencia)
        `,
        )
        .eq("empresa_id", empresaId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (Orcamento & {
        cliente: {
          nome: string;
          documento?: string;
          telefone?: string;
          endereco?: string;
          contato?: string;
          cidade?: string;
          representante?: string;
          referencia?: string;
        } | null;
      })[];
    },
    enabled: !!empresaId,
  });
}

export function useOrcamento(id: string) {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["orcamentos", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("orcamentos")
        .select(
          `
          *,
          cliente:clientes(*)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Orcamento & {
        cliente: Database["public"]["Tables"]["clientes"]["Row"] | null;
      };
    },
    enabled: !!id,
  });
}

export function useOrcamentoMutations() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const empresaId = getDefaultEmpresaId();

  const createMutation = useMutation({
    mutationFn: async (orcamento: Omit<OrcamentoInsert, "empresa_id">) => {
      sanitizeTextFields(orcamento as Record<string, unknown>, [
        "numero",
        "status",
        "observacoes",
        "descricao",
        "tipo",
      ]);
      const { data, error } = await supabase
        .from("orcamentos")
        .insert([{ ...orcamento, empresa_id: empresaId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast.success("Orçamento criado com sucesso! 💎");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao criar orçamento", error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...changes }: OrcamentoUpdate & { id: string }) => {
      sanitizeTextFields(changes as Record<string, unknown>, [
        "numero",
        "status",
        "observacoes",
        "descricao",
        "tipo",
      ]);
      const { data, error } = await supabase
        .from("orcamentos")
        .update(changes)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      queryClient.invalidateQueries({ queryKey: ["orcamentos", data.id] });
      toast.success("Orçamento atualizado! ⚒️");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao atualizar orçamento", error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("orcamentos")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast.success("Orçamento removido! 🗑️");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao remover orçamento", error));
    },
  });

  return {
    createOrcamento: createMutation.mutateAsync,
    updateOrcamento: updateMutation.mutateAsync,
    deleteOrcamento: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
