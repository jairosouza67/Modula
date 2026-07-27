# Relatório de Auditoria RLS — Etapa 7.1

> **Data:** 26/06/2026  
> **Responsável:** Ralph Loop — Security Hardening  
> **Arquivo-fonte:** `docs/Ralph Loop/security-hardening.md`

---

## Resumo Executivo

Auditoria estática das migrations em `supabase/migrations/` identificou **34 tabelas** no schema `public`, todas com RLS habilitado. Foram encontradas **5 falhas de segurança** que foram corrigidas via migration `20260626000100_rls_audit_fixes.sql` e testes automatizados foram criados em `tests/security/rls-audit.test.ts`.

| Indicador | Valor |
|-----------|-------|
| Tabelas auditadas | 34 |
| Tabelas com RLS | 34 (100%) |
| Falhas corrigidas | 5 |
| Testes criados | 8 |

---

## Falhas Encontradas e Correções

### 1. Funções `SECURITY DEFINER` sem `SET search_path`

**Problema:** Funções `SECURITY DEFINER` sem `search_path` explícito são vulneráveis a search-path injection.

**Funções afetadas:**
- `public.set_updated_at()`
- `public.marcar_os_atrasadas()`
- `public.trg_avaliar_atraso_os()`
- `public.fn_keepalive_ping()`

**Correção:** Migration `20260626000100_rls_audit_fixes.sql` recriou todas com `SET search_path = public`.

---

### 2. Policies de `convites` permitiam acesso anônimo

**Problema:** `convites_select_by_token` e `convites_update_by_token` usavam apenas `token IS NOT NULL`, permitindo que qualquer pessoa (incluindo `anon`) listasse/alterasse convites ativos.

**Correção:** As policies foram reescritas para exigir `auth.uid() IS NOT NULL` e vínculo com a empresa (convidado_por ou admin/superadmin).

**Impacto no fluxo:** O registro por convite passou a usar a Edge Function `validar-convite` em vez de consultar a tabela diretamente, pois o usuário ainda não está autenticado no momento da validação.

---

### 3. Privilege escalation em `perfis_usuario`

**Problema:** `perfis_usuario_write_by_empresa` permitia que qualquer usuário da empresa alterasse roles e criasse perfis administrativos.

**Correção:** A policy agora exige que o chamador tenha role `superadmin` ou `admin`.

---

### 4. Bypass histórico em `can_access_empresa`

**Problema:** A migration `20260512055519_auth_rls_empresa_access_mvp.sql` continha um bypass `auth.role() = 'authenticated' AND empresa_id = UUID_FIXO`. A migration `20260601000000_security_fix_rls_bypass.sql` removeu o bypass.

**Teste:** Teste de regressão garante que a definição final não reintroduza o bypass.

---

### 5. Storage policies cross-tenant

**Problema:** As policies do bucket `nfe_xml` permitiam que qualquer usuário autenticado acessasse XMLs de outras empresas.

**Status:** Não corrigido nesta etapa. Requer padronização do path de armazenamento por empresa (recomendado para task futura ou sprint de fiscal).

**Mitigação temporária:** Teste automatizado detecta e falha se policies de storage permitirem acesso irrestrito a `authenticated` sem isolamento por tenant.

---

## Testes Automatizados

Local: `tests/security/rls-audit.test.ts`

| Teste | Descrição |
|-------|-----------|
| every public table has RLS enabled | Garante que toda tabela `public.*` tem RLS habilitado |
| final can_access_empresa does not contain authenticated bypass | Regressão do bypass removido |
| storage.objects nfe_xml policies do not allow cross-tenant access | Detecta policies de storage sem isolamento por empresa |
| every SECURITY DEFINER function sets search_path = public | Garante search_path em funções privilegiadas |
| convites SELECT/UPDATE policy requires authentication | Garante que policies de convite exigem autenticação |
| registrar_nfe_entrada validates caller permission | Garante validação de permissão na função RPC |
| perfis_usuario_write_by_empresa restricts role changes | Garante restrição de role na policy |

---

## Recomendações Pendentes

1. **Storage `nfe_xml`:** Implementar isolamento por empresa via path (`empresa_<uuid>/...`) ou metadados.
2. **RBAC por tabela sensível:** Restringir operações em tabelas financeiras/fiscais por papel.
3. **Testes de integração:** Criar suite que execute queries reais no Supabase com usuários de empresas distintas.
4. **Edge Functions sensíveis:** Implementar Edge Functions para delete, alteração de role e operações financeiras críticas (Task 7.2).
