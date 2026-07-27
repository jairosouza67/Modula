import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { userFriendlyError } from "@/lib/errors/sanitize";
import { Database } from "@/lib/supabase/types";
import { sanitizeTextFields } from "@/lib/validation/inputSanitizer";
import { toast } from "sonner";

export type Colaborador = Database["public"]["Tables"]["colaboradores"]["Row"];
export type ColaboradorInsert = Database["public"]["Tables"]["colaboradores"]["Insert"];
export type ColaboradorUpdate = Database["public"]["Tables"]["colaboradores"]["Update"];

export function useColaboradores() {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["colaboradores", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("nome", { ascending: true });

      if (error) throw error;

      // Map snake_case from DB to camelCase for the UI
      return (data || []).map((item) => ({
        id: item.id,
        nome: item.nome,
        cpf: item.cpf,
        cargo: item.cargo,
        salario: item.salario,
        status: item.status,
        dataAdmissao: item.data_admissao,
        dataDemissao: item.data_demissao,
        dataLimiteFerias: item.data_limite_ferias,
        horasExtrasMes: item.horas_extras_mes,
        telefone: item.telefone,
        email: item.email,
      }));
    },
    enabled: !!empresaId,
  });

  const createMutation = useMutation({
    mutationFn: async (colaborador: Omit<ColaboradorInsert, "empresa_id">) => {
      sanitizeTextFields(colaborador as Record<string, unknown>, [
        "nome",
        "cpf",
        "cargo",
        "telefone",
        "email",
      ]);
      const { data, error } = await supabase
        .from("colaboradores")
        .insert([{ ...colaborador, empresa_id: empresaId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Colaborador adicionado com sucesso! 👥");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao adicionar colaborador", error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...changes }: ColaboradorUpdate & { id: string }) => {
      sanitizeTextFields(changes as Record<string, unknown>, [
        "nome",
        "cpf",
        "cargo",
        "telefone",
        "email",
      ]);
      const { data, error } = await supabase
        .from("colaboradores")
        .update(changes)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Colaborador atualizado! ✅");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao atualizar colaborador", error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("colaboradores")
        .update({ status: "Inativo", data_demissao: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Colaborador desativado! 🗑️");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao desativar colaborador", error));
    },
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createColaborador: createMutation.mutateAsync,
    updateColaborador: updateMutation.mutateAsync,
    deleteColaborador: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
