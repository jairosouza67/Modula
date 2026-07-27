import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Não autorizado." }, 401);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const jwtToken = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwtToken);

    if (userError || !user) {
      return jsonResponse({ error: "Não autorizado." }, 401);
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ success: false, error: "Corpo da requisição inválido" });
    }

    const { acao, empresa_id, token, ambiente } = body;

    if (!empresa_id) {
      return jsonResponse({ success: false, error: "empresa_id é obrigatório" });
    }

    if (acao === "get") {
      const { data, error: selectErr } = await supabase
        .from("empresa_secrets")
        .select("chave, valor")
        .eq("empresa_id", empresa_id)
        .in("chave", ["focus_nfe_token", "focus_nfe_ambiente"]);

      if (selectErr) {
        return jsonResponse({ success: true, token: "", ambiente: "homologacao" });
      }

      const tokenValue = data?.find((s: any) => s.chave === "focus_nfe_token")?.valor || "";
      const ambienteValue =
        data?.find((s: any) => s.chave === "focus_nfe_ambiente")?.valor || "homologacao";

      return jsonResponse({ success: true, token: tokenValue, ambiente: ambienteValue });
    }

    if (acao === "save") {
      if (typeof token !== "string" || typeof ambiente !== "string") {
        return jsonResponse({ success: false, error: "token e ambiente são obrigatórios" });
      }

      const updates = [
        { empresa_id, chave: "focus_nfe_token", valor: token.trim() },
        { empresa_id, chave: "focus_nfe_ambiente", valor: ambiente.trim() },
      ];

      for (const secret of updates) {
        const { error: upsertErr } = await supabase
          .from("empresa_secrets")
          .upsert(secret, { onConflict: "empresa_id,chave" });

        if (upsertErr) {
          return jsonResponse({
            success: false,
            error: "Erro ao salvar. Verifique se a tabela empresa_secrets existe.",
            details: upsertErr.message,
          });
        }
      }

      return jsonResponse({ success: true });
    }

    return jsonResponse({ success: false, error: "Ação inválida. Use acao: 'get' ou 'save'" });
  } catch (err: any) {
    return jsonResponse({
      success: false,
      error: "Erro interno ao processar configuração fiscal",
      details: err?.message || String(err),
    });
  }
});
