import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { sanitizeTextFields } from "@/lib/validation/inputSanitizer";
import { Database } from "@/lib/supabase/types";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";

type OS = Database["public"]["Tables"]["ordens_servico"]["Row"];
type OSUpdate = Database["public"]["Tables"]["ordens_servico"]["Update"];

type InstalacaoOS = OS & {
  endereco_instalacao?: string | null;
  hora_previsao?: string | null;
  status_instalacao?: string | null;
  cliente?: { nome: string; endereco?: string | null } | null;
  tecnico?: { id: string; nome: string } | null;
};

export function useAgenda(date: Date = new Date(), viewMode: "semana" | "mes" = "semana") {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  // Se for mês, o calendário precisa preencher os dias antes e depois para completar a grade de semanas
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const start =
    viewMode === "semana"
      ? startOfWeek(date, { weekStartsOn: 1 })
      : startOfWeek(monthStart, { weekStartsOn: 1 });

  const end =
    viewMode === "semana"
      ? endOfWeek(date, { weekStartsOn: 1 })
      : endOfWeek(monthEnd, { weekStartsOn: 1 });

  return useQuery({
    queryKey: ["agenda", empresaId, viewMode, format(start, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(
          `
          *,
          cliente:clientes(nome, endereco),
          tecnico:colaboradores!ordens_servico_tecnico_id_fkey(id, nome)
        `,
        )
        .eq("empresa_id", empresaId)
        .is("deleted_at", null)
        .gte("data_previsao", format(start, "yyyy-MM-dd"))
        .lte("data_previsao", format(end, "yyyy-MM-dd"))
        .order("data_previsao", { ascending: true });

      if (error) throw error;

      const rows = (data || []) as InstalacaoOS[];

      // Group by day
      const days = eachDayOfInterval({ start, end });
      const agenda = days.map((day) => {
        const itens = rows
          .filter((os) => {
            if (!os.data_previsao) return false;
            // Parse yyyy-MM-dd as local date to prevent timezone shift backwards
            const [yStr, mStr, dStr] = os.data_previsao.split("-");
            const localDate = new Date(parseInt(yStr), parseInt(mStr) - 1, parseInt(dStr));
            return isSameDay(localDate, day);
          })
          .map((os) => ({
            id: os.id,
            os: os.numero,
            cliente: os.cliente?.nome || "Cliente não identificado",
            endereco: os.endereco_instalacao || os.cliente?.endereco || "Endereço não informado",
            endereco_instalacao: os.endereco_instalacao || "",
            tecnico_id: os.tecnico?.id || null,
            inst: os.tecnico?.nome || "Não atribuído",
            status: os.status,
            hora_previsao: os.hora_previsao,
            status_instalacao: os.status_instalacao || "Agendado",
          }));

        return {
          dia: format(day, "EEE dd", { locale: ptBR }),
          diaNumero: format(day, "d"),
          isCurrentMonth: day >= monthStart && day <= monthEnd,
          isToday: isToday(day),
          fullDate: day,
          itens,
        };
      });

      return agenda;
    },
    enabled: !!empresaId,
  });
}

export function useInstaladoresStats() {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  return useQuery({
    queryKey: ["instaladores-stats", empresaId],
    queryFn: async () => {
      // Fetch all technicians from colaboradores
      const { data: tecnicos, error: errT } = await supabase
        .from("colaboradores")
        .select("id, nome")
        .eq("empresa_id", empresaId)
        .eq("status", "Ativo");

      if (errT) throw errT;

      // Fetch OS stats for these technicians
      const { data: stats, error: errS } = await supabase
        .from("ordens_servico")
        .select("id, tecnico_id, status, created_at, status_instalacao")
        .eq("empresa_id", empresaId)
        .is("deleted_at", null)
        .in(
          "tecnico_id",
          tecnicos.map((t) => t.id),
        );

      if (errS) throw errS;

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      return tecnicos.map((t) => {
        const tecnicoOS = stats.filter((os) => os.tecnico_id === t.id);
        const instalacoesMes = tecnicoOS.filter(
          (os) =>
            (os.status_instalacao === "Concluido" || os.status === "Concluido") &&
            new Date(os.created_at) >= firstDayOfMonth,
        ).length;
        const pendentes = tecnicoOS.filter(
          (os) => os.status_instalacao !== "Concluido" && os.status !== "Concluido",
        ).length;
        // Mocking variant and status for UI consistency with existing mock
        // In a real app, we might have a "status" field in perfis_usuario or check active OS
        const isEmCampo = tecnicoOS.some(
          (os) => os.status === "Instalacao" || os.status_instalacao === "Em Rota",
        );

        return {
          id: t.id,
          nome: t.nome,
          status: isEmCampo ? "Em campo" : "Livre",
          variant: (isEmCampo ? "info" : "success") as
            | "info"
            | "success"
            | "warning"
            | "danger"
            | "neutral",
          instalacoes: instalacoesMes,
          pendentes: pendentes,
        };
      });
    },
    enabled: !!empresaId,
  });
}

export function useUpdateInstalacao() {
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  return {
    mutateAsync: async (params: {
      id: string;
      tecnico_id: string | null;
      data_previsao?: string | null;
      hora_previsao: string | null;
      status_instalacao: string | null;
      endereco_instalacao?: string | null;
    }) => {
      sanitizeTextFields(params as unknown as Record<string, unknown>, [
        "endereco_instalacao",
        "status_instalacao",
        "hora_previsao",
      ]);

      const updateData: OSUpdate = {
        tecnico_id: params.tecnico_id,
        hora_previsao: params.hora_previsao,
        status_instalacao: params.status_instalacao as OSUpdate["status_instalacao"],
      };

      if (params.data_previsao !== undefined) {
        updateData.data_previsao = params.data_previsao;
      }

      if (params.endereco_instalacao !== undefined) {
        updateData.endereco_instalacao = params.endereco_instalacao;
      }

      const { data, error } = await supabase
        .from("ordens_servico")
        .update(updateData)
        .eq("id", params.id)
        .eq("empresa_id", empresaId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  };
}
