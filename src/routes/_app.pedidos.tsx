import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  GripVertical,
  AlertTriangle,
  UserCheck,
  Clock,
  Filter,
  LayoutList,
  LayoutGrid,
  X,
  UserX,
  Search,
  Trash2,
  Pencil,
  FileDown,
  MoreHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/erp/PageHeader";
import { KpiCard } from "@/components/erp/KpiCard";
import { ErpCard } from "@/components/erp/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import type { OsStatus } from "@/lib/sales/os";
import { isOsAtrasada, calcularKpisOS, filtrarOrdenarOS, WIP_LIMITS } from "@/lib/sales/os";
import { usePedidos, usePedidoMutations } from "@/hooks/usePedidos";
import { useInstaladores } from "@/hooks/useInstaladores";
import { useClientes } from "@/hooks/useClientes";
import { useProdutosOrcamento } from "@/hooks/useProdutosOrcamento";
import { exportarOsPDF, montarModeloPdfOS } from "@/lib/sales/pdfOs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { processarBaixaEstoque, reverterBaixaEstoque } from "@/lib/estoque/processarBaixaEstoque";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/_app/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos / OS — Vidraçaria Ornamental" },
      { name: "description", content: "Central de controle de todas as ordens de serviço ativas." },
    ],
  }),
  component: PedidosPage,
});

const STATUS_COLUMNS: OsStatus[] = ["Na Fila", "Em Producao", "Instalacao", "Concluido"];
const COLUMN_LABELS: Record<OsStatus, string> = {
  "Na Fila": "Na Fila",
  "Em Producao": "Em Produção",
  Instalacao: "Instalação",
  Concluido: "Concluído",
};
const COLUMN_COLORS: Record<OsStatus, string> = {
  "Na Fila": "#B4B2A9",
  "Em Producao": "#BA7517",
  Instalacao: "#1D9E75",
  Concluido: "#3B6D11",
};

type ViewMode = "kanban" | "tabela";
type OrdenarPor = "prazo" | "numero" | "cliente";

function PedidosPage() {
  const { data: pedidosRaw = [], isLoading: isLoadingPedidos } = usePedidos();
  const { data: tecnicosRaw = [], isLoading: isLoadingTecnicos } = useInstaladores();
  const { data: clientesRaw = [], isLoading: isLoadingClientes } = useClientes();
  const { createPedido, updatePedido, deletePedido } = usePedidoMutations();
  const { tiposVidro, processamentos } = useProdutosOrcamento();

  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<OsStatus | null>(null);
  const [view, setView] = useState<ViewMode>("kanban");
  const [busca, setBusca] = useState("");
  const [apenasAtrasadas, setApenasAtrasadas] = useState(false);
  const [apenasSemsemTecnico, setApenasSemsemTecnico] = useState(false);
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>("prazo");
  const [tecnicoModal, setTecnicoModal] = useState<string | null>(null); // OS id
  
  // Estado para criação/edição de OS
  const [isOSModalOpen, setIsOSModalOpen] = useState(false);
  const [modalOS, setModalOS] = useState({
    id: "",
    cliente_id: "",
    numero: "",
    data_previsao: "",
    descricao: "",
  });

  const [osDetalhes, setOsDetalhes] = useState<any | null>(null);

  // ─── Normalização de Dados ──────────────────────────────────────────
  const listaOS = useMemo(() => {
    return pedidosRaw.map((o) => {
      const tecnico = o.tecnico_id ? tecnicosRaw.find(t => t.id === o.tecnico_id) : null;
      const itensArray = Array.isArray(o.itens) ? o.itens : [];
      const statusAtual = o.status as OsStatus;
      const atrasada = o.data_previsao ? isOsAtrasada(o.data_previsao) : false;
      
      let variant: "default" | "warning" | "success" | "info" | "danger" = "default";
      if (statusAtual === "Concluido") variant = "success";
      else if (atrasada) variant = "danger";
      else if (statusAtual === "Em Producao") variant = "warning";
      else if (statusAtual === "Instalacao") variant = "info";

      return {
        ...o,
        os: o.numero,
        statusAtual,
        variant,
        atrasada,
        tecnico: tecnico?.nome || "—",
        tecnicoAtribuido: o.tecnico_id,
        cliente: o.cliente?.nome || "Cliente não identificado",
        tipo: (itensArray[0] as any)?.tipo || "Diverso",
        vidro: (itensArray[0] as any)?.vidro || "N/A",
        m2: (itensArray[0] as any)?.area || "0",
        prazo: o.data_previsao ? new Date(o.data_previsao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : "—",
        dataPrevisao: o.data_previsao, // para os filtros
      };
    });
  }, [pedidosRaw, tecnicosRaw]);

  // ─── Técnicos (Instaladores) Formatados ─────────────────────────────
  const instaladores = useMemo(() => {
    return tecnicosRaw.map((t) => {
      const pendentes = listaOS.filter(
        (o) => o.tecnicoAtribuido === t.id && o.statusAtual !== "Concluido"
      ).length;
      
      let status: "Disponível" | "Ocupado" | "Em Rota" = "Disponível";
      let variant: "success" | "warning" | "info" = "success";

      if (pendentes > 3) {
        status = "Ocupado";
        variant = "warning";
      } else if (pendentes > 0) {
        status = "Em Rota";
        variant = "info";
      }

      return {
        id: t.id,
        nome: t.nome || "Técnico sem nome",
        pendentes,
        status,
        variant,
      };
    });
  }, [tecnicosRaw, listaOS]);

  // ─── KPIs ───────────────────────────────────────────────────────────
  const kpis = useMemo(() => calcularKpisOS(listaOS), [listaOS]);

  // ─── Lista filtrada ─────────────────────────────────────────────────
  const listaFiltrada = useMemo(
    () =>
      filtrarOrdenarOS(listaOS, {
        busca,
        apenasAtrasadas,
        apenasSemsemTecnico,
        ordenarPor,
      }),
    [listaOS, busca, apenasAtrasadas, apenasSemsemTecnico, ordenarPor]
  );

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleDragStart = (id: string) => setDraggedItem(id);
  const handleDragOver = (e: React.DragEvent, col: OsStatus) => {
    e.preventDefault();
    setDragOverCol(col);
  };
  const handleDragLeave = () => setDragOverCol(null);
  const handleDrop = async (status: OsStatus) => {
    if (!draggedItem) return;
    const osAtual = listaOS.find((o) => o.id === draggedItem);
    if (!osAtual) return;

    if (osAtual.statusAtual === status) {
      setDraggedItem(null);
      setDragOverCol(null);
      return;
    }

    const count = listaOS.filter((o) => o.statusAtual === status && o.id !== draggedItem).length;
    if (count >= WIP_LIMITS[status]) {
      toast.error(`Limite WIP da coluna "${COLUMN_LABELS[status]}" atingido (${WIP_LIMITS[status]}).`);
      setDraggedItem(null);
      setDragOverCol(null);
      return;
    }

    const statusAnterior = osAtual.statusAtual;
    const entrandoInstalacao = status === "Instalacao" && statusAnterior !== "Instalacao";
    const saindoInstalacao = statusAnterior === "Instalacao" && status !== "Instalacao";

    try {
      await updatePedido({ id: draggedItem, status });

      // ─── Integração de estoque na transição de Instalação ──────
      if ((entrandoInstalacao || saindoInstalacao) && osAtual.orcamento_id) {
        const empresaId = getDefaultEmpresaId();
        if (empresaId) {
          try {
            // Buscar dados do orçamento para ter os itens e o número
            const supabase = getSupabaseBrowserClient();
            const { data: orcData } = await supabase
              .from("orcamentos")
              .select("numero, itens")
              .eq("id", osAtual.orcamento_id)
              .maybeSingle();

            if (orcData) {
              if (entrandoInstalacao) {
                // Baixa automática ao entrar em Instalação
                const resultado = await processarBaixaEstoque(
                  osAtual.orcamento_id,
                  orcData.numero || osAtual.os,
                  Array.isArray(orcData.itens) ? orcData.itens : [],
                  empresaId
                );

                if (resultado.baixados.length > 0) {
                  toast.success(
                    `Estoque atualizado: ${resultado.baixados.length} item(ns) baixado(s) para instalação 📦`
                  );
                }
                if (resultado.semEstoque.length > 0) {
                  toast.warning(
                    `${resultado.semEstoque.length} item(ns) sem estoque vinculado: ${resultado.semEstoque.slice(0, 3).join(", ")}`,
                    { duration: 6000 }
                  );
                }
              } else if (saindoInstalacao) {
                // Devolução automática ao sair de Instalação
                const resultado = await reverterBaixaEstoque(
                  osAtual.orcamento_id,
                  orcData.numero || osAtual.os,
                  empresaId
                );

                if (resultado.baixados.length > 0) {
                  toast.success(
                    `Estoque recomposto: ${resultado.baixados.length} item(ns) devolvido(s) 🔄`
                  );
                }
              }
            }
          } catch {
            // Falha no estoque não bloqueia a mudança de status
            toast.warning("Movimentação de status atualizada, mas houve um erro ao processar o estoque.");
          }
        }
      }
    } catch (error) {
      // Error handled by mutation
    } finally {
      setDraggedItem(null);
      setDragOverCol(null);
    }
  };

  const atribuirTecnico = async (osId: string, tecnicoId: string) => {
    try {
      await updatePedido({ id: osId, tecnico_id: tecnicoId });
      setTecnicoModal(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const removerTecnico = async (osId: string) => {
    try {
      await updatePedido({ id: osId, tecnico_id: null });
      setTecnicoModal(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleNovaOSSubmit = async () => {
    if (!modalOS.cliente_id || !modalOS.numero || !modalOS.data_previsao) {
      toast.error("Preencha cliente, número da OS e data de previsão.");
      return;
    }

    try {
      if (modalOS.id) {
        await updatePedido({
          id: modalOS.id,
          cliente_id: modalOS.cliente_id,
          numero: modalOS.numero,
          data_previsao: new Date(modalOS.data_previsao).toISOString(),
        });
        toast.success("OS atualizada com sucesso!");
      } else {
        await createPedido({
          orcamento_id: "00000000-0000-0000-0000-000000000000",
          cliente_id: modalOS.cliente_id,
          numero: modalOS.numero,
          status: "Na Fila",
          data_previsao: new Date(modalOS.data_previsao).toISOString(),
          itens: [],
          is_atrasada: false,
        });
      }
      
      // Reset form
      setModalOS({
        id: "",
        cliente_id: "",
        numero: "",
        data_previsao: "",
        descricao: "",
      });
      setIsOSModalOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeletarOS = (id: string) => {
    toast.error("Deseja realmente cancelar/excluir esta Ordem de Serviço?", {
      action: {
        label: "Sim, Cancelar",
        onClick: async () => {
          try {
            await deletePedido(id);
          } catch (e) {}
        },
      },
      cancel: {
        label: "Não",
        onClick: () => {},
      },
      duration: 5000,
    });
  };

  const handleEditarOS = (os: any) => {
    setModalOS({
      id: os.id,
      cliente_id: os.cliente_id || "",
      numero: os.os || "",
      data_previsao: os.dataPrevisao ? os.dataPrevisao.split("T")[0] : "",
      descricao: "",
    });
    setIsOSModalOpen(true);
  };

  const handleExportarOS = (os: any) => {
    exportarOsPDF(
      {
        numero: os.os,
        status: os.statusAtual,
        data_previsao: os.dataPrevisao,
        created_at: os.created_at,
        itens: Array.isArray(os.itens) ? os.itens : [],
        cliente: { nome: os.cliente },
      },
      tiposVidro,
      processamentos
    );
  };

  const handleVerDetalhes = (os: any) => {
    const modelo = montarModeloPdfOS(
      {
        numero: os.os,
        status: os.statusAtual,
        data_previsao: os.dataPrevisao,
        created_at: os.created_at,
        itens: Array.isArray(os.itens) ? os.itens : [],
        cliente: { nome: os.cliente },
      },
      tiposVidro,
      processamentos
    );
    setOsDetalhes(modelo);
  };

  if (isLoadingPedidos || isLoadingTecnicos) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Pedidos / Ordens de Serviço"
        subtitle={`${listaOS.length} cadastradas · ${kpis.atrasadas} atrasadas · prazo médio ${kpis.prazoMedioDias} dias`}
        actions={
          <>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setView(view === "kanban" ? "tabela" : "kanban")}>
              {view === "kanban" ? <LayoutList className="mr-1 h-3 w-3" /> : <LayoutGrid className="mr-1 h-3 w-3" />}
              {view === "kanban" ? "Tabela" : "Kanban"}
            </Button>
            <Button size="sm" className="text-xs" onClick={() => {
              setModalOS({ id: "", cliente_id: "", numero: "", data_previsao: "", descricao: "" });
              setIsOSModalOpen(true);
            }}>
              <Plus className="mr-1 h-3 w-3" /> Nova OS
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 mb-3.5">
        <KpiCard label="Na Fila" value={String(kpis.naFila)} topBar={COLUMN_COLORS["Na Fila"]} />
        <KpiCard label="Em Produção" value={String(kpis.emProducao)} topBar={COLUMN_COLORS["Em Producao"]} />
        <KpiCard label="Instalação" value={String(kpis.instalacao)} topBar={COLUMN_COLORS["Instalacao"]} />
        <KpiCard label="Concluído" value={String(kpis.concluidas)} topBar={COLUMN_COLORS["Concluido"]} />
      </div>

      {/* Indicadores de alerta */}
      {(kpis.atrasadas > 0 || kpis.semTecnico > 0) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {kpis.atrasadas > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger/10 border border-danger/30">
              <AlertTriangle className="h-3 w-3 text-danger" />
              <span className="text-[11px] font-medium text-danger">{kpis.atrasadas} OS atrasada{kpis.atrasadas > 1 ? "s" : ""}</span>
            </div>
          )}
          {kpis.semTecnico > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 border border-warning/30">
              <UserX className="h-3 w-3 text-warning" />
              <span className="text-[11px] font-medium text-warning">{kpis.semTecnico} sem técnico</span>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <ErpCard className="mb-3 p-2.5">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              id="pedidos-busca"
              type="text"
              placeholder="Buscar OS, cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-6 pr-3 py-1 text-[11px] rounded-md border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <select
            id="pedidos-ordenar"
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value as OrdenarPor)}
            className="text-[11px] px-2 py-1 rounded-md border border-border/60 bg-background focus:outline-none"
          >
            <option value="prazo">Ordenar: Prazo</option>
            <option value="numero">Ordenar: Número</option>
            <option value="cliente">Ordenar: Cliente</option>
          </select>

          <button
            id="pedidos-filtro-atrasadas"
            onClick={() => setApenasAtrasadas(!apenasAtrasadas)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
              apenasAtrasadas
                ? "bg-danger/10 border-danger/40 text-danger"
                : "border-border/60 text-muted-foreground hover:border-border"
            }`}
          >
            <Filter className="h-3 w-3" />
            Atrasadas
          </button>

          <button
            id="pedidos-filtro-sem-tecnico"
            onClick={() => setApenasSemsemTecnico(!apenasSemsemTecnico)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
              apenasSemsemTecnico
                ? "bg-warning/10 border-warning/40 text-warning"
                : "border-border/60 text-muted-foreground hover:border-border"
            }`}
          >
            <UserX className="h-3 w-3" />
            Sem técnico
          </button>

          {(busca || apenasAtrasadas || apenasSemsemTecnico) && (
            <button
              onClick={() => { setBusca(""); setApenasAtrasadas(false); setApenasSemsemTecnico(false); }}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
      </ErpCard>

      {/* ── KANBAN ───────────────────────────────────────────────────── */}
      {view === "kanban" && (
        <ErpCard className="bg-muted/10 border-none shadow-none p-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {STATUS_COLUMNS.map((column) => {
              const items = listaFiltrada.filter((o: any) => o.statusAtual === column);
              const wipExcedido = items.length >= WIP_LIMITS[column];
              const isOver = dragOverCol === column;

              return (
                <div
                  key={column}
                  className={`flex flex-col rounded-lg p-2 min-h-[400px] transition-colors ${
                    isOver ? "bg-primary/5 ring-1 ring-primary/30" : "bg-muted/40"
                  }`}
                  onDragOver={(e) => handleDragOver(e, column)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(column)}
                >
                  <div className="flex justify-between items-center mb-3 px-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: COLUMN_COLORS[column] }}
                      />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {COLUMN_LABELS[column]}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        wipExcedido && column !== "Concluido"
                          ? "bg-warning/10 text-warning"
                          : "bg-background text-muted-foreground"
                      }`}
                    >
                      {items.length}
                      {WIP_LIMITS[column] !== Infinity ? `/${WIP_LIMITS[column]}` : ""}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    {items.map((os: any) => {
                      const semTecnico = !os.tecnicoAtribuido && (!os.tecnico || os.tecnico === "—");

                      return (
                        <div
                          key={os.id}
                          draggable
                          onDragStart={() => handleDragStart(os.id)}
                          onDoubleClick={() => handleVerDetalhes(os)}
                          className={`bg-background border rounded-md p-2.5 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors ${
                            os.atrasada ? "border-danger/50 bg-danger/5" : semTecnico ? "border-warning/40 bg-warning/3" : "border-border/60"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="text-[11px] font-bold text-foreground">{os.os}</span>
                            <div className="flex items-center gap-1">
                              {os.atrasada && <AlertTriangle className="h-3 w-3 text-danger" />}
                              {semTecnico && !os.atrasada && <UserX className="h-3 w-3 text-warning" />}
                              <span className={`text-[10px] font-medium ${os.atrasada ? "text-danger" : "text-muted-foreground"}`}>
                                {os.prazo}
                              </span>
                            </div>
                          </div>
                          <div className="text-[11px] font-medium leading-tight mb-1">{os.cliente}</div>
                          <div className="text-[10px] text-muted-foreground truncate mb-2">
                            {os.tipo} • {os.vidro}
                          </div>

                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40">
                            <button
                              id={`atribuir-tecnico-${os.id}`}
                              onClick={() => setTecnicoModal(os.id)}
                              className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                                semTecnico
                                  ? "bg-warning/10 text-warning hover:bg-warning/20"
                                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {semTecnico ? <UserX className="h-2.5 w-2.5" /> : <UserCheck className="h-2.5 w-2.5" />}
                              {os.tecnico !== "—" ? os.tecnico : "Atribuir técnico"}
                            </button>
                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 rounded hover:bg-muted/60 transition-colors">
                                    <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onSelect={() => handleEditarOS(os)} className="gap-2 text-xs cursor-pointer">
                                    <Pencil className="h-3.5 w-3.5" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleExportarOS(os)} className="gap-2 text-xs cursor-pointer">
                                    <FileDown className="h-3.5 w-3.5" /> Exportar PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleDeletarOS(os.id)} className="gap-2 text-xs cursor-pointer text-destructive focus:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" /> Cancelar OS
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/40 rounded-md">
                        <span className="text-[10px] text-muted-foreground">Arraste para cá</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ErpCard>
      )}

      {/* ── TABELA ───────────────────────────────────────────────────── */}
      {view === "tabela" && (
        <ErpCard>
          <div className="overflow-x-auto">
            <table className="w-full" id="pedidos-tabela">
              <thead>
                <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                  <th className="py-1.5">OS</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Vidro</th>
                  <th>m²</th>
                  <th>Prazo</th>
                  <th>Técnico</th>
                  <th>Status</th>
                  <th className="text-right pr-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((os: any) => {
                  const semTecnico = !os.tecnicoAtribuido && (!os.tecnico || os.tecnico === "—");
                  const statusAtual = os.statusAtual as OsStatus;

                  return (
                    <tr
                      key={os.id}
                      onDoubleClick={() => handleVerDetalhes(os)}
                      className={`border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40 cursor-pointer ${os.atrasada ? "bg-danger/3" : ""}`}
                    >
                      <td className="py-1.5 font-medium">{os.os}</td>
                      <td>{os.cliente}</td>
                      <td>{os.tipo}</td>
                      <td>{os.vidro}</td>
                      <td>{os.m2}</td>
                      <td>
                        <span className={`flex items-center gap-1 ${os.atrasada ? "text-danger font-medium" : ""}`}>
                          {os.atrasada && <AlertTriangle className="h-3 w-3" />}
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {os.prazo}
                        </span>
                      </td>
                      <td>
                        <button
                          id={`tabela-tecnico-${os.id}`}
                          onClick={() => setTecnicoModal(os.id)}
                          className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                            semTecnico
                              ? "border-warning/40 bg-warning/10 text-warning"
                              : "border-border/40 bg-muted/40 text-muted-foreground hover:border-border"
                          }`}
                        >
                          {semTecnico ? <UserX className="h-2.5 w-2.5" /> : <UserCheck className="h-2.5 w-2.5" />}
                          {os.tecnico !== "—" ? os.tecnico : "Atribuir"}
                        </button>
                      </td>
                      <td>
                        <StatusBadge variant={os.variant}>{COLUMN_LABELS[statusAtual] || os.status}</StatusBadge>
                      </td>
                      <td className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onSelect={() => handleEditarOS(os)} className="gap-2 text-xs cursor-pointer">
                              <Pencil className="h-3.5 w-3.5" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleExportarOS(os)} className="gap-2 text-xs cursor-pointer">
                              <FileDown className="h-3.5 w-3.5" /> Exportar PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleDeletarOS(os.id)} className="gap-2 text-xs cursor-pointer text-destructive focus:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" /> Cancelar OS
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {listaFiltrada.length === 0 && (
              <div className="text-center py-8 text-[11px] text-muted-foreground">
                Nenhuma OS encontrada com os filtros aplicados.
              </div>
            )}
          </div>
        </ErpCard>
      )}

      {/* ── MODAL NOVA OS ────────────────────────────────────────────── */}
      <Dialog open={isOSModalOpen} onOpenChange={setIsOSModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{modalOS.id ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label>Cliente *</Label>
              <Select
                value={modalOS.cliente_id}
                onValueChange={(value) => setModalOS({ ...modalOS, cliente_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingClientes ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : clientesRaw.length === 0 ? (
                    <SelectItem value="empty" disabled>Nenhum cliente cadastrado</SelectItem>
                  ) : (
                    clientesRaw.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Número da OS *</Label>
              <Input
                value={modalOS.numero}
                onChange={(e) => setModalOS({ ...modalOS, numero: e.target.value })}
                placeholder="Ex: OS-5001"
              />
            </div>

            <div>
              <Label>Data de Previsão *</Label>
              <Input
                type="date"
                value={modalOS.data_previsao}
                onChange={(e) => setModalOS({ ...modalOS, data_previsao: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label>Descrição / Observações</Label>
              <Input
                value={modalOS.descricao}
                onChange={(e) => setModalOS({ ...modalOS, descricao: e.target.value })}
                placeholder="Detalhes adicionais sobre o serviço..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOSModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleNovaOSSubmit}>
              {modalOS.id ? "Salvar" : "Criar OS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL TÉCNICO ────────────────────────────────────────────── */}
      {tecnicoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setTecnicoModal(null)}
        >
          <div
            className="bg-card border border-border rounded-lg p-4 w-72 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            id="modal-atribuir-tecnico"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold">Atribuir técnico</h3>
              <button onClick={() => setTecnicoModal(null)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-1.5 mb-3">
              {instaladores.map((inst) => (
                <button
                  key={inst.id}
                  id={`tecnico-option-${inst.nome.replace(/\s/g, "-")}`}
                  onClick={() => atribuirTecnico(tecnicoModal, inst.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border border-border/60 hover:bg-muted/60 text-[11px] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                      {inst.nome.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{inst.nome}</div>
                      <div className="text-[10px] text-muted-foreground">{inst.pendentes} pendentes</div>
                    </div>
                  </div>
                  <StatusBadge variant={inst.variant}>{inst.status}</StatusBadge>
                </button>
              ))}
            </div>

            <button
              id="tecnico-remover"
              onClick={() => { removerTecnico(tecnicoModal); }}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border border-danger/30 text-danger text-[11px] hover:bg-danger/5 transition-colors"
            >
              <UserX className="h-3.5 w-3.5" /> Remover técnico
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL DETALHES OS ────────────────────────────────────────────── */}
      <Dialog open={!!osDetalhes} onOpenChange={(open) => !open && setOsDetalhes(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da OS: {osDetalhes?.numero}</DialogTitle>
          </DialogHeader>
          
          {osDetalhes && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-md border border-border/50">
                <div>
                  <span className="font-semibold text-muted-foreground block text-xs">Cliente</span> 
                  <span>{osDetalhes.cliente.nome}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block text-xs">Status</span> 
                  <span className="font-medium text-primary">{osDetalhes.status}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block text-xs">Previsão</span> 
                  <span>{osDetalhes.previsao}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block text-xs">Data Emissão</span> 
                  <span>{osDetalhes.dataEmissao}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Itens do Pedido</h3>
                <div className="border rounded-md overflow-hidden bg-background">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-muted-foreground border-b border-border">
                      <tr>
                        <th className="p-2.5 text-left font-medium text-xs">Cód.</th>
                        <th className="p-2.5 text-left font-medium text-xs">Descrição</th>
                        <th className="p-2.5 text-right font-medium text-xs">Qtd</th>
                        <th className="p-2.5 text-center font-medium text-xs">Unid</th>
                        <th className="p-2.5 text-right font-medium text-xs">Larg. (m)</th>
                        <th className="p-2.5 text-right font-medium text-xs">Alt. (m)</th>
                        <th className="p-2.5 text-right font-medium text-xs">M²</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {osDetalhes.itens.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="p-2.5 text-xs text-muted-foreground">{item.codigo}</td>
                          <td className="p-2.5 font-medium text-[13px]">{item.descricao}</td>
                          <td className="p-2.5 text-right font-medium">{item.quantidade}</td>
                          <td className="p-2.5 text-center text-xs text-muted-foreground">{item.unidade}</td>
                          <td className="p-2.5 text-right text-xs">{item.largura.toFixed(2)}</td>
                          <td className="p-2.5 text-right text-xs">{item.altura.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-medium text-primary">{item.m2.toFixed(2)}</td>
                        </tr>
                      ))}
                      {osDetalhes.itens.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-muted-foreground">
                            Nenhum item detalhado nesta OS.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOsDetalhes(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
