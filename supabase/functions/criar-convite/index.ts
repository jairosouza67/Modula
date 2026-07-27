// @ts-nocheck
// Edge Function executada no runtime Deno da Supabase.

import { createClient } from "@supabase/supabase-js";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { isValidRole } from "../_shared/roles.ts";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return errorResponse("Configuração do servidor incompleta.", 500);
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return errorResponse("Não autorizado.", 401);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

  if (userError || !user) {
    return errorResponse("Sessão inválida.", 401);
  }

  let body: { email?: unknown; role?: unknown };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Corpo da requisição inválido.");
  }

  const { email, role } = body;
  if (typeof email !== "string" || !email.includes("@")) {
    return errorResponse("E-mail inválido.");
  }
  if (!isValidRole(role)) {
    return errorResponse("Role inválida.");
  }

  const perfil = await supabase
    .from("perfis_usuario")
    .select("id, empresa_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (perfil.error || !perfil.data) {
    return errorResponse("Perfil não encontrado.", 403);
  }

  if (!["superadmin", "admin"].includes(perfil.data.role)) {
    return errorResponse("Permissão negada.", 403);
  }

  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: convite, error: insertError } = await supabase
    .from("convites")
    .insert({
      email: email.toLowerCase().trim(),
      role,
      token,
      empresa_id: perfil.data.empresa_id,
      convidado_por: perfil.data.id,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, token")
    .single();

  if (insertError) {
    console.error(insertError);
    return errorResponse("Erro ao criar convite.", 500);
  }

  const origin = req.headers.get("origin") ?? Deno.env.get("SITE_URL") ?? "";
  const link = origin ? `${origin}/login?token=${token}` : `?token=${token}`;

  return jsonResponse({
    id: convite.id,
    token: convite.token,
    link,
    expires_at: expiresAt.toISOString(),
  });
});
