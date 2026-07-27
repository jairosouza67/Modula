import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const body = await req.json().catch(() => ({}));

  // Focus NFe envia: { ref, status, cnpj_emitente, ... }
  const { ref, status, chave_nfe, numero, protocolo, caminho_danfe, motivo, xml } = body;

  if (!ref) {
    return new Response("Missing ref", { status: 400 });
  }

  // Mapeia status Focus NFe → nosso status
  const statusMap: Record<string, string> = {
    autorizado: "EMITIDA",
    cancelado: "CANCELADA",
    erro_autorizacao: "DENEGADA",
    denegado: "DENEGADA",
    erro: "DENEGADA",
  };

  const novoStatus = statusMap[status] || "DENEGADA";

  const updateData: Record<string, any> = {
    status: novoStatus,
    atualizado_em: new Date().toISOString(),
  };

  if (novoStatus === "EMITIDA") {
    updateData.chave_acesso = chave_nfe;
    updateData.protocolo_autorizacao = protocolo;
    updateData.danfe_url = caminho_danfe;
    updateData.xml_autorizado = xml;
    updateData.data_autorizacao = new Date().toISOString();
    updateData.motivo_rejeicao = null;

    // Número da nota: usa o retornado pela SEFAZ, senão gera sequencial via RPC
    if (numero) {
      updateData.numero = String(numero);
    } else {
      // Fallback: busca empresa_id do registro e gera número sequencial
      const { data: nfeRecord } = await supabase
        .from("nfe_saida")
        .select("empresa_id")
        .eq("focus_nfe_ref", ref)
        .single();

      if (nfeRecord) {
        const { data: nextNum } = await supabase.rpc("get_next_nfe_numero", {
          p_empresa_id: nfeRecord.empresa_id,
        });
        updateData.numero = String(nextNum || 1);
      }
    }
  } else {
    updateData.motivo_rejeicao = motivo || "Nota rejeitada pela SEFAZ";
  }

  const { error } = await supabase
    .from("nfe_saida")
    .update(updateData)
    .eq("focus_nfe_ref", ref);

  if (error) {
    console.error("[webhook-nfe] Erro ao atualizar:", error);
    return new Response("DB error", { status: 500 });
  }

  console.log(`[webhook-nfe] NF-e ref=${ref} → status=${novoStatus}`);
  return new Response("OK", { status: 200 });
});
