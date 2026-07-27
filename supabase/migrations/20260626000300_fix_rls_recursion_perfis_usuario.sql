-- =================================================================
-- FIX: Recursão infinita na RLS policy de perfis_usuario
--
-- Problema: A policy perfis_usuario_write_by_empresa (FOR ALL)
-- continha EXISTS(SELECT FROM perfis_usuario) que reavaliava
-- as policies da própria tabela, gerando loop infinito.
--
-- Solução: Criar função SECURITY DEFINER is_admin_user() que
-- verifica o papel do usuário sem acionar RLS, e separar as
-- policies de SELECT e WRITE.
-- =================================================================

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfis_usuario p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('superadmin', 'admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

DROP POLICY IF EXISTS perfis_usuario_write_by_empresa ON public.perfis_usuario;
DROP POLICY IF EXISTS perfis_usuario_select_by_empresa ON public.perfis_usuario;

CREATE POLICY perfis_usuario_select_by_empresa
  ON public.perfis_usuario
  FOR SELECT
  USING (public.can_access_empresa(empresa_id));

CREATE POLICY perfis_usuario_write_by_empresa
  ON public.perfis_usuario
  FOR ALL
  USING (
    public.can_access_empresa(empresa_id)
    AND public.is_admin_user()
  )
  WITH CHECK (
    public.can_access_empresa(empresa_id)
    AND public.is_admin_user()
  );
