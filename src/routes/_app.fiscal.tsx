import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  FileCheck,
  Mail,
  MailCheck,
  CheckCircle2,
  CalendarPlus,
  Clock,
  Loader2,
  Send,
  MoreHorizontal,
  XCircle,
  Trash2,
  Pencil,
  Printer,
  Eye,
  FileDown,
  AlertTriangle,
} from "lucide-react";
import { isValidEmail } from "@/lib/formatters/contact";
import { PageHeader } from "@/components/erp/PageHeader";
import { KpiCard } from "@/components/erp/KpiCard";
import { ErpCard } from "@/components/erp/Card";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ModalVerNfe } from "@/components/features/fiscal/ModalVerNfe";
import { imprimirNfe } from "@/lib/fiscal/pdfNfe";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import {
  useNfes,
  useObrigacoes,
  useEnviarNfeEmail,
  usePagarObrigacao,
  useCancelarNfe,
  useExcluirNfe,
  useExcluirObrigacao,
  useNfeRealtime,
  type ObrigacaoFiscal,
  type NfeSaida,
} from "@/hooks/useFiscalData";
import { ModalEmitirNfe } from "@/components/features/fiscal/ModalEmitirNfe";
import { ModalObrigacao } from "@/components/features/fiscal/ModalObrigacao";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/fiscal")({
  head: () => ({
    meta: [
      { title: "Fiscal / NF-e — ModulaAPP" },
      { name: "description", content: "Emissão de NF-e e obrigações acessórias." },
    ],
  }),
  component: FiscalPage,
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy");
  } catch (e) {
    return dateStr;
  }
}

function FiscalPage() {
  const [isEmitirModalOpen, setIsEmitirModalOpen] = useState(false);
  const [isObrigacaoModalOpen, setIsObrigacaoModalOpen] = useState(false);
  const [sendingNfeId, setSendingNfeId] = useState<string | null>(null);
  const [emailDialogNfe, setEmailDialogNfe] = useState<{ id: string; email?: string } | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [pagamentoDialogId, setPagamentoDialogId] = useState<string | null>(null);
  const [cancelarNfeDialog, setCancelarNfeDialog] = useState<NfeSaida | null>(null);
  const [cancelJustificativa, setCancelJustificativa] = useState("");
  const [excluirNfeDialog, setExcluirNfeDialog] = useState<NfeSaida | null>(null);
  const [excluirObrigacaoDialog, setExcluirObrigacaoDialog] = useState<ObrigacaoFiscal | null>(
    null,
  );
  const [editObrigacao, setEditObrigacao] = useState<ObrigacaoFiscal | null>(null);
  const [verNfeDialog, setVerNfeDialog] = useState<NfeSaida | null>(null);

  const { data: nfes, isLoading: isLoadingNfes } = useNfes();
  const { data: obrigacoes, isLoading: isLoadingObrigacoes } = useObrigacoes();

  const enviarEmailMutation = useEnviarNfeEmail();
  const pagarObrigacaoMutation = usePagarObrigacao();
  const cancelarNfeMutation = useCancelarNfe();
  const excluirNfeMutation = useExcluirNfe();
  const excluirObrigacaoMutation = useExcluirObrigacao();

  useNfeRealtime();

  const nfesEnviadas = nfes?.filter((n) => n.email_enviado).length || 0;

  const handleEnviarEmail = (nfeId: string, clienteEmail?: string) => {
    if (!clienteEmail) {
      // Abre dialog para pedir e-mail
      setEmailDialogNfe({ id: nfeId, email: "" });
      setEmailInput("");
      return;
    }
    setSendingNfeId(nfeId);
    enviarEmailMutation.mutate(
      { nfeId, email: clienteEmail },
      {
        onSettled: () => setSendingNfeId(null),
      },
    );
  };

  const confirmEnviarEmail = () => {
    if (!emailDialogNfe || !emailInput) return;
    if (!isValidEmail(emailInput)) {
      return; // botão já está desabilitado, mas protege programação defensiva
    }
    setSendingNfeId(emailDialogNfe.id);
    setEmailDialogNfe(null);
    enviarEmailMutation.mutate(
      { nfeId: emailDialogNfe.id, email: emailInput.trim() },
      {
        onSettled: () => setSendingNfeId(null),
      },
    );
  };

  const handleImprimirNfe = async (nfe: NfeSaida) => {
    const supabase = getSupabaseBrowserClient();
    const empresaId = getDefaultEmpresaId();
    const { data: empresa, error } = await supabase
      .from("empresas")
      .select("razao_social, nome_fantasia, cnpj, endereco, cidade, telefone")
      .eq("id", empresaId)
      .maybeSingle();

    if (error || !empresa) {
      toast.error("Não foi possível carregar os dados da empresa para impressão.");
      return;
    }

    imprimirNfe(nfe, empresa);
  };

  // KPIs calculations
  const nfesEmitidas = nfes?.filter((n) => n.status === "EMITIDA").length || 0;

  // Pending taxes (DAS, etc)
  const pendentes = obrigacoes?.filter((o) => o.status === "PENDENTE") || [];
  const proximaObrigacao = pendentes.sort(
    (a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime(),
  )[0];
  const proximoVencimentoStr = proximaObrigacao
    ? formatDate(proximaObrigacao.data_vencimento)
    : "-";
  const proximoValor = proximaObrigacao ? formatCurrency(proximaObrigacao.valor) : "";

  // Calendário de vencimentos
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [calendarMonth]);

  const obrigacoesDoMes = useMemo(() => {
    if (!obrigacoes) return [];
    return obrigacoes.filter((o) => {
      const venc = new Date(o.data_vencimento + "T00:00:00");
      return isSameMonth(venc, calendarMonth);
    });
  }, [obrigacoes, calendarMonth]);

  const getObrigacoesNoDia = (day: Date) => {
    if (!obrigacoes) return [];
    return obrigacoes.filter((o) => {
      const venc = new Date(o.data_vencimento + "T00:00:00");
      return isSameDay(venc, day);
    });
  };

  return (
    <>
      <PageHeader
        title="Fiscal / NF-e"
        subtitle={`${nfesEmitidas} NF-e emitidas · Simples Nacional`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setIsObrigacaoModalOpen(true)}
            >
              <CalendarPlus className="mr-1 h-3 w-3" /> Nova Guia
            </Button>
            <Button size="sm" className="text-xs" onClick={() => setIsEmitirModalOpen(true)}>
              <FileCheck className="mr-1 h-3 w-3" /> Emitir NF-e
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 mb-3.5">
        <KpiCard label="NF-e emitidas" value={String(nfesEmitidas)} />
        <KpiCard
          label="NF-e enviadas por e-mail"
          value={`${nfesEnviadas}/${nfesEmitidas}`}
          hintTone={nfesEnviadas === nfesEmitidas && nfesEmitidas > 0 ? "success" : "warning"}
        />
        <KpiCard
          label="Guias Pendentes"
          value={String(pendentes.length)}
          hintTone={pendentes.length > 0 ? "warning" : undefined}
        />
        <KpiCard
          label="Próximo Vencimento"
          value={proximoVencimentoStr}
          hint={proximoValor}
          hintTone={proximaObrigacao ? "warning" : undefined}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ErpCard title="Últimas NF-e">
          {isLoadingNfes ? (
            <div className="py-4 text-center text-xs text-muted-foreground">Carregando...</div>
          ) : !nfes || nfes.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              Nenhuma NF-e emitida.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                    <th className="py-1.5 px-2">Número</th>
                    <th>Chave</th>
                    <th>Protocolo</th>
                    <th>OS</th>
                    <th>Tomador</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>E-mail</th>
                    <th className="text-center px-2">Ver</th>
                    <th className="text-right px-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {nfes.map((n) => {
                    const isSending = sendingNfeId === n.id;
                    const chaveCurta = n.chave_acesso
                      ? `${n.chave_acesso.slice(0, 8)}...${n.chave_acesso.slice(-8)}`
                      : "-";
                    const podeCancelar = n.status === "EMITIDA" && !!n.focus_nfe_ref;
                    return (
                      <tr
                        key={n.id}
                        className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/30"
                      >
                        <td className="py-1.5 px-2 font-mono">
                          {n.status === "EM_PROCESSAMENTO" ? (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" /> ...
                            </span>
                          ) : (
                            `#${n.numero}`
                          )}
                        </td>
                        <td>
                          {n.chave_acesso ? (
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="font-mono cursor-help">{chaveCurta}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-mono text-[10px]">{n.chave_acesso}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="font-mono">{n.protocolo_autorizacao || "-"}</td>
                        <td>{n.ordens_servico?.numero || "-"}</td>
                        <td className="truncate max-w-[120px]" title={n.cliente_nome}>
                          {n.cliente_nome || "-"}
                        </td>
                        <td>{formatCurrency(n.valor_total)}</td>
                        <td>
                          {n.status === "EM_PROCESSAMENTO" ? (
                            <StatusBadge variant="warning">
                              <Loader2 className="inline h-3 w-3 mr-0.5 animate-spin" /> Processando
                            </StatusBadge>
                          ) : n.status === "DENEGADA" ? (
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <StatusBadge variant="danger">
                                      <AlertTriangle className="inline h-3 w-3 mr-0.5" /> Rejeitada
                                    </StatusBadge>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-[10px]">
                                    {n.motivo_rejeicao || "Motivo não informado"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <StatusBadge
                              variant={
                                n.status === "EMITIDA"
                                  ? "success"
                                  : n.status === "CANCELADA"
                                    ? "danger"
                                    : "neutral"
                              }
                            >
                              {n.status}
                            </StatusBadge>
                          )}
                        </td>
                        <td>
                          {n.email_enviado ? (
                            <StatusBadge variant="success">
                              <MailCheck className="inline h-3 w-3 mr-0.5" /> Enviado
                            </StatusBadge>
                          ) : (
                            <StatusBadge variant="neutral">
                              <Mail className="inline h-3 w-3 mr-0.5" /> Pendente
                            </StatusBadge>
                          )}
                        </td>
                        <td className="text-center px-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Ver detalhes da NF-e"
                            onClick={() => setVerNfeDialog(n)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                        <td className="text-right px-2">
                          <div className="flex items-center justify-end gap-1">
                            {n.danfe_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] px-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                title="Baixar DANFE"
                                onClick={() => window.open(n.danfe_url, "_blank")}
                              >
                                <FileDown className="h-3 w-3 mr-1" /> DANFE
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              title={
                                n.email_enviado
                                  ? "Reenviar NF-e por e-mail"
                                  : "Enviar NF-e por e-mail ao cliente"
                              }
                              disabled={isSending || n.status !== "EMITIDA"}
                              onClick={() => handleEnviarEmail(n.id, n.cliente_email)}
                            >
                              {isSending ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Enviando...
                                </>
                              ) : n.email_enviado ? (
                                <>
                                  <Send className="h-3 w-3 mr-1" /> Reenviar
                                </>
                              ) : (
                                <>
                                  <Mail className="h-3 w-3 mr-1" /> Enviar
                                </>
                              )}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs">
                                <DropdownMenuItem
                                  className="text-xs"
                                  onClick={() => setVerNfeDialog(n)}
                                >
                                  <Eye className="h-3 w-3 mr-1.5" /> Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-xs"
                                  onClick={() => handleImprimirNfe(n)}
                                >
                                  <Printer className="h-3 w-3 mr-1.5" /> Imprimir NF-e
                                </DropdownMenuItem>
                                {n.danfe_url && (
                                  <DropdownMenuItem
                                    className="text-xs"
                                    onClick={() => window.open(n.danfe_url, "_blank")}
                                  >
                                    <FileDown className="h-3 w-3 mr-1.5" /> Baixar DANFE
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {podeCancelar && (
                                  <DropdownMenuItem
                                    className="text-amber-600 text-xs"
                                    onClick={() => {
                                      setCancelarNfeDialog(n);
                                      setCancelJustificativa("");
                                    }}
                                  >
                                    <XCircle className="h-3 w-3 mr-1.5" /> Cancelar NF-e
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive text-xs"
                                  onClick={() => setExcluirNfeDialog(n)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1.5" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ErpCard>

        <ErpCard title="Obrigações e Impostos (Guias)">
          {isLoadingObrigacoes ? (
            <div className="py-4 text-center text-xs text-muted-foreground">Carregando...</div>
          ) : !obrigacoes || obrigacoes.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              Nenhuma obrigação registrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                    <th className="py-1.5 px-2">Tipo</th>
                    <th>Competência</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th className="text-right px-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {obrigacoes.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/30"
                    >
                      <td className="py-1.5 px-2 font-medium">{o.tipo}</td>
                      <td>{o.competencia}</td>
                      <td>
                        <span
                          className={
                            new Date(o.data_vencimento) < new Date() && o.status === "PENDENTE"
                              ? "text-destructive font-medium"
                              : ""
                          }
                        >
                          {formatDate(o.data_vencimento)}
                        </span>
                      </td>
                      <td>{formatCurrency(o.valor)}</td>
                      <td>
                        <StatusBadge
                          variant={
                            o.status === "PAGO"
                              ? "success"
                              : o.status === "PENDENTE"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {o.status}
                        </StatusBadge>
                      </td>
                      <td className="text-right px-2">
                        {o.status === "PENDENTE" ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-2 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                              disabled={pagarObrigacaoMutation.isPending}
                              onClick={() => setPagamentoDialogId(o.id)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Pagar
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs">
                                <DropdownMenuItem
                                  className="text-xs"
                                  onClick={() => {
                                    setEditObrigacao(o);
                                    setIsObrigacaoModalOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3 w-3 mr-1.5" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive text-xs"
                                  onClick={() => setExcluirObrigacaoDialog(o)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1.5" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-muted-foreground text-[10px] flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(o.data_pagamento || "")}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs">
                                <DropdownMenuItem
                                  className="text-destructive text-xs"
                                  onClick={() => setExcluirObrigacaoDialog(o)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1.5" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ErpCard>
      </div>

      {/* Calendário de Vencimentos */}
      <div className="mt-4">
        <ErpCard title="Calendário de Vencimentos">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
            >
              ← Anterior
            </Button>
            <span className="text-sm font-medium capitalize">
              {format(calendarMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
            >
              Próximo →
            </Button>
          </div>

          {/* Header dias da semana */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-medium text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Dias do mês */}
          <div className="grid grid-cols-7 gap-px">
            {/* Espaços vazios antes do primeiro dia */}
            {Array.from({ length: getDay(startOfMonth(calendarMonth)) }).map((_, i) => (
              <div key={`empty-${i}`} className="h-14" />
            ))}
            {calendarDays.map((day) => {
              const obrigsDia = getObrigacoesNoDia(day);
              const temPendente = obrigsDia.some((o) => o.status === "PENDENTE");
              const temVencido = obrigsDia.some(
                (o) => o.status === "PENDENTE" && new Date(o.data_vencimento) < new Date(),
              );
              return (
                <div
                  key={day.toISOString()}
                  className={`h-14 rounded-md border p-1 text-[10px] relative transition-colors ${
                    isToday(day) ? "border-primary bg-primary/5" : "border-border/40"
                  } ${temVencido ? "bg-destructive/10" : temPendente ? "bg-amber-500/10" : ""}`}
                >
                  <span
                    className={`font-medium ${isToday(day) ? "text-primary" : "text-foreground"}`}
                  >
                    {format(day, "d")}
                  </span>
                  {obrigsDia.length > 0 && (
                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      {obrigsDia.slice(0, 2).map((o) => (
                        <div
                          key={o.id}
                          className={`truncate rounded px-0.5 text-[8px] font-medium ${
                            o.status === "PAGO"
                              ? "bg-emerald-500/20 text-emerald-700"
                              : temVencido
                                ? "bg-destructive/20 text-destructive"
                                : "bg-amber-500/20 text-amber-700"
                          }`}
                          title={`${o.tipo} - ${formatCurrency(o.valor)}`}
                        >
                          {o.tipo}
                        </div>
                      ))}
                      {obrigsDia.length > 2 && (
                        <div className="text-[8px] text-muted-foreground">
                          +{obrigsDia.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500/30" /> Pendente
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-destructive/30" /> Vencido
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/30" /> Pago
            </span>
          </div>
        </ErpCard>
      </div>

      <ModalEmitirNfe open={isEmitirModalOpen} onOpenChange={setIsEmitirModalOpen} />
      <ModalObrigacao
        open={isObrigacaoModalOpen}
        onOpenChange={(open) => {
          setIsObrigacaoModalOpen(open);
          if (!open) setEditObrigacao(null);
        }}
        editData={editObrigacao}
      />

      <ModalVerNfe
        nfe={verNfeDialog}
        open={!!verNfeDialog}
        onOpenChange={(open) => !open && setVerNfeDialog(null)}
      />

      {/* Dialog de e-mail para envio NF-e */}
      <Dialog open={!!emailDialogNfe} onOpenChange={(open) => !open && setEmailDialogNfe(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-primary" />
              Enviar NF-e por E-mail
            </DialogTitle>
            <DialogDescription>Informe o e-mail do cliente para enviar a NF-e.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="email"
              placeholder="cliente@email.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEmailDialogNfe(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={!emailInput || !isValidEmail(emailInput)}
              onClick={confirmEnviarEmail}
            >
              <Send className="h-3 w-3 mr-1" /> Enviar
            </Button>
          </DialogFooter>
          {emailInput && !isValidEmail(emailInput) && (
            <span className="text-[10px] text-destructive block -mt-2">
              Formato de e-mail inválido.
            </span>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de pagamento */}
      <Dialog
        open={!!pagamentoDialogId}
        onOpenChange={(open) => !open && setPagamentoDialogId(null)}
      >
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Registrar Pagamento
            </DialogTitle>
            <DialogDescription>Confirme o pagamento desta guia fiscal.</DialogDescription>
          </DialogHeader>
          {pagamentoDialogId &&
            obrigacoes &&
            (() => {
              const obr = obrigacoes.find((o) => o.id === pagamentoDialogId);
              if (!obr) return null;
              return (
                <div className="rounded-md bg-muted/50 p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium">{obr.tipo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Competência:</span>
                    <span className="font-medium">{obr.competencia}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vencimento:</span>
                    <span
                      className={`font-medium ${new Date(obr.data_vencimento) < new Date() ? "text-destructive" : ""}`}
                    >
                      {formatDate(obr.data_vencimento)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-1.5 mt-1.5">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-semibold">{formatCurrency(obr.valor)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data de Pagamento:</span>
                    <span className="font-medium">{format(new Date(), "dd/MM/yyyy")}</span>
                  </div>
                </div>
              );
            })()}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPagamentoDialogId(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={pagarObrigacaoMutation.isPending}
              onClick={() => {
                if (pagamentoDialogId) {
                  pagarObrigacaoMutation.mutate(pagamentoDialogId, {
                    onSuccess: () => setPagamentoDialogId(null),
                  });
                }
              }}
            >
              {pagarObrigacaoMutation.isPending && (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              )}
              <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de cancelamento de NF-e */}
      <Dialog
        open={!!cancelarNfeDialog}
        onOpenChange={(open) => !open && setCancelarNfeDialog(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <XCircle className="h-4 w-4 text-amber-500" />
              Cancelar NF-e
            </DialogTitle>
            <DialogDescription>
              Esta ação irá enviar o cancelamento para a SEFAZ via Focus NFe e alterar o status da
              nota para CANCELADA. Informe a justificativa.
            </DialogDescription>
          </DialogHeader>
          {cancelarNfeDialog && (
            <div className="space-y-3">
              <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NF-e:</span>
                  <span className="font-mono font-medium">#{cancelarNfeDialog.numero}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium">
                    {formatCurrency(cancelarNfeDialog.valor_total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{cancelarNfeDialog.cliente_nome || "-"}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Justificativa (mín. 15 caracteres)
                </label>
                <Input
                  className="mt-1"
                  placeholder="Motivo do cancelamento..."
                  value={cancelJustificativa}
                  onChange={(e) => setCancelJustificativa(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCancelarNfeDialog(null)}>
              Voltar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={cancelJustificativa.length < 15 || cancelarNfeMutation.isPending}
              onClick={() => {
                if (cancelarNfeDialog) {
                  cancelarNfeMutation.mutate(
                    { id: cancelarNfeDialog.id, justificativa: cancelJustificativa },
                    { onSuccess: () => setCancelarNfeDialog(null) },
                  );
                }
              }}
            >
              {cancelarNfeMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de exclusão de NF-e */}
      <Dialog open={!!excluirNfeDialog} onOpenChange={(open) => !open && setExcluirNfeDialog(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-4 w-4 text-destructive" />
              Excluir NF-e
            </DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. A NF-e será removida permanentemente.
            </DialogDescription>
          </DialogHeader>
          {excluirNfeDialog && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">NF-e:</span>
                <span className="font-mono font-medium">#{excluirNfeDialog.numero}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-medium">{formatCurrency(excluirNfeDialog.valor_total)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setExcluirNfeDialog(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={excluirNfeMutation.isPending}
              onClick={() => {
                if (excluirNfeDialog) {
                  excluirNfeMutation.mutate(excluirNfeDialog.id, {
                    onSuccess: () => setExcluirNfeDialog(null),
                  });
                }
              }}
            >
              {excluirNfeMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de exclusão de obrigação */}
      <Dialog
        open={!!excluirObrigacaoDialog}
        onOpenChange={(open) => !open && setExcluirObrigacaoDialog(null)}
      >
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-4 w-4 text-destructive" />
              Excluir Obrigação
            </DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. A obrigação será removida permanentemente.
            </DialogDescription>
          </DialogHeader>
          {excluirObrigacaoDialog && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-medium">{excluirObrigacaoDialog.tipo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Competência:</span>
                <span className="font-medium">{excluirObrigacaoDialog.competencia}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-medium">{formatCurrency(excluirObrigacaoDialog.valor)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setExcluirObrigacaoDialog(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={excluirObrigacaoMutation.isPending}
              onClick={() => {
                if (excluirObrigacaoDialog) {
                  excluirObrigacaoMutation.mutate(excluirObrigacaoDialog.id, {
                    onSuccess: () => setExcluirObrigacaoDialog(null),
                  });
                }
              }}
            >
              {excluirObrigacaoMutation.isPending && (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              )}
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
