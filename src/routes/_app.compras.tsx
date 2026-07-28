import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, FileDown, Truck, Send, PackageOpen, Trash2, Ban } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/erp/PageHeader";
import { KpiCard } from "@/components/erp/KpiCard";
import { ErpCard } from "@/components/erp/Card";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePedidosCompra,
} from "@/hooks/compras/usePedidosCompra";
import {
  useAprovarPedido,
  useAvancarEtapa,
  useExcluirPedido
} from "@/hooks/compras/useMutationsPedido";
import { useRomaneios } from "@/hooks/compras/useRomaneios";
import { ETAPA_LABELS, ETAPAS_PEDIDO, PedidoCompra } from "@/lib/compras/types";
import { NovoPedidoModal } from "@/components/features/compras/NovoPedidoModal";
import { EditarPedidoModal } from "@/components/features/compras/EditarPedidoModal";
import { RecebimentoModal } from "@/components/features/compras/RecebimentoModal";
import { RegistrarNFeModal } from "@/components/features/compras/RegistrarNFeModal";
import { useNFeEntrada } from "@/hooks/compras/useNFeEntrada";
import { romaneios } from "@/lib/mock/data";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/_app/compras")({
  head: () => ({
    meta: [
      { title: "Compras — ModulaAPP" },
      {
        name: "description",
        content:
          "Pedidos de compra com aprovação em 8 etapas, romaneios e NFe de entrada.",
      },
    ],
  }),
  component: ComprasPage,
});

function ComprasPage() {
  const { data: pedidos, isLoading: loadingPedidos } = usePedidosCompra();
  const { data: dbRomaneios, isLoading: loadingRomaneios } = useRomaneios();
  const { data: nfeEntrada, isLoading: loadingNFe } = useNFeEntrada();
  const { mutate: aprovarPedido, isPending: isApproving } = useAprovarPedido();
  const { mutate: avancarEtapa, isPending: isAdvancing } = useAvancarEtapa();
  const { mutate: excluirPedido, isPending: isExcluindo } = useExcluirPedido();
  
  const [pedidoRecebendo, setPedidoRecebendo] = useState<PedidoCompra | null>(null);

  const kpis = {
    abertos: pedidos?.filter(p => !['recebido_total', 'cancelado'].includes(p.status)).length || 0,
    aguardando: pedidos?.filter(p => p.status === 'aguardando_aprovacao').length || 0,
    aprovados: pedidos?.filter(p => p.status === 'aprovado').length || 0,
    enviados: pedidos?.filter(p => p.status === 'enviado' || p.status === 'recebido_parcial').length || 0,
  };
  return (
    <>
      <PageHeader
        title="Compras"
        subtitle="Pedidos · Liberação · Rastreamento · Romaneios · NFe"
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              disabled={pedidos?.every(p => ['recebido_total', 'cancelado'].includes(p.status))}
            >
              <Check className="h-4 w-4 mr-2" /> Aprovar Lote
            </Button>
            <NovoPedidoModal />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 mb-3.5">
        <KpiCard label="Pedidos abertos" value={loadingPedidos ? "..." : kpis.abertos.toString()} hint={`${kpis.aguardando} aguardando aprovação`} />
        <KpiCard label="Aprovados (Pronto p/ Envio)" value={loadingPedidos ? "..." : kpis.aprovados.toString()} hintTone="warning" />
        <KpiCard label="Enviados (Aguard. Recebimento)" value={loadingPedidos ? "..." : kpis.enviados.toString()} hintTone="info" />
      </div>

      <Tabs defaultValue="pedidos" className="w-full">
        <TabsList className="h-8">
          <TabsTrigger value="pedidos" className="text-xs">Pedidos</TabsTrigger>
          <TabsTrigger value="rastreio" className="text-xs">Rastreamento</TabsTrigger>
          <TabsTrigger value="romaneios" className="text-xs">Romaneios</TabsTrigger>
          <TabsTrigger value="nfe" className="text-xs">NFe Entrada</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos" className="mt-3">
          <ErpCard title="Pedidos de compra">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                  <th className="py-1.5">Pedido</th>
                  <th>Fornecedor</th>
                  <th>Solicitante</th>
                  <th>Criado</th>
                  <th>Etapa</th>
                  <th>Status</th>
                  <th className="text-right">Valor</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loadingPedidos ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td colSpan={8} className="py-2"><Skeleton className="h-4 w-full" /></td>
                    </tr>
                  ))
                ) : (
                  pedidos?.map((p) => (
                    <tr key={p.id} className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40">
                      <td className="py-1.5 font-medium">{p.numero}</td>
                      <td>{p.fornecedor_nome}</td>
                      <td>Sistema</td>
                      <td>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</td>
                      <td className="text-muted-foreground">
                        {ETAPAS_PEDIDO.indexOf(p.status) + 1}/{ETAPAS_PEDIDO.length}
                      </td>
                      <td>
                        <StatusBadge variant={
                          ['recebido_total'].includes(p.status) ? 'success' :
                          p.status === 'aguardando_aprovacao' ? 'warning' :
                          ['enviado', 'recebido_parcial'].includes(p.status) ? 'info' :
                          p.status === 'cancelado' ? 'danger' : 'neutral'
                        }>
                          {ETAPA_LABELS[p.status] || p.status}
                        </StatusBadge>
                      </td>
                      <td className="text-right">
                        {formatCurrency(p.valor_total)}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          {p.status === 'rascunho' && (
                            <>
                              <EditarPedidoModal pedido={p} />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[10px]"
                                disabled={isAdvancing}
                                onClick={() => avancarEtapa({ pedidoId: p.id, proximaEtapa: 'aguardando_aprovacao' })}
                              >
                                <Send className="h-3 w-3 mr-1" /> Solicitar
                              </Button>
                            </>
                          )}
                          {p.status === 'aguardando_aprovacao' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px] text-success"
                              disabled={isApproving}
                              onClick={() => aprovarPedido({ pedidoId: p.id, novoStatus: 'aprovado' })}
                            >
                              <Check className="h-3 w-3 mr-1" /> Aprovar
                            </Button>
                          )}
                          {p.status === 'aprovado' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px] text-info"
                              disabled={isAdvancing}
                              onClick={() => avancarEtapa({ pedidoId: p.id, proximaEtapa: 'enviado' })}
                            >
                              <Truck className="h-3 w-3 mr-1" /> Enviar Pedido
                            </Button>
                          )}
                          {['enviado', 'recebido_parcial'].includes(p.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => setPedidoRecebendo(p)}
                            >
                              <PackageOpen className="h-3 w-3 mr-1" /> Receber
                            </Button>
                          )}
                          {p.status !== 'cancelado' && p.status !== 'rascunho' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px] text-warning hover:bg-warning/10 hover:text-warning"
                              disabled={isAdvancing}
                              onClick={() => {
                                if (confirm("Tem certeza que deseja cancelar este pedido? Se foi recebido, essa ação irá invalidar o recebimento.")) {
                                  avancarEtapa({ pedidoId: p.id, proximaEtapa: 'cancelado' });
                                }
                              }}
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px] text-danger hover:bg-danger/10 hover:text-danger"
                            disabled={isExcluindo}
                            onClick={() => {
                              if (confirm(p.status === 'rascunho' ? "Tem certeza que deseja excluir este rascunho de pedido?" : "ATENÇÃO (ADM): Tem certeza que deseja excluir este pedido permanentemente? Todo o histórico será apagado.")) {
                                excluirPedido(p.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {!loadingPedidos && pedidos?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground italic">Nenhum pedido lançado ainda...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </ErpCard>
        </TabsContent>

        <TabsContent value="rastreio" className="mt-3 space-y-3">
          {loadingPedidos ? (
            Array.from({ length: 3 }).map((_, i) => (
              <ErpCard key={i} title={<Skeleton className="h-4 w-32" />}>
                <Skeleton className="h-8 w-full" />
              </ErpCard>
            ))
          ) : (
            pedidos?.slice(0, 5).map((p) => (
              <ErpCard
                key={p.id}
                title={
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.numero}</span>
                    <span className="text-muted-foreground">— {p.fornecedor_nome}</span>
                    <StatusBadge variant={
                      ['recebido_total'].includes(p.status) ? 'success' :
                      p.status === 'aguardando_aprovacao' ? 'warning' :
                      ['enviado', 'recebido_parcial'].includes(p.status) ? 'info' :
                      p.status === 'cancelado' ? 'danger' : 'neutral'
                    }>
                      {ETAPA_LABELS[p.status] || p.status}
                    </StatusBadge>
                  </div>
                }
                action={
                  <span className="text-[10px] text-muted-foreground">
                    {formatCurrency(p.valor_total)}
                  </span>
                }
              >
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {ETAPAS_PEDIDO.map((etapaKey, i) => {
                    const statusIdx = ETAPAS_PEDIDO.indexOf(p.status);
                    const done = i < statusIdx || p.status === 'recebido_total';
                    const current = i === statusIdx && p.status !== 'recebido_total';
                    return (
                      <div key={etapaKey} className="flex items-center gap-1.5 shrink-0">
                        <div
                          className={`flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium ${current
                              ? "bg-info-bg text-info"
                              : done
                                ? "bg-success-bg text-success"
                                : "bg-muted text-muted-foreground"
                            }`}
                        >
                          <span className="opacity-70">{i + 1}.</span>
                          {ETAPA_LABELS[etapaKey]}
                        </div>
                        {i < ETAPAS_PEDIDO.length - 1 && (
                          <span className={`h-px w-4 ${done ? "bg-success" : "bg-border"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </ErpCard>
            ))
          )}
          {!loadingPedidos && pedidos?.length === 0 && (
            <div className="py-8 text-center text-muted-foreground italic">Nenhum pedido sendo rastreado no momento.</div>
          )}
        </TabsContent>

        <TabsContent value="romaneios" className="mt-3">
          <ErpCard title="Romaneios de recebimento">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                  <th className="py-1.5">Romaneio ID</th>
                  <th>Pedido</th>
                  <th>Fornecedor</th>
                  <th>Status</th>
                  <th>Criação</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loadingRomaneios ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td colSpan={6} className="py-2"><Skeleton className="h-4 w-full" /></td>
                    </tr>
                  ))
                ) : dbRomaneios && dbRomaneios.length > 0 ? (
                  dbRomaneios.map((r) => {
                    const pedido = r.pedido_compra?.numero || "N/A";
                    const fornecedor = r.pedido_compra?.fornecedores?.nome || "N/A";

                    return (
                      <tr key={r.id} className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40">
                        <td className="py-1.5 font-medium" title={r.id}>{r.id.split('-')[0].toUpperCase()}</td>
                        <td>{pedido}</td>
                        <td>{fornecedor}</td>
                        <td>
                          <StatusBadge variant={
                            r.status === 'concluido' ? 'success' :
                              r.status === 'divergencia' ? 'danger' :
                                r.status === 'em_conferencia' ? 'warning' : 'neutral'
                          }>
                            {r.status.replace('_', ' ').toUpperCase()}
                          </StatusBadge>
                        </td>
                        <td>{new Date(r.criado_em).toLocaleDateString('pt-BR')}</td>
                        <td className="text-right">
                          {r.status !== 'concluido' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => toast.success(`Conferência de romaneio em breve...`)}
                            >
                              <Truck className="h-3 w-3 mr-1" /> Conferir
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground italic">
                      Nenhum romaneio pendente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ErpCard>
        </TabsContent>

        <TabsContent value="nfe" className="mt-3">
          <ErpCard 
            title="NFe de entrada"
            action={<RegistrarNFeModal />}
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                  <th className="py-1.5">Chave</th>
                  <th>Fornecedor</th>
                  <th>Emissão</th>
                  <th className="text-right">Valor</th>
                  <th>XML</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loadingNFe ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td colSpan={6} className="py-2"><Skeleton className="h-4 w-full" /></td>
                    </tr>
                  ))
                ) : nfeEntrada && nfeEntrada.length > 0 ? (
                  nfeEntrada.map((n) => (
                    <tr key={n.chave_acesso} className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40">
                      <td className="py-1.5 font-mono text-[10px]" title={n.chave_acesso}>
                        {n.chave_acesso.substring(0, 16)}...
                      </td>
                      <td>{n.fornecedor_nome}</td>
                      <td>{new Date(n.data_emissao).toLocaleDateString('pt-BR')}</td>
                      <td className="text-right">{formatCurrency(n.valor_total)}</td>
                      <td>
                        <StatusBadge variant={n.status_sped === 'lancada' ? 'success' : 'warning'}>
                          {n.status_sped === 'lancada' ? 'Lançada SPED' : 'Pendente'}
                        </StatusBadge>
                      </td>
                      <td className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => toast.success("Processamento do XML não implementado no MVP")}
                        >
                          <FileDown className="h-3 w-3 mr-1" /> XML
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground italic">
                      Nenhuma NFe registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ErpCard>
        </TabsContent>

      </Tabs>
      
      <RecebimentoModal 
        pedido={pedidoRecebendo} 
        open={!!pedidoRecebendo} 
        onOpenChange={(isOpen) => { if (!isOpen) setPedidoRecebendo(null); }} 
      />
    </>
  );
}
