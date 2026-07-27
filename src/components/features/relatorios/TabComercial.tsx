import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ShoppingBag, TrendingUp, Users } from "lucide-react";
import { ErpCard } from "@/components/erp/Card";
import { formatCurrency } from "@/lib/utils";
import { useFaturamentoPorCliente } from "@/hooks/useFaturamentoCliente";
import { useProdutosMaisVendidos } from "@/hooks/useProdutosVendidos";
import { useFaturamentoPorSegmento } from "@/hooks/useKPIsRelatorios";
import { LoadingSkeleton, ReportEmptyState } from "./shared";

const PIE_COLORS = [
  "hsl(217 73% 37%)",
  "hsl(160 70% 36%)",
  "hsl(33 78% 41%)",
  "hsl(45 6% 53%)",
  "hsl(0 72% 45%)",
  "hsl(271 68% 45%)",
];

const BAR_COLORS = { primary: "#185FA5", success: "#1D9E75", warning: "#BA7517" };

/* ── Aba Comercial ── */
export function TabComercial() {
  return (
    <>
      <div className="grid gap-3 lg:grid-cols-2">
        <FaturamentoClienteCard />
        <ProdutosVendidosCard />
      </div>
      <SegmentoCard />
    </>
  );
}

/* ── Faturamento por Cliente ── */
function FaturamentoClienteCard() {
  const { data: clientes, isLoading } = useFaturamentoPorCliente(12);
  const top = clientes?.slice(0, 10) ?? [];
  const maxVal = top[0]?.faturamento_total || 1;
  const totFat = top.reduce((a, c) => a + c.faturamento_total, 0);
  const totArea = top.reduce((a, c) => a + c.area_total_m2, 0);
  const totOS = top.reduce((a, c) => a + c.total_os, 0);

  return (
    <ErpCard
      title={
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-primary" />
          Faturamento por cliente (Top 10)
        </span>
      }
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : top.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            {top.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span
                  className="w-[100px] truncate text-muted-foreground"
                  title={c.cliente}
                >
                  {c.cliente}
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all"
                    style={{
                      width: `${(c.faturamento_total / maxVal) * 100}%`,
                    }}
                  />
                </div>
                <span className="font-medium w-[75px] text-right text-[10px]">
                  {formatCurrency(c.faturamento_total)}
                </span>
              </div>
            ))}
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                <th className="py-2">Cliente</th>
                <th className="py-2 text-right">OS</th>
                <th className="py-2 text-right">Área (m²)</th>
                <th className="py-2 text-right">Faturamento</th>
                <th className="py-2 text-right">Ticket médio</th>
              </tr>
            </thead>
            <tbody>
              {top.map((c, i) => (
                <tr
                  key={i}
                  className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40"
                >
                  <td
                    className="py-2 font-medium truncate max-w-[180px]"
                    title={c.cliente}
                  >
                    {c.cliente}
                  </td>
                  <td className="py-2 text-right">{c.total_os}</td>
                  <td className="py-2 text-right">
                    {c.area_total_m2.toFixed(2)} m²
                  </td>
                  <td className="py-2 text-right font-medium text-primary">
                    {formatCurrency(c.faturamento_total)}
                  </td>
                  <td className="py-2 text-right">
                    {formatCurrency(c.ticket_medio)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border text-[11px] font-medium">
                <td className="py-2">Total</td>
                <td className="py-2 text-right">{totOS}</td>
                <td className="py-2 text-right">{totArea.toFixed(2)} m²</td>
                <td className="py-2 text-right text-primary">
                  {formatCurrency(totFat)}
                </td>
                <td className="py-2 text-right">
                  {formatCurrency(totOS > 0 ? totFat / totOS : 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <ReportEmptyState message="Nenhum dado de faturamento encontrado." />
      )}
    </ErpCard>
  );
}

/* ── Produtos Mais Vendidos ── */
function ProdutosVendidosCard() {
  const { data: produtos, isLoading } = useProdutosMaisVendidos(10, 12);
  const topPie = produtos?.slice(0, 6) ?? [];
  const totValor = produtos?.reduce((a, p) => a + p.valor_total, 0) || 0;
  const totArea = produtos?.reduce((a, p) => a + p.area_total_m2, 0) || 0;
  const totPecas = produtos?.reduce((a, p) => a + p.total_pecas, 0) || 0;

  return (
    <ErpCard
      title={
        <span className="flex items-center gap-1.5">
          <ShoppingBag className="h-3.5 w-3.5 text-primary" />
          Produtos mais vendidos (Top 10)
        </span>
      }
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : produtos && produtos.length > 0 ? (
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-[180px_1fr] items-center">
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topPie}
                    dataKey="area_total_m2"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={2}
                  >
                    {topPie.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number | string) => [
                      `${Number(v).toFixed(1)} m²`,
                      "Área",
                    ]}
                    contentStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1">
              {topPie.map((p, i) => (
                <div
                  key={p.produto}
                  className="flex justify-between text-[10px]"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    <span
                      className="truncate max-w-[140px]"
                      title={p.produto}
                    >
                      {p.produto}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    {p.area_total_m2.toFixed(1)} m²
                  </span>
                </div>
              ))}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                <th className="py-2">Produto</th>
                <th className="py-2 text-right">Peças</th>
                <th className="py-2 text-right">Área (m²)</th>
                <th className="py-2 text-right">Valor total</th>
                <th className="py-2 text-right">Preço/m²</th>
              </tr>
            </thead>
            <tbody>
              {produtos.slice(0, 10).map((p, i) => (
                <tr
                  key={i}
                  className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40"
                >
                  <td
                    className="py-2 font-medium truncate max-w-[150px]"
                    title={p.produto}
                  >
                    {p.produto}
                  </td>
                  <td className="py-2 text-right">{p.total_pecas}</td>
                  <td className="py-2 text-right">
                    {p.area_total_m2.toFixed(2)} m²
                  </td>
                  <td className="py-2 text-right font-medium text-primary">
                    {formatCurrency(p.valor_total)}
                  </td>
                  <td className="py-2 text-right">
                    {formatCurrency(p.preco_medio_m2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border text-[11px] font-medium">
                <td className="py-2">Total</td>
                <td className="py-2 text-right">{totPecas}</td>
                <td className="py-2 text-right">{totArea.toFixed(2)} m²</td>
                <td className="py-2 text-right text-primary">
                  {formatCurrency(totValor)}
                </td>
                <td className="py-2 text-right">
                  {totArea > 0 ? formatCurrency(totValor / totArea) : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <ReportEmptyState message="Nenhum dado de produtos encontrado." />
      )}
    </ErpCard>
  );
}

/* ── Faturamento por Segmento ── */
function SegmentoCard() {
  const { data: segmento, isLoading } = useFaturamentoPorSegmento();

  return (
    <ErpCard
      title={
        <span className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          Faturamento por segmento (R$ mil)
        </span>
      }
      className="mt-3"
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : segmento && segmento.length > 0 ? (
        <div className="space-y-3">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmento}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v}k`}
                />
                <Tooltip
                  formatter={(v: number | string, n: string | number) => [
                    `R$ ${Number(v).toFixed(1)}k`,
                    String(n),
                  ]}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar
                  dataKey="construtoras"
                  stackId="a"
                  fill={BAR_COLORS.primary}
                  name="Construtoras"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="residencial"
                  stackId="a"
                  fill={BAR_COLORS.success}
                  name="Residencial"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="comercial"
                  stackId="a"
                  fill={BAR_COLORS.warning}
                  name="Comercial"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: BAR_COLORS.primary }}
              />
              Construtoras
            </span>
            <span className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: BAR_COLORS.success }}
              />
              Residencial
            </span>
            <span className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: BAR_COLORS.warning }}
              />
              Comercial
            </span>
          </div>
        </div>
      ) : (
        <ReportEmptyState message="Nenhum dado de segmento encontrado." />
      )}
    </ErpCard>
  );
}
