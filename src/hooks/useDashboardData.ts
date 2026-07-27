import { useQuery } from "@tanstack/react-query";
import { calcularKpisOS, diasAtePrevisao, isOsAtrasada } from "@/lib/sales/os";
import { calcularKpisEstoque, calcularStatusEstoque } from "@/lib/inventory/estoque";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { Database } from "@/lib/supabase/types";
import { userFriendlyError } from "@/lib/errors/sanitize";
import { CategoriaEstoque, EstoqueItem } from "@/lib/inventory/estoque";
import { listarServicosDisponiveis } from "@/lib/sales/resolverServico";

// ─── Tipos ────────────────────────────────────────────────────────────────

export type AlertaSeveridade = "danger" | "warning" | "info";
export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface FaturamentoMensalDashboard {
  mes: string;
  anoAnterior: number;
  anoAtual: number;
}

export interface MixServicoDashboard {
  name: string;
  value: number;
}

export interface UltimaOsDashboard {
  os: string;
  cliente: string;
  status: string;
  variant: StatusVariant;
  valor: string;
}

export interface OsAtrasadaDashboard {
  os: string;
  cliente: string;
  prazo: string;
  diasAtraso: number;
}

export interface AlertaDashboard {
  id: string;
  severidade: AlertaSeveridade;
  titulo: string;
  descricao: string;
  modulo: "estoque" | "os" | "financeiro";
}

export interface DashboardKpis {
  faturamento: { valor: number; variacao: number };
  osAbertas: number;
  osAtrasadas: number;
  m2EmProducao: number;
  aReceberVencido: number;
  titrosVencidos: number;
  itensCriticos: number;
}

interface DashboardPayload {
  kpis: DashboardKpis;
  alertas: AlertaDashboard[];
  osKpis: ReturnType<typeof calcularKpisOS>;
  estoqueKpis: ReturnType<typeof calcularKpisEstoque>;
  faturamentoMensal: FaturamentoMensalDashboard[];
  tipoVidro: MixServicoDashboard[];
  ultimasOS: UltimaOsDashboard[];
  osAtrasadas: OsAtrasadaDashboard[];
  ticketMedio: number;
  osSemTecnico: number;
}

type DashboardOS = Database["public"]["Tables"]["ordens_servico"]["Row"] & {
  cliente: { nome: string }[] | null;
  orcamento:
    | {
        valor_total: number;
        area_total: number;
        itens: unknown[];
        status: string;
        created_at: string;
      }[]
    | null;
};

type DashboardEstoqueRow = Database["public"]["Tables"]["estoque_itens"]["Row"];

type DashboardTituloRow = Database["public"]["Tables"]["contas_pagar_receber"]["Row"] & {
  ordens_servico?: { numero: string }[] | null;
};

type OsNormalizada = {
  os: string | null;
  statusAtual: string;
  atrasada: boolean;
  prazo: string;
  dataPrevisao: string | undefined;
  tecnicoId: string | null;
  tecnico: string;
};

const MESES_ABREVIADOS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
const SERVICOS_MAPA = new Map(
  listarServicosDisponiveis().map((servico) => [servico.codigo, servico.nome]),
);

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const formatCurrency = (value: number): string => money.format(value);

const getStatusAtual = (status: string): "Na Fila" | "Em Producao" | "Instalacao" | "Concluido" => {
  if (status === "Em Producao" || status === "Produção") {
    return "Em Producao";
  }
  if (status === "Instalacao" || status === "Instalação" || status === "Instalado") {
    return "Instalacao";
  }
  if (status === "Concluido" || status === "Concluído") {
    return "Concluido";
  }
  return "Na Fila";
};

const getStatusVariant = (status: string, atrasada: boolean): StatusVariant => {
  if (atrasada) {
    return "danger";
  }
  if (status === "Concluido") {
    return "success";
  }
  if (status === "Instalacao") {
    return "info";
  }
  if (status === "Em Producao") {
    return "warning";
  }
  return "neutral";
};

const parseDateOnly = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isBeforeToday = (value: string | null | undefined): boolean => {
  const parsed = parseDateOnly(value);
  if (!parsed) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed.getTime() < today.getTime();
};

const getItemAreaM2 = (item: any): number => {
  const largura = Number(item?.largura ?? 0);
  const altura = Number(item?.altura ?? 0);
  const quantidade = Number(item?.quantidade ?? 0);
  return (largura * altura * quantidade) / 1_000_000;
};

const buildFaturamentoMensal = (orcamentosRows: any[]): FaturamentoMensalDashboard[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;
  const currentMonth = now.getMonth();

  const approved = orcamentosRows.filter((row) => row.status === "Aprovado");
  const totalsByYearMonth = new Map<string, number>();

  approved.forEach((row) => {
    const createdAt = parseDateOnly(row.created_at);
    if (!createdAt) {
      return;
    }

    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth()).padStart(2, "0")}`;
    totalsByYearMonth.set(key, (totalsByYearMonth.get(key) ?? 0) + Number(row.valor_total ?? 0));
  });

  return Array.from({ length: currentMonth + 1 }, (_, monthIndex) => {
    const currentKey = `${currentYear}-${String(monthIndex).padStart(2, "0")}`;
    const previousKey = `${previousYear}-${String(monthIndex).padStart(2, "0")}`;

    return {
      mes: MESES_ABREVIADOS[monthIndex],
      anoAnterior: Number((totalsByYearMonth.get(previousKey) ?? 0).toFixed(2)),
      anoAtual: Number((totalsByYearMonth.get(currentKey) ?? 0).toFixed(2)),
    };
  });
};

const buildMixServico = (orcamentosRows: any[]): MixServicoDashboard[] => {
  const mixMap = new Map<string, number>();

  orcamentosRows
    .filter((row) => row.status === "Aprovado")
    .forEach((orcamento) => {
      const itens = Array.isArray(orcamento.itens) ? orcamento.itens : [];

      itens.forEach((item: any) => {
        const codigo =
          String(
            item?.codigoServico || item?.produtoCodigo || item?.codigo || item?.tipo || "Outros",
          ).trim() || "Outros";
        const area = getItemAreaM2(item);
        const peso = area > 0 ? area : Number(item?.quantidade ?? 1);
        mixMap.set(codigo, (mixMap.get(codigo) ?? 0) + peso);
      });
    });

  const ordenado = Array.from(mixMap.entries()).sort((a, b) => b[1] - a[1]);
  const principais = ordenado.slice(0, 4);
  const restante = ordenado.slice(4).reduce((sum, [, value]) => sum + value, 0);
  const total = principais.reduce((sum, [, value]) => sum + value, 0) + restante;
  const combinados = restante > 0 ? [...principais, ["Outros", restante] as const] : principais;

  return combinados
    .map(([codigo, valor]) => ({
      name: SERVICOS_MAPA.get(codigo) ?? codigo,
      value: total > 0 ? Number(((valor / total) * 100).toFixed(0)) : 0,
    }))
    .filter((item) => item.value > 0);
};

const buildDashboardPayload = async (): Promise<DashboardPayload> => {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  const [osResult, estoqueResult, titulosResult, orcamentosResult] = await Promise.all([
    supabase
      .from("ordens_servico")
      .select(
        `
        id,
        numero,
        status,
        data_previsao,
        is_atrasada,
        tecnico_id,
        created_at,
        cliente:clientes(nome),
        orcamento:orcamentos(valor_total, area_total, itens, status, created_at)
      `,
      )
      .eq("empresa_id", empresaId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("estoque_itens")
      .select(
        "id, codigo, descricao, categoria, unidade, quantidade, estoque_minimo, custo_unitario",
      )
      .eq("empresa_id", empresaId)
      .is("deleted_at", null),
    supabase
      .from("contas_pagar_receber")
      .select(
        `
        id,
        cliente_id,
        fornecedor_id,
        data_vencimento,
        valor_previsto,
        status,
        observacoes,
        ordem_servico_id,
        parcela,
        clientes(nome),
        fornecedores(nome),
        ordens_servico(numero)
      `,
      )
      .eq("empresa_id", empresaId),
    supabase
      .from("orcamentos")
      .select(
        `
        id,
        numero,
        descricao,
        itens,
        area_total,
        valor_total,
        status,
        created_at,
        cliente:clientes(nome)
      `,
      )
      .eq("empresa_id", empresaId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  if (osResult.error) {
    throw new Error(userFriendlyError("Erro ao carregar ordens de serviço", osResult.error));
  }
  if (estoqueResult.error) {
    throw new Error(userFriendlyError("Erro ao carregar estoque", estoqueResult.error));
  }
  if (titulosResult.error) {
    throw new Error(userFriendlyError("Erro ao carregar títulos financeiros", titulosResult.error));
  }
  if (orcamentosResult.error) {
    throw new Error(userFriendlyError("Erro ao carregar orçamentos", orcamentosResult.error));
  }

  const osRows = (osResult.data ?? []) as unknown as DashboardOS[];
  const estoqueRows = (estoqueResult.data ?? []) as DashboardEstoqueRow[];
  const titulosRows = (titulosResult.data ?? []) as unknown as DashboardTituloRow[];
  const orcamentosRows = orcamentosResult.data ?? [];

  const osNormalizadas: OsNormalizada[] = osRows.map((row) => {
    const atrasada =
      Boolean(row.is_atrasada) || (row.status !== "Concluido" && isBeforeToday(row.data_previsao));

    return {
      os: row.numero,
      statusAtual: getStatusAtual(row.status),
      atrasada,
      prazo: row.data_previsao ?? "",
      dataPrevisao: row.data_previsao ?? undefined,
      tecnicoId: row.tecnico_id ?? null,
      tecnico: row.tecnico_id ? "Atribuído" : "—",
    };
  });

  const osKpis = calcularKpisOS(osNormalizadas);
  const osAtrasadas = osRows
    .filter(
      (row) => row.data_previsao && (Boolean(row.is_atrasada) || isOsAtrasada(row.data_previsao)),
    )
    .map((row) => ({
      os: row.numero,
      cliente: row.cliente?.[0]?.nome ?? "Cliente não identificado",
      prazo: row.data_previsao ?? "indefinido",
      diasAtraso: row.data_previsao ? Math.max(1, Math.abs(diasAtePrevisao(row.data_previsao))) : 0,
    }))
    .slice(0, 5);

  const estoqueCompleto: EstoqueItem[] = estoqueRows.map((row) => ({
    id: row.id,
    codigo: row.codigo,
    descricao: row.descricao,
    categoria: row.categoria as CategoriaEstoque,
    unidade: row.unidade,
    quantidade: Number(row.quantidade ?? 0),
    estoqueMinimo: Number(row.estoque_minimo ?? 0),
    custoUnitario: Number(row.custo_unitario ?? 0),
  }));

  const estoqueKpis = calcularKpisEstoque(estoqueCompleto);

  const faturamentoMensal = buildFaturamentoMensal(orcamentosRows);
  const tipoVidro = buildMixServico(orcamentosRows);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthApprovedOrcamentos = orcamentosRows
    .filter((row: any) => row.status === "Aprovado")
    .filter((row: any) => {
      const createdAt = parseDateOnly(row.created_at);
      return createdAt?.getMonth() === currentMonth && createdAt?.getFullYear() === currentYear;
    });

  const currentMonthRevenue = currentMonthApprovedOrcamentos.reduce(
    (sum: number, row: any) => sum + Number(row.valor_total ?? 0),
    0,
  );

  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const previousMonthRevenue = orcamentosRows
    .filter((row: any) => row.status === "Aprovado")
    .filter((row: any) => {
      const createdAt = parseDateOnly(row.created_at);
      return (
        createdAt?.getMonth() === previousMonthDate.getMonth() &&
        createdAt?.getFullYear() === previousMonthDate.getFullYear()
      );
    })
    .reduce((sum: number, row: any) => sum + Number(row.valor_total ?? 0), 0);

  const m2EmProducao = orcamentosRows.reduce((sum: number, row: any) => {
    if (row.status === "Aprovado" || row.status === "Aberto") {
      return sum + Number(row.area_total ?? 0);
    }
    return sum;
  }, 0);

  const titulosVencidos = titulosRows.filter((row: any) => {
    const vencido =
      row.status === "ATRASADO" ||
      (row.status === "PENDENTE" && isBeforeToday(row.data_vencimento));
    return !row.fornecedor_id && vencido;
  });

  const totalVencido = titulosVencidos.reduce(
    (sum: number, row: any) => sum + Number(row.valor_previsto ?? 0),
    0,
  );

  const osSemTecnico = osRows.filter(
    (row: any) => !row.tecnico_id && row.status !== "Concluido",
  ).length;

  const alertas: AlertaDashboard[] = [
    ...estoqueCompleto.flatMap((item: EstoqueItem): AlertaDashboard[] => {
      const status = calcularStatusEstoque(item.quantidade, item.estoqueMinimo);

      if (status === "Crítico") {
        return [
          {
            id: `est-${item.codigo}`,
            severidade: "danger",
            titulo: "Estoque crítico",
            descricao: `${item.codigo} — apenas ${item.quantidade} unidade${item.quantidade !== 1 ? "s" : ""} restante${item.quantidade !== 1 ? "s" : ""}`,
            modulo: "estoque",
          },
        ];
      }

      if (status === "Atenção") {
        return [
          {
            id: `est-at-${item.codigo}`,
            severidade: "warning",
            titulo: "Estoque em atenção",
            descricao: `${item.codigo} — ${item.quantidade} unidades (mínimo: ${item.estoqueMinimo})`,
            modulo: "estoque",
          },
        ];
      }

      return [];
    }),
    ...osRows.flatMap((row) => {
      const atrasada =
        Boolean(row.is_atrasada) ||
        (row.status !== "Concluido" && isBeforeToday(row.data_previsao));

      if (!atrasada) {
        return [];
      }

      return [
        {
          id: `os-at-${row.id ?? row.numero}`,
          severidade: "danger" as const,
          titulo: "OS em atraso",
          descricao: `${row.numero ?? "OS"} — ${row.cliente?.[0]?.nome ?? "Cliente não identificado"} (prazo: ${row.data_previsao ?? "indefinido"})`,
          modulo: "os" as const,
        },
      ];
    }),
    ...titulosVencidos.map((row) => ({
      id: `fin-${row.id}`,
      severidade: "warning" as const,
      titulo: "Título vencido",
      descricao: `${row.observacoes ?? row.ordens_servico?.[0]?.numero ?? "Título financeiro"} · ${formatCurrency(Number(row.valor_previsto ?? 0))}`,
      modulo: "financeiro" as const,
    })),
  ];

  const ordemSev: Record<AlertaSeveridade, number> = { danger: 0, warning: 1, info: 2 };
  alertas.sort((a, b) => ordemSev[a.severidade] - ordemSev[b.severidade]);

  const ultimasOS = osRows.slice(0, 5).map((row: any) => {
    const orcamento = row.orcamento ?? null;
    const valor = Number(orcamento?.valor_total ?? 0);
    const atrasada =
      Boolean(row.is_atrasada) || (row.status !== "Concluido" && isBeforeToday(row.data_previsao));

    return {
      os: row.numero,
      cliente: row.cliente?.nome ?? "Cliente não identificado",
      status: row.status,
      variant: getStatusVariant(row.status, atrasada),
      valor: formatCurrency(valor),
    } satisfies UltimaOsDashboard;
  });

  const faturamentoAtual = currentMonthRevenue;
  const faturamentoAnterior = previousMonthRevenue;

  const variacao =
    faturamentoAnterior > 0
      ? Number((((faturamentoAtual - faturamentoAnterior) / faturamentoAnterior) * 100).toFixed(0))
      : 0;

  return {
    kpis: {
      faturamento: { valor: faturamentoAtual, variacao },
      osAbertas: osKpis.total - osKpis.concluidas,
      osAtrasadas: osKpis.atrasadas,
      m2EmProducao,
      aReceberVencido: totalVencido,
      titrosVencidos: titulosVencidos.length,
      itensCriticos: estoqueKpis.itensCriticos,
    },
    alertas,
    osKpis,
    estoqueKpis,
    faturamentoMensal,
    tipoVidro,
    ultimasOS,
    osAtrasadas,
    ticketMedio:
      currentMonthApprovedOrcamentos.length > 0
        ? faturamentoAtual / currentMonthApprovedOrcamentos.length
        : 0,
    osSemTecnico,
  };
};

// ─── Hook ────────────────────────────────────────────────────────────────

export function useDashboardData() {
  const supabaseQuery = useQuery({
    queryKey: ["dashboard-data", getDefaultEmpresaId()],
    queryFn: buildDashboardPayload,
    staleTime: 30_000,
    retry: 1,
  });

  const emptyPayload: DashboardPayload = {
    kpis: {
      faturamento: { valor: 0, variacao: 0 },
      osAbertas: 0,
      osAtrasadas: 0,
      m2EmProducao: 0,
      aReceberVencido: 0,
      titrosVencidos: 0,
      itensCriticos: 0,
    },
    alertas: [],
    osKpis: {
      total: 0,
      naFila: 0,
      emProducao: 0,
      instalacao: 0,
      concluidas: 0,
      atrasadas: 0,
      semTecnico: 0,
      prazoMedioDias: 0,
    },
    estoqueKpis: { totalItens: 0, valorTotal: 0, itensCriticos: 0, itensAtencao: 0, custoMedio: 0 },
    faturamentoMensal: [],
    tipoVidro: [],
    ultimasOS: [],
    osAtrasadas: [],
    ticketMedio: 0,
    osSemTecnico: 0,
  };

  return {
    ...(supabaseQuery.data ?? emptyPayload),
    isLoading: supabaseQuery.isLoading,
    isError: supabaseQuery.isError,
    error: supabaseQuery.error,
  };
}
