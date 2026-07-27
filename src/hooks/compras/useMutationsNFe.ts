import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userFriendlyError } from "@/lib/errors/sanitize";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useRegistrarNFe() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  // We use the fixed user_id from localStorage for MVP if session is missing
  // Or we just fetch the empresa_id from current session / profile

  return useMutation({
    mutationFn: async (data: any) => {
      // 1. Get current empresa_id
      const { data: profile } = await supabase
        .from("perfis_usuario")
        .select("empresa_id")
        .limit(1)
        .single();

      if (!profile?.empresa_id) throw new Error("Empresa não encontrada");

      // 2. Call the RPC to register NFe and process stock
      const { data: res, error } = await supabase.rpc("registrar_nfe_entrada", {
        p_empresa_id: profile.empresa_id,
        p_fornecedor_id: null, // We'll infer from pedido or ignore
        p_fornecedor_nome: data.fornecedor_nome,
        p_numero: data.numero,
        p_serie: data.serie,
        p_chave_acesso: data.chave_acesso,
        p_data_emissao: data.data_emissao,
        p_valor_total: data.valor_total,
        p_pedido_compra_id: data.pedido_compra_id || null,
      });

      if (error) throw error;
      return res;
    },
    onSuccess: () => {
      toast.success("NFe registrada com sucesso", {
        description: "Estoque e pedidos atualizados conforme vínculo.",
      });
      queryClient.invalidateQueries({ queryKey: ["nfe_entrada"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos_compra"] });
      queryClient.invalidateQueries({ queryKey: ["estoque_itens"] });
      queryClient.invalidateQueries({ queryKey: ["estoque_movimentacoes"] });
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao registrar NFe", error));
    },
  });
}
