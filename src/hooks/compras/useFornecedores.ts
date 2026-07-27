import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";

export interface FornecedorListItem {
  id: string;
  nome: string;
  cnpj: string;
}

export function useFornecedores() {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  return useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("id, nome, cnpj")
        .eq("empresa_id", empresaId)
        .is("deleted_at", null)
        .order("nome");

      if (error) throw error;
      return data as FornecedorListItem[];
    },
  });
}
