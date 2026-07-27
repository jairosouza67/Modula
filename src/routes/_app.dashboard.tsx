import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import {
  AlertTriangle,
  Bell,
  Banknote,
  Clock,
  Plus,
  Package,
  UserX,
  TrendingUp,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/erp/PageHeader";
import { KpiCard } from "@/components/erp/KpiCard";
import { ErpCard } from "@/components/erp/Card";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { AlertaDashboard } from "@/hooks/useDashboardData";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Vidraçaria Ornamental" },
      { name: "description", content: "Visão consolidada da vidraçaria em tempo real." },
    ],
  }),
  component: DashboardPage,
});

const PIE_COLORS = [
  "hsl(217 73% 37%)",
  "hsl(160 70% 36%)",
  "hsl(33 78% 41%)",
  "hsl(45 6% 53%)",
];

const ALERTA_ICON: Record<string, React.ReactNode> = {
  estoque: <Package className="h-3.5 w-3.5" />,
  os: <AlertTriangle className="h-3.5 w-3.5" />,
  financeiro: <Banknote className="h-3.5 w-3.5" />,
};

function AlertaItem({ alerta }: { alerta: AlertaDashboard }) {
  const bg =
    alerta.severidade === "danger"
      ? "bg-danger-bg"
      : alerta.severidade === "warning"
      ? "bg-warning-bg"
      : "bg-info-bg";
  const fg =
    alerta.severidade === "danger"
      ? "text-danger"
      : alerta.severidade === "warning"
      ? "text-warning"
      : "text-info";

  return (
    <div id={`alerta-${alerta.id}`} className={`flex gap-2 rounded-md p-2 ${bg}`}>
      <div className={`mt-0.5 flex-shrink-0 ${fg}`}>
        {ALERTA_ICON[alerta.modulo] ?? <AlertTriangle className="h-3.5 w-3.5" />}
      </div>
      <div>
        <div className={`text-[11px] font-medium ${fg}`}>{alerta.titulo}</div>
        <div className="text-[10px] text-muted-foreground">{alerta.descricao}</div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const { kpis, alertas, faturamentoMensal, tipoVidro, ultimasOS, osAtrasadas, ticketMedio, osSemTecnico, isLoading } = useDashboardData();

  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const anoAnterior = anoAtual - 1;
  const mesAtual = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(agora);
  const mesAtualFormatado = mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);
  const carregando = isLoading && alertas.length === 0 && ultimasOS.length === 0;
  const formatCurrency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  const alertasGraves = alertas.filter((a) => a.severidade === "danger");
  const alertasExibidos = alertas.slice(0, 5); // máx 5 no painel

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={carregando
          ? "Carregando dados reais do Supabase..."
          : `${mesAtualFormatado} — atualizado agora · ${alertas.length} alerta${alertas.length !== 1 ? "s" : ""} ativo${alertas.length !== 1 ? "s" : ""}`}
        actions={
          <>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className={`text-xs ${alertasGraves.length > 0 ? "border-danger/40 text-danger" : ""}`}
                  id="dashboard-btn-alertas"
                >
                  <Bell className="mr-1 h-3 w-3" />
                  {alertas.length} alerta{alertas.length !== 1 ? "s" : ""}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Alertas do Sistema</SheetTitle>
                  <SheetDescription>
                    Você tem {alertas.length} alerta{alertas.length !== 1 ? "s" : ""} ativo{alertas.length !== 1 ? "s" : ""}.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-3 h-[calc(100vh-8rem)] overflow-y-auto pr-2">
                  {alertas.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      Nenhum alerta no momento.
                    </div>
                  ) : (
                    alertas.map((a) => (
                      <AlertaItem key={a.id} alerta={a} />
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <Button size="sm" className="text-xs" id="dashboard-btn-nova-os" onClick={() => navigate({ to: "/pedidos" })}>
              <Plus className="mr-1 h-3 w-3" /> Nova OS
            </Button>
          </>
        }
      />

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 mb-3.5">
        <KpiCard
          label={`Faturamento — ${agora.toLocaleDateString("pt-BR", { month: "short" })}`}
          value={`R$ ${(kpis.faturamento.valor / 1000).toFixed(0)}k`}
          hint={kpis.faturamento.variacao >= 0 ? `↑ ${kpis.faturamento.variacao}% vs mês anterior` : `↓ ${Math.abs(kpis.faturamento.variacao)}% vs mês anterior`}
          hintTone="success"
        />
        <KpiCard
          label="Ordens de Serviço"
          value={`${kpis.osAbertas} abertas`}
          hint={kpis.osAtrasadas > 0 ? `⚠ ${kpis.osAtrasadas} atrasada${kpis.osAtrasadas > 1 ? "s" : ""}` : "✓ Prazo OK"}
          hintTone={kpis.osAtrasadas > 0 ? "warning" : "success"}
        />
        <KpiCard
          label="Vidro em Produção"
          value={`${kpis.m2EmProducao.toFixed(2)} m²`}
          hint="Produção atualizada pelo Supabase"
        />
        <KpiCard
          label="A Receber Vencido"
          value={`R$ ${(kpis.aReceberVencido / 1000).toFixed(1)}k`}
          hint={`${kpis.titrosVencidos} títulos em aberto`}
          hintTone={kpis.aReceberVencido > 0 ? "danger" : "success"}
        />
      </div>

      {/* KPIs secundários */}
      {(kpis.itensCriticos > 0 || kpis.osAtrasadas > 0) && (
        <div className="flex flex-wrap gap-2 mb-3.5">
          {kpis.itensCriticos > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/8 border border-danger/30 text-[11px] text-danger font-medium">
              <Package className="h-3.5 w-3.5" />
              {kpis.itensCriticos} item{kpis.itensCriticos > 1 ? "s" : ""} crítico{kpis.itensCriticos > 1 ? "s" : ""} em estoque
            </div>
          )}
          {kpis.osAtrasadas > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/8 border border-danger/30 text-[11px] text-danger font-medium">
              <Clock className="h-3.5 w-3.5" />
              {kpis.osAtrasadas} OS{kpis.osAtrasadas > 1 ? "" : ""} em atraso
            </div>
          )}
        </div>
      )}

      {osAtrasadas.length > 0 && (
        <div className="mb-3.5 rounded-xl border border-danger/20 bg-danger/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-danger">
            <Clock className="h-3.5 w-3.5" />
            OS em atraso
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {osAtrasadas.map((os) => (
              <div key={os.os} className="rounded-lg border border-danger/15 bg-background/80 p-2.5 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{os.os}</span>
                  <StatusBadge variant="danger">{os.diasAtraso} dia{os.diasAtraso !== 1 ? "s" : ""}</StatusBadge>
                </div>
                <div className="mt-1 truncate text-muted-foreground">{os.cliente}</div>
                <div className="mt-0.5 text-muted-foreground">Prazo: {os.prazo}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid gap-3 lg:grid-cols-3 mb-3.5">
        <ErpCard title="Faturamento mensal (R$)" className="lg:col-span-2">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={faturamentoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency.format(Number(v)), ""]}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="anoAnterior" fill="#B5D4F4" radius={[2, 2, 0, 0]} name="Ano anterior" />
                <Bar dataKey="anoAtual" fill="#185FA5" radius={[2, 2, 0, 0]} name="Ano atual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-1.5 justify-end">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="h-2 w-2 rounded-sm bg-[#B5D4F4]" /> {anoAnterior}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="h-2 w-2 rounded-sm bg-[#185FA5]" /> {anoAtual}
            </span>
          </div>
        </ErpCard>

        <ErpCard title="Mix de serviços aprovados">
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tipoVidro}
                  dataKey="value"
                  innerRadius={32}
                  outerRadius={56}
                  paddingAngle={2}
                >
                  {tipoVidro.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {tipoVidro.map((t, i) => (
              <div key={t.name} className="flex justify-between text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  {t.name}
                </span>
                <span className="text-muted-foreground">{t.value}%</span>
              </div>
            ))}
          </div>
        </ErpCard>
      </div>

      {/* Alertas + Últimas OS */}
      <div className="grid gap-3 lg:grid-cols-2">
        <ErpCard
          title={`Alertas do sistema (${alertas.length})`}
          className={alertasGraves.length > 0 ? "border-danger/20" : ""}
        >
          {alertas.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-[11px] text-muted-foreground gap-2">
              <Layers className="h-8 w-8 opacity-20" />
              Nenhum alerta ativo. Sistema operando normalmente.
            </div>
          ) : (
            <div className="space-y-2">
              {alertasExibidos.map((a) => (
                <AlertaItem key={a.id} alerta={a} />
              ))}
              {alertas.length > 5 && (
                <p className="text-center text-[10px] text-muted-foreground pt-1">
                  + {alertas.length - 5} alerta{alertas.length - 5 > 1 ? "s" : ""} adicional{alertas.length - 5 > 1 ? "is" : ""}
                </p>
              )}
            </div>
          )}
        </ErpCard>

        <ErpCard title="Últimas OS" id="dashboard-ultimas-os">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                <th className="py-1.5">OS</th>
                <th>Cliente</th>
                <th>Status</th>
                <th className="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {ultimasOS.map((o) => (
                <tr
                  key={o.os}
                  className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40"
                >
                  <td className="py-1.5 font-medium">{o.os}</td>
                  <td className="truncate max-w-[120px]">{o.cliente}</td>
                  <td>
                    <StatusBadge variant={o.variant}>{o.status}</StatusBadge>
                  </td>
                  <td className="text-right">{o.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mini KPIs rápidos */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-2 text-[10px]">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              <span className="text-muted-foreground">Ticket médio:</span>
              <span className="font-medium">{ticketMedio > 0 ? formatCurrency.format(ticketMedio) : "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <UserX className="h-3.5 w-3.5 text-warning" />
              <span className="text-muted-foreground">Sem técnico:</span>
              <span className="font-medium text-warning">{osSemTecnico} OS</span>
            </div>
          </div>
        </ErpCard>
      </div>
    </>
  );
}
