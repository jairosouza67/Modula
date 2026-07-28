import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/erp/PageHeader";
import { KpiCard } from "@/components/erp/KpiCard";
import { ErpCard } from "@/components/erp/Card";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAgenda, useInstaladoresStats, useUpdateInstalacao } from "@/hooks/useInstalacoes";
import { usePedidos } from "@/hooks/usePedidos";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/instalacoes")({
  head: () => ({
    meta: [
      { title: "Instalações — ModulaAPP" },
      { name: "description", content: "Agenda e controle de campo dos instaladores." },
    ],
  }),
  component: InstalacoesPage,
});

function InstalacoesPage() {
  const [viewMode, setViewMode] = useState<"semana" | "mes">("semana");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const { data: agenda = [], isLoading: loadingAgenda, refetch: refetchAgenda } = useAgenda(currentDate, viewMode);
  const { data: instaladores = [], isLoading: loadingInstaladores, refetch: refetchInstaladores } = useInstaladoresStats();
  const { data: pedidos = [], isLoading: loadingPedidos } = usePedidos();
  const { mutateAsync: updateInstalacao } = useUpdateInstalacao();

  const [selectedInstalacao, setSelectedInstalacao] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    os_id: "", 
    tecnico_id: "", 
    hora_previsao: "", 
    data_previsao: "",
    status_instalacao: "",
    endereco_instalacao: ""
  });

  const isLoading = loadingAgenda || loadingInstaladores;

  // Calculate dynamic KPIs
  const totalAgendadas = agenda.reduce((acc, dia) => acc + dia.itens.length, 0);
  const emCampoAgora = instaladores.filter(i => i.status === "Em campo").length;
  const concluidasMes = instaladores.reduce((acc, i) => acc + i.instalacoes, 0);
  const totalInstaladores = instaladores.length;

  const start = viewMode === "semana" ? startOfWeek(currentDate, { weekStartsOn: 1 }) : startOfMonth(currentDate);
  const end = viewMode === "semana" ? endOfWeek(currentDate, { weekStartsOn: 1 }) : endOfMonth(currentDate);
  const dateRangeStr = viewMode === "mes" 
    ? format(currentDate, "MMMM yyyy", { locale: ptBR })
    : `${format(start, "dd", { locale: ptBR })}–${format(end, "dd MMM", { locale: ptBR })}`;

  const handlePrevious = () => {
    if (viewMode === "semana") setCurrentDate(prev => subWeeks(prev, 1));
    else setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNext = () => {
    if (viewMode === "semana") setCurrentDate(prev => addWeeks(prev, 1));
    else setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Instalações"
        subtitle={`${dateRangeStr.charAt(0).toUpperCase() + dateRangeStr.slice(1)} · ${totalAgendadas} agendadas · ${totalInstaladores} instaladores ativos`}
        actions={
          <Button 
            size="sm" 
            className="text-xs"
            onClick={() => {
              setSelectedInstalacao({ isNew: true });
              setFormData({
                os_id: "",
                tecnico_id: "none",
                hora_previsao: "",
                data_previsao: format(new Date(), "yyyy-MM-dd"),
                status_instalacao: "Agendado",
                endereco_instalacao: ""
              });
            }}
          >
            <CalendarPlus className="mr-1 h-3 w-3" /> Agendar
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 mb-3.5">
        <KpiCard label="Agendadas" value={totalAgendadas.toString()} />
        <KpiCard label="Em campo agora" value={emCampoAgora.toString()} />
        <KpiCard label="Concluídas mês" value={concluidasMes.toString()} />
        <KpiCard label="Instaladores" value={totalInstaladores.toString()} />
      </div>

      <ErpCard 
        title={
          <div className="flex items-center gap-2">
            <span className="capitalize">{dateRangeStr}</span>
            <div className="flex items-center ml-2 border border-border/50 rounded-md overflow-hidden">
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none" onClick={handlePrevious}>
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] rounded-none border-x border-border/50" onClick={handleToday}>
                Hoje
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none" onClick={handleNext}>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        } 
        className="mb-3.5"
        action={
          <div className="flex bg-muted rounded-md p-0.5">
            <button
              className={`px-3 py-1 text-[11px] font-medium rounded-sm transition-colors ${viewMode === "semana" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => {
                setViewMode("semana");
                // Reset to today when switching back to week mode if the user was far away, 
                // or just keep the same reference date. Let's keep the reference date.
              }}
            >
              Semana
            </button>
            <button
              className={`px-3 py-1 text-[11px] font-medium rounded-sm transition-colors ${viewMode === "mes" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setViewMode("mes")}
            >
              Mês
            </button>
          </div>
        }
      >
        <div className={cn("grid gap-2", viewMode === "mes" ? "grid-cols-7" : "grid-cols-3 lg:grid-cols-7")}>
          {agenda.map((d, index) => (
            <div 
              key={d.fullDate.toISOString()} 
              className={cn(
                "rounded-md border p-2 min-h-[120px] cursor-pointer hover:border-primary/50 transition-colors group relative overflow-y-auto max-h-[180px]",
                viewMode === "mes" && !d.isCurrentMonth ? "opacity-40 bg-muted/20 border-border/40" : "bg-card border-border/60",
                d.isToday && "ring-1 ring-primary/50 bg-primary/5"
              )}
              onClick={() => {
                setSelectedInstalacao({ isNew: true });
                setFormData({
                  os_id: "",
                  tecnico_id: "none",
                  hora_previsao: "",
                  data_previsao: format(d.fullDate, "yyyy-MM-dd"),
                  status_instalacao: "Agendado"
                });
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5 sticky top-0 bg-background/80 backdrop-blur z-10 py-0.5 group-hover:text-primary transition-colors">
                <span className={cn(
                  "text-[11px] font-medium uppercase",
                  d.isToday && "bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm"
                )}>
                  {viewMode === "mes" ? (index < 7 ? d.dia : d.diaNumero) : d.dia}
                </span>
                {d.isToday && viewMode !== "mes" && <span className="text-[9px] font-semibold text-primary">HOJE</span>}
              </div>

              <div className="space-y-1.5 pb-1">
                {d.itens.length === 0 && (
                  <div className="text-[10px] text-muted-foreground/60 italic opacity-0 group-hover:opacity-100 transition-opacity">
                    Clique para agendar
                  </div>
                )}
                {d.itens.map((it: any) => (
                  <div 
                    key={it.id} 
                    className="rounded bg-info-bg p-1.5 border-l-2 border-info cursor-pointer hover:bg-info-bg/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInstalacao({ ...it, fullDate: d.fullDate });
                      setFormData({
                        os_id: it.id,
                        tecnico_id: it.tecnico_id || "none",
                        hora_previsao: it.hora_previsao || "",
                        data_previsao: format(d.fullDate, "yyyy-MM-dd"),
                        status_instalacao: it.status_instalacao || "Agendado",
                        endereco_instalacao: it.endereco_instalacao || ""
                      });
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-[10px] font-medium text-info">OS #{it.os}</div>
                      {it.hora_previsao && <div className="text-[9px] text-muted-foreground">{it.hora_previsao.substring(0,5)}</div>}
                    </div>
                    <div className="text-[10px] font-semibold truncate">{it.cliente}</div>
                    <div className="text-[9px] text-muted-foreground truncate">{it.endereco}</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-[9px] text-info font-medium truncate">{it.inst}</div>
                      <div className="text-[8px] bg-background px-1 py-0.5 rounded border">{it.status_instalacao}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ErpCard>

      <ErpCard title="Status dos instaladores">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {instaladores.map((i) => (
            <div key={i.id} className="rounded-md border border-border/60 p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-medium">{i.nome}</div>
                <StatusBadge variant={i.variant}>{i.status}</StatusBadge>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <div className="text-[9px] text-muted-foreground uppercase">Instal. mês</div>
                  <div className="text-sm font-medium">{i.instalacoes}</div>
                </div>
                <div>
                  <div className="text-[9px] text-muted-foreground uppercase">Pendentes</div>
                  <div className="text-sm font-medium">{i.pendentes}</div>
                </div>
              </div>
            </div>
          ))}
          {instaladores.length === 0 && (
            <div className="col-span-full py-8 text-center text-sm text-muted-foreground border border-dashed rounded-md">
              Nenhum instalador cadastrado.
            </div>
          )}
        </div>
      </ErpCard>

      <Sheet open={!!selectedInstalacao} onOpenChange={(open) => !open && setSelectedInstalacao(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{selectedInstalacao?.isNew ? "Agendar Nova Instalação" : "Gestão de Instalação"}</SheetTitle>
            <SheetDescription>
              {selectedInstalacao?.isNew 
                ? "Selecione a OS e defina a data, equipe e horário da instalação."
                : `Atualize a equipe, o horário e o status de campo para a OS #${selectedInstalacao?.os}.`
              }
            </SheetDescription>
          </SheetHeader>

          {selectedInstalacao && (
            <div className="space-y-6">
              {!selectedInstalacao.isNew ? (
                <div className="space-y-1">
                  <div className="text-sm font-semibold">{selectedInstalacao.cliente}</div>
                  <div className="text-xs text-muted-foreground">{selectedInstalacao.endereco}</div>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>Ordem de Serviço</Label>
                    <Select 
                      value={formData.os_id} 
                      onValueChange={(val) => setFormData(prev => ({ ...prev, os_id: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a OS" />
                      </SelectTrigger>
                      <SelectContent>
                        {pedidos.filter(p => !["Concluido", "Cancelado"].includes(p.status)).map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            #{p.numero} - {p.cliente?.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data Prevista</Label>
                    <Input 
                      type="date" 
                      value={formData.data_previsao} 
                      onChange={(e) => setFormData(prev => ({ ...prev, data_previsao: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Endereço de Instalação</Label>
                  <Input 
                    type="text" 
                    placeholder="Endereço (opcional)"
                    value={formData.endereco_instalacao} 
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco_instalacao: e.target.value }))}
                  />
                  <div className="text-[10px] text-muted-foreground">
                    Se vazio, será usado o endereço do cliente.
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Equipe / Instalador</Label>
                  <Select 
                    value={formData.tecnico_id} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, tecnico_id: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um instalador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não atribuído</SelectItem>
                      {instaladores.map(i => (
                        <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Horário Previsto</Label>
                  <Input 
                    type="time" 
                    value={formData.hora_previsao} 
                    onChange={(e) => setFormData(prev => ({ ...prev, hora_previsao: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Status da Instalação</Label>
                  <Select 
                    value={formData.status_instalacao} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, status_instalacao: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agendado">Agendado</SelectItem>
                      <SelectItem value="Em Rota">Em Rota</SelectItem>
                      <SelectItem value="Concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <Button 
                  className="w-full" 
                  onClick={async () => {
                    if (selectedInstalacao.isNew && !formData.os_id) {
                      toast.error("Selecione uma Ordem de Serviço.");
                      return;
                    }
                    if (selectedInstalacao.isNew && !formData.data_previsao) {
                      toast.error("A data prevista é obrigatória.");
                      return;
                    }

                    try {
                      await updateInstalacao({
                        id: selectedInstalacao.isNew ? formData.os_id : selectedInstalacao.id,
                        tecnico_id: formData.tecnico_id === "none" ? null : formData.tecnico_id,
                        hora_previsao: formData.hora_previsao || null,
                        status_instalacao: formData.status_instalacao,
                        data_previsao: selectedInstalacao.isNew ? formData.data_previsao : format(selectedInstalacao.fullDate, "yyyy-MM-dd"),
                        endereco_instalacao: formData.endereco_instalacao || null
                      });
                      toast.success(selectedInstalacao.isNew ? "Instalação agendada com sucesso!" : "Instalação atualizada com sucesso!");
                      refetchAgenda();
                      refetchInstaladores();
                      setSelectedInstalacao(null);
                    } catch (error) {
                      toast.error("Erro ao salvar a instalação.");
                      console.error(error);
                    }
                  }}
                >
                  {selectedInstalacao.isNew ? "Agendar Instalação" : "Salvar Alterações"}
                </Button>

                {!selectedInstalacao.isNew && (
                  <Button
                    variant="outline"
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={async () => {
                      if (!confirm("Tem certeza que deseja remover esta OS do calendário?")) return;
                      
                      try {
                        await updateInstalacao({
                          id: selectedInstalacao.id,
                          tecnico_id: null,
                          hora_previsao: null,
                          status_instalacao: null,
                          data_previsao: null,
                          endereco_instalacao: null
                        });
                        toast.success("Agendamento removido com sucesso.");
                        refetchAgenda();
                        refetchInstaladores();
                        setSelectedInstalacao(null);
                      } catch (error) {
                        toast.error("Erro ao remover o agendamento.");
                        console.error(error);
                      }
                    }}
                  >
                    Remover do Calendário
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
