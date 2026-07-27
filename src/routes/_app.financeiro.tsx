import { useState } from "react";
import { createFileRoute } from "@tanstack/react-query"; // Wait, in the original it was "@tanstack/react-router"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Plus, Loader2, DollarSign, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { PageHeader } from "@/components/erp/PageHeader";
import { KpiCard } from "@/components/erp/KpiCard";
import { ErpCard } from "@/components/erp/Card";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinanceData, TituloFinanceiro } from "@/hooks/useFinanceData";
import { formatCurrency } from "@/lib/utils";
import { FinanceiroForm } from "@/components/features/financeiro/FinanceiroForm";
import { BaixaModal } from "@/components/features/financeiro/BaixaModal";

// Import correto para o router
import { createFileRoute as createRoute } from "@tanstack/react-router";

export const Route = createRoute("/_app/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Vidraçaria Ornamental" },
      { name: "description", content: "DRE, fluxo de caixa, contas a receber e a pagar." },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { kpis, recentes, graficoFluxo, isLoading } = useFinanceData();
  const [formOpen, setFormOpen] = useState<"RECEBER" | "PAGAR" | null>(null);
  const [baixaModalOpen, setBaixaModalOpen] = useState<TituloFinanceiro | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const contasReceber = recentes.filter(r => r.tipo === "RECEBER");
  const contasPagar = recentes.filter(r => r.tipo === "PAGAR");

  const handleExportDRE = () => {
    if (!kpis) return;

    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const csvContent = [
      "Vidraçaria Ornamental - DRE Simplificado",
      `Gerado em: ${dataAtual}`,
      "",
      "Descricao;Valor (R$)",
      `Receita Bruta;${kpis.receitaMes.toFixed(2).replace(".", ",")}`,
      `Custos / Despesas;${kpis.despesaMes.toFixed(2).replace(".", ",")}`,
      `Resultado Liquido;${kpis.resultadoMes.toFixed(2).replace(".", ",")}`,
      "",
      "Resumo Geral (Geral de todos os meses);Valor (R$)",
      `Saldo em Caixa;${kpis.saldoTotal.toFixed(2).replace(".", ",")}`,
      `A Receber Total (Pendentes);${kpis.aReceberTotal.toFixed(2).replace(".", ",")}`,
      `A Pagar Total (Vencimentos);${kpis.aPagarTotal.toFixed(2).replace(".", ",")}`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DRE_Simplificado_${dataAtual.replace(/\//g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHeader
        title="Financeiro"
        subtitle={`Saldo Total ${formatCurrency(kpis?.saldoTotal || 0)} · Previsão Mês ${formatCurrency(kpis?.previstoMes || 0)}`}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs" onClick={handleExportDRE}>
              <Download className="mr-1 h-3 w-3" /> Exportar DRE
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setFormOpen("RECEBER")}>
              <ArrowUpCircle className="mr-1 h-3 w-3 text-success" /> Nova Receita
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setFormOpen("PAGAR")}>
              <ArrowDownCircle className="mr-1 h-3 w-3 text-destructive" /> Nova Despesa
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="visao-geral" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="receber">A Receber</TabsTrigger>
          <TabsTrigger value="pagar">A Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 mb-3.5">
            <KpiCard 
              label="Saldo em caixa" 
              value={formatCurrency(kpis?.saldoTotal || 0)} 
              hintTone={(kpis?.saldoTotal || 0) >= 0 ? "success" : "danger"} 
              hint="Disponível" 
            />
            <KpiCard 
              label="A receber total" 
              value={formatCurrency(kpis?.aReceberTotal || 0)} 
              hintTone="success" 
              hint="Pendentes"
            />
            <KpiCard 
              label="A pagar total" 
              value={formatCurrency(kpis?.aPagarTotal || 0)} 
              hintTone="danger" 
              hint="Vencimentos"
            />
            <KpiCard 
              label="Saldo previsto" 
              value={formatCurrency(kpis?.previstoMes || 0)} 
              hintTone={(kpis?.previstoMes || 0) >= 0 ? "success" : "danger"}
              hint="Receber - Pagar"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <ErpCard title="Fluxo de caixa (R$)">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graficoFluxo}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={80} tickFormatter={(v) => `R$ ${v/1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: 'black' }}
                    />
                    <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#1D9E75" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="saidas" name="Saídas" stroke="#C73E3E" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ErpCard>

            <ErpCard title="DRE Simplificado - Mês Atual">
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                  <span className="text-[13px] text-muted-foreground">Receita Bruta</span>
                  <span className="text-[13px] font-medium text-success">{formatCurrency(kpis?.receitaMes || 0)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                  <span className="text-[13px] text-muted-foreground">Custos / Despesas</span>
                  <span className="text-[13px] font-medium text-destructive">{formatCurrency(kpis?.despesaMes || 0)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[14px] font-bold">Resultado Líquido</span>
                  <span className={`text-[14px] font-bold ${(kpis?.resultadoMes || 0) >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(kpis?.resultadoMes || 0)}
                  </span>
                </div>
              </div>
            </ErpCard>
          </div>
        </TabsContent>

        <TabsContent value="receber" className="space-y-4">
          <ErpCard title="Títulos a Receber">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                    <th className="py-2 pl-2">Descrição</th>
                    <th>Cliente</th>
                    <th>OS</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th className="text-right pr-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contasReceber.length === 0 ? (
                    <tr><td colSpan={7} className="py-4 text-center text-muted-foreground italic text-[11px]">Nenhum título pendente</td></tr>
                  ) : (
                    contasReceber.map((c) => (
                      <tr key={c.id} className="border-b border-border/40 hover:bg-muted/50 transition-colors text-[11px]">
                        <td className="py-2 pl-2 max-w-[150px] truncate font-medium">{c.descricao}</td>
                        <td className="max-w-[100px] truncate">{c.contato}</td>
                        <td className="max-w-[80px] truncate">{c.ordem_servico || "-"}</td>
                        <td>{new Date(c.vencimento).toLocaleDateString("pt-BR", {timeZone: 'UTC'})}</td>
                        <td className="font-medium text-success">{formatCurrency(c.valor)}</td>
                        <td>
                          <StatusBadge variant={c.status === "PAGO" ? "success" : c.status === "ATRASADO" ? "danger" : "warning"}>
                            {c.status}
                          </StatusBadge>
                        </td>
                        <td className="text-right pr-2">
                          {c.status === "PENDENTE" && (
                            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setBaixaModalOpen(c)}>
                              Dar Baixa
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ErpCard>
        </TabsContent>

        <TabsContent value="pagar" className="space-y-4">
          <ErpCard title="Títulos a Pagar">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                    <th className="py-2 pl-2">Descrição</th>
                    <th>Fornecedor</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th className="text-right pr-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contasPagar.length === 0 ? (
                    <tr><td colSpan={6} className="py-4 text-center text-muted-foreground italic text-[11px]">Nenhum título pendente</td></tr>
                  ) : (
                    contasPagar.map((c) => (
                      <tr key={c.id} className="border-b border-border/40 hover:bg-muted/50 transition-colors text-[11px]">
                        <td className="py-2 pl-2 max-w-[150px] truncate font-medium">{c.descricao}</td>
                        <td className="max-w-[100px] truncate">{c.contato}</td>
                        <td>{new Date(c.vencimento).toLocaleDateString("pt-BR", {timeZone: 'UTC'})}</td>
                        <td className="font-medium text-destructive">{formatCurrency(c.valor)}</td>
                        <td>
                          <StatusBadge variant={c.status === "PAGO" ? "success" : c.status === "ATRASADO" ? "danger" : "warning"}>
                            {c.status}
                          </StatusBadge>
                        </td>
                        <td className="text-right pr-2">
                          {c.status === "PENDENTE" && (
                            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setBaixaModalOpen(c)}>
                              Dar Baixa
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ErpCard>
        </TabsContent>
      </Tabs>

      {formOpen && (
        <FinanceiroForm
          isOpen={!!formOpen}
          onClose={() => setFormOpen(null)}
          tipo={formOpen}
        />
      )}

      {baixaModalOpen && (
        <BaixaModal
          isOpen={!!baixaModalOpen}
          onClose={() => setBaixaModalOpen(null)}
          titulo={baixaModalOpen}
        />
      )}
    </>
  );
}
