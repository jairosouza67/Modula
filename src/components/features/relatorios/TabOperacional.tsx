import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ClipboardList } from "lucide-react";
import { ErpCard } from "@/components/erp/Card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { useOSPorPeriodo } from "@/hooks/useRelatorios";
import { MiniResumos, LoadingSkeleton, ReportEmptyState } from "./shared";

const COLORS = { primary: "#185FA5", success: "#1D9E75" };

export function TabOperacional() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const { data, isLoading } = useOSPorPeriodo(
    dataInicio || undefined,
    dataFim || undefined,
  );
  const rows = data?.periodoData ?? [];

  const totOS = rows.reduce((a, r) => a + r.quantidade, 0);
  const totArea = rows.reduce((a, r) => a + r.area_m2, 0);
  const totValor = rows.reduce((a, r) => a + r.valor_total, 0);
  const pMedio =
    totOS > 0
      ? Math.round(
          rows.reduce((a, r) => a + r.prazo_medio_dias * r.quantidade, 0) /
            totOS,
        )
      : 0;

  return (
    <ErpCard
      title={
        <span className="flex items-center gap-1.5">
          <ClipboardList className="h-3.5 w-3.5 text-primary" />
          OS por período (volume e prazo)
        </span>
      }
    >
      <div className="flex items-center gap-2 mb-3">
        <Label className="text-[10px] text-muted-foreground whitespace-nowrap">De</Label>
        <Input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="h-7 text-[11px] max-w-[140px]"
        />
        <Label className="text-[10px] text-muted-foreground whitespace-nowrap">até</Label>
        <Input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          className="h-7 text-[11px] max-w-[140px]"
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : rows.length > 0 ? (
        <div className="space-y-3">
          <MiniResumos
            items={[
              { label: "Total OS", value: String(totOS) },
              { label: "Área total", value: `${totArea.toFixed(1)} m²` },
              { label: "Faturamento", value: formatCurrency(totValor) },
              { label: "Prazo médio", value: `${pMedio} dias` },
            ]}
          />

          <OSChart rows={rows} />
          <OSTable
            rows={rows}
            totOS={totOS}
            totArea={totArea}
            totValor={totValor}
            pMedio={pMedio}
          />
        </div>
      ) : (
        <ReportEmptyState message="Nenhuma OS encontrada no período." />
      )}
    </ErpCard>
  );
}

/* ── Gráfico ── */
function OSChart({
  rows,
}: {
  rows: { mes: string; quantidade: number; prazo_medio_dias: number }[];
}) {
  return (
    <>
      <div className="h-[110px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            barCategoryGap={24}
            barGap={6}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: number | string, name: string | number) => {
                const n = typeof value === "number" ? value : Number(value);
                return String(name) === "Prazo médio"
                  ? [`${n} dias`, String(name)]
                  : [n, String(name)];
              }}
              contentStyle={{ fontSize: 11 }}
            />
            <Bar
              yAxisId="left"
              dataKey="quantidade"
              fill={COLORS.primary}
              name="Qtd. OS"
              barSize={14}
              maxBarSize={20}
              radius={[2, 2, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="prazo_medio_dias"
              fill={COLORS.success}
              name="Prazo médio"
              barSize={14}
              maxBarSize={20}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 justify-end text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-sm"
            style={{ backgroundColor: COLORS.primary }}
          />
          Qtd. OS
        </span>
        <span className="flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-sm"
            style={{ backgroundColor: COLORS.success }}
          />
          Prazo médio
        </span>
      </div>
    </>
  );
}

/* ── Tabela ── */
function OSTable({
  rows,
  totOS,
  totArea,
  totValor,
  pMedio,
}: {
  rows: {
    mes: string;
    quantidade: number;
    area_m2: number;
    valor_total: number;
    prazo_medio_dias: number;
  }[];
  totOS: number;
  totArea: number;
  totValor: number;
  pMedio: number;
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
          <th className="py-2">Mês</th>
          <th className="py-2 text-right">Qtd. OS</th>
          <th className="py-2 text-right">Área (m²)</th>
          <th className="py-2 text-right">Valor total</th>
          <th className="py-2 text-right">Prazo médio</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr
            key={i}
            className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40"
          >
            <td className="py-2 capitalize">{r.mes}</td>
            <td className="py-2 text-right">{r.quantidade}</td>
            <td className="py-2 text-right">{r.area_m2.toFixed(2)} m²</td>
            <td className="py-2 text-right font-medium">
              {formatCurrency(r.valor_total)}
            </td>
            <td className="py-2 text-right">{r.prazo_medio_dias} dias</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-border text-[11px] font-medium">
          <td className="py-2">Total</td>
          <td className="py-2 text-right">{totOS}</td>
          <td className="py-2 text-right">{totArea.toFixed(2)} m²</td>
          <td className="py-2 text-right text-primary">
            {formatCurrency(totValor)}
          </td>
          <td className="py-2 text-right">{pMedio} dias</td>
        </tr>
      </tfoot>
    </table>
  );
}
