import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FOCUS_NFE_BASE = "https://api.focusnfe.com.br/v2";

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

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse({ error: "Não autorizado." }, 401);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({
        success: false,
        error: "Corpo da requisição inválido (JSON esperado)",
      });
    }

    const { nfe_saida_id, empresa_id } = body;

    if (!nfe_saida_id || !empresa_id) {
      return jsonResponse({ success: false, error: "nfe_saida_id e empresa_id são obrigatórios" });
    }

    // 1. Busca dados da NF-e + OS + cliente
    const { data: nfe, error: nfeErr } = await supabase
      .from("nfe_saida")
      .select(
        `
      *,
      ordens_servico (
        numero, itens,
        clientes (*)
      )
    `,
      )
      .eq("id", nfe_saida_id)
      .single();

    if (nfeErr || !nfe) {
      return jsonResponse({
        success: false,
        error: "NF-e não encontrada",
        details: nfeErr?.message,
      });
    }

    // 2. Busca dados da empresa
    const { data: empresa } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", empresa_id)
      .single();

    if (!empresa) {
      return jsonResponse(
        {
          success: false,
          error: "Dados da empresa não encontrados. Configure a empresa antes de emitir NF-e.",
        },
        400,
      );
    }

    if (!empresa.cnpj || !empresa.inscricao_estadual) {
      return jsonResponse(
        {
          success: false,
          error: "CNPJ e Inscrição Estadual da empresa são obrigatórios para emissão de NF-e.",
        },
        400,
      );
    }

    // 3. Busca token Focus NFe e ambiente
    const { data: tokenSecret } = await supabase
      .from("empresa_secrets")
      .select("valor")
      .eq("empresa_id", empresa_id)
      .eq("chave", "focus_nfe_token")
      .single();

    const { data: ambienteSecret } = await supabase
      .from("empresa_secrets")
      .select("valor")
      .eq("empresa_id", empresa_id)
      .eq("chave", "focus_nfe_ambiente")
      .single();

    if (!tokenSecret?.valor) {
      return jsonResponse({
        success: false,
        error: "Token Focus NFe não configurado. Vá em Configurações > Fiscal para configurar.",
      });
    }

    const focusToken = tokenSecret.valor;
    const ambiente = ambienteSecret?.valor || "homologacao";
    const focusBase =
      ambiente === "homologacao" ? "https://homologacao.focusnfe.com.br/v2" : FOCUS_NFE_BASE;

    const focusRef = uuidv4(); // Referência única da nota na Focus NFe

    // 4. Monta itens da NF-e a partir dos itens da OS
    const os = nfe.ordens_servico as any;
    const cliente = os?.clientes as any;
    const itensOS = Array.isArray(os?.itens) ? os.itens : [];

    const itensFocus = itensOS.map((item: any, idx: number) => {
      const valorUnitario = item.valorTotal || item.precoUnitario || item.valor || 0;
      const quantidade = item.quantidade || 1;
      return {
        numero_item: idx + 1,
        codigo_produto: item.produtoCodigo || item.codigo || `ITEM-${idx + 1}`,
        descricao: item.descricao || item.nomeServico || `Produto ${idx + 1}`,
        codigo_ncm: item.ncm || "70051000", // Vidro Float como padrão
        cfop: item.cfop || "5102",
        unidade_comercial: item.unidade || "UN",
        quantidade_comercial: quantidade,
        valor_unitario_comercial: Number(valorUnitario.toFixed(2)),
        valor_bruto: Number((valorUnitario * quantidade).toFixed(2)),
        origem_mercadoria: item.origem ?? 0,
        // Simples Nacional sem crédito de ICMS
        situacao_tributaria: "400",
        icms_csosn: "400",
        // PIS/COFINS não tributados (Simples)
        pis_situacao_tributaria: "07",
        cofins_situacao_tributaria: "07",
      };
    });

    // Fallback se não há itens: usa valor total
    if (itensFocus.length === 0) {
      itensFocus.push({
        numero_item: 1,
        codigo_produto: "SERVICO-001",
        descricao: nfe.descricao_itens || "Serviços de vidraçaria",
        codigo_ncm: "70051000",
        cfop: "5102",
        unidade_comercial: "UN",
        quantidade_comercial: 1,
        valor_unitario_comercial: Number(nfe.valor_total.toFixed(2)),
        valor_bruto: Number(nfe.valor_total.toFixed(2)),
        origem_mercadoria: 0,
        situacao_tributaria: "400",
        icms_csosn: "400",
        pis_situacao_tributaria: "07",
        cofins_situacao_tributaria: "07",
      });
    }

    // Endereço do destinatário
    const docCliente = String(cliente?.documento || "").replace(/\D/g, "");
    const isCpf = docCliente.length === 11;

    const payload: any = {
      natureza_operacao: "Venda de mercadoria",
      forma_pagamento: mapFormaPagamento(nfe.forma_pagamento),
      tipo_documento: 1,
      local_destino: 1,
      data_emissao: new Date().toISOString(),
      tipo_operacao: 1,
      finalidade_emissao: 1,
      consumidor_final: 1,
      presenca_comprador: 1,
      modalidade_frete: nfe.modalidade_frete || "9",

      emitente: {
        cnpj: String(empresa.cnpj || "").replace(/\D/g, ""),
        nome: empresa.razao_social || empresa.nome_fantasia || "",
        nome_fantasia: empresa.nome_fantasia || "",
        logradouro: empresa.logradouro || "",
        numero: empresa.numero_endereco || "",
        complemento: empresa.complemento || "",
        bairro: empresa.bairro || "",
        municipio: empresa.cidade || "",
        uf: empresa.uf || "",
        cep: String(empresa.cep || "").replace(/\D/g, ""),
        codigo_municipio: empresa.codigo_municipio || 0,
        telefone: String(empresa.telefone || "")
          .replace(/\D/g, "")
          .slice(0, 11),
        regime_tributario: empresa.crt || 1,
        inscricao_estadual: empresa.inscricao_estadual || "",
      },

      destinatario: {
        // CPF/CNPJ do cliente — campo obrigatório
        ...(isCpf ? { cpf: docCliente } : { cnpj: docCliente || "" }),
        nome: nfe.cliente_nome || cliente?.nome || "Consumidor Final",
        email: nfe.cliente_email || cliente?.email || undefined,
        indicador_inscricao_estadual: cliente?.inscricao_estadual ? 1 : 9,
        ...(cliente?.inscricao_estadual && { inscricao_estadual: cliente.inscricao_estadual }),
        // Endereço do destinatário (obrigatório para NF-e)
        logradouro: cliente?.logradouro || cliente?.endereco || "Não Informado",
        numero: cliente?.numero_endereco || "S/N",
        complemento: cliente?.complemento || undefined,
        bairro: cliente?.bairro || "Não Informado",
        municipio: cliente?.cidade || "Não Informado",
        uf: cliente?.uf || "",
        cep: String(cliente?.cep || "").replace(/\D/g, ""),
        codigo_municipio: cliente?.codigo_municipio || 0,
      },

      items: itensFocus,

      formas_pagamento: [
        {
          forma_pagamento: mapFormaPagamento(nfe.forma_pagamento),
          valor_pagamento: Number(nfe.valor_total.toFixed(2)),
        },
      ],

      informacoes_adicionais_contribuinte: `OS: ${os?.numero || "N/A"} | Simples Nacional`,
    };

    // 6. Envia para Focus NFe
    const focusUrl = `${focusBase}/nfe?ref=${focusRef}`;
    const focusResponse = await fetch(focusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(focusToken + ":")}`,
      },
      body: JSON.stringify(payload),
    });

    const focusText = await focusResponse.text().catch(() => "");
    let focusData: any = {};
    try {
      focusData = JSON.parse(focusText);
    } catch {
      focusData = { raw: focusText };
    }

    if (!focusResponse.ok && focusResponse.status !== 202) {
      const motivo =
        focusData?.mensagem ||
        focusData?.erro ||
        focusData?.error ||
        focusData?.raw ||
        `Erro HTTP ${focusResponse.status}`;
      await supabase
        .from("nfe_saida")
        .update({ status: "DENEGADA", motivo_rejeicao: String(motivo).slice(0, 500) })
        .eq("id", nfe_saida_id);

      console.error("[emitir-nfe] Erro Focus NFe:", {
        status: focusResponse.status,
        statusText: focusResponse.statusText,
      });

      return jsonResponse({ success: false, error: String(motivo) });
    }

    // 7. Atualiza nfe_saida com referência e status EM_PROCESSAMENTO
    await supabase
      .from("nfe_saida")
      .update({
        focus_nfe_ref: focusRef,
        status: "EM_PROCESSAMENTO",
        motivo_rejeicao: null,
      })
      .eq("id", nfe_saida_id);

    return jsonResponse({ success: true, ref: focusRef, status: "EM_PROCESSAMENTO" });
  } catch (err: any) {
    return jsonResponse({
      success: false,
      error: "Erro interno ao processar NF-e",
      details: err?.message || String(err),
    });
  }
});

function mapFormaPagamento(forma?: string): string {
  const map: Record<string, string> = {
    dinheiro: "01",
    pix: "17",
    cartao_debito: "04",
    cartao_credito: "03",
    boleto: "15",
    transferencia: "18",
  };
  return map[forma || "dinheiro"] || "01";
}
