import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { useAuth } from "@/lib/auth/context";
import { userFriendlyError } from "@/lib/errors/sanitize";
import { sanitizeTextFields } from "@/lib/validation/inputSanitizer";
import { Database } from "@/lib/supabase/types";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────

export interface FinanceKpis {
  saldoTotal: number;
  aReceberTotal: number;
  aPagarTotal: number;
  previstoMes: number;
  receitaMes: number;
  despesaMes: number;
  resultadoMes: number;
}

export interface TituloFinanceiro {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: "PENDENTE" | "PAGO" | "CANCELADO" | "ATRASADO";
  tipo: "RECEBER" | "PAGAR";
  contato: string;
  ordem_servico?: string;
  parcela?: string;
}

interface FinancePayload {
  kpis: FinanceKpis;
  recentes: TituloFinanceiro[];
  graficoFluxo: { mes: string; entradas: number; saidas: number }[];
}

export interface CreateTituloPayload {
  descricao: string;
  valor: number;
  vencimento: string;
  tipo: "RECEBER" | "PAGAR";
  cliente_id?: string;
  fornecedor_id?: string;
  ordem_servico_id?: string;
  parcela?: string;
  categoria_id: string;
}

export interface PayTituloPayload {
  id: string;
  valorPago: number;
  dataPagamento: string;
  contaId: string;
}

type ContaPagarReceberComJoins = Database["public"]["Tables"]["contas_pagar_receber"]["Row"] & {
  clientes?: { nome: string } | null;
  fornecedores?: { nome: string } | null;
  ordens_servico?: { numero: string } | null;
};

// ─── Supabase ─────────────────────────────────────────────────────────────

const fetchSupabaseFinanceData = async (): Promise<FinancePayload> => {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  const [contasResult, titulosResult, lancamentosResult] = await Promise.all([
    supabase
      .from("contas_bancarias")
      .select("saldo_atual")
      .eq("empresa_id", empresaId)
      .eq("ativo", true),
    supabase
      .from("contas_pagar_receber")
      .select("*, clientes(nome), fornecedores(nome), ordens_servico(numero)")
      .eq("empresa_id", empresaId)
      .order("data_vencimento", { ascending: true }),
    supabase
      .from("lancamentos")
      .select("valor, tipo, data_pagamento")
      .eq("empresa_id", empresaId)
      .gte("data_pagamento", new Date(new Date().getFullYear(), 0, 1).toISOString()),
  ]);

  if (contasResult.error) throw new Error(contasResult.error.message);
  if (titulosResult.error) throw new Error(titulosResult.error.message);
  if (lancamentosResult.error) throw new Error(lancamentosResult.error.message);

  const saldoTotal = contasResult.data?.reduce((sum, c) => sum + Number(c.saldo_atual), 0) ?? 0;

  const titulos = (titulosResult.data ?? []) as ContaPagarReceberComJoins[];
  const aReceberTotal = titulos
    .filter((t) => !t.fornecedor_id && t.status === "PENDENTE")
    .reduce((sum, t) => sum + Number(t.valor_previsto), 0);
  const aPagarTotal = titulos
    .filter((t) => t.fornecedor_id && t.status === "PENDENTE")
    .reduce((sum, t) => sum + Number(t.valor_previsto), 0);

  const currentMonth = new Date().getMonth();
  const receitaMes =
    lancamentosResult.data
      ?.filter(
        (l) => l.tipo === "ENTRADA" && new Date(l.data_pagamento).getMonth() === currentMonth,
      )
      .reduce((sum, l) => sum + Number(l.valor), 0) ?? 0;

  const despesaMes =
    lancamentosResult.data
      ?.filter((l) => l.tipo === "SAIDA" && new Date(l.data_pagamento).getMonth() === currentMonth)
      .reduce((sum, l) => sum + Number(l.valor), 0) ?? 0;

  const recentes: TituloFinanceiro[] = titulos.map((t) => ({
    id: t.id,
    descricao: t.observacoes || (t.fornecedor_id ? "Pagamento Fornecedor" : "Recebimento Cliente"),
    valor: Number(t.valor_previsto),
    vencimento: t.data_vencimento,
    status: t.status as TituloFinanceiro["status"],
    tipo: t.fornecedor_id ? "PAGAR" : "RECEBER",
    contato: (t.fornecedor_id ? t.fornecedores?.nome : t.clientes?.nome) || "N/A",
    ordem_servico: t.ordens_servico?.numero,
    parcela: t.parcela || undefined,
  }));

  const fluxosByMes: Record<string, { entradas: number; saidas: number }> = {};
  const meses = [
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

  meses.forEach((m) => (fluxosByMes[m] = { entradas: 0, saidas: 0 }));

  lancamentosResult.data?.forEach((l) => {
    const data = new Date(l.data_pagamento);
    const mes = meses[data.getMonth()];
    if (l.tipo === "ENTRADA") fluxosByMes[mes].entradas += Number(l.valor);
    else fluxosByMes[mes].saidas += Number(l.valor);
  });

  const graficoFluxo = meses
    .map((m) => ({
      mes: m,
      entradas: fluxosByMes[m].entradas,
      saidas: fluxosByMes[m].saidas,
    }))
    .filter((f) => f.entradas > 0 || f.saidas > 0);

  return {
    kpis: {
      saldoTotal,
      aReceberTotal,
      aPagarTotal,
      previstoMes: aReceberTotal - aPagarTotal,
      receitaMes,
      despesaMes,
      resultadoMes: receitaMes - despesaMes,
    },
    recentes,
    graficoFluxo,
  };
};

// ─── Hooks ────────────────────────────────────────────────────────────────

export function useFinanceData() {
  const query = useQuery({
    queryKey: ["finance-data"],
    queryFn: fetchSupabaseFinanceData,
    staleTime: 30_000,
  });

  const empty: FinancePayload = {
    kpis: {
      saldoTotal: 0,
      aReceberTotal: 0,
      aPagarTotal: 0,
      previstoMes: 0,
      receitaMes: 0,
      despesaMes: 0,
      resultadoMes: 0,
    },
    recentes: [],
    graficoFluxo: [],
  };

  return {
    ...(query.data ?? empty),
    isLoading: query.isLoading,
    isFallback: false,
  };
}

export function useCreateTitulo() {
  const queryClient = useQueryClient();
  const { provider } = useAuth();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (data: CreateTituloPayload) => {
      sanitizeTextFields(data as unknown as Record<string, unknown>, ["descricao", "parcela"]);

      const empresaId = getDefaultEmpresaId();

      const { error } = await supabase.from("contas_pagar_receber").insert({
        empresa_id: empresaId,
        categoria_id: data.categoria_id,
        valor_previsto: data.valor,
        data_vencimento: data.vencimento,
        cliente_id: data.cliente_id,
        fornecedor_id: data.fornecedor_id,
        ordem_servico_id: data.ordem_servico_id,
        parcela: data.parcela,
        observacoes: data.descricao,
        status: "PENDENTE",
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Lançamento salvo com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["finance-data"] });
    },
    onError: (err) => {
      toast.error(userFriendlyError("Erro ao salvar", err));
    },
  });
}

export function usePayTitulo() {
  const queryClient = useQueryClient();
  const { provider } = useAuth();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (data: PayTituloPayload) => {
      const empresaId = getDefaultEmpresaId();

      // Busca o título para saber o tipo e categoria
      const { data: titulo, error: errTitulo } = await supabase
        .from("contas_pagar_receber")
        .select("*")
        .eq("id", data.id)
        .single();

      if (errTitulo || !titulo) throw new Error(errTitulo?.message || "Título não encontrado");

      // Cria o lançamento
      const { data: lancamento, error: errLancamento } = await supabase
        .from("lancamentos")
        .insert({
          empresa_id: empresaId,
          conta_id: data.contaId,
          categoria_id: titulo.categoria_id,
          data_pagamento: data.dataPagamento,
          valor: data.valorPago,
          tipo: titulo.fornecedor_id ? "SAIDA" : "ENTRADA",
          descricao: `Baixa de ${titulo.observacoes || (titulo.fornecedor_id ? "Despesa" : "Receita")}`,
          documento_ref: titulo.id,
        })
        .select()
        .single();

      if (errLancamento) throw new Error(errLancamento.message);

      // Atualiza o título
      const { error: errUpdate } = await supabase
        .from("contas_pagar_receber")
        .update({
          status: "PAGO",
          valor_pago: data.valorPago,
          lancamento_id: lancamento.id,
        })
        .eq("id", data.id);

      if (errUpdate) throw new Error(errUpdate.message);
    },
    onSuccess: () => {
      toast.success("Baixa realizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["finance-data"] });
    },
    onError: (err) => {
      toast.error(userFriendlyError("Erro ao dar baixa", err));
    },
  });
}
