import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FOCUS_NFE_BASE = "https://api.focusnfe.com.br/v2"; // Produção

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Não autorizado." }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return jsonResponse({ error: "Não autorizado." }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const { nfe_saida_id, justificativa } = body;

  if (!nfe_saida_id) {
    return jsonResponse({ error: "nfe_saida_id é obrigatório" }, 400);
  }

  if (!justificativa || justificativa.length < 15) {
    return jsonResponse({ error: "Justificativa deve ter no mínimo 15 caracteres" }, 400);
  }

  // 1. Busca dados da NF-e
  const { data: nfe, error: nfeErr } = await supabase
    .from("nfe_saida")
    .select("*, ordens_servico(numero)")
    .eq("id", nfe_saida_id)
    .single();

  if (nfeErr || !nfe) {
    return jsonResponse({ error: "NF-e não encontrada" }, 404);
  }

  if (!nfe.focus_nfe_ref) {
    return jsonResponse({ error: "NF-e não possui referência na Focus NFe" }, 400);
  }

  // 2. Busca token Focus NFe e ambiente
  const { data: tokenSecret } = await supabase
    .from("empresa_secrets")
    .select("valor")
    .eq("empresa_id", nfe.empresa_id)
    .eq("chave", "focus_nfe_token")
    .single();

  const { data: ambienteSecret } = await supabase
    .from("empresa_secrets")
    .select("valor")
    .eq("empresa_id", nfe.empresa_id)
    .eq("chave", "focus_nfe_ambiente")
    .single();

  if (!tokenSecret?.valor) {
    return jsonResponse({ error: "Token Focus NFe não configurado" }, 400);
  }

  const focusToken = tokenSecret.valor;
  const ambiente = ambienteSecret?.valor || "homologacao";
  const focusBase =
    ambiente === "homologacao" ? "https://homologacao.focusnfe.com.br/v2" : FOCUS_NFE_BASE;

  // 3. Chama Focus NFe para cancelamento
  const encodedJustificativa = encodeURIComponent(justificativa);
  const focusUrl = `${focusBase}/nfe/${nfe.focus_nfe_ref}?justificativa=${encodedJustificativa}`;

  const focusResponse = await fetch(focusUrl, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${btoa(focusToken + ":")}`,
    },
  });

  const focusData = await focusResponse.json().catch(() => ({}));

  if (!focusResponse.ok && focusResponse.status !== 200) {
    console.error("[cancelar-nfe] Erro Focus NFe:", {
      status: focusResponse.status,
      statusText: focusResponse.statusText,
    });
    return jsonResponse({ error: "Erro ao cancelar na Focus NFe" }, 500);
  }

  // 4. Atualiza nfe_saida com status CANCELADA
  const { error: updateError } = await supabase
    .from("nfe_saida")
    .update({
      status: "CANCELADA",
      xml_cancelamento: focusData?.xml,
      motivo_rejeicao: null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", nfe_saida_id);

  if (updateError) {
    console.error("[cancelar-nfe] Erro ao atualizar:", updateError);
    return jsonResponse({ error: "DB error" }, 500);
  }

  return jsonResponse({ success: true, status: "CANCELADA" });
});
