import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { userFriendlyError } from "@/lib/errors/sanitize";
import { sanitizeTextFields } from "@/lib/validation/inputSanitizer";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { toast } from "sonner";

export interface NfeSaida {
  id: string;
  empresa_id: string;
  os_id: string;
  numero: string;
  serie: string;
  chave_acesso?: string;
  valor_total: number;
  valor_impostos: number;
  status: "EMITIDA" | "CANCELADA" | "EM_PROCESSAMENTO" | "DENEGADA";
  cliente_nome?: string;
  cliente_documento?: string;
  cliente_email?: string;
  itens: any;
  descricao_itens?: string;
  email_enviado?: boolean;
  email_enviado_em?: string;
  focus_nfe_ref?: string;
  protocolo_autorizacao?: string;
  danfe_url?: string;
  motivo_rejeicao?: string;
  data_autorizacao?: string;
  forma_pagamento?: string;
  modalidade_frete?: string;
  criado_em: string;
  ordens_servico?: {
    numero: string;
  };
}

export interface ObrigacaoFiscal {
  id: string;
  tipo: string;
  competencia: string;
  data_vencimento: string;
  valor: number;
  status: "PENDENTE" | "PAGO" | "ATRASADO";
  data_pagamento?: string;
  criado_em: string;
}

export function useNfes() {
  const empresaId = getDefaultEmpresaId();
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["nfes", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nfe_saida")
        .select("*, ordens_servico(numero)")
        .eq("empresa_id", empresaId)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      return data as NfeSaida[];
    },
    enabled: !!empresaId,
  });
}

export function useObrigacoes() {
  const empresaId = getDefaultEmpresaId();
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["obrigacoes_fiscais", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obrigacoes_fiscais")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("data_vencimento", { ascending: true });

      if (error) throw error;
      return data as ObrigacaoFiscal[];
    },
    enabled: !!empresaId,
  });
}

export function useOSDisponiveisNfe() {
  const empresaId = getDefaultEmpresaId();
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["os_disponiveis_nfe", empresaId],
    queryFn: async () => {
      // 1. Busca OSs que já têm NF-e emitida
      const { data: nfeExistentes, error: nfeError } = await supabase
        .from("nfe_saida")
        .select("os_id")
        .eq("empresa_id", empresaId);

      if (nfeError) {
        console.warn("[useOSDisponiveisNfe] Erro ao buscar NF-e existentes:", nfeError.message);
      }

      const osIdsComNfe = nfeExistentes?.map((n) => n.os_id) || [];

      // 2. Busca OSs concluídas (ou instaladas) sem soft-delete
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("*, clientes(nome, documento)")
        .eq("empresa_id", empresaId)
        .is("deleted_at", null)
        .in("status", ["Concluido", "Instalacao"]);

      if (error) throw error;

      // 3. Filtra as que já têm NF-e
      const osDisponiveis = (data || []).filter((os) => !osIdsComNfe.includes(os.id));

      return osDisponiveis;
    },
    enabled: !!empresaId,
  });
}

export function useEmitirNfe() {
  const queryClient = useQueryClient();
  const empresaId = getDefaultEmpresaId();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (dados: {
      os_id: string;
      cliente_nome: string;
      cliente_documento: string;
      cliente_email?: string;
      valor_total: number;
      valor_impostos: number;
      itens: any;
      descricao_itens?: string;
      forma_pagamento?: string;
      modalidade_frete?: string;
    }) => {
      // 1. Cria registro EM_PROCESSAMENTO no banco
      const { data: nfeRecord, error: insertErr } = await supabase
        .from("nfe_saida")
        .insert({
          empresa_id: empresaId,
          os_id: dados.os_id,
          numero: "0", // Será atualizado pelo webhook
          serie: "1",
          status: "EM_PROCESSAMENTO",
          valor_total: dados.valor_total,
          valor_impostos: dados.valor_impostos,
          cliente_nome: dados.cliente_nome,
          cliente_documento: dados.cliente_documento,
          cliente_email: dados.cliente_email,
          itens: dados.itens,
          descricao_itens: dados.descricao_itens,
          forma_pagamento: dados.forma_pagamento || "dinheiro",
          modalidade_frete: dados.modalidade_frete || "9",
        })
        .select()
        .single();

      if (insertErr || !nfeRecord) throw insertErr;

      // 2. Chama Edge Function para transmitir à SEFAZ via Focus NFe
      // NOTA: A Edge Function sempre retorna HTTP 200; erros vêm via { success: false, error: "..." }
      const { data: fnResult, error: fnError } = await supabase.functions.invoke("emitir-nfe", {
        body: {
          nfe_saida_id: nfeRecord.id,
          empresa_id: empresaId,
        },
      });

      // Em caso de erro de rede/timeout, fnError existe e fnResult é null
      if (fnError && !fnResult) {
        await supabase
          .from("nfe_saida")
          .delete()
          .eq("id", nfeRecord.id)
          .eq("status", "EM_PROCESSAMENTO")
          .is("focus_nfe_ref", null);
        throw new Error("Erro de conexão ao emitir NF-e. Tente novamente.");
      }

      // Edge Function retornou 200 mas com erro de negócio
      if (fnResult && fnResult.success === false) {
        const msg = fnResult.error || fnResult.details || "Erro ao emitir NF-e";
        await supabase
          .from("nfe_saida")
          .delete()
          .eq("id", nfeRecord.id)
          .eq("status", "EM_PROCESSAMENTO")
          .is("focus_nfe_ref", null);
        throw new Error(msg);
      }
      return { ...nfeRecord, ...fnResult };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfes"] });
      queryClient.invalidateQueries({ queryKey: ["os_disponiveis_nfe"] });
      toast.success("NF-e enviada à SEFAZ!", {
        description: "Aguardando autorização... Status será atualizado automaticamente.",
      });
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao emitir NF-e", error));
    },
  });
}

export function useNfeRealtime() {
  const queryClient = useQueryClient();
  const empresaId = getDefaultEmpresaId();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!empresaId) return;

    const channel = supabase
      .channel("nfe-saida-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "nfe_saida",
          filter: `empresa_id=eq.${empresaId}`,
        },
        (payload) => {
          const novo = payload.new as NfeSaida;
          const anterior = payload.old as NfeSaida;

          if (anterior?.status !== novo?.status) {
            queryClient.invalidateQueries({ queryKey: ["nfes"] });
            queryClient.invalidateQueries({ queryKey: ["os_disponiveis_nfe"] });

            if (novo.status === "EMITIDA") {
              toast.success(`NF-e #${novo.numero} autorizada pela SEFAZ!`);
            } else if (novo.status === "DENEGADA") {
              toast.error(`NF-e rejeitada: ${novo.motivo_rejeicao || "motivo não informado"}`);
            } else if (novo.status === "CANCELADA") {
              toast.info(`NF-e #${novo.numero} cancelada.`);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [empresaId, queryClient, supabase]);
}

export function useRegistrarObrigacao() {
  const queryClient = useQueryClient();
  const empresaId = getDefaultEmpresaId();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (dados: {
      tipo: string;
      competencia: string;
      data_vencimento: string;
      valor: number;
    }) => {
      sanitizeTextFields(dados as unknown as Record<string, unknown>, ["tipo", "competencia"]);

      const { data, error } = await supabase
        .from("obrigacoes_fiscais")
        .insert({
          empresa_id: empresaId,
          status: "PENDENTE",
          ...dados,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obrigacoes_fiscais"] });
      toast.success("Obrigação registrada!");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao registrar obrigação", error));
    },
  });
}

export function usePagarObrigacao() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("obrigacoes_fiscais")
        .update({
          status: "PAGO",
          data_pagamento: new Date().toISOString().split("T")[0],
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obrigacoes_fiscais"] });
      toast.success("Obrigação marcada como paga!");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao atualizar status", error));
    },
  });
}

export function useCancelarNfe() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async ({ id, justificativa }: { id: string; justificativa: string }) => {
      // Chama Edge Function para cancelar na Focus NFe (ela já atualiza o banco)
      const { data: fnResult, error: fnError } = await supabase.functions.invoke("cancelar-nfe", {
        body: {
          nfe_saida_id: id,
          justificativa,
        },
      });

      if (fnError) throw fnError;
      return fnResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfes"] });
      queryClient.invalidateQueries({ queryKey: ["os_disponiveis_nfe"] });
      toast.success("NF-e cancelada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao cancelar NF-e", error));
    },
  });
}

export function useExcluirNfe() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nfe_saida").delete().eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfes"] });
      queryClient.invalidateQueries({ queryKey: ["os_disponiveis_nfe"] });
      toast.success("NF-e excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao excluir NF-e", error));
    },
  });
}

export function useEditarObrigacao() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (dados: {
      id: string;
      tipo: string;
      competencia: string;
      data_vencimento: string;
      valor: number;
    }) => {
      sanitizeTextFields(dados as unknown as Record<string, unknown>, ["tipo", "competencia"]);

      const { id, ...updateData } = dados;
      const { data, error } = await supabase
        .from("obrigacoes_fiscais")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obrigacoes_fiscais"] });
      toast.success("Obrigação atualizada!");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao atualizar obrigação", error));
    },
  });
}

export function useExcluirObrigacao() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("obrigacoes_fiscais").delete().eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obrigacoes_fiscais"] });
      toast.success("Obrigação excluída!");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao excluir obrigação", error));
    },
  });
}

export function useEnviarNfeEmail() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async ({ nfeId, email }: { nfeId: string; email?: string }) => {
      // Envia e-mail real via Edge Function (Resend)
      const { data: fnResult, error: fnError } = await supabase.functions.invoke(
        "enviar-nfe-email",
        {
          body: { nfe_saida_id: nfeId, email },
        },
      );

      if (fnError) {
        const msg = fnResult?.error || fnResult?.details || fnError.message || "Erro desconhecido";
        throw new Error(msg);
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfes"] });
      toast.success("E-mail enviado!", {
        description: "A NF-e foi enviada para o cliente com sucesso.",
      });
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Falha ao enviar e-mail", error));
    },
  });
}
