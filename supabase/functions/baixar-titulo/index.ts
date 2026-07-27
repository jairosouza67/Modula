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

  // Apenas superadmin, admin, gestor ou financeiro podem fazer baixa financeira
  const allowedRoles = ["superadmin", "admin", "gestor", "financeiro"];
  if (!allowedRoles.includes(perfilChamador.role)) {
    return errorResponse("Permissão negada para efetuar baixa de títulos.", 403);
  }

  // Ler e validar corpo da requisição
  let body: {
    tituloId?: unknown;
    contaId?: unknown;
    dataPagamento?: unknown;
    valorPago?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Corpo da requisição inválido.");
  }

  const { tituloId, contaId, dataPagamento, valorPago } = body;

  if (typeof tituloId !== "string" || !tituloId) {
    return errorResponse("ID do título é obrigatório.");
  }
  if (typeof contaId !== "string" || !contaId) {
    return errorResponse("ID da conta é obrigatório.");
  }
  if (typeof dataPagamento !== "string" || !dataPagamento) {
    return errorResponse("Data de pagamento é obrigatória.");
  }
  if (typeof valorPago !== "number" || valorPago <= 0) {
    return errorResponse("Valor pago é obrigatório e deve ser maior que zero.");
  }

  // Busca o título
  const { data: titulo, error: erroTitulo } = await supabase
    .from("contas_pagar_receber")
    .select("*")
    .eq("id", tituloId)
    .maybeSingle();

  if (erroTitulo || !titulo) {
    return errorResponse("Título não encontrado.", 404);
  }

  // Verifica empresa (se não for superadmin)
  if (perfilChamador.role !== "superadmin" && titulo.empresa_id !== perfilChamador.empresa_id) {
    return errorResponse("Permissão negada. O título pertence a outra empresa.", 403);
  }

  if (titulo.status === "PAGO") {
    return errorResponse("Este título já foi pago/baixado.", 400);
  }

  // Executa o fluxo de baixa em sequência
  try {
    // 1. Cria o lançamento correspondente
    const tipo = titulo.fornecedor_id ? "SAIDA" : "ENTRADA";
    const descricao = `Baixa de ${titulo.observacoes || (titulo.fornecedor_id ? "Despesa" : "Receita")}`;

    const { data: lancamento, error: erroLancamento } = await supabase
      .from("lancamentos")
      .insert({
        empresa_id: titulo.empresa_id,
        conta_id: contaId,
        categoria_id: titulo.categoria_id,
        data_pagamento: dataPagamento,
        valor: valorPago,
        tipo,
        descricao,
        documento_ref: titulo.id,
      })
      .select()
      .single();

    if (erroLancamento || !lancamento) {
      throw erroLancamento || new Error("Erro ao criar lançamento de baixa.");
    }

    // 2. Atualiza o status do título
    const { error: erroUpdate } = await supabase
      .from("contas_pagar_receber")
      .update({
        status: "PAGO",
        valor_pago: valorPago,
        lancamento_id: lancamento.id,
      })
      .eq("id", titulo.id);

    if (erroUpdate) {
      // Como não temos transação distribuída nativa no Deno de forma simples aqui,
      // se a atualização falhar, tentamos remover o lançamento criado para evitar inconsistência.
      await supabase.from("lancamentos").delete().eq("id", lancamento.id);
      throw erroUpdate;
    }

    return jsonResponse({
      success: true,
      lancamentoId: lancamento.id,
      message: "Baixa realizada com sucesso.",
    });
  } catch (err) {
    console.error("Erro ao realizar baixa do título:", err);
    return errorResponse("Erro interno ao processar a baixa do título.", 500);
  }
});
