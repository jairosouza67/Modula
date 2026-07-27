-- =================================================================
-- SECURITY FIX: RLS Audit Fixes
-- Data: 2026-06-26
-- Origem: ETAPA 7 — RLS, Edge Functions e CSRF
--
-- Problemas corrigidos:
--   1. Funções SECURITY DEFINER sem SET search_path
--   2. Policies de convites permitiam acesso anônimo
--   3. perfis_usuario_write_by_empresa permitia privilege escalation
-- =================================================================

-- =================================================================
-- 1. Adicionar SET search_path = public em funções SECURITY DEFINER
-- =================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.marcar_os_atrasadas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ordens_servico
  SET is_atrasada = (data_previsao IS NOT NULL AND data_previsao < current_date)
  WHERE status NOT IN ('Concluido')
    AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_avaliar_atraso_os()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_atrasada := (NEW.data_previsao IS NOT NULL)
                     AND (NEW.data_previsao < current_date)
                     AND (NEW.status <> 'Concluido');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_keepalive_ping()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public._keepalive_log (pinged_at)
  VALUES (now());
END;
$$;

-- =================================================================
-- 2. Corrigir policies da tabela convites
--    SELECT/UPDATE agora exigem usuário autenticado e vínculo com a empresa.
--    O fluxo de registro por token será movido para Edge Function.
-- =================================================================

DROP POLICY IF EXISTS convites_select_by_token ON public.convites;
CREATE POLICY convites_select_by_token
  ON public.convites
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      auth.uid() = convidado_por
      OR EXISTS (
        SELECT 1
        FROM public.perfis_usuario p
        WHERE p.user_id = auth.uid()
          AND p.role IN ('superadmin', 'admin')
          AND p.empresa_id = convites.empresa_id
      )
    )
  );

DROP POLICY IF EXISTS convites_update_by_token ON public.convites;
CREATE POLICY convites_update_by_token
  ON public.convites
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      auth.uid() = convidado_por
      OR EXISTS (
        SELECT 1
        FROM public.perfis_usuario p
        WHERE p.user_id = auth.uid()
          AND p.role IN ('superadmin', 'admin')
          AND p.empresa_id = convites.empresa_id
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      auth.uid() = convidado_por
      OR EXISTS (
        SELECT 1
        FROM public.perfis_usuario p
        WHERE p.user_id = auth.uid()
          AND p.role IN ('superadmin', 'admin')
          AND p.empresa_id = convites.empresa_id
      )
    )
  );

-- =================================================================
-- 3. Restringir escrita em perfis_usuario a admin/superadmin
-- =================================================================

DROP POLICY IF EXISTS perfis_usuario_write_by_empresa ON public.perfis_usuario;
CREATE POLICY perfis_usuario_write_by_empresa
  ON public.perfis_usuario
  FOR ALL
  USING (
    public.can_access_empresa(empresa_id)
    AND EXISTS (
      SELECT 1
      FROM public.perfis_usuario p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('superadmin', 'admin')
    )
  )
  WITH CHECK (
    public.can_access_empresa(empresa_id)
    AND EXISTS (
      SELECT 1
      FROM public.perfis_usuario p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('superadmin', 'admin')
    )
  );
