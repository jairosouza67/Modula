-- =================================================================
-- FIX: RLS policies para tabelas fiscais (obrigacoes_fiscais e nfe_saida)
-- Substitui policies inconsistentes por can_access_empresa()
-- =================================================================

-- ── obrigacoes_fiscais ────────────────────────────────────────────
DROP POLICY IF EXISTS obrigacoes_fiscais_select_by_empresa ON public.obrigacoes_fiscais;
DROP POLICY IF EXISTS obrigacoes_fiscais_write_by_empresa ON public.obrigacoes_fiscais;

CREATE POLICY obrigacoes_fiscais_select_by_empresa ON public.obrigacoes_fiscais
  FOR SELECT USING (public.can_access_empresa(empresa_id));

CREATE POLICY obrigacoes_fiscais_write_by_empresa ON public.obrigacoes_fiscais
  FOR ALL
  USING (public.can_access_empresa(empresa_id))
  WITH CHECK (public.can_access_empresa(empresa_id));

-- ── nfe_saida ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS nfe_saida_empresa ON public.nfe_saida;

CREATE POLICY nfe_saida_select_by_empresa ON public.nfe_saida
  FOR SELECT USING (public.can_access_empresa(empresa_id));

CREATE POLICY nfe_saida_write_by_empresa ON public.nfe_saida
  FOR ALL
  USING (public.can_access_empresa(empresa_id))
  WITH CHECK (public.can_access_empresa(empresa_id));
