import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { Database } from "@/lib/supabase/types";

export function useInstaladores() {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  return useQuery({
    queryKey: ["instaladores", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("status", "Ativo");

      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });
}
