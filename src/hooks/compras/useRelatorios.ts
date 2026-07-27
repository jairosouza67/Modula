import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ComprasPorFornecedor {
  fornecedor_id: string;
  fornecedor: string; // mapped from fornecedor_nome
  total_pedidos: number;
  valor_total: number; // mapped from valor_total_compras
  area_total_m2: number; // mapped from volume_total_m2
  ticket_medio: number; // calculated
  perc_no_prazo: number;
}

export function useRelatorioCompras() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["relatorio_compras_fornecedor"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_compras_por_fornecedor")
        .select("*")
        .order("valor_total_compras", { ascending: false });

      if (error) throw error;

      // Mapear os dados para o formato que a interface espera
      return (data ?? []).map((row) => ({
        fornecedor_id: String(row.fornecedor_id || ""),
        fornecedor: String(row.fornecedor_nome || ""),
        total_pedidos: Number(row.total_pedidos || 0),
        valor_total: Number(row.valor_total_compras || 0),
        area_total_m2: Number(row.volume_total_m2 || 0),
        ticket_medio:
          Number(row.total_pedidos || 0) > 0
            ? Number(row.valor_total_compras || 0) / Number(row.total_pedidos || 1)
            : 0,
        perc_no_prazo: Number(row.perc_no_prazo || 0),
      }));
    },
  });
}
