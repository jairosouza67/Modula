# 🔍 Relatório de Auditoria — ModulaSystem

> **Data:** 03/07/2026
> **Base:** Análise do usuário em `ANALISE.md` + inspeção de código completa
> **Escopo:** 10 Edge Functions, ~20 hooks, auth client, security headers, storage layers

---

## Metodologia

Cada ponto da análise foi verificado diretamente no código-fonte. Para cada item, apresento:
- ✅ **Confirmado** — o problema existe exatamente como descrito
- ⚠️ **Parcialmente** — existe mas com nuances
- ❌ **Não confirmado** — o código não apresenta o problema descrito
- 🆕 **Novo achado** — problema adicional descoberto na auditoria

---

## 🚨 Fragilidades de Segurança — Críticas (#1–#3)

### #1 — Webhook NFe sem autenticação ✅ CONFIRMADO

**Arquivo:** [webhook-nfe/index.ts](file:///d:/VS%20Code/AllVidros/supabase/functions/webhook-nfe/index.ts)

```typescript
// Linha 7-13: aceita qualquer POST sem validação de origem
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const body = await req.json().catch(() => ({}));
  // Confia no body SEM nenhuma verificação
```

**Gravidade:** 🔴 Crítica
**Impacto real:** Qualquer pessoa que descubra a URL pode enviar `{ ref: "xxx", status: "autorizado" }` e marcar uma NF-e como EMITIDA no banco, ou forjar cancelamentos.

**Pode implementar sem quebrar?** ✅ SIM
- Adicionar validação de IP fixo da Focus NFe (IPs documentados) ou token HMAC
- Sem impacto em nenhum outro componente — a função é chamada exclusivamente pela Focus NFe

---

### #2 — Dados da empresa hardcoded como fallback ✅ CONFIRMADO

**Arquivo:** [emitir-nfe/index.ts](file:///d:/VS%20Code/AllVidros/supabase/functions/emitir-nfe/index.ts)

```typescript
// Linhas 162-177: fallbacks hardcoded para dados fiscais reais
emitente: {
  cnpj: String(empresa?.cnpj || "").replace(/\D/g, "") || "14032864000108",
  nome: empresa?.razao_social || empresa?.nome_fantasia || "MODULAAPP",
  logradouro: empresa?.logradouro || "Avenida Gil Ferreira Pessoa",
  numero: empresa?.numero_endereco || "70",
  inscricao_estadual: empresa?.inscricao_estadual || "096918958",
  // ...
```

**Gravidade:** 🔴 Crítica
**Impacto real:** Se a query `empresas` falhar silenciosamente, o sistema emite NF-e com dados de outra empresa (CNPJ real). Isso é fraude fiscal.

**Pode implementar sem quebrar?** ✅ SIM
- Remover todos os fallbacks e retornar erro 400 se `empresa` for `null`
- A emissão simplesmente para até o problema ser corrigido — melhor que emitir dados errados

---

### #3 — `@ts-nocheck` nas Edge Functions ⚠️ PIOR QUE DESCRITO

**Descrito:** 3 funções com `@ts-nocheck`
**Real:** **5 funções** com `@ts-nocheck`:

| Função | `@ts-nocheck` |
|--------|:--:|
| `alterar-role` | ✅ |
| `baixar-titulo` | ✅ |
| `deletar-registro` | ✅ |
| `criar-convite` | ✅ |
| `validar-convite` | ✅ |

**Gravidade:** 🟡 Média (não 🔴 pela presença de validações manuais boas)
**Impacto real:** Erros de tipo passam silenciosamente. Porém, o código dessas funções tem validação manual razoável — o risco é em refatorações futuras.

**Pode implementar sem quebrar?** ✅ SIM, com cuidado
- Remover `@ts-nocheck` um a um e corrigir erros de tipo que surgirem
- Risco: erros de tipo podem revelar bugs latentes. Tratar incrementalmente.

---

## 🟡 Fragilidades Médias (#4–#8)

### #4 — Permissão só no frontend ✅ CONFIRMADO

**Nuance importante:** As RLS estão ativas em 82 tabelas (confirmado pelo audit test). A análise está correta que é **camada única** mas a RLS é a camada certa — o problema é que não há segunda barreira se a RLS tiver bug.

**Pode implementar sem quebrar?** ⚠️ SIM, mas complexo
- Adicionar middleware de autorização nas Edge Functions existentes é viável
- Para operações diretas via `supabase-js` no client, a RLS é a barreira (ok)
- Recomendo: audit das RLS policies existentes antes de criar segunda camada

---

### #5 — CSP com `'unsafe-inline'` para style-src ✅ CONFIRMADO

**Arquivo:** [headers.ts](file:///d:/VS%20Code/AllVidros/src/lib/security/headers.ts#L4)

```typescript
const BASE_CSP =
  "...style-src 'self' 'unsafe-inline'; ...";
```

**Pode implementar sem quebrar?** ⚠️ RISCO MÉDIO
- Remover `'unsafe-inline'` de style-src requer nonce/hash para **todos** os estilos inline
- TailwindCSS gera estilos via classes (ok), mas componentes de terceiros e `<style>` tags podem quebrar
- Precisa de teste visual extensivo após a mudança
- **Recomendo:** migrar gradualmente — primeiro adicionar nonce em style-src mantendo `unsafe-inline`, depois remover

---

### #6 — JWT armazenado em localStorage ✅ CONFIRMADO

**Arquivo:** [auth/storage.ts](file:///d:/VS%20Code/AllVidros/src/lib/auth/storage.ts#L80-L81)

```typescript
const writeJson = (key: string, value: unknown): void => {
  window.localStorage.setItem(key, JSON.stringify(value));
};
export const setStoredSession = (session: AuthSession): void => {
  writeJson(AUTH_SESSION_KEY, session);
};
```

**Pode implementar sem quebrar?** ⚠️ RISCO MÉDIO
- Migrar para cookie httpOnly requer server-side middleware para setar/ler cookies
- Com TanStack Start (SSR), é viável mas precisa de refatoração no auth flow
- **Alternativa mais segura e simples:** usar `sessionStorage` (fecha com a aba) — menor superfície de ataque
- O Supabase `supabase-js` por padrão já gerencia sua própria sessão em localStorage (via `autoRefreshToken`). A duplicação em `AUTH_SESSION_KEY` adiciona risco extra

---

### #7 — Empresa ID fixo via VITE_DEFAULT_EMPRESA_ID ✅ CONFIRMADO

**Arquivo:** [company.ts](file:///d:/VS%20Code/AllVidros/src/lib/supabase/company.ts)

```typescript
export const getDefaultEmpresaId = (): string => {
  const configuredEmpresaId = import.meta.env.VITE_DEFAULT_EMPRESA_ID;
  // UUID fixo no .env: 00000000-0000-0000-0000-000000000001
```

**Pode implementar sem quebrar?** ⚠️ DEPENDE
- Hoje o sistema é single-tenant (uma empresa). Trocar para derivar `empresa_id` do perfil do usuário logado requer alteração em **todos os hooks** que usam `getDefaultEmpresaId()`
- Para o MVP atual (1 empresa), o risco é aceito
- Para multi-tenancy real, é refatoração significativa

---

### #8 — CORS `Access-Control-Allow-Origin: *` ✅ CONFIRMADO

**Abrangência:** 9 de 10 Edge Functions (todas exceto `webhook-nfe` que nem tem CORS handler)

**Pode implementar sem quebrar?** ✅ SIM
- Substituir `"*"` pelo domínio real do app (ex: `https://modulaapp.netlify.app`) 
- Adicionar variável de ambiente `SITE_URL` ou `ALLOWED_ORIGINS`
- Em dev, pode manter `*` ou usar `localhost:3000`
- **Zero risco de quebra** se o domínio for configurado corretamente

---

## 🔵 Leves / Boas Práticas (#9–#13)

### #9 — Sem rate limit nas Edge Functions ✅ CONFIRMADO

**Pode implementar sem quebrar?** ✅ SIM
- Supabase Edge Functions não têm rate limiting nativo
- Implementar via header `X-Forwarded-For` + contagem in-memory (ou tabela `rate_limits`)
- Sem impacto em funcionalidades existentes

---

### #10 — Input sanitizer subutilizado ⚠️ PARCIALMENTE CONFIRMADO

**Realidade:** `sanitizeTextFields` é usado em **7 de 18 hooks** do diretório:

| Hook | Sanitizer | 
|------|:---------:|
| `useClientes` | ✅ |
| `useColaboradores` | ✅ |
| `useEstoque` | ✅ |
| `useKits` | ✅ |
| `useOrcamentos` | ✅ |
| `usePedidos` | ✅ |
| `useProdutos` | ✅ |
| `useDashboardData` | ❌ (read-only, ok) |
| `useFaturamentoCliente` | ❌ (read-only, ok) |
| `useFinanceData` | ❌ (não sanitiza inputs) |
| `useFiscalData` | ❌ (não sanitiza inputs) |
| `useInadimplencia` | ❌ (read-only, ok) |
| `useInstalacoes` | ❌ (escrita sem sanitizer) |
| `useInstaladores` | ❌ (read-only, ok) |
| `useKPIsRelatorios` | ❌ (read-only, ok) |
| `useProdutosOrcamento` | ❌ (read-only, ok) |
| `useProdutosVendidos` | ❌ (read-only, ok) |
| `useRelatorios` | ❌ (read-only, ok) |

**Gaps reais:** `useInstalacoes` e `useFinanceData` fazem escrita sem sanitizar.

**Pode implementar sem quebrar?** ✅ SIM
- Adicionar sanitizer nos hooks que fazem escrita é mecânico
- Ou criar um wrapper/middleware automático

---

### #11 — Senhas em localStorage (modo DEV) ✅ CONFIRMADO

**Arquivo:** [auth/storage.ts](file:///d:/VS%20Code/AllVidros/src/lib/auth/storage.ts#L7-L17)

Valores estão como `"REDACTED"` — já foi tratado em conversas anteriores. **Risco aceito para DEV.**

---

### #12 — Fire-and-forget sem await ✅ CONFIRMADO

**3 ocorrências em** [client.ts](file:///d:/VS%20Code/AllVidros/src/lib/auth/client.ts):
- Linha 237: `void ensureSupabaseProfile(supabase, data.user).catch(...)`
- Linha 288: `void ensureSupabaseProfile(supabase, data.session.user).catch(...)`  
- Linha 452: `void ensureSupabaseProfile(supabase, data.user, inviteEmpresaId).catch(...)`
- Linha 458: `void supabase.from("convites").update(...)` — **sem `.catch()`!**

**Pode implementar sem quebrar?** ✅ SIM
- Para `ensureSupabaseProfile`: o perfil é criado em background — se falhar, o login funciona mas o perfil fica desatualizado. Aceitar e logar.
- Para o update de convites (L458): adicionar `.catch()` é trivial

---

### #13 — Token Focus NFe vaza em log de erro ✅ CONFIRMADO

**Arquivo:** [emitir-nfe/index.ts](file:///d:/VS%20Code/AllVidros/supabase/functions/emitir-nfe/index.ts#L228-L240)

```typescript
// Linha 240: focusData pode conter token em base64
return jsonResponse({ success: false, error: String(motivo), details: focusData });
```

O `focusData` retornado ao **client** pode conter headers/tokens da API Focus NFe. E o `cancelar-nfe` (L95) faz `console.error("[cancelar-nfe] Focus NFe error:", focusData)` que também pode logar tokens.

**Pode implementar sem quebrar?** ✅ SIM
- Filtrar campos sensíveis antes de logar/retornar
- Retornar apenas `motivo` ao client, não o `focusData` completo

---

## 🆕 Achados Adicionais (não mencionados na análise)

### #14 — 🔴 `config-fiscal`, `emitir-nfe`, `cancelar-nfe`, `enviar-nfe-email` SEM autenticação JWT

As Edge Functions NFe (`config-fiscal`, `emitir-nfe`, `cancelar-nfe`, `enviar-nfe-email`) **não validam JWT**. Não têm sequer `req.headers.get("Authorization")`. Qualquer request com o body correto é aceito.

Compare com `alterar-role`, `deletar-registro`, `baixar-titulo` que validam JWT + perfil + empresa.

| Função | Valida JWT | Valida Perfil | Valida Empresa |
|--------|:---------:|:------------:|:--------------:|
| `alterar-role` | ✅ | ✅ | ✅ |
| `baixar-titulo` | ✅ | ✅ | ✅ |
| `deletar-registro` | ✅ | ✅ | ✅ |
| `criar-convite` | ✅ | ✅ | — |
| `validar-convite` | — (pública, ok) | — | — |
| **`config-fiscal`** | ❌ | ❌ | ❌ |
| **`emitir-nfe`** | ❌ | ❌ | ❌ |
| **`cancelar-nfe`** | ❌ | ❌ | ❌ |
| **`enviar-nfe-email`** | ❌ | ❌ | ❌ |
| `webhook-nfe` | ❌ (webhook, diferente) | — | — |

**Gravidade:** 🔴 Crítica
**Impacto:** Qualquer pessoa pode emitir NF-e, cancelar NF-e, enviar e-mails, e ler/escrever tokens Focus NFe se souber a URL do Supabase.

**Pode implementar sem quebrar?** ✅ SIM
- Adicionar o mesmo padrão de auth JWT + perfil usado em `alterar-role`
- O frontend já envia `Authorization: Bearer <token>` via `supabase-js` automaticamente

---

### #15 — `partners/storage.ts` readJson sem try/catch

O `readJson` em `partners/storage.ts` (L151) não tem `try/catch` no `JSON.parse`, ao contrário da versão em `auth/storage.ts` que tem proteção.

**Pode implementar sem quebrar?** ✅ SIM — adicionar try/catch trivial

---

### #16 — `criar-convite` também tem `@ts-nocheck` (total = 5, não 3)

Atualização: 5 funções com `@ts-nocheck`, não 3 como descrito na análise.

---

## 📋 Resumo: Viabilidade de Implementação

### Resposta à pergunta central: **SIM, é possível implementar todos os pontos sem quebrar o sistema.**

Mas com graus diferentes de risco e esforço:

| Prioridade | Item | Risco de Quebra | Esforço |
|:----------:|------|:--------------:|:-------:|
| 🔥 | #1 Autenticar webhook-nfe | 🟢 Zero | 1h |
| 🔥 | #2 Remover fallback hardcoded | 🟢 Zero | 30min |
| 🔥 | #14 Auth JWT nas 4 funções NFe | 🟢 Baixo | 2h |
| ⏳ | #8 Limitar CORS ao domínio | 🟢 Baixo | 30min |
| ⏳ | #13 Sanitizar logs/responses | 🟢 Zero | 30min |
| ⏳ | #3 Remover @ts-nocheck (5 funções) | 🟡 Médio | 3h |
| ⏳ | #4 Centralizar readJson/writeJson | 🟢 Zero | 1h |
| ⏳ | #10 Expandir sanitizer | 🟢 Zero | 1h |
| ⏳ | #12 Tratar fire-and-forget | 🟢 Zero | 30min |
| ⏳ | #9 Rate limit Edge Functions | 🟢 Baixo | 2h |
| 🧠 | #5 CSP sem unsafe-inline | 🟠 Alto | 4h+ (teste visual) |
| 🧠 | #6 JWT → sessionStorage/cookie | 🟠 Alto | 4h+ (refator auth) |
| 🧠 | #7 empresa_id dinâmico | 🔴 Muito alto | 8h+ (todos hooks) |
| 🧠 | #4 Segunda camada de autorização | 🟡 Médio | 4h+ |

### Itens que podem ser feitos AGORA com segurança total:
- #1, #2, #8, #13, #14, #10, #12, #4 (duplicação readJson)

### Itens que precisam de testes extensivos:
- #3, #5, #6

### Itens que são refatoração estrutural (médio prazo):
- #7, #4 (segunda camada auth)

---

> [!IMPORTANT]
> O achado **#14** (4 Edge Functions NFe sem autenticação JWT) é **mais grave que o #1** (webhook sem auth) porque afeta operações que o próprio sistema chama — emitir, cancelar, configurar fiscal, enviar email — e qualquer pessoa com a URL do Supabase pode executá-las.
