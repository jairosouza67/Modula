// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Edge Function pública para validação de convite (não requer autenticação).

import { createClient } from "@supabase/supabase-js";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Método não permitido.", 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return errorResponse("Configuração do servidor incompleta.", 500);
  }

  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Corpo da requisição inválido.");
  }

  const { token } = body;
  if (typeof token !== "string" || token.trim().length === 0) {
    return errorResponse("Token do convite inválido.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: convite, error } = await supabase
    .from("convites")
    .select("email, role, empresa_id, expires_at, usado_em")
    .eq("token", token.trim())
    .maybeSingle();

  if (error) {
    console.error(error);
    return errorResponse("Erro ao validar convite.", 500);
  }

  if (!convite) {
    return errorResponse("Convite inválido.", 404);
  }

  if (convite.usado_em) {
    return errorResponse("Convite já utilizado.", 410);
  }

  if (new Date(convite.expires_at) < new Date()) {
    return errorResponse("Convite expirado.", 410);
  }

  return jsonResponse({
    email: convite.email,
    role: convite.role,
    empresa_id: convite.empresa_id,
    expires_at: convite.expires_at,
  });
});
