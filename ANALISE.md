# Análise do VidraSystem

> **Data:** 03/07/2026
> **Repositório:** jairosouza67/VidraSystem
> **Stack:** TanStack Start + React 19 + Supabase + TypeScript

## Visão Geral

SaaS de gestão para vidraçaria. TanStack Start (SSR), React 19, Supabase (auth + DB), Edge Functions Deno, testes extensivos. ~20 hooks, 9 Edge Functions, 82 tabelas com RLS.

---

## 🚨 Fragilidades de Segurança

### 🔴 Críticas

| # | Problema | Localização | Risco |
|---|---|---|---|
| 1 | **Webhook NFe sem autenticação** | `supabase/functions/webhook-nfe/index.ts` | Qualquer um que descobrir a URL pode forjar status de NF-e (EMITIDA/CANCELADA). Zero verificação de token ou assinatura — a Focus NFe envia um POST com `{ ref, status, chave_nfe }` e o webhook confia sem validar a origem |
| 2 | **Dados da empresa hardcoded como fallback** | `emitir-nfe/index.ts` linhas 162, 177 | CNPJ `14032864000108`, IE `096918958`, endereço completo em Livramento de Nossa Senhora/BA estão hardcoded. Se a tabela `empresas` estiver vazia, a NF-e é emitida com dados fixos **sem nenhum aviso** |
| 3 | **`@ts-nocheck` em 3 das 9 Edge Functions** | `alterar-role`, `deletar-registro`, `baixar-titulo` | TypeScript desativado intencionalmente. Bugs de tipo, parâmetros `any` e valores `unknown` passam despercebidos |

### 🟡 Médias

| # | Problema | Risco |
|---|---|---|
| 4 | **Permissão só no frontend** — `PrivateRoute` + `canAccessPath` rodam exclusivamente no cliente. O backend confia 100% nas RLS do Supabase como única barreira | Se uma RLS falhar (ex: policy escrita com `USING (true)`), **todos os dados multi-tenant ficam expostos**. Não há segunda camada de autorização |
| 5 | **CSP com `'unsafe-inline'` para style-src** | `src/lib/security/headers.ts` linha 4 permite CSS injection. `style-src` deveria usar nonce ou hash, como `script-src` faz |
| 6 | **JWT armazenado em localStorage** | `auth/storage.ts`. Se houver XSS no app, o atacante rouba o `accessToken` e assume a sessão |
| 7 | **Empresa ID fixo via VITE_DEFAULT_EMPRESA_ID** | UUID fixo `00000000-0000-0000-0000-000000000001` no `.env.example`. Multi-tenancy frágil — se um usuário alterar o ID no frontend, pode acessar dados de outra empresa se a RLS depender apenas desse campo e falhar |
| 8 | **CORS `Access-Control-Allow-Origin: *` em TODAS as Edge Functions** | Desnecessário. Deveria ser limitado ao domínio real do app |

### 🔵 Leves / Boas Práticas

| # | Problema |
|---|---|
| 9 | **Sem rate limit nas Edge Functions** — `alterar-role`, `criar-convite`, `deletar-registro` não têm proteção contra abuso |
| 10 | **Input sanitizer subutilizado** — `sanitizeTextFields` existe mas só é chamado em alguns hooks |
| 11 | **Senhas em localStorage (modo DEV)** — mock auth (`storage.ts`) armazena `password` em plain text. Aceitável em DEV |
| 12 | **Fire-and-forget sem await** — várias chamadas Supabase são `void ... .catch(...)`. Se falharem (ex: `ensureSupabaseProfile`), o usuário não é notificado |
| 13 | **Token Focus NFe vaza em log de erro** — `emitir-nfe:228-234` loga a resposta da Focus NFe em caso de erro. O token (base64) pode aparecer no `console.error` |

---

## ✅ Pontos Fortes

| Item | Detalhe |
|---|---|
| **Testes extensivos** | Unitários (15+ arquivos), security, RLS audit, e2e (Playwright), **load testing (k6)** |
| **CSRF** | `isCsrfSafe()` com validação Origin + Referer |
| **CSP Nonce** | Nonce único por request via AsyncLocalStorage |
| **Security headers** | HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Permissions-Policy restritiva |
| **Error sanitization** | `userFriendlyError()` não expõe detalhes técnicos em produção |
| **RLS audit test** | Teste automatizado que varre migrations: **82 tabelas com RLS habilitadas** |
| **Audit logging** | `logAuditEvent()` persiste ações sensíveis no Supabase |
| **Brute force** | Rate limit de 10 tentativas/minuto no `recordLoginAttempt()` |
| **PWA** | Service worker com workbox, fallback navigation, cache de assets |
| **Input validation** | Input sanitizer com regex para XSS e SQLi patterns |

---

## 🔧 Problemas de Código e Arquitetura

### Duplicação

1. **`readJson`/`writeJson` em 3 arquivos** — `auth/storage.ts`, `partners/storage.ts`, `settings/storage.ts`. Três implementações idênticas de localStorage wrapper. Um helper centralizado resolveria
2. **CORS copiado em 7 Edge Functions** — o mesmo bloco `corsHeaders` + `jsonResponse` + `errorResponse` colado em cada função. Poderia ser um módulo compartilhado
3. **`isValidRole` redefinido** — existe em `alterar-role/index.ts` (linha 22) e `criar-convite/index.ts` (linha 23)

### Falta de Cobertura

4. **Zero testes para Edge Functions** — 9 funções Deno, zero testes
5. **Zero README** — sem instruções de setup. Única referência é `.env.example`
6. **`scripts/keepalive.mjs` não encontrado** — referenciado em `package.json` mas ausente do repositório

### Observabilidade

7. **Log não estruturado** — `console.error` é a única forma de log. Sem níveis, sem agregação
8. **`focus_nfe_token` lido via `SERVICE_ROLE_KEY`** — correto, mas se `empresa_secrets` não tiver RLS rigorosa, admins podem ler tokens de NFe de outras empresas

---

## 📋 Recomendações por Prioridade

### 🔥 Imediato

1. **Autenticar webhook-nfe** — validar assinatura HMAC ou IP fixo da Focus NFe
2. **Remover fallback hardcoded do `emitir-nfe`** — se `empresa` não existir, retornar erro 400

### ⏳ Curto prazo

3. **Criar README.md** — stack, setup, `.env`, deploy
4. **Centralizar `readJson`/`writeJson`** num helper único
5. **Adicionar smoke tests nas Edge Functions**
6. **Remover `@ts-nocheck`** — resolver os erros de tipo
7. **Limitar CORS das Edge Functions ao domínio real**

### 🧠 Médio prazo

8. **Sanitizer como middleware automático** — não manual por hook
9. **Rate limiting global nas Edge Functions**
10. **Segunda camada de autorização** — validar permissões no servidor além das RLS
11. **Migrar sessão de localStorage para cookie httpOnly** (ou ao menos sessionStorage)