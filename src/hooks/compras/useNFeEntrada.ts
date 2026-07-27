import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface NFeEntrada {
  id: string;
  empresa_id: string;
  fornecedor_id?: string;
  fornecedor_nome: string;
  numero: string;
  serie: string;
  chave_acesso: string;
  data_emissao: string;
  valor_total: number;
  pedido_compra_id?: string;
  status_sped: string;
  criado_em: string;
}

export function useNFeEntrada() {
  const supabase = getSupabaseBrowserClient();
  return useQuery({
    queryKey: ['nfe_entrada'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nfe_entrada')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data as NFeEntrada[];
    }
  });
}
