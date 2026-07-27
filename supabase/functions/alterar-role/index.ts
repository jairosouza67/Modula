// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { isValidRole } from "../_shared/roles.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Método não permitido.", 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse("Não autorizado.", 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return errorResponse("Configuração do servidor incompleta.", 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Valida o token JWT do chamador
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return errorResponse("Não autorizado.", 401);
  }

  // Busca o perfil do chamador
  const { data: perfilChamador, error: erroChamador } = await supabase
    .from("perfis_usuario")
    .select("empresa_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (erroChamador || !perfilChamador) {
    return errorResponse("Perfil do chamador não encontrado.", 403);
  }

  // Verifica permissões do chamador
  const isSuperadmin = perfilChamador.role === "superadmin";
  const isAdmin = perfilChamador.role === "admin";

  if (!isSuperadmin && !isAdmin) {
    return errorResponse("Permissão negada. Apenas administradores podem alterar funções.", 403);
  }

  // Ler o corpo da requisição
  let body: { userId?: unknown; role?: unknown };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Corpo da requisição inválido.");
  }

  const { userId, role } = body;
  if (typeof userId !== "string" || !userId) {
    return errorResponse("ID do usuário de destino é obrigatório.");
  }

  if (typeof role !== "string" || !isValidRole(role)) {
    return errorResponse("Função (role) inválida.");
  }

  // Restrições de segurança
  if (!isSuperadmin) {
    // Admin comum não pode promover ninguém a superadmin
    if (role === "superadmin") {
      return errorResponse("Apenas superadmins podem promover usuários para superadmin.", 403);
    }

    // Admin comum só pode alterar usuários da mesma empresa
    const { data: perfilDestino, error: erroDestino } = await supabase
      .from("perfis_usuario")
      .select("empresa_id, role")
      .eq("user_id", userId)
      .maybeSingle();

    if (erroDestino || !perfilDestino) {
      return errorResponse("Usuário de destino não encontrado.", 404);
    }

    if (perfilDestino.empresa_id !== perfilChamador.empresa_id) {
      return errorResponse("Permissão negada. O usuário não pertence à sua empresa.", 403);
    }

    // Admin comum não pode alterar o cargo de um superadmin
    if (perfilDestino.role === "superadmin") {
      return errorResponse("Não é permitido alterar o cargo de um superadmin.", 403);
    }
  }

  // Executa a atualização
  const { data: perfilAtualizado, error: erroUpdate } = await supabase
    .from("perfis_usuario")
    .update({ role })
    .eq("user_id", userId)
    .select()
    .single();

  if (erroUpdate) {
    console.error("Erro ao atualizar perfil:", erroUpdate);
    return errorResponse("Erro ao atualizar a função do usuário.", 500);
  }

  return jsonResponse({
    success: true,
    perfil: perfilAtualizado,
  });
});
