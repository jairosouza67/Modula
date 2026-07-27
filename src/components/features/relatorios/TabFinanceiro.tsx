import { AlertTriangle } from "lucide-react";
import { ErpCard } from "@/components/erp/Card";
import { KpiCard } from "@/components/erp/KpiCard";
import { formatCurrency } from "@/lib/utils";
import { useInadimplencia } from "@/hooks/useInadimplencia";
import { LoadingSkeleton, ReportEmptyState } from "./shared";

const AGING_COLORS = ["#BA7517", "#C0392B", "#8E44AD", "#2C3E50"];

export function TabFinanceiro() {
  const { data: inadimplencia, isLoading } = useInadimplencia();

  const aging = [
    { label: "0–30 dias", valor: 0, count: 0 },
    { label: "31–60 dias", valor: 0, count: 0 },
    { label: "61–90 dias", valor: 0, count: 0 },
    { label: "90+ dias", valor: 0, count: 0 },
  ];

  inadimplencia?.titulos_vencidos.forEach((t) => {
    const idx =
      t.dias_atraso <= 30 ? 0 : t.dias_atraso <= 60 ? 1 : t.dias_atraso <= 90 ? 2 : 3;
    aging[idx].valor += t.valor;
    aging[idx].count++;
  });

  const maxAging = Math.max(...aging.map((a) => a.valor), 1);

  return (
    <ErpCard
      title={
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          Inadimplência — contas vencidas
        </span>
      }
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : inadimplencia ? (
        <div className="space-y-3">
          <InadimplenciaKPIs
            totalVencido={inadimplencia.total_vencido}
            qtdTitulos={inadimplencia.quantidade_titulos}
            idadeMedia={inadimplencia.idade_media_dias}
          />

          <AgingDistribution
            aging={aging}
            maxAging={maxAging}
            totalVencido={inadimplencia.total_vencido}
          />

          <TitulosTable titulos={inadimplencia.titulos_vencidos} />

          <TopDevedores devedores={inadimplencia.top_devedores} />
        </div>
      ) : (
        <ReportEmptyState message="Nenhuma conta vencida encontrada." />
      )}
    </ErpCard>
  );
}

/* ── KPIs da inadimplência ── */
function InadimplenciaKPIs({
  totalVencido,
  qtdTitulos,
  idadeMedia,
}: {
  totalVencido: number;
  qtdTitulos: number;
  idadeMedia: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
      <KpiCard
        label="Total vencido"
        value={formatCurrency(totalVencido)}
        hintTone="danger"
        hint="⚠ Atenção"
        topBar="#C0392B"
      />
      <KpiCard
        label="Qtd. títulos"
        value={String(qtdTitulos)}
        hintTone="danger"
        topBar="#C0392B"
      />
      <KpiCard
        label="Idade média"
        value={`${idadeMedia} dias`}
        hintTone="danger"
        topBar="#C0392B"
      />
    </div>
  );
}

/* ── Distribuição por aging ── */
function AgingDistribution({
  aging,
  maxAging,
  totalVencido,
}: {
  aging: { label: string; valor: number; count: number }[];
  maxAging: number;
  totalVencido: number;
}) {
  if (totalVencido <= 0) return null;

  return (
    <div className="rounded-md border border-border/40 p-3 space-y-2">
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
        Distribuição por aging
      </div>
      {aging
        .filter((a) => a.count > 0)
        .map((bucket, i) => (
          <div key={bucket.label} className="flex items-center gap-2 text-[10px]">
            <span className="w-[70px] text-muted-foreground">{bucket.label}</span>
            <div className="flex-1 h-3 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(bucket.valor / maxAging) * 100}%`,
                  backgroundColor: AGING_COLORS[i],
                }}
              />
            </div>
            <span className="font-medium w-[80px] text-right">
              {formatCurrency(bucket.valor)}
            </span>
            <span className="text-muted-foreground w-[30px] text-right">
              {bucket.count}×
            </span>
          </div>
        ))}
    </div>
  );
}

/* ── Tabela de títulos vencidos ── */
function TitulosTable({
  titulos,
}: {
  titulos: {
    id: string;
    cliente: string;
    referencia: string;
    vencimento: string;
    dias_atraso: number;
    valor: number;
  }[];
}) {
  if (titulos.length === 0) return null;

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
          <th className="py-2">Cliente</th>
          <th className="py-2">Referência</th>
          <th className="py-2 text-right">Vencimento</th>
          <th className="py-2 text-right">Dias atraso</th>
          <th className="py-2 text-right">Valor</th>
        </tr>
      </thead>
      <tbody>
        {titulos.slice(0, 15).map((t) => (
          <tr
            key={t.id}
            className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40"
          >
            <td
              className="py-2 font-medium truncate max-w-[200px]"
              title={t.cliente}
            >
              {t.cliente}
            </td>
            <td className="py-2 text-muted-foreground">{t.referencia}</td>
            <td className="py-2 text-right">
              {new Date(t.vencimento).toLocaleDateString("pt-BR")}
            </td>
            <td className="py-2 text-right text-destructive font-medium">
              {t.dias_atraso} dias
            </td>
            <td className="py-2 text-right font-medium">
              {formatCurrency(t.valor)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Top Devedores ── */
function TopDevedores({
  devedores,
}: {
  devedores: {
    cliente: string;
    total_devido: number;
    quantidade_titulos: number;
  }[];
}) {
  if (devedores.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/40">
      <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3 text-destructive" />
        Top devedores
      </h4>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {devedores.slice(0, 6).map((dev, i) => (
          <div
            key={i}
            className="rounded-md border border-border/60 p-2 bg-muted/30"
          >
            <div className="text-[10px] text-muted-foreground truncate">
              {dev.cliente}
            </div>
            <div className="text-xs font-medium text-destructive">
              {formatCurrency(dev.total_devido)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {dev.quantidade_titulos} título(s)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
