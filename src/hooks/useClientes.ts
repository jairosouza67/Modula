import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { userFriendlyError } from "@/lib/errors/sanitize";
import { Database } from "@/lib/supabase/types";
import { sanitizeTextFields } from "@/lib/validation/inputSanitizer";
import { toast } from "sonner";

type ClienteCamposExtras = {
  cidade?: string | null;
  representante?: string | null;
  referencia?: string | null;
  cep?: string | null;
  bairro?: string | null;
  uf?: string | null;
  numero_endereco?: string | null;
  complemento?: string | null;
  codigo_municipio?: number | null;
  inscricao_estadual?: string | null;
};

export type Cliente = Database["public"]["Tables"]["clientes"]["Row"] & ClienteCamposExtras;
export type ClienteInsert = Database["public"]["Tables"]["clientes"]["Insert"] &
  ClienteCamposExtras;
export type ClienteUpdate = Database["public"]["Tables"]["clientes"]["Update"] &
  ClienteCamposExtras;

export function useClientes() {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["clientes", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("empresa_id", empresaId)
        .is("deleted_at", null)
        .order("nome", { ascending: true });

      if (error) throw error;

      // Map snake_case from DB to camelCase for the UI
      return (data || []).map((item) => ({
        id: item.id,
        nome: item.nome,
        documento: item.documento,
        tipoDocumento: item.tipo_documento,
        contato: item.contato,
        segmento: item.segmento,
        ultimoContato: item.ultimo_contato,
        volumeTotal: item.volume_total,
        email: item.email,
        telefone: item.telefone,
        endereco: item.endereco,
        cidade: item.cidade ?? "",
        representante: item.representante ?? "",
        referencia: item.referencia ?? "",
        cep: item.cep ?? "",
        bairro: item.bairro ?? "",
        uf: item.uf ?? "",
        numero_endereco: item.numero_endereco ?? "",
        complemento: item.complemento ?? "",
        codigo_municipio: item.codigo_municipio ?? null,
        inscricao_estadual: item.inscricao_estadual ?? "",
      }));
    },
    enabled: !!empresaId,
  });

  const createMutation = useMutation({
    mutationFn: async (cliente: Omit<ClienteInsert, "empresa_id">) => {
      sanitizeTextFields(cliente as Record<string, unknown>, [
        "nome",
        "documento",
        "tipo_documento",
        "contato",
        "segmento",
        "email",
        "telefone",
        "endereco",
        "cidade",
        "representante",
        "referencia",
        "cep",
        "bairro",
        "uf",
        "numero_endereco",
        "complemento",
      ]);
      const { data, error } = await supabase
        .from("clientes")
        .insert({
          empresa_id: empresaId,
          nome: cliente.nome,
          documento: cliente.documento,
          tipo_documento: cliente.tipo_documento,
          contato: cliente.contato,
          segmento: cliente.segmento,
          ultimo_contato: cliente.ultimo_contato,
          volume_total: cliente.volume_total,
          email: cliente.email,
          telefone: cliente.telefone,
          endereco: cliente.endereco,
          cidade: cliente.cidade,
          representante: cliente.representante,
          referencia: cliente.referencia,
          cep: cliente.cep,
          bairro: cliente.bairro,
          uf: cliente.uf,
          numero_endereco: cliente.numero_endereco,
          complemento: cliente.complemento,
          codigo_municipio: cliente.codigo_municipio,
          inscricao_estadual: cliente.inscricao_estadual,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes", empresaId] });
      toast.success("Cliente cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error(userFriendlyError("Erro ao cadastrar cliente", error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...changes }: { id: string } & ClienteUpdate) => {
      sanitizeTextFields(changes as Record<string, unknown>, [
        "nome",
        "documento",
        "tipo_documento",
        "contato",
        "segmento",
        "email",
        "telefone",
        "endereco",
        "cidade",
        "representante",
        "referencia",
        "cep",
        "bairro",
        "uf",
        "numero_endereco",
        "complemento",
      ]);
      const { data, error } = await supabase
        .from("clientes")
        .update({
          nome: changes.nome,
          documento: changes.documento,
          tipo_documento: changes.tipo_documento,
          contato: changes.contato,
          segmento: changes.segmento,
          ultimo_contato: changes.ultimo_contato,
          volume_total: changes.volume_total,
          email: changes.email,
          telefone: changes.telefone,
          endereco: changes.endereco,
          cidade: changes.cidade,
          representante: changes.representante,
          referencia: changes.referencia,
          cep: changes.cep,
          bairro: changes.bairro,
          uf: changes.uf,
          numero_endereco: changes.numero_endereco,
          complemento: changes.complemento,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes", empresaId] });
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(userFriendlyError("Erro ao atualizar cliente", error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clientes")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes", empresaId] });
      toast.success("Cliente removido com sucesso!");
    },
    onError: (error) => {
      toast.error(userFriendlyError("Erro ao remover cliente", error));
    },
  });

  return {
    ...query,
    createCliente: createMutation.mutateAsync,
    updateCliente: updateMutation.mutateAsync,
    deleteCliente: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
