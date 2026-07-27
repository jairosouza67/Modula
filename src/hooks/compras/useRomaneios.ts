import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface Romaneio {
  id: string;
  numero_oe: string | null;
  numero_nfe: string | null;
  data_emissao: string;
  data_recebimento: string | null;
  status: "pendente" | "em_conferencia" | "concluido" | "divergencia";
  criado_em: string;
  atualizado_em: string;
  pedido_compra: {
    numero: string;
    fornecedor_id: string;
    fornecedores: {
      nome: string;
    };
  };
}

export function useRomaneios() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["romaneios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("romaneios")
        .select(`
          id,
          numero_oe,
          numero_nfe,
          data_emissao,
          data_recebimento,
          status,
          criado_em,
          atualizado_em,
          pedido_compra:pedido_compra_id (
            numero,
            fornecedor_id,
            fornecedores:fornecedor_id (
              nome
            )
          )
        `)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });
}
