// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";

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

  // Ler o corpo da requisição
  let body: { table?: unknown; id?: unknown };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Corpo da requisição inválido.");
  }

  const { table, id } = body;
  if (typeof table !== "string" || !table) {
    return errorResponse("O nome da tabela é obrigatório.");
  }
  if (typeof id !== "string" || !id) {
    return errorResponse("O ID do registro é obrigatório.");
  }

  // Tabelas permitidas e papéis autorizados para cada uma
  const tablePermissions: Record<string, string[]> = {
    clientes: ["superadmin", "admin", "gestor", "vendedor"],
    colaboradores: ["superadmin", "admin"],
    nfe_saida: ["superadmin", "admin", "gestor", "financeiro"],
    obrigacoes_fiscais: ["superadmin", "admin", "gestor", "financeiro"],
    pedidos_compra: ["superadmin", "admin", "gestor", "financeiro"],
    servicos_compostos: ["superadmin", "admin", "gestor"],
  };

  if (!tablePermissions[table]) {
    return errorResponse(`Operação de exclusão não permitida para a tabela '${table}'.`, 400);
  }

  const allowedRoles = tablePermissions[table];
  const isSuperadmin = perfilChamador.role === "superadmin";

  if (!isSuperadmin && !allowedRoles.includes(perfilChamador.role)) {
    return errorResponse("Permissão negada para excluir registros nesta tabela.", 403);
  }

  // Busca o registro para garantir que pertence à mesma empresa (se não for superadmin)
  if (!isSuperadmin) {
    const { data: registro, error: erroRegistro } = await supabase
      .from(table)
      .select("empresa_id")
      .eq("id", id)
      .maybeSingle();

    if (erroRegistro || !registro) {
      return errorResponse("Registro não encontrado ou já excluído.", 404);
    }

    if (registro.empresa_id !== perfilChamador.empresa_id) {
      return errorResponse("Permissão negada. O registro pertence a outra empresa.", 403);
    }
  }

  // Executa a exclusão de acordo com as regras da tabela
  try {
    if (table === "clientes") {
      // Soft delete para clientes
      const { error } = await supabase
        .from("clientes")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    } else if (table === "colaboradores") {
      // Soft delete / Inativação para colaboradores
      const { error } = await supabase
        .from("colaboradores")
        .update({ status: "Inativo", data_demissao: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    } else if (table === "servicos_compostos") {
      // Primeiro deleta componentes
      const { error: erroComp } = await supabase
        .from("servico_componentes")
        .delete()
        .eq("servico_id", id);
      if (erroComp) throw erroComp;

      // Depois deleta o kit
      const { error: erroKit } = await supabase.from("servicos_compostos").delete().eq("id", id);
      if (erroKit) throw erroKit;
    } else {
      // Hard delete para os demais
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    }
  } catch (err) {
    console.error(`Erro ao deletar registro de ${table}:`, err);
    return errorResponse(`Erro interno ao processar a exclusão na tabela ${table}.`, 500);
  }

  return jsonResponse({
    success: true,
    message: "Registro excluído com sucesso.",
  });
});
