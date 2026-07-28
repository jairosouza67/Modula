import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "NF-e ModulaAPP <onboarding@resend.dev>";

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

function buildEmailHtml(nfe: any, empresa: any): string {
  const statusColor = nfe.status === "EMITIDA" ? "#16a34a" : "#6D6E71";
  const danfeLink = nfe.danfe_url
    ? `<a href="${nfe.danfe_url}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Baixar DANFE (PDF)</a>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f5;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
    <!-- Header -->
    <div style="background:#18181b;padding:20px 24px;text-align:center;">
      <h1 style="margin:0;font-size:20px;color:#fff;letter-spacing:1px;">Nota Fiscal Eletrônica</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#a1a1aa;">${empresa?.nome_fantasia || empresa?.razao_social || "Empresa"}</p>
    </div>

    <!-- Status -->
    <div style="padding:16px 24px;text-align:center;border-bottom:1px solid #e4e4e7;">
      <span style="display:inline-block;padding:4px 16px;background:${statusColor};color:#fff;border-radius:12px;font-size:12px;font-weight:bold;text-transform:uppercase;">
        ${nfe.status}
      </span>
    </div>

    <!-- Dados da NF-e -->
    <div style="padding:20px 24px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr>
          <td style="padding:6px 0;color:#71717a;">Número:</td>
          <td style="padding:6px 0;text-align:right;font-weight:bold;">#${String(nfe.numero).padStart(9, "0")}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#71717a;">Série:</td>
          <td style="padding:6px 0;text-align:right;">${nfe.serie}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#71717a;">Data de Emissão:</td>
          <td style="padding:6px 0;text-align:right;">${fmtDate(nfe.criado_em)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#71717a;">Valor Total:</td>
          <td style="padding:6px 0;text-align:right;font-weight:bold;font-size:16px;color:#18181b;">${fmtCurrency(nfe.valor_total)}</td>
        </tr>
        ${
          nfe.chave_acesso
            ? `
        <tr>
          <td colspan="2" style="padding:12px 0 6px;color:#71717a;font-size:11px;">Chave de Acesso:</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:4px 8px;background:#f4f4f5;border-radius:4px;font-family:monospace;font-size:11px;letter-spacing:0.5px;word-break:break-all;">${nfe.chave_acesso}</td>
        </tr>`
            : ""
        }
      </table>

      <!-- Emitente -->
      <div style="margin-top:20px;padding:12px;background:#f4f4f5;border-radius:6px;font-size:12px;">
        <p style="margin:0 0 4px;font-weight:bold;color:#18181b;">${empresa?.razao_social || empresa?.nome_fantasia || "—"}</p>
        <p style="margin:0;color:#71717a;">CNPJ: ${empresa?.cnpj || "—"}</p>
        <p style="margin:0;color:#71717a;">${empresa?.endereco || ""} ${empresa?.cidade ? "— " + empresa.cidade : ""}</p>
      </div>

      <!-- DANFE -->
      <div style="text-align:center;">
        ${danfeLink}
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 24px;background:#f4f4f5;text-align:center;font-size:10px;color:#a1a1aa;">
      Este e-mail foi enviado automaticamente pelo ModulaAPP.<br/>
      Em caso de dúvidas, entre em contato com ${empresa?.nome_fantasia || "a empresa"}${empresa?.telefone ? " — Tel: " + empresa.telefone : ""}.
    </div>
  </div>
</body>
</html>`;
}

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

  if (!RESEND_API_KEY) {
    return jsonResponse({ error: "RESEND_API_KEY não configurada no servidor" }, 500);
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
  const { nfe_saida_id, email, test, mensagem } = body;

  if (!email) {
    return jsonResponse({ error: "O e-mail é obrigatório" }, 400);
  }

  if (!test && !nfe_saida_id) {
    return jsonResponse({ error: "nfe_saida_id é obrigatório para envio real de NF-e" }, 400);
  }

  let html: string;
  let subject: string;

  if (test) {
    html = `<p>${mensagem || "Its ok!!"}</p>`;
    subject = "Teste Resend - ModulaAPP";
  } else {
    // 1. Busca dados da NF-e
    const { data: nfe, error: nfeErr } = await supabase
      .from("nfe_saida")
      .select("*")
      .eq("id", nfe_saida_id)
      .single();

    if (nfeErr || !nfe) {
      return jsonResponse({ error: "NF-e não encontrada" }, 404);
    }

    // 2. Busca dados da empresa
    const { data: empresa } = await supabase
      .from("empresas")
      .select("razao_social, nome_fantasia, cnpj, endereco, cidade, telefone")
      .eq("id", nfe.empresa_id)
      .maybeSingle();

    html = buildEmailHtml(nfe, empresa);
    const nomeEmpresa = empresa?.nome_fantasia || empresa?.razao_social || "ModulaAPP";
    subject = `NF-e #${String(nfe.numero).padStart(9, "0")} — ${nomeEmpresa}`;
  }

  // 3. Envia e-mail via Resend
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [email],
      subject: subject,
      html,
    }),
  });

  const resendData = await resendResponse.json().catch(() => ({}));

  if (!resendResponse.ok) {
    console.error("[enviar-nfe-email] Resend error:", resendData);
    return jsonResponse(
      { error: "Falha ao enviar e-mail", details: resendData?.message || resendData },
      500,
    );
  }

  // 4. Atualiza nfe_saida se não for teste
  if (!test && nfe_saida_id) {
    const updateData: Record<string, any> = {
      email_enviado: true,
      email_enviado_em: new Date().toISOString(),
    };
    if (email) {
      updateData.cliente_email = email;
    }

    await supabase.from("nfe_saida").update(updateData).eq("id", nfe_saida_id);
    console.log(`[enviar-nfe-email] E-mail enviado para ${email} (NF-e)`);
  } else {
    console.log(`[enviar-nfe-email] E-mail de teste enviado para ${email}`);
  }

  return jsonResponse({ success: true, resend_id: resendData?.id });
});
