/**
 * Script de Keepalive para Supabase
 *
 * Usa fetch nativo (Node.js 18+) para chamar a REST API do Supabase.
 * Sem dependências externas — não requer npm install.
 *
 * Variáveis de ambiente necessárias:
 *   SUPABASE_URL            - URL do projeto Supabase
 *   SUPABASE_SERVICE_ROLE_KEY - Chave service_role
 */

// Carregar .env automaticamente (sem dependência externa)
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

try {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(__dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  // .env não encontrado — usa variáveis de ambiente do sistema (CI/CD)
}

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  console.error('   Configure as variáveis de ambiente ou crie um arquivo .env');
  process.exit(1);
}

async function keepalive() {
  const startTime = Date.now();
  console.log(`🏓 [${new Date().toISOString()}] Executando keepalive no Supabase...`);
  console.log(`   URL: ${supabaseUrl}`);

  try {
    // Usa a REST API diretamente via fetch nativo — sem dependências externas
    const response = await fetch(
      `${supabaseUrl}/rest/v1/empresas?select=id&limit=1`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact',
        },
      }
    );

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status} — ${body}`);
    }

    const countHeader = response.headers.get('content-range');
    console.log(`✅ Keepalive bem-sucedido em ${elapsed}ms`);
    console.log(`   Status: ${response.status} | Content-Range: ${countHeader ?? 'N/A'}`);
    console.log(`   Banco de dados respondendo normalmente.`);

    // Tenta registrar no log via REST API (pode falhar se a tabela não existir)
    try {
      await fetch(`${supabaseUrl}/rest/v1/_keepalive_log`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          status: 'ok',
          details: {
            elapsed_ms: elapsed,
            timestamp_utc: new Date().toISOString(),
            source: 'github-actions',
          },
        }),
      });
    } catch {
      // Log falhou — não é crítico
    }

    return true;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ Keepalive falhou após ${elapsed}ms`);
    console.error(`   Erro: ${err.message}`);
    return false;
  }
}

const success = await keepalive();
process.exit(success ? 0 : 1);
