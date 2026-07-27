-- =================================================================
-- FIX: Restaurar RLS policies usando can_access_empresa()
-- Corrige fornecedores, clientes, produtos, pedidos_compra e tabelas relacionadas
-- que foram sobrescritas por migrations com auth.uid() direto
-- =================================================================

-- ── FORNECEDORES ─────────────────────────────────────────────────
DROP POLICY IF EXISTS fornecedores_select_by_empresa ON public.fornecedores;
CREATE POLICY fornecedores_select_by_empresa ON public.fornecedores
  FOR SELECT USING (public.can_access_empresa(empresa_id));

DROP POLICY IF EXISTS fornecedores_write_by_empresa ON public.fornecedores;
CREATE POLICY fornecedores_write_by_empresa ON public.fornecedores
  FOR ALL
  USING (public.can_access_empresa(empresa_id))
  WITH CHECK (public.can_access_empresa(empresa_id));

-- ── CLIENTES ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS clientes_select_by_empresa ON public.clientes;
CREATE POLICY clientes_select_by_empresa ON public.clientes
  FOR SELECT USING (public.can_access_empresa(empresa_id));

DROP POLICY IF EXISTS clientes_write_by_empresa ON public.clientes;
CREATE POLICY clientes_write_by_empresa ON public.clientes
  FOR ALL
  USING (public.can_access_empresa(empresa_id))
  WITH CHECK (public.can_access_empresa(empresa_id));

-- ── PRODUTOS ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS leitura_produtos_por_empresa ON public.produtos;
DROP POLICY IF EXISTS produtos_select_by_empresa ON public.produtos;
CREATE POLICY produtos_select_by_empresa ON public.produtos
  FOR SELECT USING (public.can_access_empresa(empresa_id));

DROP POLICY IF EXISTS produtos_write_by_empresa ON public.produtos;
CREATE POLICY produtos_write_by_empresa ON public.produtos
  FOR ALL
  USING (public.can_access_empresa(empresa_id))
  WITH CHECK (public.can_access_empresa(empresa_id));

-- ── SERVICOS COMPOSTOS ───────────────────────────────────────────
DROP POLICY IF EXISTS leitura_servicos_compostos_por_empresa ON public.servicos_compostos;
DROP POLICY IF EXISTS servicos_compostos_select_by_empresa ON public.servicos_compostos;
CREATE POLICY servicos_compostos_select_by_empresa ON public.servicos_compostos
  FOR SELECT USING (public.can_access_empresa(empresa_id));

DROP POLICY IF EXISTS servicos_compostos_write_by_empresa ON public.servicos_compostos;
CREATE POLICY servicos_compostos_write_by_empresa ON public.servicos_compostos
  FOR ALL
  USING (public.can_access_empresa(empresa_id))
  WITH CHECK (public.can_access_empresa(empresa_id));

-- ── SERVICO COMPONENTES ──────────────────────────────────────────
DROP POLICY IF EXISTS leitura_servico_componentes_por_servico ON public.servico_componentes;
DROP POLICY IF EXISTS servico_componentes_select ON public.servico_componentes;
CREATE POLICY servico_componentes_select ON public.servico_componentes
  FOR SELECT USING (
    servico_id IN (
      SELECT id FROM public.servicos_compostos
      WHERE public.can_access_empresa(empresa_id)
    )
  );

DROP POLICY IF EXISTS servico_componentes_write ON public.servico_componentes;
CREATE POLICY servico_componentes_write ON public.servico_componentes
  FOR ALL USING (
    servico_id IN (
      SELECT id FROM public.servicos_compostos
      WHERE public.can_access_empresa(empresa_id)
    )
  ) WITH CHECK (
    servico_id IN (
      SELECT id FROM public.servicos_compostos
      WHERE public.can_access_empresa(empresa_id)
    )
  );

-- ── PEDIDOS COMPRA ───────────────────────────────────────────────
DROP POLICY IF EXISTS pedidos_compra_empresa ON public.pedidos_compra;
DROP POLICY IF EXISTS pedidos_compra_select_by_empresa ON public.pedidos_compra;
CREATE POLICY pedidos_compra_select_by_empresa ON public.pedidos_compra
  FOR SELECT USING (public.can_access_empresa(empresa_id));

DROP POLICY IF EXISTS pedidos_compra_write_by_empresa ON public.pedidos_compra;
CREATE POLICY pedidos_compra_write_by_empresa ON public.pedidos_compra
  FOR ALL
  USING (public.can_access_empresa(empresa_id))
  WITH CHECK (public.can_access_empresa(empresa_id));

-- ── PEDIDOS COMPRA ITENS ─────────────────────────────────────────
DROP POLICY IF EXISTS pedidos_compra_itens_empresa ON public.pedidos_compra_itens;
DROP POLICY IF EXISTS pedidos_compra_itens_select ON public.pedidos_compra_itens;
CREATE POLICY pedidos_compra_itens_select ON public.pedidos_compra_itens
  FOR SELECT USING (
    pedido_id IN (
      SELECT id FROM public.pedidos_compra
      WHERE public.can_access_empresa(empresa_id)
    )
  );

DROP POLICY IF EXISTS pedidos_compra_itens_write ON public.pedidos_compra_itens;
CREATE POLICY pedidos_compra_itens_write ON public.pedidos_compra_itens
  FOR ALL USING (
    pedido_id IN (
      SELECT id FROM public.pedidos_compra
      WHERE public.can_access_empresa(empresa_id)
    )
  ) WITH CHECK (
    pedido_id IN (
      SELECT id FROM public.pedidos_compra
      WHERE public.can_access_empresa(empresa_id)
    )
  );

-- ── PEDIDOS COMPRA ETAPAS ────────────────────────────────────────
DROP POLICY IF EXISTS pedidos_compra_etapas_empresa ON public.pedidos_compra_etapas;
DROP POLICY IF EXISTS pedidos_compra_etapas_select ON public.pedidos_compra_etapas;
CREATE POLICY pedidos_compra_etapas_select ON public.pedidos_compra_etapas
  FOR SELECT USING (
    pedido_id IN (
      SELECT id FROM public.pedidos_compra
      WHERE public.can_access_empresa(empresa_id)
    )
  );

DROP POLICY IF EXISTS pedidos_compra_etapas_write ON public.pedidos_compra_etapas;
CREATE POLICY pedidos_compra_etapas_write ON public.pedidos_compra_etapas
  FOR ALL USING (
    pedido_id IN (
      SELECT id FROM public.pedidos_compra
      WHERE public.can_access_empresa(empresa_id)
    )
  ) WITH CHECK (
    pedido_id IN (
      SELECT id FROM public.pedidos_compra
      WHERE public.can_access_empresa(empresa_id)
    )
  );
