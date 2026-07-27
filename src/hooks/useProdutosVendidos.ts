import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";

interface OrcamentoItem {
  produto?: string;
  tipo?: string;
  largura?: number;
  altura?: number;
  quantidade?: number;
}

type OSComOrcamentoCompleto = Database["public"]["Tables"]["ordens_servico"]["Row"] & {
  orcamentos: { valor_total: number; itens: OrcamentoItem[] }[] | null;
};

export interface ProdutoVendido {
  produto: string;
  total_pecas: number;
  area_total_m2: number;
  valor_total: number;
  preco_medio_m2: number;
}

export function useProdutosMaisVendidos(topN: number = 10, periodoMeses?: number) {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["relatorio_produtos_vendidos", topN, periodoMeses],
    queryFn: async () => {
      // Buscar OS concluídas com itens
      let query = supabase.from("ordens_servico").select("*, orcamentos(valor_total, itens)");

      // Filtrar por período se especificado
      if (periodoMeses) {
        const dataInicio = new Date();
        dataInicio.setMonth(dataInicio.getMonth() - periodoMeses);
        query = query.gte("created_at", dataInicio.toISOString());
      }

      // Apenas OS concluídas ou em instalação
      query = query.in("status", ["Concluido", "Instalacao"]);

      const { data: os, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      // Extrair todos os itens e agrupar por produto
      const produtoMap = new Map<string, ProdutoVendido>();

      (os as OSComOrcamentoCompleto[] | null)?.forEach((osItem) => {
        const orcamento = osItem.orcamentos?.[0];
        const itens = orcamento?.itens || [];
        const valorTotalOrcamento = Number(orcamento?.valor_total || 0);

        // Calcular área total da OS para distribuição proporcional do valor
        const areaTotalOS = itens.reduce((acc: number, i) => {
          const l = Number(i.largura || 0);
          const a = Number(i.altura || 0);
          const q = Number(i.quantidade || 0);
          return acc + (l * a * q) / 1000000;
        }, 0);

        itens.forEach((item) => {
          const nomeProduto = item.produto || item.tipo || "Produto não identificado";
          const largura = Number(item.largura || 0);
          const altura = Number(item.altura || 0);
          const quantidade = Number(item.quantidade || 0);
          const areaM2 = (largura * altura * quantidade) / 1000000;

          // Distribuir valor proporcionalmente pela área
          const valorItem =
            valorTotalOrcamento > 0 && areaM2 > 0 && areaTotalOS > 0
              ? (areaM2 / areaTotalOS) * valorTotalOrcamento
              : 0;

          const produtoData = produtoMap.get(nomeProduto) || {
            produto: nomeProduto,
            total_pecas: 0,
            area_total_m2: 0,
            valor_total: 0,
            preco_medio_m2: 0,
          };

          produtoData.total_pecas += quantidade;
          produtoData.area_total_m2 += areaM2;
          produtoData.valor_total += valorItem;
          produtoMap.set(nomeProduto, produtoData);
        });
      });

      // Calcular preço médio por m² e ordenar por valor
      const produtosVendidos: ProdutoVendido[] = Array.from(produtoMap.values())
        .sort((a, b) => b.valor_total - a.valor_total)
        .slice(0, topN)
        .map((data) => ({
          ...data,
          area_total_m2: parseFloat(data.area_total_m2.toFixed(2)),
          valor_total: parseFloat(data.valor_total.toFixed(2)),
          preco_medio_m2:
            data.area_total_m2 > 0
              ? parseFloat((data.valor_total / data.area_total_m2).toFixed(2))
              : 0,
        }));

      return produtosVendidos;
    },
  });
}
