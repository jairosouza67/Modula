# 🔒 Auditoria de Segurança — ModulaAPP

> **Data:** 25 de Junho de 2026  
> **Escopo:** Código-fonte completo (frontend TanStack Start + Supabase)  
> **Classificação:** Uso Interno

---

## Sumário Executivo

Esta auditoria analisou a segurança do sistema ModulaAPP, identificando **15 vulnerabilidades** divididas entre críticas, altas, médias e baixas. O sistema possui boas práticas como RLS (Row Level Security) no banco, módulo LGPD e controle de acesso baseado em papéis, mas carece de **defesa em profundidade** — várias funções de segurança existem no código mas não são efetivamente utilizadas.

### Resumo por Severidade

| Severidade | Quantidade | Risco |
|:----------:|:----------:|:------|
| 🔴 Crítico | 4 | Acesso não autorizado a dados, exposição de credenciais |
| 🟠 Alto | 5 | Vulnerações de autenticação e integridade |
| 🟡 Médio | 6 | Deficiências em defesa em profundidade |
| 🟢 Baixo | 2 | Vazamento de informação, hygiene |

---

## 🔴 CRÍTICO

### C-01: Senhas em texto puro no `localStorage` (Modo Mock)

**Arquivo:** `src/lib/auth/storage.ts`

```typescript
export interface MockAuthUser extends AuthUser {
  password: string; // senha em plaintext
}
```

O modo `mock` de autenticação armazena usuários com senhas em texto puro no `localStorage` do navegador:

- `saveStoredMockUsers()` serializa `MockAuthUser[]` (com `password`) para `localStorage`
- `addStoredMockUser()` adiciona novos usuários com senha visível
- Qualquer extensão de navegador, script XSS ou pessoa com acesso ao DevTools pode ler todas as senhas

**Impacto:** 🔴 Comprometimento total de credenciais em modo de desenvolvimento/teste.  
**Mitigação:** Usar Supabase Auth em produção. Remover persistência de senhas do localStorage no modo mock.

---

### C-02: Sessão de autenticação em `localStorage` (sem httpOnly)

**Arquivo:** `src/lib/auth/storage.ts`

```typescript
const AUTH_SESSION_KEY = "modulaapp:auth:session";
export const setStoredSession = (session: AuthSession): void => {
  writeJson(AUTH_SESSION_KEY, session); // localStorage.setItem
};
```

A sessão (`accessToken`, role, email, nome) é salva em `localStorage`:

- ❌ Não possui flag `httpOnly` (impossível em localStorage)
- ❌ Acessível via qualquer JavaScript executado na origem
- ❌ Vulnerável a XSS e a ataques de extensões maliciosas
- ❌ Persiste mesmo após fechar o navegador (sem expiração forçada)

**Impacto:** 🔴 Um XSS permite sequestro completo de sessão.  
**Mitigação:** Utilizar cookies httpOnly com o Supabase Auth (suportado via `setSession`), ou implementar renovação via `onAuthStateChange`.

---

### C-03: Todas as queries rodam com a Supabase Anon Key

**Arquivo:** `src/lib/supabase/client.ts`

```typescript
browserClient = createClient(supabaseUrl, supabaseAnonKey, { ... });
```

A segurança de **todos os dados** depende exclusivamente das RLS policies do Supabase estarem corretas. Não há:

- Validação server-side adicional
- Edge Functions como camada de API
- Service Role para operações sensíveis

**Impacto:** 🔴 Se qualquer RLS policy estiver ausente ou mal configurada, **qualquer** usuário autenticado pode acessar ou modificar dados de **qualquer** empresa.  
**Mitigação:** Revisão periódica de todas as RLS policies. Criar migração de verificação automatizada. Considerar Edge Functions para operações críticas.

---

### C-04: Fallback de `empresa_id` hardcoded com bypass histórico

**Arquivo:** `src/lib/supabase/company.ts`

```typescript
const FALLBACK_EMPRESA_ID = "00000000-0000-0000-0000-000000000001";
```

**Migração:** `supabase/migrations/20260601000000_security_fix_rls_bypass.sql`

Esta migration documenta que existia um bypass crítico:

```sql
-- ❌ REMOVIDO: bypass que dava acesso universal a authenticated users
-- OR (
--   auth.role() = 'authenticated'
--   AND target_empresa_id = '00000000-0000-0000-0000-000000000001'::uuid
-- )
```

Qualquer usuário autenticado conseguia acessar dados da empresa `000...001`. O valor `00000000-0000-0000-0000-000000000001` continua sendo o **fallback padrão** usado por toda aplicação.

**Impacto:** 🔴 Potencial acesso cruzado entre empresas se alguma outra empresa usar UUID semelhante.  
**Mitigação:** Exigir que `VITE_DEFAULT_EMPRESA_ID` seja configurado explicitamente, sem fallback automático.

---

## 🟠 ALTO

### H-01: Validação de input não é aplicada

**Arquivo:** `src/lib/auth/security.ts`

```typescript
export function validateInput(input: string): { isValid: boolean; reason?: string } {
  // Detecta SQLi, XSS...
}
```

A função possui detecção para:

| Ameaça | Padrões |
|--------|---------|
| XSS | `<script>`, `javascript:`, `onerror=`, `onload=`, `onclick=`, `<iframe>`, `<svg>` |
| SQLi | `' --`, `OR 1=1`, `UNION SELECT`, `DROP TABLE`, `EXEC` |

**Mas não é chamada em lugar nenhum.** Dados de formulários vão diretamente para queries do Supabase sem sanitização.

**Arquivos afetados:** Todos os hooks com `insert`/`update`:
- `useClientes.ts` — nome, documento, email
- `useProdutos.ts` — código, descrição
- `useOrcamentos.ts` — descrição, itens
- `useEstoque.ts` — código, descrição
- `useColaboradores.ts` — nome, cargo, documento

**Impacto:** 🟠 Defesa em profundidade ausente. Embora o Supabase SDK use queries parametrizadas, dados maliciosos podem chegar ao banco ou ser renderizados sem sanitização.  
**Mitigação:** Aplicar `validateInput()` em todos os campos de texto antes de operações de escrita.

---

### H-02: Proteção CSRF não implementada

**Arquivo:** `src/lib/auth/security.ts`

```typescript
export function validateCsrfToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false;
  return token === expectedToken;
}
```

A função existe mas:

- ❌ Não há geração de tokens CSRF
- ❌ Não há armazenamento de tokens na sessão
- ❌ Não há validação em formulário algum
- ❌ Não há middleware de verificação

Todas as operações mutantes (`insert`, `update`, `delete`) via Supabase podem ser alvo de CSRF se um usuário autenticado visitar um site malicioso.

**Impacto:** 🟠 Possível execução de ações não intencionais em usuário logado.  
**Mitigação:** Implementar tokens CSRF usando o `XSRF-TOKEN` do Supabase Auth ou validar o header `Origin`/`Referer`.

---

### H-03: Rate limiting / brute-force não aplicado

**Arquivo:** `src/lib/auth/security.ts`

```typescript
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

export function recordLoginAttempt(userId: string): { allowed: boolean } {
  // Bloqueia após 10 tentativas em 1 minuto
  if (attempt.count > 10) return { allowed: false };
  return { allowed: true };
}
```

A função existe mas **nunca é chamada** antes do login:

```typescript
// src/lib/auth/client.ts
async login(email: string, password: string): Promise<AuthSession> {
  // ❌ recordLoginAttempt(email) não é chamado aqui
  const { data, error } = await supabase.auth.signInWithPassword({ ... });
}
```

**Impacto:** 🟠 Força bruta de senhas é possível sem restrições.  
**Mitigação:** Chamar `recordLoginAttempt()` no início do `authClient.login()` e bloquear antes de chamar o Supabase.

---

### H-04: Casts `as any` ignoram type safety

**Arquivos:** Múltiplos hooks

```typescript
// src/hooks/useClientes.ts — linha 69
.insert({ empresa_id: empresaId, nome: cliente.nome, ... } as any)
//                                      ^^^^^^^ fields extras podem ser inseridos

// src/hooks/useInstalacoes.ts — linha 153
status_instalacao: params.status_instalacao as any,
```

Aproximadamente **30+ ocorrências** de `as any` em operações de dados. Isso permite:

- Inserção de colunas inexistentes
- Bypass de validação de tipo do TypeScript
- Dados maliciosos em campos não esperados

**Arquivos críticos:**

| Arquivo | Ocorrências |
|---------|:-----------:|
| `useClientes.ts` | 7 |
| `useEstoque.ts` | 3 |
| `useInstalacoes.ts` | 10+ |
| `useOrcamentos.ts` | 2 |
| `useProdutos.ts` | 0 |

**Impacto:** 🟠 Mass assignment potencial em operações de banco.  
**Mitigação:** Substituir `as any` pelos tipos concretos do `Database` schema (`ClienteInsert`, `EstoqueItemUpdate`, etc).

---

### H-05: Logs de auditoria expõem informações sensíveis no console

**Arquivo:** `src/lib/auth/security.ts`

```typescript
console.log(`[AUDIT] ${event.severidade.toUpperCase()} - ${event.acao} by ${event.userId}`);
```

Eventos de auditoria são logados no console do navegador, acessível via DevTools (F12) por qualquer usuário. Informações expostas incluem:

- `userId` de quem realizou a ação
- `acao` executada
- `severidade` do evento
- `detalhes` com contexto adicional

**Impacto:** 🟠 Vazamento de informações sensíveis para usuários com acesso ao navegador.  
**Mitigação:** Remover `console.log` de produção ou restringir a logs de baixa severidade sem dados identificáveis.

---

## 🟡 MÉDIO

### M-01: Ausência de headers de segurança HTTP

**Arquivos:** `src/server.ts`, `src/start.ts`

O servidor só define `content-type` nos responses:

```typescript
headers: { "content-type": "text/html; charset=utf-8" }
```

Headers ausentes:

| Header | Status | Risco |
|--------|:------:|:------|
| `Content-Security-Policy` | ❌ | XSS, injeção de scripts |
| `X-Frame-Options: DENY` | ❌ | Clickjacking |
| `X-Content-Type-Options: nosniff` | ❌ | MIME-sniffing |
| `Strict-Transport-Security` | ❌ | Downgrade HTTP |
| `Referrer-Policy: strict-origin-when-cross-origin` | ❌ | Vazamento de URL |

**Impacto:** 🟡 Aplicação vulnerável a clickjacking, MIME-sniffing e downgrade attacks.  
**Mitigação:** Adicionar middleware no servidor (`src/server.ts`) que injete todos os security headers antes de cada resposta.

---

### M-02: Erros de perfil/autorização são silenciados

**Arquivo:** `src/lib/auth/client.ts`

```typescript
void ensureSupabaseProfile(supabase, data.user).catch(() => {});
//                                                          ^^ silencia qualquer erro
```

Ocorre em 3 lugares:

1. `login()` — linha 207
2. `restoreSession()` — linha 256
3. `signUp()` — linha 395

Se a criação/atualização do perfil (`perfis_usuario`) falhar (ex: RLS bloqueando, chave duplicada), o erro é silenciosamente engolido. O usuário pode fazer login mas ficar sem perfil → sem acesso a dados.

**Impacto:** 🟡 Falhas de autorização podem passar despercebidas, resultando em usuários sem acesso sem explicação.  
**Mitigação:** Logar o erro pelo menos, e considerar retry ou fallback com notificação ao usuário.

---

### M-03: Auto-registro sem aprovação

**Arquivo:** `src/routes/login.tsx`

```typescript
const handleRegister = async (event: React.FormEvent) => {
  await signUp(email, password, name.trim());
  await navigate({ to: safeRedirectPath }); // login automático após registro
};
```

Em modo `supabase`, qualquer pessoa pode:

1. Acessar a página de login
2. Clicar em "Criar conta"
3. Preencher nome, email e senha
4. Entrar automaticamente no sistema

**Impacto:** 🟡 Qualquer pessoa pode criar uma conta e acessar o sistema. Embora as RLS limits por empresa, ainda há exposição.  
**Mitigação:** Implementar fluxo de convite (apenas admins podem criar usuários), ou exigir confirmação de email antes de conceder acesso.

---

### M-04: Validação de senha fraca

**Arquivo:** `src/routes/login.tsx`

```typescript
if (password.length < 6) {
  setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
  return;
}
```

Única validação: **mínimo 6 caracteres**. Não há:

- ❌ Exigência de maiúsculas
- ❌ Exigência de números
- ❌ Exigência de caracteres especiais
- ❌ Exigência de comprimento mínimo maior (recomendado: 8+)
- ❌ Verificação contra senhas comuns
- ❌ Verificação contra vazamentos conhecidos

**Impacto:** 🟡 Senhas fracas são permitidas, facilitando ataques de força bruta.  
**Mitigação:** Implementar política de senha forte (mín. 8 chars, maiúscula, minúscula, número, especial) usando regex ou lib como `zxcvbn`.

---

### M-05: Possível Open Redirect no parâmetro `redirect`

**Arquivo:** `src/routes/login.tsx`

```typescript
validateSearch: (search: Record<string, unknown>) => ({
  redirect: typeof search.redirect === "string" ? search.redirect : "/dashboard",
}),

const normalizeRedirectPath = (redirectPath: string): string =>
  redirectPath.startsWith("/") ? redirectPath : "/dashboard";
```

A validação só checa se começa com `/`, mas:

- `//evil.com` começa com `/` e é interpretado como protocolo-relative URL
- `@` pode ser usado para confundir
- URLs como `\/\/evil.com` podem funcionar em alguns navegadores

**Impacto:** 🟡 Possível phishing usando redirecionamento para sites maliciosos.  
**Mitigação:** Usar `new URL(redirectPath, window.location.origin)` e validar se o hostname é o mesmo.

---

### M-06: Dados mock com credenciais hardcoded

**Arquivo:** `src/lib/auth/storage.ts`

```typescript
const DEFAULT_MOCK_USERS: MockAuthUser[] = [
  {
    id: "usr_superadmin",
    name: "Admin Dev",
    email: "admin@dev.local",
    role: "superadmin",
    password: "REDACTED", // em versões anteriores, senhas reais
  },
  // ... 5 usuários com diferentes papéis
];
```

Embora as senhas estejam como "REDACTED" na versão atual:

- O formato `MockAuthUser` inclui `password: string` — se alguém adicionar um novo usuário, a senha vai para localStorage
- A página de login em modo `mock` exibe: "Use o perfil de desenvolvimento para iniciar (admin@dev.local / REDACTED)."

**Impacto:** 🟡 Risco de commit de senhas reais, exposição em ambientes de desenvolvimento.  
**Mitigação:** Remover completamente o modo mock para produção. Usar variáveis de ambiente para credenciais de desenvolvimento.

---

## 🟢 BAIXO

### L-01: Erros do Supabase expostos ao usuário

**Arquivos:** Múltiplos hooks

```typescript
// useClientes.ts
onError: (error) => {
  toast.error("Erro ao cadastrar cliente: " + error.message);
  //                                   ^^ mensagem de erro bruta do Supabase
};
```

Mensagens de erro do Supabase são exibidas diretamente ao usuário via `toast.error()`. Isso pode vazar:

- Nomes de tabelas e colunas
- Informações sobre estrutura do banco
- Detalhes de constraints e validações

**Mitigação:** Usar mensagens amigáveis padronizadas e logar o erro técnico separadamente.

---

### L-02: Anon Key exposta em variável VITE_ pública

**Arquivo:** `.env`

```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Isso é esperado e **correto** para frontends Supabase (a anon key é pública por design). No entanto:

- A segurança depende 100% das RLS estarem corretas
- Se a anon key for revogada no Supabase, a aplicação para de funcionar
- Qualquer um pode inspecionar o bundle e extrair a chave

**Mitigação:** Garantir que RLS esteja habilitada em **todas** as tabelas. Considerar usar Supabase Edge Functions para operações que exigem service_role.

---

## ✅ Pontos Fortes

Apesar das vulnerabilidades identificadas, o sistema possui boas práticas de segurança:

| Prática | Status | Detalhes |
|---------|:------:|----------|
| **RLS (Row Level Security)** | ✅ | Implementada em todas as tabelas principais |
| **Correção de bypass RLS** | ✅ | Migration `20260601000000` removeu bypass crítico |
| **Módulo LGPD** | ✅ | Mascaramento de dados sensíveis (CPF, email, telefone) |
| **Anonimização** | ✅ | Função `anonimizarTitular()` implementada |
| **Controle de acesso por papel** | ✅ | `PrivateRoute` + `canAccessPath()` |
| **Auditoria** | ✅ | `logAuditEvent()` registra eventos no banco |
| **Uso correto da anon key** | ✅ | Service role não é exposta no frontend |
| **Soft delete** | ✅ | `deleted_at` em vez de exclusão física |
| **Políticas de retenção** | ✅ | `retention.ts` define períodos por módulo |
| **Separação de empresa** | ✅ | `empresa_id` em todas as queries |

---

## 🔧 Plano de Ação Recomendado

### Imediato (1-2 dias)

| # | Ação | Arquivo(s) | Esforço |
|:-:|:-----|:-----------|:-------:|
| 1 | Aplicar `validateInput()` em todos os formulários | Todos os hooks | 🟢 Fácil |
| 2 | Aplicar `recordLoginAttempt()` no fluxo de login | `auth/client.ts` | 🟢 Fácil |
| 3 | Remover senhas do localStorage no modo mock | `auth/storage.ts` | 🟢 Fácil |
| 4 | Substituir `as any` por tipos concretos | Múltiplos hooks | 🟡 Médio |

### Curto Prazo (1 semana)

| # | Ação | Arquivo(s) | Esforço |
|:-:|:-----|:-----------|:-------:|
| 5 | Implementar CSRF tokens ou validação Origin | `auth/security.ts` | 🟡 Médio |
| 6 | Adicionar security headers HTTP | `server.ts` | 🟢 Fácil |
| 7 | Aprimorar política de senha | `login.tsx` | 🟢 Fácil |
| 8 | Corrigir possível open redirect | `login.tsx` | 🟢 Fácil |

### Médio Prazo (1 mês)

| # | Ação | Esforço |
|:-:|:-----|:-------:|
| 9 | Implementar fluxo de convite (invite-only registration) | 🟡 Médio |
| 10 | Revisar e testar todas as RLS policies | 🟡 Médio |
| 11 | Criar auditoria automatizada de segurança (testes) | 🟡 Médio |
| 12 | Implementar Edge Functions para operações sensíveis | 🔴 Difícil |

---

## 📋 Checklist para Revisão de Código

Copie e cole este checklist em PRs de novas funcionalidades:

- [ ] Dados de input são validados com `validateInput()`?
- [ ] A operação tem tratamento de erro adequado (sem `catch(() => {})`)?
- [ ] O `empresa_id` está sendo passado corretamente na query?
- [ ] A query respeita a RLS policy da tabela?
- [ ] Senhas/tokens não estão sendo logados no console?
- [ ] `as any` foi evitado em operações de banco?
- [ ] A rota tem a verificação de permissão adequada?
- [ ] Dados sensíveis estão mascarados em logs e UI?

---

## 🔍 Metodologia

Esta auditoria foi realizada através de:

1. **Análise estática de código** — Revisão manual de todos os arquivos de segurança
2. **Análise de dependências** — Verificação de packages.json para bibliotecas conhecidas
3. **Análise de migrations SQL** — Revisão de RLS policies e triggers
4. **Análise de fluxo de dados** — Rastreamento de input do usuário até o banco
5. **Análise de configuração** — Variáveis de ambiente, headers HTTP, deployment config

---

*Documento gerado automaticamente por análise de código em 25/06/2026.*
*Revisão manual recomendada a cada 3 meses ou a cada release major.*
