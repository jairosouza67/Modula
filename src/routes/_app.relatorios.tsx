import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/erp/PageHeader";
import { KpiCard } from "@/components/erp/KpiCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { useKPIsRelatorios } from "@/hooks/useKPIsRelatorios";
import { useInadimplencia } from "@/hooks/useInadimplencia";
import { useProdutosMaisVendidos } from "@/hooks/useProdutosVendidos";
import { TabOperacional } from "@/components/features/relatorios/TabOperacional";
import { TabComercial } from "@/components/features/relatorios/TabComercial";
import { TabFinanceiro } from "@/components/features/relatorios/TabFinanceiro";
import { TabSuprimentos } from "@/components/features/relatorios/TabSuprimentos";

export const Route = createFileRoute("/_app/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios / BI — Vidraçaria Ornamental" },
      {
        name: "description",
        content: "Inteligência de negócio com análise de desempenho.",
      },
    ],
  }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { data: kpis, isLoading: loadingKPIs } = useKPIsRelatorios();
  const { data: inadimplencia, isLoading: loadingInadimplencia } =
    useInadimplencia();
  const { data: produtosVendidos, isLoading: loadingProdutos } =
    useProdutosMaisVendidos(10, 12);

  const totalM2 =
    produtosVendidos?.reduce((acc, p) => acc + p.area_total_m2, 0) || 0;

  return (
    <>
      <PageHeader
        title="Relatórios / BI"
        subtitle="Inteligência de negócio · análise e exportação"
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 mb-3.5">
        <KpiCard
          label="Receita acumulada (ano)"
          value={
            loadingKPIs
              ? "..."
              : formatCurrency(kpis?.receita_acumulada_ano || 0)
          }
          hintTone={
            kpis && kpis.percentual_crescimento > 0 ? "success" : "danger"
          }
          hint={
            loadingKPIs
              ? ""
              : `${kpis?.percentual_crescimento && kpis.percentual_crescimento > 0 ? "↑" : "↓"} ${Math.abs(kpis?.percentual_crescimento || 0)}% vs ano anterior`
          }
          topBar="#185FA5"
        />
        <KpiCard
          label="OS concluídas (ano)"
          value={
            loadingKPIs ? "..." : String(kpis?.os_concluidas_ano || 0)
          }
          topBar="#1D9E75"
        />
        <KpiCard
          label="Área vendida (12 meses)"
          value={loadingProdutos ? "..." : `${totalM2.toFixed(0)} m²`}
          topBar="#BA7517"
        />
        <KpiCard
          label="Inadimplência"
          value={
            loadingInadimplencia
              ? "..."
              : formatCurrency(inadimplencia?.total_vencido || 0)
          }
          hintTone={
            inadimplencia && inadimplencia.total_vencido > 0
              ? "danger"
              : "success"
          }
          hint={
            loadingInadimplencia
              ? ""
              : `${inadimplencia?.quantidade_titulos || 0} título(s) vencido(s)`
          }
          topBar={
            inadimplencia && inadimplencia.total_vencido > 0
              ? "#C0392B"
              : "#1D9E75"
          }
        />
      </div>

      <Tabs defaultValue="operacional" className="w-full space-y-4">
        <TabsList className="h-8">
          <TabsTrigger value="operacional" className="text-xs">
            Operacional
          </TabsTrigger>
          <TabsTrigger value="comercial" className="text-xs">
            Comercial
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="text-xs">
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="suprimentos" className="text-xs">
            Suprimentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operacional" className="space-y-4">
          <TabOperacional />
        </TabsContent>
        <TabsContent value="comercial" className="space-y-4">
          <TabComercial />
        </TabsContent>
        <TabsContent value="financeiro" className="space-y-4">
          <TabFinanceiro />
        </TabsContent>
        <TabsContent value="suprimentos" className="space-y-4">
          <TabSuprimentos />
        </TabsContent>
      </Tabs>
    </>
  );
}
