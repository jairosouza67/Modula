-- =================================================================
-- SECURITY FIX: Remover bypass de RLS para authenticated users
-- 
-- PROBLEMA (C-03 do Security Audit):
-- A função can_access_empresa() permitia que QUALQUER usuário
-- autenticado acessasse dados da empresa 000...001 sem estar
-- vinculado a ela via perfis_usuario. Isso significa que um
-- auto-registro via signUp dava acesso total ao sistema.
--
-- CORREÇÃO:
-- Remover a cláusula "auth.role() = 'authenticated' AND empresa_id = UUID_FIXO"
-- Manter apenas os caminhos legítimos de acesso:
--   1. service_role (admin do Supabase)
--   2. JWT com empresa_id no payload (futuro)
--   3. Vínculo via perfis_usuario (caminho correto)
-- =================================================================

-- Recriar a função can_access_empresa SEM o bypass
CREATE OR REPLACE FUNCTION public.can_access_empresa(target_empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- 1. Service role sempre tem acesso (admin do Supabase)
    auth.role() = 'service_role'
    
    -- 2. JWT com empresa_id no payload (para tokens customizados)
    OR (
      auth.jwt() ->> 'empresa_id' IS NOT NULL
      AND target_empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
    )
    
    -- 3. Usuário vinculado à empresa via perfis_usuario (caminho seguro)
    OR EXISTS (
      SELECT 1
      FROM public.perfis_usuario p
      WHERE p.user_id = auth.uid()
        AND p.empresa_id = target_empresa_id
    )
    
    -- ❌ REMOVIDO: bypass que dava acesso universal a authenticated users
    -- OR (
    --   auth.role() = 'authenticated'
    --   AND target_empresa_id = '00000000-0000-0000-0000-000000000001'::uuid
    -- )
  );
$$;

-- Garantir que as permissões de execução estão corretas
GRANT EXECUTE ON FUNCTION public.can_access_empresa(uuid) TO anon, authenticated, service_role;

-- Recriar current_empresa_id sem alterações (manter consistência)
CREATE OR REPLACE FUNCTION public.current_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.empresa_id
  FROM public.perfis_usuario p
  WHERE p.user_id = auth.uid()
  ORDER BY p.created_at ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_empresa_id() TO anon, authenticated, service_role;

-- =================================================================
-- NOTA IMPORTANTE PARA O DEV:
-- Após aplicar esta migration, o usuário PRECISA ter um registro
-- em perfis_usuario vinculado à empresa para acessar dados.
-- 
-- Se o app usa mock auth (sem Supabase Auth real), o user_id
-- do mock DEVE existir em perfis_usuario com a empresa correta.
--
-- Para criar o vínculo manualmente (via SQL Editor do Supabase):
--
-- INSERT INTO public.perfis_usuario (user_id, empresa_id, email, nome, role)
-- VALUES (
--   'SEU_USER_ID_AQUI',
--   '00000000-0000-0000-0000-000000000001',
--   'admin@modulaapp.com',
--   'Administrador',
--   'superadmin'
-- )
-- ON CONFLICT (user_id) DO NOTHING;
-- =================================================================
