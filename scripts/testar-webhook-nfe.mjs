/**
 * Testa o webhook de NF-e localmente sem depender da Focus NFe.
 *
 * 1. Insere um registro de teste em nfe_saida.
 * 2. Chama a Edge Function webhook-nfe simulando retorno da Focus.
 * 3. Verifica se o status foi atualizado para EMITIDA.
 * 4. Remove o registro de teste.
 *
 * Uso:
 *   node scripts/testar-webhook-nfe.mjs [EMPRESA_ID]
 *
 * Se EMPRESA_ID não for informado, usa a primeira empresa encontrada.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carrega .env se existir
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "..", ".env");
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env opcional
  }
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
  process.exit(1);
}

function rest(path, options = {}) {
  return fetch(`${supabaseUrl}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

async function getEmpresaId() {
  const arg = process.argv[2];
  if (arg) return arg;

  console.log("🔍 Buscando empresa existente...");
  const res = await rest("/empresas?select=id&limit=1");
  if (!res.ok) {
    throw new Error(`Falha ao buscar empresas: ${await res.text()}`);
  }
  const data = await res.json();
  if (!data.length) {
    throw new Error("Nenhuma empresa encontrada. Crie uma empresa ou passe o ID como argumento.");
  }
  const id = data[0].id;
  console.log(`   Usando empresa_id: ${id}`);
  return id;
}

async function getOsId(empresaId) {
  console.log("🔍 Buscando OS existente para a empresa...");
  const res = await rest(`/ordens_servico?empresa_id=eq.${empresaId}&select=id,numero&limit=1`);
  if (!res.ok) {
    throw new Error(`Falha ao buscar OS: ${await res.text()}`);
  }
  const data = await res.json();
  if (!data.length) {
    throw new Error("Nenhuma ordem de serviço encontrada para essa empresa.");
  }
  console.log(`   Usando os_id: ${data[0].id} (OS #${data[0].numero})`);
  return data[0].id;
}

async function run() {
  const empresaId = await getEmpresaId();
  const osId = await getOsId(empresaId);
  const ref = `teste-webhook-${Date.now()}`;

  console.log(`\n📝 Inserindo NF-e de teste (ref: ${ref})...`);
  const insertRes = await rest("/nfe_saida", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      empresa_id: empresaId,
      os_id: osId,
      numero: "99999",
      serie: "1",
      status: "EM_PROCESSAMENTO",
      valor_total: 150,
      valor_impostos: 9,
      cliente_nome: "Cliente Teste",
      cliente_documento: "000.000.000-00",
      focus_nfe_ref: ref,
      forma_pagamento: "pix",
    }),
  });

  if (!insertRes.ok) {
    throw new Error(`Falha ao inserir NF-e de teste: ${await insertRes.text()}`);
  }

  const [nfe] = await insertRes.json();
  console.log(`   Criada nfe_saida.id: ${nfe.id}`);

  const webhookUrl = process.env.WEBHOOK_NFE_URL || `${supabaseUrl}/functions/v1/webhook-nfe`;
  const authHeader = process.env.SUPABASE_ANON_KEY || supabaseKey;

  console.log(`\n📡 Chamando webhook: ${webhookUrl}`);
  const webhookRes = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authHeader}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ref,
      status: "autorizado",
      chave_nfe: "NFe00000000000000000000000000000000000000",
      numero: "99999",
      protocolo: "000000000000000",
      caminho_danfe: "https://exemplo.com/danfe.pdf",
      xml: "<xml>teste</xml>",
    }),
  });

  const webhookText = await webhookRes.text();
  console.log(`   Resposta: ${webhookRes.status} ${webhookText}`);

  if (!webhookRes.ok) {
    throw new Error(`Webhook retornou erro ${webhookRes.status}: ${webhookText}`);
  }

  console.log("\n🔎 Verificando atualização no banco...");
  const checkRes = await rest(
    `/nfe_saida?focus_nfe_ref=eq.${ref}&select=status,chave_acesso,numero,protocolo_autorizacao,danfe_url`,
  );
  const [updated] = await checkRes.json();

  if (!updated) {
    throw new Error("Registro não encontrado após webhook.");
  }

  if (updated.status !== "EMITIDA") {
    throw new Error(`Status esperado EMITIDA, mas veio ${updated.status}`);
  }

  console.log("✅ Webhook funcionou corretamente:");
  console.log(`   status: ${updated.status}`);
  console.log(`   chave_acesso: ${updated.chave_acesso}`);
  console.log(`   protocolo_autorizacao: ${updated.protocolo_autorizacao}`);
  console.log(`   danfe_url: ${updated.danfe_url}`);

  console.log("\n🧹 Removendo registro de teste...");
  const deleteRes = await rest(`/nfe_saida?id=eq.${nfe.id}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });

  if (!deleteRes.ok) {
    console.warn(`   ⚠️ Não foi possível remover o registro de teste: ${await deleteRes.text()}`);
  } else {
    console.log("   Registro removido.");
  }

  console.log("\n✅ Teste concluído com sucesso.");
}

run().catch((err) => {
  console.error(`\n❌ Erro: ${err.message}`);
  process.exit(1);
});
