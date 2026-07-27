import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";

interface OrcamentoItem {
  largura?: number;
  altura?: number;
  quantidade?: number;
}

type OSComOrcamentoCompleto = Database["public"]["Tables"]["ordens_servico"]["Row"] & {
  orcamentos: { valor_total: number; itens: OrcamentoItem[] }[] | null;
};

// Interfaces para OS por período
export interface OSPeriodoData {
  mes: string;
  quantidade: number;
  area_m2: number;
  valor_total: number;
  prazo_medio_dias: number;
}

export interface OSStatusResumo {
  status: string;
  quantidade: number;
  valor_total: number;
}

export function useOSPorPeriodo(dataInicio?: string, dataFim?: string) {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["relatorio_os_periodo", dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase.from("ordens_servico").select("*, orcamentos(valor_total, itens)");

      if (dataInicio) {
        query = query.gte("data_previsao", dataInicio);
      }
      if (dataFim) {
        query = query.lte("data_previsao", dataFim);
      }

      const { data: os, error } = await query.order("data_previsao", { ascending: true });

      if (error) throw error;

      // Agrupar por mês
      const mesMap = new Map<string, OSPeriodoData>();
      const statusMap = new Map<string, OSStatusResumo>();

      (os as OSComOrcamentoCompleto[] | null)?.forEach((osItem) => {
        if (!osItem.data_previsao) return;

        const data = new Date(osItem.data_previsao);
        const mesKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
        const mesLabel = data.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

        const orcamento = osItem.orcamentos?.[0];
        const valorTotal = Number(orcamento?.valor_total || 0);
        const itens = orcamento?.itens || [];
        const areaM2 = itens.reduce((acc: number, item) => {
          return (
            acc +
            (Number(item.largura || 0) * Number(item.altura || 0) * Number(item.quantidade || 0)) /
              1000000
          );
        }, 0);

        // Calcular prazo (diferença entre created_at e data_previsao)
        const created = new Date(osItem.created_at);
        const previsao = new Date(osItem.data_previsao);
        const prazoDias = Math.max(
          1,
          Math.ceil((previsao.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)),
        );

        // Agrupar por mês
        const mesData = mesMap.get(mesKey) || {
          mes: mesLabel,
          quantidade: 0,
          area_m2: 0,
          valor_total: 0,
          prazo_medio_dias: 0,
        };

        mesData.quantidade += 1;
        mesData.area_m2 += areaM2;
        mesData.valor_total += valorTotal;
        mesData.prazo_medio_dias += prazoDias;
        mesMap.set(mesKey, mesData);

        // Agrupar por status
        const statusData = statusMap.get(osItem.status) || {
          status: osItem.status,
          quantidade: 0,
          valor_total: 0,
        };
        statusData.quantidade += 1;
        statusData.valor_total += valorTotal;
        statusMap.set(osItem.status, statusData);
      });

      // Calcular médias
      const periodoData: OSPeriodoData[] = Array.from(mesMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, data]) => ({
          ...data,
          area_m2: parseFloat(data.area_m2.toFixed(2)),
          valor_total: parseFloat(data.valor_total.toFixed(2)),
          prazo_medio_dias: Math.round(data.prazo_medio_dias / data.quantidade),
        }));

      const statusResumo: OSStatusResumo[] = Array.from(statusMap.values())
        .sort((a, b) => b.valor_total - a.valor_total)
        .map((data) => ({
          ...data,
          valor_total: parseFloat(data.valor_total.toFixed(2)),
        }));

      return { periodoData, statusResumo };
    },
  });
}
