import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calculator, Plus, Trash2, Pencil, SendHorizonal, FileDown, MoreHorizontal, CheckCircle, Undo, Eye } from "lucide-react";
import { PageHeader } from "@/components/erp/PageHeader";
import { KpiCard } from "@/components/erp/KpiCard";
import { ErpCard } from "@/components/erp/Card";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrcamentos, useOrcamentoMutations } from "@/hooks/useOrcamentos";
import { usePedidoMutations } from "@/hooks/usePedidos";
import { Skeleton } from "@/components/ui/skeleton";
import { NovoOrcamentoModal } from "@/components/features/orcamentos/NovoOrcamentoModal";
import { EditarOrcamentoModal } from "@/components/features/orcamentos/EditarOrcamentoModal";
import { PreviewOrcamento } from "@/components/features/orcamentos/PreviewOrcamento";

import type { OrcamentoItemV2 } from "@/lib/sales/types";
import {
  calcularValorTotalLinha,
  calcularTotalOrcamento as calcularTotalOrcamentoV2,
} from "@/lib/sales/calculadoraModula";
import { listarServicosDisponiveis, resolverServico } from "@/lib/sales/resolverServico";
import { exportarOrcamentoPDF } from "@/lib/sales/pdfOrcamento";
import { useProdutosOrcamento } from "@/hooks/useProdutosOrcamento";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";

export const Route = createFileRoute("/_app/orcamentos")({
  head: () => ({
    meta: [
      { title: "Orçamentos — ModulaAPP" },
      { name: "description", content: "Gestão completa do ciclo de vendas, da proposta à conversão em OS." },
    ],
  }),
  component: OrcamentosPage,
});

type OrcamentoRow = NonNullable<ReturnType<typeof useOrcamentos>["data"]>[number];

function OrcamentosPage() {
  const { data: orcamentosList, isLoading, error } = useOrcamentos();
  const { updateOrcamento, deleteOrcamento, isUpdating } = useOrcamentoMutations();
  const { createPedido } = usePedidoMutations();
  const { session } = useAuth();
  const { tiposVidro, processamentos: processamentosOrc } = useProdutosOrcamento();

  // Calculadora rápida
  const [itens, setItens] = useState<OrcamentoItemV2[]>([
    { codigoServico: "PPI8", largura: 1, altura: 2.1, quantidade: 1, adicional: 0 },
  ]);
  const servicosDisponiveis = useMemo(() => listarServicosDisponiveis(), []);

  // Agrupar serviços por categoria (mesmo padrão dos modais)
  const categoriasServico = useMemo(() => {
    const map = new Map<string, typeof servicosDisponiveis>();
    for (const s of servicosDisponiveis) {
      if (!map.has(s.categoria)) map.set(s.categoria, []);
      map.get(s.categoria)!.push(s);
    }
    return map;
  }, [servicosDisponiveis]);

  const LABELS_CATEGORIA: Record<string, string> = {
    porta_pivotante: "Portas Pivotantes",
    porta_correr: "Portas de Correr",
    box: "Box de Banheiro",
    janela: "Janelas",
    espelho: "Espelhos",
    fachada: "Fachadas",
    painel: "Painéis",
  };

  // Modal de edição
  const [orcamentoEditando, setOrcamentoEditando] = useState<OrcamentoRow | null>(null);

  // Modal de visualização
  const [orcamentoVisualizando, setOrcamentoVisualizando] = useState<OrcamentoRow | null>(null);

  const calculos = useMemo(() => {
    return itens.map((item) => calcularValorTotalLinha(item, resolverServico(item.codigoServico)));
  }, [itens]);

  const areaTotal = useMemo(() => calculos.reduce((acc, item) => acc + item.m2, 0), [calculos]);
  const valorTotal = useMemo(() => calcularTotalOrcamentoV2(calculos), [calculos]);

  const canConvertOS = session?.user.role === "admin" || session?.user.role === "gestor" || session?.user.role === "superadmin";

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const addItem = () =>
    setItens([...itens, { codigoServico: "PPI8", largura: 1, altura: 1, quantidade: 1, adicional: 0 }]);

  const removeItem = (index: number) => {
    if (itens.length > 1) setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, changes: Partial<OrcamentoItemV2>) =>
    setItens(itens.map((item, i) => (i === index ? { ...item, ...changes } : item)));

  // Mapeamento de status para variantes do StatusBadge
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Aprovado": return "success";
      case "Aberto": return "info";
      case "Rejeitado": return "danger";
      case "Expirado": return "warning";
      default: return "neutral";
    }
  };

  // Enviar para produção: aprova orçamento, cria OS e dá baixa no estoque
  const handleEnviarProducao = async (orc: OrcamentoRow) => {
    if (!canConvertOS) {
      toast.error("Apenas gestores e administradores podem converter orçamentos em OS.");
      return;
    }

    if (orc.status === "Aprovado") {
      toast.info("Orçamento já está aprovado e em produção.");
      return;
    }

    const empresaId = getDefaultEmpresaId();
    if (!empresaId) {
      toast.error("Empresa não identificada. Faça login novamente.");
      return;
    }

    // 1. Aprova o orçamento
    await updateOrcamento({ id: orc.id, status: "Aprovado" });

    // 2. Cria a Ordem de Serviço automaticamente
    const numeroOS = `OS-${Math.floor(1000 + Math.random() * 9000)}`;
    const dataPrevisao = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    try {
      await createPedido({
        orcamento_id: orc.id,
        cliente_id: orc.cliente_id ?? null,
        numero: numeroOS,
        status: "Na Fila",
        data_previsao: dataPrevisao,
        itens: (orc.itens as any) ?? [],
        is_atrasada: false,
      });
      toast.success(`Orçamento aprovado! OS ${numeroOS} criada e em fila de produção 🏭`);
    } catch {
      toast.success(`Orçamento ${orc.numero} aprovado! (Erro ao criar OS — tente manualmente)`);
    }
  };

  const handleRemoverProducao = async (orc: OrcamentoRow) => {
    if (!canConvertOS) {
      toast.error("Apenas gestores e administradores podem remover orçamentos da produção.");
      return;
    }

    if (orc.status !== "Aprovado") {
      toast.info("Apenas orçamentos em produção podem ser removidos.");
      return;
    }

    if (!confirm(`Deseja realmente remover o orçamento ${orc.numero} da produção e voltar para aberto? A OS associada será cancelada.`)) {
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();

      const { data: pedidoData } = await supabase
        .from("ordens_servico")
        .select("id")
        .eq("orcamento_id", orc.id)
        .is("deleted_at", null)
        .maybeSingle();

      if (pedidoData) {
        await supabase
          .from("ordens_servico")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", pedidoData.id);
      }

      await updateOrcamento({ id: orc.id, status: "Aberto" });

      toast.success("Orçamento removido da produção com sucesso! A OS foi cancelada.");
    } catch (error) {
      toast.error("Erro ao remover da produção.");
    }
  };

  const handleExportarPDF = async (orc: OrcamentoRow) => {
    await exportarOrcamentoPDF(
      {
        numero: orc.numero,
        descricao: orc.descricao,
        status: orc.status,
        data_validade: orc.data_validade,
        created_at: (orc as any).created_at,
        area_total: orc.area_total,
        valor_total: orc.valor_total,
        itens: (orc.itens as unknown[]) ?? null,
        cliente: orc.cliente ? {
          nome: (orc.cliente as any).nome,
          documento: (orc.cliente as any).documento,
          endereco: (orc.cliente as any).endereco,
          representante: (orc.cliente as any).representante,
          cidade: (orc.cliente as any).cidade,
          contato: (orc.cliente as any).contato,
          referencia: (orc.cliente as any).referencia,
          telefone: (orc.cliente as any).telefone,
        } : undefined,
      },
      tiposVidro,
      processamentosOrc
    );
  };

  const handleDeletar = async (orc: OrcamentoRow) => {
    if (!confirm(`Deseja remover o orçamento ${orc.numero}?`)) return;
    await deleteOrcamento(orc.id);
  };

  return (
    <>
      <PageHeader
        title="Orçamentos"
        subtitle="Conversão em tempo real conectada ao Supabase"
        actions={<NovoOrcamentoModal />}
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 mb-3.5">
        <KpiCard label="Em aberto" value={isLoading ? "..." : String(orcamentosList?.filter((o) => o.status === "Aberto").length || 0)} />
        <KpiCard label="Aprovados" value={isLoading ? "..." : String(orcamentosList?.filter((o) => o.status === "Aprovado").length || 0)} />
        <KpiCard label="Valor aprovado" value={isLoading ? "..." : fmt(orcamentosList?.filter((o) => o.status === "Aprovado").reduce((acc, o) => acc + (o.valor_total || 0), 0) || 0)} />
        <KpiCard label="Expirados" value={isLoading ? "..." : String(orcamentosList?.filter((o) => o.status === "Expirado").length || 0)} />
      </div>

      <ErpCard className="mb-3.5">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-destructive">Erro ao carregar orçamentos</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                  <th className="py-1.5">Nº</th>
                  <th>Cliente</th>
                  <th>Descrição</th>
                  <th>M²</th>
                  <th>Valor</th>
                  <th>Validade</th>
                  <th>Status</th>
                  <th className="text-right pr-1">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orcamentosList?.map((o) => (
                  <tr key={o.id} className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40 transition-colors">
                    <td className="py-1.5 font-medium">{o.numero || "S/N"}</td>
                    <td>{o.cliente?.nome || "Consumidor"}</td>
                    <td className="max-w-[140px] truncate text-muted-foreground">{o.descricao || "—"}</td>
                    <td>{o.area_total?.toFixed(2) || "0.00"}</td>
                    <td className="font-medium">{fmt(o.valor_total || 0)}</td>
                    <td>{o.data_validade ? new Date(o.data_validade).toLocaleDateString("pt-BR") : "—"}</td>
                    <td><StatusBadge variant={getStatusVariant(o.status)}>{o.status}</StatusBadge></td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setOrcamentoVisualizando(o)} className="gap-2 text-xs cursor-pointer">
                            <Eye className="h-3.5 w-3.5" /> Ver orçamento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setOrcamentoEditando(o)} className="gap-2 text-xs cursor-pointer">
                            <Pencil className="h-3.5 w-3.5" /> Editar orçamento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportarPDF(o)} className="gap-2 text-xs cursor-pointer">
                            <FileDown className="h-3.5 w-3.5" /> Exportar PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleEnviarProducao(o)}
                            className="gap-2 text-xs cursor-pointer text-emerald-600 focus:text-emerald-600"
                            disabled={o.status === "Aprovado" || isUpdating || !canConvertOS}
                          >
                            {o.status === "Aprovado" ? (
                              <><CheckCircle className="h-3.5 w-3.5" /> Em produção</>
                            ) : (
                              <><SendHorizonal className="h-3.5 w-3.5" /> Enviar p/ produção</>
                            )}
                          </DropdownMenuItem>
                          {o.status === "Aprovado" && (
                            <DropdownMenuItem
                              onClick={() => handleRemoverProducao(o)}
                              className="gap-2 text-xs cursor-pointer text-orange-600 focus:text-orange-600"
                              disabled={isUpdating || !canConvertOS}
                            >
                              <Undo className="h-3.5 w-3.5" /> Remover da produção
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeletar(o)}
                            className="gap-2 text-xs cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {orcamentosList?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-muted-foreground text-xs">
                      Nenhum orçamento encontrado. Clique em "Novo orçamento" para começar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </ErpCard>

      <ErpCard
        title={
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5" /> Calculadora rápida.
            </span>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addItem}>
              <Plus className="mr-1 h-3 w-3" /> Adicionar serviço
            </Button>
          </div>
        }
      >
            <div className="space-y-3 mb-4">
              {itens.map((item, i) => (
                <div key={i} className="grid gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6 items-end">
                    {/* Serviço / Kit */}
                    <div className="lg:col-span-3">
                      <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">
                        Serviço / Kit
                      </Label>
                      <select
                        className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                        value={item.codigoServico}
                        onChange={(e) => updateItem(i, { codigoServico: e.target.value })}
                      >
                        {Array.from(categoriasServico.entries()).map(([cat, lista]) => (
                          <optgroup key={cat} label={LABELS_CATEGORIA[cat] ?? cat}>
                            {lista.map((s) => (
                              <option key={s.codigo} value={s.codigo}>
                                {s.nome}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {/* Largura */}
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">
                        Largura (m)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.largura}
                        onChange={(e) => updateItem(i, { largura: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </div>

                    {/* Altura */}
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">
                        Altura (m)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.altura}
                        onChange={(e) => updateItem(i, { altura: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </div>

                    {/* Qtd + remover */}
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Qtd</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => updateItem(i, { quantidade: Number(e.target.value) })}
                          className="h-8 text-xs"
                        />
                        {itens.length > 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(i)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Adicional + Resumo do item */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="w-[120px]">
                      <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">
                        Adicional (R$)
                      </Label>
                      <Input
                        type="number"
                        value={item.adicional}
                        onChange={(e) => updateItem(i, { adicional: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="text-muted-foreground">
                        Área: <b className="text-foreground">{calculos[i].m2.toFixed(2)} m²</b>
                      </span>
                      <span className="text-muted-foreground">
                        Subtotal: <b className="text-primary">{fmt(calculos[i].valorTotal)}</b>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-2 md:grid-cols-4 border-t pt-3">
              <KpiCard label="Total de itens" value={String(itens.length)} />
              <KpiCard label="Área total" value={`${areaTotal.toFixed(2)} m²`} />
              <div className="md:col-start-4 rounded-lg bg-info-bg p-3">
                <div className="text-[9px] uppercase tracking-wide text-info">Total estimado</div>
                <div className="mt-0.5 text-xl font-medium text-info">{fmt(valorTotal)}</div>
              </div>
            </div>
      </ErpCard>

      {/* Modal de edição */}
      {orcamentoEditando && (
        <EditarOrcamentoModal
          orcamento={orcamentoEditando}
          open={!!orcamentoEditando}
          onClose={() => setOrcamentoEditando(null)}
        />
      )}

      {/* Modal de visualização */}
      {orcamentoVisualizando && (
        <PreviewOrcamento
          open={!!orcamentoVisualizando}
          onClose={() => setOrcamentoVisualizando(null)}
          orcamento={{
            numero: orcamentoVisualizando.numero,
            descricao: orcamentoVisualizando.descricao,
            status: orcamentoVisualizando.status,
            data_validade: orcamentoVisualizando.data_validade,
            created_at: (orcamentoVisualizando as any).created_at,
            area_total: orcamentoVisualizando.area_total,
            valor_total: orcamentoVisualizando.valor_total,
            itens: (orcamentoVisualizando.itens as unknown[]) ?? null,
            cliente: orcamentoVisualizando.cliente
              ? {
                  nome: (orcamentoVisualizando.cliente as any).nome,
                  documento: (orcamentoVisualizando.cliente as any).documento,
                  endereco: (orcamentoVisualizando.cliente as any).endereco,
                  representante: (orcamentoVisualizando.cliente as any).representante,
                  cidade: (orcamentoVisualizando.cliente as any).cidade,
                  contato: (orcamentoVisualizando.cliente as any).contato,
                  referencia: (orcamentoVisualizando.cliente as any).referencia,
                  telefone: (orcamentoVisualizando.cliente as any).telefone,
                }
              : undefined,
          }}
          tiposVidro={tiposVidro}
          processamentos={processamentosOrc}
        />
      )}
    </>
  );
}
