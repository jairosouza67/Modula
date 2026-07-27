import { Truck } from "lucide-react";
import { ErpCard } from "@/components/erp/Card";
import { formatCurrency } from "@/lib/utils";
import { useRelatorioCompras } from "@/hooks/compras/useRelatorios";
import { LoadingSkeleton, ReportEmptyState } from "./shared";

export function TabSuprimentos() {
  const { data: compras, isLoading } = useRelatorioCompras();
  const top = compras?.slice(0, 5) ?? [];
  const maxVal = top[0]?.valor_total || 1;

  return (
    <ErpCard
      title={
        <span className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-primary" />
          Compras por fornecedor (Top 5)
        </span>
      }
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : top.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            {top.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span
                  className="w-[120px] truncate text-muted-foreground"
                  title={c.fornecedor}
                >
                  {c.fornecedor}
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all"
                    style={{
                      width: `${(c.valor_total / maxVal) * 100}%`,
                    }}
                  />
                </div>
                <span className="font-medium w-[75px] text-right text-[10px]">
                  {formatCurrency(c.valor_total)}
                </span>
              </div>
            ))}
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                <th className="py-2">Fornecedor</th>
                <th className="py-2 text-right">Pedidos</th>
                <th className="py-2 text-right">Área (m²)</th>
                <th className="py-2 text-right">Ticket méd.</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {top.map((c, i) => (
                <tr
                  key={i}
                  className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40"
                >
                  <td className="py-2">{c.fornecedor}</td>
                  <td className="py-2 text-right">{c.total_pedidos}</td>
                  <td className="py-2 text-right">
                    {c.area_total_m2?.toFixed(2) || "0.00"} m²
                  </td>
                  <td className="py-2 text-right">
                    {formatCurrency(c.ticket_medio)}
                  </td>
                  <td className="py-2 text-right font-medium text-primary">
                    {formatCurrency(c.valor_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ReportEmptyState message="Nenhum dado de compras encontrado." />
      )}
    </ErpCard>
  );
}
