import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";

interface OrcamentoItem {
  largura?: number;
  altura?: number;
  quantidade?: number;
}

type OSComClienteEOrcamentoCompleto = Database["public"]["Tables"]["ordens_servico"]["Row"] & {
  clientes: { nome: string }[] | null;
  orcamentos: { valor_total: number; itens: OrcamentoItem[] }[] | null;
};

export interface FaturamentoCliente {
  cliente_id: string;
  cliente: string;
  total_os: number;
  area_total_m2: number;
  faturamento_total: number;
  ticket_medio: number;
}

export function useFaturamentoPorCliente(periodoMeses?: number) {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["relatorio_faturamento_cliente", periodoMeses],
    queryFn: async () => {
      // Buscar OS concluídas com dados do cliente e orçamento
      let query = supabase
        .from("ordens_servico")
        .select("*, clientes(nome), orcamentos(valor_total, itens)");

      // Filtrar por período se especificado
      if (periodoMeses) {
        const dataInicio = new Date();
        dataInicio.setMonth(dataInicio.getMonth() - periodoMeses);
        query = query.gte("created_at", dataInicio.toISOString());
      }

      // Apenas OS concluídas ou instaladas
      query = query.in("status", ["Concluido", "Instalacao"]);

      const { data: os, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      // Agrupar por cliente
      const clienteMap = new Map<string, FaturamentoCliente>();

      (os as OSComClienteEOrcamentoCompleto[] | null)?.forEach((osItem) => {
        const cliente = osItem.clientes?.[0];
        const clienteId = osItem.cliente_id || "sem_cliente";
        const clienteNome = cliente?.nome || "Cliente não identificado";

        const orcamento = osItem.orcamentos?.[0];
        const valorTotal = Number(orcamento?.valor_total || 0);
        const itens = orcamento?.itens || [];

        // Calcular área total em m²
        const areaM2 = itens.reduce((acc: number, item) => {
          const largura = Number(item.largura || 0);
          const altura = Number(item.altura || 0);
          const quantidade = Number(item.quantidade || 0);
          return acc + (largura * altura * quantidade) / 1000000;
        }, 0);

        const clienteData = clienteMap.get(clienteId) || {
          cliente_id: clienteId,
          cliente: clienteNome,
          total_os: 0,
          area_total_m2: 0,
          faturamento_total: 0,
          ticket_medio: 0,
        };

        clienteData.total_os += 1;
        clienteData.area_total_m2 += areaM2;
        clienteData.faturamento_total += valorTotal;
        clienteMap.set(clienteId, clienteData);
      });

      // Calcular ticket médio e ordenar por faturamento
      const faturamentoClientes: FaturamentoCliente[] = Array.from(clienteMap.values())
        .sort((a, b) => b.faturamento_total - a.faturamento_total)
        .map((data) => ({
          ...data,
          area_total_m2: parseFloat(data.area_total_m2.toFixed(2)),
          faturamento_total: parseFloat(data.faturamento_total.toFixed(2)),
          ticket_medio: parseFloat((data.faturamento_total / data.total_os).toFixed(2)),
        }));

      return faturamentoClientes;
    },
  });
}
