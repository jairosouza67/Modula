# Plano de Execução — Remediação de Segurança VidraSystem

> **Gerado em:** 03/07/2026
> **Base:** `ANALISE.md` (13 itens) + Achado #14 da auditoria
> **Organização:** 3 fases por nível de risco

---

## FASE 1 — Risco Zero 🟢

Alterações isoladas que não afetam fluxos existentes. Podem ser feitas e deployadas individualmente.

---

### 1.1 Autenticação JWT nas 4 Edge Functions NFe

**Itens da análise:** #14 (achado novo da auditoria)
**Arquivos:** `emitir-nfe/index.ts`, `cancelar-nfe/index.ts`, `config-fiscal/index.ts`, `enviar-nfe-email/index.ts`
**Por que risco zero:** O frontend já envia o header `Authorization: Bearer <token>` via `supabase.functions.invoke()` automaticamente. O token já chega — só não é validado.

**Instruções:**

Em cada um dos 4 arquivos, adicionar o bloco de validação JWT **imediatamente após** o check de `req.method !== "POST"`, **antes** de qualquer lógica de negócio.

**Padrão a copiar** (já funciona em `alterar-role/index.ts` linhas 30-57):

```typescript
// --- INÍCIO: Autenticação JWT ---
const authHeader = req.headers.get("Authorization");
if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return jsonResponse({ error: "Não autorizado." }, 401);
}

const token = authHeader.replace("Bearer ", "");
const { data: { user }, error: userError } = await supabase.auth.getUser(token);

if (userError || !user) {
  return jsonResponse({ error: "Não autorizado." }, 401);
}
// --- FIM: Autenticação JWT ---
```

**Detalhes por arquivo:**

| Arquivo                       | Inserir após a linha                                                                                     | Observação                                                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `emitir-nfe/index.ts`       | Linha 28 (após`if (req.method !== "POST")`)                                                            | O`createClient` na linha 31 já existe sem auth config — manter. O `supabase` usado para `getUser` deve ser o mesmo |
| `cancelar-nfe/index.ts`     | Linha 27 (após check de método)                                                                         | O`createClient` está na linha 29. Mover para antes do auth check ou criar separado para validar user                    |
| `config-fiscal/index.ts`    | Linha 26 (após check de método), dentro do`try`                                                       | O`createClient` está na linha 29. Reordenar para ficar antes do auth check                                              |
| `enviar-nfe-email/index.ts` | Após check de método (não tem check explícito — adicionar um`if (req.method !== "POST")` primeiro) | Precisa adicionar check de método + auth                                                                                  |

**Para `enviar-nfe-email/index.ts`** — adicionar entre a linha 19 e a função `serve`:

```typescript
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  // Auth JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Não autorizado." }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return jsonResponse({ error: "Não autorizado." }, 401);
  }

  // ... resto da lógica existente
```

**Teste:** Chamar cada Edge Function sem header `Authorization` → deve retornar 401. Chamar com token válido → deve funcionar normalmente.

---

### 1.2 Remover fallbacks hardcoded do `emitir-nfe`

**Item da análise:** #2
**Arquivo:** `supabase/functions/emitir-nfe/index.ts` linhas 162-178

**O que mudar:**

Substituir **todo o bloco `emitente`** (linhas 161-178) por:

```typescript
emitente: {
  cnpj: String(empresa?.cnpj || "").replace(/\D/g, ""),
  nome: empresa?.razao_social || empresa?.nome_fantasia || "",
  nome_fantasia: empresa?.nome_fantasia || "",
  logradouro: empresa?.logradouro || "",
  numero: empresa?.numero_endereco || "",
  complemento: empresa?.complemento || "",
  bairro: empresa?.bairro || "",
  municipio: empresa?.cidade || "",
  uf: empresa?.uf || "",
  cep: String(empresa?.cep || "").replace(/\D/g, ""),
  codigo_municipio: empresa?.codigo_municipio || 0,
  telefone: String(empresa?.telefone || "")
    .replace(/\D/g, "")
    .slice(0, 11),
  regime_tributario: empresa?.crt || 1,
  inscricao_estadual: empresa?.inscricao_estadual || "",
},
```

**Adicionar validação antes** (após a busca da empresa, ~linha 70):

```typescript
if (!empresa) {
  return jsonResponse({
    success: false,
    error: "Dados da empresa não encontrados. Configure a empresa antes de emitir NF-e.",
  }, 400);
}

if (!empresa.cnpj || !empresa.inscricao_estadual) {
  return jsonResponse({
    success: false,
    error: "CNPJ e Inscrição Estadual da empresa são obrigatórios para emissão de NF-e.",
  }, 400);
}
```

**Também** na seção `destinatario` (linhas 180-195), remover os fallbacks de cidade e código municipal:

```diff
-  municipio: cliente?.cidade || "Livramento de Nossa Senhora",
+  municipio: cliente?.cidade || "Não Informado",
-  uf: cliente?.uf || "BA",
+  uf: cliente?.uf || "",
-  cep: String(cliente?.cep || "46140000").replace(/\D/g, ""),
+  cep: String(cliente?.cep || "").replace(/\D/g, ""),
-  codigo_municipio: cliente?.codigo_municipio || 2919504,
+  codigo_municipio: cliente?.codigo_municipio || 0,
```

---

### 1.3 CORS restrito ao domínio real

**Item da análise:** #8
**Arquivos:** Todas as 9 Edge Functions (ver lista abaixo)

**O que mudar:**

Em **cada arquivo**, substituir:

```typescript
"Access-Control-Allow-Origin": "*",
```

Por:

```typescript
"Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "https://seu-dominio.vercel.app",
```

**Arquivos afetados (9):**

1. `alterar-role/index.ts` — linha 6
2. `baixar-titulo/index.ts` — linha 6
3. `cancelar-nfe/index.ts` — linha 9
4. `config-fiscal/index.ts` — linha 8
5. `criar-convite/index.ts` — linha 7
6. `deletar-registro/index.ts` — linha 6
7. `emitir-nfe/index.ts` — linha 10
8. `enviar-nfe-email/index.ts` — linha 10
9. `validar-convite/index.ts` — linha 8

**Pré-requisito:** Configurar a variável de ambiente `ALLOWED_ORIGIN` no painel do Supabase → Edge Functions → Secrets:

```
ALLOWED_ORIGIN=https://vidraerp.vercel.app
```

> [!NOTE]
> O `webhook-nfe/index.ts` NÃO tem CORS (não precisa — é chamado pela Focus NFe, não pelo browser).

---

### 1.4 Expandir sanitizer para hooks sem cobertura

**Item da análise:** #10
**Hooks sem sanitizer:** `useFinanceData.ts`, `useInstalacoes.ts`, `useFiscalData.ts`

**useFinanceData.ts** — adicionar sanitização em `useCreateTitulo`:

```typescript
// No topo do arquivo, adicionar import:
import { sanitizeTextFields } from "@/lib/validation/inputSanitizer";

// Dentro de mutationFn de useCreateTitulo (linha 203), antes do insert:
sanitizeTextFields(data as Record<string, unknown>, ["descricao", "parcela"]);
```

**useInstalacoes.ts** — adicionar sanitização em `useUpdateInstalacao`:

```typescript
// No topo do arquivo, adicionar import:
import { sanitizeTextFields } from "@/lib/validation/inputSanitizer";

// Dentro de mutateAsync (linha 187), antes da construção de updateData:
sanitizeTextFields(params as Record<string, unknown>, [
  "endereco_instalacao",
  "status_instalacao",
  "hora_previsao",
]);
```

**useFiscalData.ts** — adicionar sanitização em `useRegistrarObrigacao` e `useEditarObrigacao`:

```typescript
// No topo do arquivo, adicionar import:
import { sanitizeTextFields } from "@/lib/validation/inputSanitizer";

// Em useRegistrarObrigacao, dentro de mutationFn (antes do insert):
sanitizeTextFields(dados as Record<string, unknown>, ["tipo", "competencia"]);

// Em useEditarObrigacao, dentro de mutationFn (antes do update):
sanitizeTextFields(dados as Record<string, unknown>, ["tipo", "competencia"]);
```

---

### 1.5 Proteger log de token Focus NFe

**Item da análise:** #13
**Arquivo:** `supabase/functions/emitir-nfe/index.ts` linhas ~228-234

Localizar o bloco de `console.error` que loga a resposta da Focus NFe e substituir por:

```typescript
console.error("[emitir-nfe] Erro Focus NFe:", {
  status: focusResponse.status,
  statusText: focusResponse.statusText,
  // NÃO logar body nem headers — podem conter token
});
```

---

### 1.6 Centralizar `readJson`/`writeJson`

**Item da análise:** ANALISE.md → Duplicação #1
**Arquivos com duplicação:** `src/lib/auth/storage.ts`, `src/lib/partners/storage.ts`, `src/lib/settings/storage.ts`

**Passo 1:** Criar `src/lib/utils/localStorage.ts`:

```typescript
const isBrowser = (): boolean => typeof window !== "undefined";

export const readJson = <T>(key: string): T | null => {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
};

export const writeJson = (key: string, value: unknown): void => {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export { isBrowser };
```

**Passo 2:** Em cada um dos 3 arquivos, substituir as funções locais `readJson`/`writeJson`/`isBrowser` por:

```typescript
import { readJson, writeJson, isBrowser } from "@/lib/utils/localStorage";
```

E **remover** as implementações locais.

---

### 1.7 Centralizar CORS helper das Edge Functions

**Item da análise:** ANALISE.md → Duplicação #2
**Arquivo a criar:** `supabase/functions/_shared/cors.ts`

```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

export function errorResponse(msg: string, status = 400): Response {
  return jsonResponse({ error: msg }, status);
}

export function handleCorsOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}
```

**Em cada Edge Function**, substituir as definições locais por:

```typescript
import { corsHeaders, jsonResponse, errorResponse, handleCorsOptions } from "../_shared/cors.ts";
```

> [!IMPORTANT]
> No Supabase Edge Functions, o import relativo com `../` funciona para pastas irmãs. O diretório `_shared` é uma convenção oficial do Supabase.

---

### 1.8 Centralizar `isValidRole`

**Item da análise:** ANALISE.md → Duplicação #3
**Duplicado em:** `alterar-role/index.ts` e `criar-convite/index.ts`

**Adicionar ao `_shared/cors.ts`** (ou criar `_shared/roles.ts`):

```typescript
const VALID_ROLES = [
  "superadmin", "admin", "gestor", "vendedor", "tecnico", "financeiro",
] as const;

export type UserRole = (typeof VALID_ROLES)[number];

export function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.includes(role as UserRole);
}
```

Remover a definição local nos dois arquivos e importar.

---

## FASE 2 — Risco Médio 🟡

Requerem testes manuais após aplicação. Podem alterar comportamento se houver erros de tipo não mapeados.

---

### 2.1 Remover `@ts-nocheck` das 5 Edge Functions

**Item da análise:** #3**Arquivos (5):**

1. `alterar-role/index.ts` — linha 2
2. `baixar-titulo/index.ts` — linha 2
3. `criar-convite/index.ts` — linha 1
4. `deletar-registro/index.ts` — linha 2
5. `validar-convite/index.ts` — linha 2

**Procedimento por arquivo:**

1. Remover a linha `// @ts-nocheck`
2. Rodar `deno check supabase/functions/<nome>/index.ts` (ou `npx tsc --noEmit` se usar TS config)
3. Corrigir os erros — tipicamente são:
   - `body: any` → tipar o body com interface
   - `data` de queries Supabase retorna `unknown` → fazer type assertion após validação
   - Parâmetros implicitamente `any` → adicionar tipos

**Exemplo de fix típico** (padrão encontrado em `alterar-role`):

```diff
- const body = await req.json();
- const { user_id, new_role } = body;
+ interface AlterarRoleBody { user_id: string; new_role: string; }
+ const body: AlterarRoleBody = await req.json();
+ const { user_id, new_role } = body;
```

> [!WARNING]
> Fazer **uma função por vez**. Deployar, testar o fluxo completo no app, depois ir para a próxima. Se um deploy quebrar, o rollback é trivial (readicionar `// @ts-nocheck`).

---

### 2.2 Rate limiting nas Edge Functions

**Item da análise:** #9
**Arquivos:** Todas as Edge Functions que aceitam POST (exceto `webhook-nfe`)

**Abordagem simples** (sem Redis, usando memória in-process):

Criar `supabase/functions/_shared/rateLimit.ts`:

```typescript
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests = 10,
  windowMs = 60_000
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = requestCounts.get(identifier);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}
```

**Uso em cada Edge Function** (após autenticação JWT):

```typescript
import { checkRateLimit } from "../_shared/rateLimit.ts";

// Após validar o user:
const rateCheck = checkRateLimit(user.id, 10, 60_000);
if (!rateCheck.allowed) {
  return jsonResponse(
    { error: "Muitas requisições. Tente novamente em breve." },
    429
  );
}
```

> [!NOTE]
> Rate limit em memória reseta a cada cold start do Edge Function. É suficiente para proteção básica. Para algo mais robusto, usar Upstash Redis (pós-MVP).

---

### 2.3 Proteger webhook NFe

**Item da análise:** #1
**Arquivo:** `supabase/functions/webhook-nfe/index.ts`

**Opção A — Validação por token secreto na URL (mais simples):**

1. Gerar um token aleatório longo: `openssl rand -hex 32`
2. Salvar como secret no Supabase: `WEBHOOK_NFE_SECRET=<token>`
3. Configurar a URL do webhook na Focus NFe como: `https://<project>.supabase.co/functions/v1/webhook-nfe?token=<token>`

No código, adicionar após `if (req.method !== "POST")`:

```typescript
const url = new URL(req.url);
const webhookSecret = Deno.env.get("WEBHOOK_NFE_SECRET");
if (!webhookSecret || url.searchParams.get("token") !== webhookSecret) {
  return new Response("Forbidden", { status: 403 });
}
```

**Opção B — Validação por IP da Focus NFe (mais seguro):**

```typescript
const allowedIPs = ["52.67.12.206", "18.229.167.133"]; // IPs da Focus NFe — verificar na documentação deles
const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
if (!clientIP || !allowedIPs.includes(clientIP)) {
  console.warn(`[webhook-nfe] IP bloqueado: ${clientIP}`);
  return new Response("Forbidden", { status: 403 });
}
```

> [!IMPORTANT]
> Após implementar, **testar emitindo uma NF-e em homologação** para garantir que o webhook ainda recebe callbacks da Focus NFe.

---

## FASE 3 — Refatoração 🟠

Mudanças estruturais que afetam múltiplos módulos. Requerem branch separada, testes extensivos, e deploy gradual.

---

### 3.1 Remover `unsafe-inline` do CSP (style-src)

**Item da análise:** #5
**Arquivo:** `src/lib/security/headers.ts` — linha 4

**O que mudar:**

```diff
- style-src 'self' 'unsafe-inline';
+ style-src 'self' 'nonce-{STYLE_NONCE}';
```

**Impacto:**

- Todo CSS inline (`style="..."`) em componentes React vai parar de funcionar
- Bibliotecas que injetam `<style>` tags dinamicamente (ex: Framer Motion, alguns componentes UI) vão quebrar
- A solução requer propagar o nonce para cada `<style>` tag

**Procedimento:**

1. Criar branch: `git checkout -b security/csp-style-nonce`
2. Modificar `buildCsp()` para incluir nonce no style-src
3. Auditar **todos os componentes** que usam `style={{...}}` inline
4. Verificar se o framework (TanStack Start) injeta CSS inline no SSR
5. Testar **cada página** do app — CSS quebrado é visualmente óbvio
6. Se muito trabalhoso, alternativa intermediária: usar hashes SHA256 dos estilos inline conhecidos

> [!CAUTION]
> Esta é a tarefa de maior risco. Se o framework SSR injetar CSS inline que não pode receber nonce, pode ser necessário manter `unsafe-inline` temporariamente.

---

### 3.2 Migrar sessão de localStorage para cookie httpOnly

**Item da análise:** #6
**Arquivos afetados:** `src/lib/auth/storage.ts`, `src/lib/auth/client.ts`, `src/lib/auth/context.tsx`

**O que mudar:**

O Supabase JS SDK suporta custom storage adapters. Em vez de `localStorage`, usar cookies httpOnly:

```typescript
// src/lib/auth/cookieStorage.ts
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  // O @supabase/ssr já gerencia cookies automaticamente
);
```

**Impacto:**

- Todo o fluxo de login/logout/refresh precisa ser retestado
- O TanStack Start server-side precisa acessar os cookies para SSR autenticado
- `getStoredSession()`, `setStoredSession()`, `clearStoredSession()` serão substituídos
- O mock auth (modo DEV) precisa de adaptação separada

**Procedimento:**

1. Criar branch: `git checkout -b security/cookie-auth`
2. Instalar `@supabase/ssr` se não instalado
3. Refatorar `src/lib/supabase/client.ts` para usar `createBrowserClient`
4. Refatorar server-side para usar `createServerClient` com cookies
5. Remover `readJson`/`writeJson` de sessão do localStorage
6. Testar: login, refresh, logout, acesso SSR, modo DEV mock

---

### 3.3 Empresa ID dinâmico (multi-tenancy real)

**Item da análise:** #7
**Arquivo central:** `src/lib/supabase/company.ts`

**Estado atual:** `getDefaultEmpresaId()` lê `VITE_DEFAULT_EMPRESA_ID` do `.env` — fixo em build time.

**O que mudar:** Após a tarefa 3.2 (cookie auth), o `empresa_id` deve vir do perfil do usuário autenticado:

```typescript
// src/lib/supabase/company.ts
export const getEmpresaId = async (): Promise<string> => {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado");

  const { data: perfil } = await supabase
    .from("perfis_usuario")
    .select("empresa_id")
    .eq("user_id", user.id)
    .single();

  if (!perfil?.empresa_id) {
    throw new Error("Empresa não configurada para este usuário");
  }

  return perfil.empresa_id;
};
```

**Impacto:**

- **Todos os 20+ hooks** usam `getDefaultEmpresaId()` — precisam migrar
- A função passa a ser assíncrona → hooks precisam tratar como query
- Ideal: criar um hook `useEmpresaId()` com React Query para cache
- O `.env` `VITE_DEFAULT_EMPRESA_ID` pode ser mantido como fallback apenas em DEV

> [!WARNING]
> Esta é a mudança mais ampla do plano. Deve ser feita **por último**, após todas as outras estarem estáveis em produção.

---

## Checklist de Execução

### Fase 1 — Risco Zero

- [ ] 1.1 — JWT nas 4 Edge Functions NFe
- [ ] 1.2 — Remover fallbacks hardcoded `emitir-nfe`
- [ ] 1.3 — CORS restrito (9 arquivos + secret no Supabase)
- [ ] 1.4 — Sanitizer em `useFinanceData`, `useInstalacoes`, `useFiscalData`
- [ ] 1.5 — Proteger log de token Focus NFe
- [ ] 1.6 — Centralizar `readJson`/`writeJson`
- [ ] 1.7 — Centralizar CORS/helpers das Edge Functions (`_shared/`)
- [ ] 1.8 — Centralizar `isValidRole`

### Fase 2 — Risco Médio

- [ ] 2.1 — Remover `@ts-nocheck` (5 funções, uma por vez)
- [ ] 2.2 — Rate limiting nas Edge Functions
- [ ] 2.3 — Proteger webhook NFe (token ou IP)

### Fase 3 — Refatoração

- [ ] 3.1 — CSP style-src sem `unsafe-inline`
- [ ] 3.2 — Sessão em cookie httpOnly
- [ ] 3.3 — Empresa ID dinâmico

---

## Itens NÃO incluídos (por decisão)

| Item                             | Motivo                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #4 — Permissão só no frontend | As 82 tabelas já têm RLS. Adicionar segunda camada é melhoria de longo prazo, não remediação                                                            |
| #11 — Senhas mock em DEV        | Já protegido por`import.meta.env.DEV` guard. Risco zero em produção                                                                                      |
| #12 — Fire-and-forget `void`  | Os`void ensureSupabaseProfile(...).catch()` são pattern aceitável para operações não-críticas de background. O `.catch()` evita unhandled rejection |
