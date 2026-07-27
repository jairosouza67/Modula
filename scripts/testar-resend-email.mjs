/**
 * Script para testar a integração com o Resend através da Edge Function enviar-nfe-email.
 *
 * Uso:
 *   node scripts/testar-resend-email.mjs <seu-email@dominio.com>
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

const emailDestino = process.argv[2];

if (!emailDestino) {
  console.error("❌ Erro: Informe o e-mail de destino como argumento.");
  console.log("Exemplo: node scripts/testar-resend-email.mjs seu-email@exemplo.com");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY são obrigatórios.");
  process.exit(1);
}

const functionUrl = `${supabaseUrl}/functions/v1/enviar-nfe-email`;

console.log(`\n📬 Enviando e-mail de teste para: ${emailDestino}`);
console.log(`📡 Chamando Edge Function: ${functionUrl}`);

async function run() {
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      email: emailDestino,
      test: true,
      mensagem: "Its ok!!",
    }),
  });

  const text = await response.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    console.error(`\n❌ Falha ao enviar e-mail (HTTP ${response.status}):`);
    console.error(JSON.stringify(json, null, 2));
    process.exit(1);
  }

  console.log("\n✅ E-mail enviado com sucesso!");
  console.log("Detalhes da resposta:", JSON.stringify(json, null, 2));
}

run().catch((err) => {
  console.error(`\n❌ Erro durante a execução: ${err.message}`);
  process.exit(1);
});
