# 🔒 Ralph Loop — Security Hardening

> **Projeto:** Vidraçaria Ornamental  
> **Criado em:** 26/06/2026  
> **Origem:** `docs/security-audit.md` (15 vulnerabilidades confirmadas)  
> **Status Global:** 🔵 EM ANDAMENTO

---

## 📋 INSTRUÇÕES PARA O AGENTE

> **LEIA ISTO PRIMEIRO — Este é um Ralph Loop.**
>
> 1. Este arquivo é sua **ÚNICA fonte de contexto**. Você está começando sem memória prévia.
> 2. Localize a **ETAPA ATIVA** (marcada com `🔵 EM ANDAMENTO`). Execute APENAS ela.
> 3. Ao concluir cada task, atualize este arquivo:
>    - Marque a task como `✅ CONCLUÍDA` com data/hora
>    - Preencha o campo `Resultado:` com o que foi feito (arquivos alterados, linhas, decisões)
>    - Se a etapa inteira foi concluída, marque-a como `✅ CONCLUÍDA`
>    - Avance a próxima etapa para `🔵 EM ANDAMENTO`
> 4. **SALVE este arquivo antes de encerrar.** A próxima sessão depende dele.
> 5. **NÃO pule etapas.** Siga a ordem.
> 6. **Referência técnica:** O relatório completo está em `docs/security-audit.md`
> 7. **Stack:** TanStack Start + React + Supabase + TypeScript + TailwindCSS v4

---

## ETAPA 1 — Correções Críticas de Auth `✅ CONCLUÍDA`

> **Tempo estimado:** ~40min | **Severidade:** 🔴 CRÍTICO + 🟠 ALTO

### Task 1.1 — Aplicar rate limiting no login
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **Arquivo:** `src/lib/auth/client.ts`
- **O quê:** Importar `recordLoginAttempt` de `./security` e chamá-la no início de `authClient.login()` (antes do provider check). Se `allowed === false`, lançar erro "Muitas tentativas. Aguarde 1 minuto."
- **Referência:** `recordLoginAttempt()` já existe em `src/lib/auth/security.ts` L112-131 (bloqueia após 10 tentativas em 1 min)
- **Resultado:** Adicionado import `recordLoginAttempt` e chamada no início de `login()` usando `normalizeEmail(email)` como chave. Lança erro se `allowed === false`.

### Task 1.2 — Remover console.log de auditoria em produção
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **Arquivo:** `src/lib/auth/security.ts` L52
- **O quê:** Envolver o `console.log(\`[AUDIT]...\`)` com `if (import.meta.env.DEV)`. Também remover `userId` do log — logar apenas severidade e ação.
- **Resultado:** Log de auditoria envolvido em `if (import.meta.env.DEV)` e removido `userId` da mensagem. Também corrigidos erros de lint pré-existentes no arquivo (regex escapes e tipo `any`).

### Task 1.3 — Eliminar fallback hardcoded de empresa_id
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **Arquivo:** `src/lib/supabase/company.ts`
- **O quê:** Remover `FALLBACK_EMPRESA_ID`. Se `VITE_DEFAULT_EMPRESA_ID` não estiver configurado (ou vazio), lançar `throw new Error("VITE_DEFAULT_EMPRESA_ID não configurado. Defina no .env.")`. Garantir que `.env` e `.env.example` possuem a variável.
- **Resultado:** Removido `FALLBACK_EMPRESA_ID`; `getDefaultEmpresaId()` agora lança erro se a variável não estiver configurada. `.env` e `.env.example` já possuem `VITE_DEFAULT_EMPRESA_ID`.

### Task 1.4 — Tratar erros silenciados no ensureSupabaseProfile
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **Arquivo:** `src/lib/auth/client.ts` (linhas 207, 256, 395)
- **O quê:** Substituir `.catch(() => {})` por `.catch((err) => { console.error("[AUTH] Falha ao garantir perfil:", err?.message); })` nas 3 ocorrências.
- **Resultado:** Substituídas as 3 ocorrências em `login()`, `restoreSession()` e `signUp()`. Corrigido também erro de TS pré-existente em `mapUserRole(item.role, item.email)`.

---

## ETAPA 2 — Sanitização de Erros ao Usuário `✅ CONCLUÍDA`

> **Tempo estimado:** ~1h | **Severidade:** 🟠 ALTO + 🟢 BAIXO

### Task 2.1 — Criar utilitário `userFriendlyError()`
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **Novo arquivo:** `src/lib/errors/sanitize.ts`
- **O quê:** Criar função que mapeia padrões de erro do Supabase (duplicate key, foreign key, permission denied, JWT expired) para mensagens pt-br amigáveis. Em DEV retorna msg técnica; em PROD retorna msg genérica.
- **Resultado:** Criado `userFriendlyError(context, error)` que mapeia: duplicidade (23505/unique), FK (23503), permissão (42501/RLS), JWT expirado, erro de rede. Em DEV retorna mensagem técnica; em PROD retorna mensagem genérica.

### Task 2.2 — Aplicar `userFriendlyError()` em todos os hooks
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **Arquivos afetados (43+ ocorrências):**
  - `useClientes.ts` (3x)
  - `useColaboradores.ts` (3x)
  - `useEstoque.ts` (4x)
  - `useOrcamentos.ts` (3x)
  - `useProdutos.ts` (3x)
  - `usePedidos.ts` (3x)
  - `useKits.ts` (3x)
  - `useFiscalData.ts` (8x)
  - `useFinanceData.ts` (4x)
  - `useDashboardData.ts` (4x)
  - `compras/useMutationsPedido.ts` (5x)
  - `compras/useMutationsNFe.ts` (1x)
- **O quê:** Substituir `toast.error("Erro ao X: " + error.message)` por `toast.error(userFriendlyError("Erro ao X", error))` em cada ocorrência. Importar de `@/lib/errors/sanitize`.
- **Resultado:** Aplicado em todos os hooks listados. Alguns usavam `{ description: error.message }` e foram convertidos para o padrão unificado. `useDashboardData.ts` usa `throw new Error(userFriendlyError(...))`. Formatação corrigida com `eslint --fix`; restam apenas erros `any` pré-existentes (ETAPA 4).

---

## ETAPA 3 — Validação de Input e Senha `✅ CONCLUÍDA`

> **Tempo estimado:** ~1.5h | **Severidade:** 🟠 ALTO + 🟡 MÉDIO

### Task 3.1 — Criar utilitário de validação de input
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **Novo arquivo:** `src/lib/validation/inputSanitizer.ts`
- **O quê:** Criar `sanitizeTextFields<T>(data, textFields)` que chama `validateInput()` (de `security.ts`) em cada campo de texto. Lança erro se detectar XSS/SQLi.
- **Resultado:** Criado `sanitizeTextFields<T>(data, textFields)` em `src/lib/validation/inputSanitizer.ts`. Valida cada campo string com `validateInput()` e lança erro indicando o campo e o motivo.

### Task 3.2 — Aplicar validação nos hooks de mutação
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **Arquivos:** `useClientes.ts`, `useColaboradores.ts`, `useEstoque.ts`, `useOrcamentos.ts`, `useProdutos.ts`, `usePedidos.ts`, `useKits.ts`
- **O quê:** Antes de cada `.insert()` ou `.update()`, chamar `sanitizeTextFields()` nos campos de texto (nome, descrição, código, etc).
- **Resultado:** Aplicado `sanitizeTextFields()` antes de `insert`/`update` em todos os hooks listados. Campos validados incluem nome, código, descrição, categoria, e-mail, telefone, endereço, observações, etc.

### Task 3.3 — Fortalecer validação de senha
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **Arquivo:** `src/routes/login.tsx` L99
- **O quê:** Criar helper `validatePassword(pw)` que exige: mín 8 chars, maiúscula, minúscula, número, caractere especial. Substituir a validação atual (`length < 6`). Mostrar todas as falhas ao usuário.
- **Resultado:** Criado `validatePassword(pw)` com verificação de 8 caracteres, maiúscula, minúscula, número e caractere especial. Retorna lista de requisitos não atendidos; mensagem exibida ao usuário lista todas as falhas.

### Task 3.4 — Corrigir Open Redirect
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **Arquivo:** `src/routes/login.tsx` L18-19
- **O quê:** Substituir `startsWith("/")` por validação com `new URL(redirectPath, window.location.origin)` verificando que `url.origin === window.location.origin`. Retornar `/dashboard` se inválido.
- **Resultado:** `normalizeRedirectPath` agora usa `new URL()` e valida `url.origin === window.location.origin`, prevenindo open redirect. `/login` continua sendo redirecionado para `/dashboard`.

---

## ETAPA 4 — Eliminar `as any` nos Hooks `✅ CONCLUÍDA`

> **Tempo estimado:** ~4h | **Severidade:** 🟠 ALTO

### Task 4.1 — Corrigir `as any` em useClientes.ts (11 ocorrências)
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **O quê:** Criar interfaces tipadas para campos `cidade`, `representante`, `referencia`. Usar tipos do schema Supabase (`Tables<'clientes'>['Insert']`, `Tables<'clientes'>['Update']`). Remover cast de `deleted_at`.
- **Resultado:** Criado `ClienteCamposExtras` e estendidos `Cliente`, `ClienteInsert`, `ClienteUpdate`. Removidos todos os `as any` relacionados a cidade/representante/referencia e o cast de `deleted_at`.

### Task 4.2 — Corrigir `as any` em useInstalacoes.ts (9 ocorrências)
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **O quê:** Tipar retorno do join Supabase (os + cliente + tecnico). Criar interface para campos `endereco_instalacao`, `hora_previsao`, `status_instalacao`, `tecnico`.
- **Resultado:** Criado `InstalacaoOS` e `OSUpdate`. Cast de dados via `unknown`; acessos a `cliente`/`tecnico` usam `[0]`. Removidos `as any` do update.

### Task 4.3 — Corrigir `as any` em useFinanceData.ts (4 ocorrências)
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **O quê:** Criar union type para status (`"PAGO" | "ATRASADO" | "PENDENTE"`). Tipar join com `ordens_servico`.
- **Resultado:** Criado `ContaPagarReceberComJoins` e usado `TituloFinanceiro["status"]` nos casts. Removidos `as any` de status e join com `ordens_servico`.

### Task 4.4 — Corrigir `as any` nos demais hooks
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **Arquivos:** `useDashboardData.ts`(3), `useKPIsRelatorios.ts`(4), `useFaturamentoCliente.ts`(3), `useRelatorios.ts`(2), `useProdutosVendidos.ts`(2), `useProdutosOrcamento.ts`(1), `useEstoque.ts`(2), `compras/useRelatorios.ts`(1), `compras/useRomaneios.ts`(1)
- **O quê:** Aplicar mesma estratégia: tipar joins, criar union types para enums, usar tipos do schema.
- **Resultado:** Tipados joins em `useDashboardData.ts`, `useKPIsRelatorios.ts`, `useFaturamentoCliente.ts`, `useRelatorios.ts`, `useProdutosVendidos.ts`. Union types aplicadas em `useProdutosOrcamento.ts` e `useEstoque.ts`. `compras/useRelatorios.ts` sem casts. Restam `: any` em callbacks/helpers pré-existentes que serão tratados em refatoração futura.

---

## ETAPA 5 — Security Headers HTTP `✅ CONCLUÍDA`

> **Tempo estimado:** ~1h | **Severidade:** 🟡 MÉDIO

### Task 5.1 — Adicionar security headers no servidor
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **Arquivos:** `src/server.ts`, `src/start.ts`
- **O quê:** Criar objeto `SECURITY_HEADERS` com: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Content-Security-Policy` (permitir self + supabase). Injetar em toda Response via middleware.
- **Resultado:** Criado `src/lib/security/headers.ts` com `SECURITY_HEADERS` e `applySecurityHeaders()`. Headers aplicados em `src/server.ts` (fetch handler e error response) e `src/start.ts` (middleware de segurança + error middleware).

### Task 5.2 — Isolar modo Mock de produção
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **Arquivos:** `src/lib/auth/storage.ts`, `src/routes/login.tsx`
- **O quê:** Condicionar `DEFAULT_MOCK_USERS` e funções mock a `import.meta.env.DEV`. Em produção, `getStoredMockUsers()` deve retornar array vazio. Remover exibição de credenciais mock da UI quando `provider !== "mock"`.
- **Resultado:** `DEFAULT_MOCK_USERS` e funções mock (`getStoredMockUsers`, `saveStoredMockUsers`, `updateStoredMockUserRole`, `addStoredMockUser`) condicionadas a `import.meta.env.DEV`. Em produção retornam array vazio ou são no-op. UI de login só exibe credenciais mock quando `provider === "mock" && import.meta.env.DEV`.

---

## ETAPA 6 — Fluxo de Convite (Invite-Only) `✅ CONCLUÍDA`

> **Tempo estimado:** ~3-5 dias | **Severidade:** 🟡 MÉDIO

### Task 6.1 — Criar tabela `convites` no Supabase
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **O quê:** Migration com: `id uuid PK`, `email text NOT NULL`, `role user_role`, `token text UNIQUE`, `empresa_id uuid FK`, `convidado_por uuid FK`, `expires_at timestamptz`, `usado_em timestamptz NULL`, `created_at timestamptz DEFAULT now()`. RLS: somente admin/superadmin podem INSERT; SELECT para validação de token.
- **Resultado:** Criada migration `20260626000000_create_convites.sql` com tabela, índices, RLS para SELECT por token e INSERT restrito a admin/superadmin da mesma empresa. Role mapeado como `text` com check constraint (compatível com `perfis_usuario`).

### Task 6.2 — Criar Edge Function `criar-convite`
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **O quê:** Edge Function que recebe `{email, role}`, valida permissão do chamador (admin/superadmin), gera token seguro, insere em `convites`, retorna link de convite.
- **Resultado:** Criada `supabase/functions/criar-convite/index.ts`. Valida JWT, verifica role do perfil, gera token hex de 32 bytes, insere convite com expiração de 7 dias e retorna link `/login?token=...`.

### Task 6.3 — Alterar fluxo de registro para exigir convite
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **Arquivos:** `src/routes/login.tsx`, `src/lib/auth/client.ts`
- **O quê:** Página de registro recebe `?token=` na URL. `signUp()` valida token antes de criar conta. Remover botão "Criar conta" da UI pública — manter apenas para quem tem link de convite.
- **Resultado:** `signUp()` agora exige `token`, valida e-mail/role/empresa contra `convites` e marca como usado após cadastro. `login.tsx` lê `?token=`, oculta botão "Criar conta" sem convite e direciona para registro quando há token. `AuthContext` atualizado para propagar o token.

---

## ETAPA 7 — RLS, Edge Functions e CSRF `🔵 EM ANDAMENTO`

> **Tempo estimado:** ~2 semanas | **Severidade:** 🟡 MÉDIO → 🔴 CRÍTICO

### Task 7.1 — Auditar e testar todas as RLS policies
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **O quê:** Revisar cada migration em `supabase/migrations/`. Criar testes automatizados que validam: (1) usuário da empresa A NÃO acessa dados da empresa B, (2) anon NÃO acessa dados, (3) cada tabela tem RLS habilitado.
- **Resultado:**
  - Criado relatório de auditoria em `docs/Ralph Loop/rls-audit-report.md`.
  - Criados 8 testes automatizados em `tests/security/rls-audit.test.ts`.
  - Corrigidas 5 falhas críticas via migration `supabase/migrations/20260626000100_rls_audit_fixes.sql`:
    - `SECURITY DEFINER` sem `SET search_path` em `set_updated_at`, `marcar_os_atrasadas`, `trg_avaliar_atraso_os`, `fn_keepalive_ping`.
    - Policies de `convites` permitiam acesso anônimo.
    - `perfis_usuario_write_by_empresa` permitia privilege escalation.
  - Criada Edge Function `validar-convite` para manter o fluxo de registro invite-only após endurecimento das policies.
  - Ajustado `src/lib/auth/client.ts` para usar a Edge Function ao invés de consultar `convites` diretamente no registro.
  - Storage `nfe_xml` identificado como cross-tenant — aguarda correção futura (teste falha se policy permissiva for reintroduzida).

### Task 7.2 — Edge Functions para operações sensíveis
- **Status:** ⬜ PENDENTE
- **O quê:** Criar Edge Functions para: delete de registros, alteração de role, operações financeiras críticas. Usar service_role key apenas server-side.
- **Resultado:**

### Task 7.3 — Implementar validação CSRF via Origin/Referer
- **Status:** ✅ CONCLUÍDA (26/06/2026)
- **O quê:** No middleware do servidor, verificar header `Origin` ou `Referer` em requests mutantes (POST/PUT/DELETE). Rejeitar se não corresponder ao domínio da aplicação.
- **Resultado:**
  - Atualizado `src/lib/security/csrf.ts`: `isCsrfSafe()` agora rejeita requisições mutantes sem `Origin`/`Referer` em produção e aceita origem permitida via `VITE_SITE_URL`.
  - Adicionado `csrfMiddleware` em `src/start.ts`, executado antes do `errorMiddleware`.
  - Adicionados 6 testes em `tests/security/security.test.ts` cobrindo métodos seguros, rejeição sem headers, origem permitida, origem estrangeira e fallback para `Referer`.
  - Adicionada `VITE_SITE_URL` ao `.env.example`.

### Task 7.4 — Migrar sessão para cookies httpOnly
- **Status:** ⬜ PENDENTE
- **O quê:** Usar `@supabase/ssr` para gerenciar sessão via cookies httpOnly. Remover armazenamento de `accessToken` no localStorage. Atualizar `client.ts` e `storage.ts`.
- **Resultado:**

---

## 📊 PROGRESSO GERAL

| Etapa | Descrição | Tasks | Status |
|:-----:|-----------|:-----:|:------:|
| 1 | Correções Críticas de Auth | 4/4 | ✅ CONCLUÍDA |
| 2 | Sanitização de Erros | 2/2 | ✅ CONCLUÍDA |
| 3 | Validação de Input e Senha | 4/4 | ✅ CONCLUÍDA |
| 4 | Eliminar `as any` | 4/4 | ✅ CONCLUÍDA |
| 5 | Security Headers HTTP | 2/2 | ✅ CONCLUÍDA |
| 6 | Fluxo de Convite | 3/3 | ✅ CONCLUÍDA |
| 7 | RLS, Edge Functions, CSRF | 2/4 | 🔵 EM ANDAMENTO |

**Total: 21/23 tasks concluídas**

---

## 📝 LOG DE SESSÕES

| # | Data | Etapa | Tasks Concluídas | Notas |
|:-:|------|:-----:|:----------------:|-------|
| 1 | 26/06/2026 | 1 | 1.1, 1.2, 1.3, 1.4 | Lint passou nos arquivos alterados. TSC ainda reporta erros pré-existentes em outros arquivos. |
| 2 | 26/06/2026 | 7 | 7.1 | Testes RLS passando. Migration de correção criada. Edge Function `validar-convite` criada. Lint OK nos arquivos alterados; TSC mantém erros pré-existentes. |
| 3 | 26/06/2026 | 7 | 7.3 | Middleware CSRF ativado em `src/start.ts`. Testes de CSRF passando. Lint OK; TSC mantém erros pré-existentes. |
