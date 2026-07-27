import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";

type OSComOrcamento = Database["public"]["Tables"]["ordens_servico"]["Row"] & {
  orcamentos: { valor_total: number }[] | null;
};

type OSComClienteEOrcamento = Database["public"]["Tables"]["ordens_servico"]["Row"] & {
  clientes: { segmento: string }[] | null;
  orcamentos: { valor_total: number }[] | null;
};

export interface KPIsRelatorios {
  receita_acumulada_ano: number;
  os_concluidas_ano: number;
  percentual_crescimento: number;
}

export function useKPIsRelatorios() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["kpis_relatorios"],
    queryFn: async () => {
      const anoAtual = new Date().getFullYear();
      const anoAnterior = anoAtual - 1;

      // Buscar OS concluídas do ano atual
      const { data: osAnoAtual, error: errorOS } = await supabase
        .from("ordens_servico")
        .select("*, orcamentos(valor_total)")
        .gte("created_at", `${anoAtual}-01-01`)
        .lt("created_at", `${anoAtual + 1}-01-01`)
        .in("status", ["Concluido", "Instalacao"]);

      if (errorOS) throw errorOS;

      // Buscar OS concluídas do ano anterior para cálculo de crescimento
      const { data: osAnoAnterior, error: errorOSAnt } = await supabase
        .from("ordens_servico")
        .select("*, orcamentos(valor_total)")
        .gte("created_at", `${anoAnterior}-01-01`)
        .lt("created_at", `${anoAnterior + 1}-01-01`)
        .in("status", ["Concluido", "Instalacao"]);

      if (errorOSAnt) throw errorOSAnt;

      // Calcular receita acumulada
      const receitaAnoAtual =
        (osAnoAtual as OSComOrcamento[] | null)?.reduce((acc, os) => {
          return acc + Number(os.orcamentos?.[0]?.valor_total || 0);
        }, 0) || 0;

      const receitaAnoAnterior =
        (osAnoAnterior as OSComOrcamento[] | null)?.reduce((acc, os) => {
          return acc + Number(os.orcamentos?.[0]?.valor_total || 0);
        }, 0) || 0;

      // Calcular percentual de crescimento
      const percentualCrescimento =
        receitaAnoAnterior > 0
          ? ((receitaAnoAtual - receitaAnoAnterior) / receitaAnoAnterior) * 100
          : 0;

      return {
        receita_acumulada_ano: parseFloat(receitaAnoAtual.toFixed(2)),
        os_concluidas_ano: osAnoAtual?.length || 0,
        percentual_crescimento: parseFloat(percentualCrescimento.toFixed(1)),
      } as KPIsRelatorios;
    },
  });
}

export interface FaturamentoSegmento {
  mes: string;
  construtoras: number;
  residencial: number;
  comercial: number;
}

export function useFaturamentoPorSegmento() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["faturamento_segmento"],
    queryFn: async () => {
      // Buscar OS dos últimos 6 meses
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 6);

      const { data: os, error } = await supabase
        .from("ordens_servico")
        .select("*, clientes(segmento), orcamentos(valor_total)")
        .gte("created_at", dataInicio.toISOString())
        .in("status", ["Concluido", "Instalacao"]);

      if (error) throw error;

      // Agrupar por mês e segmento
      const mesMap = new Map<string, FaturamentoSegmento>();

      (os as OSComClienteEOrcamento[] | null)?.forEach((osItem) => {
        const data = new Date(osItem.created_at);
        const mesKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
        const mesLabel = data.toLocaleDateString("pt-BR", { month: "short" });

        const cliente = osItem.clientes?.[0];
        const orcamento = osItem.orcamentos?.[0];
        const valor = Number(orcamento?.valor_total || 0) / 1000; // Em milhares

        const segmento = (cliente?.segmento || "Outros").toLowerCase();

        const mesData = mesMap.get(mesKey) || {
          mes: mesLabel,
          construtoras: 0,
          residencial: 0,
          comercial: 0,
        };

        // Classificar por segmento
        if (segmento.includes("construtor")) {
          mesData.construtoras += valor;
        } else if (segmento.includes("resid")) {
          mesData.residencial += valor;
        } else {
          mesData.comercial += valor;
        }

        mesMap.set(mesKey, mesData);
      });

      // Ordenar por mês e retornar
      const faturamentoSegmento: FaturamentoSegmento[] = Array.from(mesMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, data]) => ({
          ...data,
          construtoras: parseFloat(data.construtoras.toFixed(1)),
          residencial: parseFloat(data.residencial.toFixed(1)),
          comercial: parseFloat(data.comercial.toFixed(1)),
        }));

      return faturamentoSegmento;
    },
  });
}
