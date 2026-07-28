-- =============================================================================
-- Migração: 20260519_fix_produtos_precos
-- Objetivo: Corrigir preços dos produtos conforme planilha real
--           planilha base de precificação
-- =============================================================================
-- Contexto: A planilha foi re-extraída e vários preços divergiam do seed original.
-- Esta migration atualiza os valores e adiciona produtos faltantes.
-- =============================================================================

DO $$
DECLARE
  v_empresa_id UUID;
BEGIN
  -- Obtém o primeiro empresa_id disponível
  SELECT id INTO v_empresa_id FROM empresas ORDER BY created_at ASC LIMIT 1;
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma empresa encontrada.';
  END IF;

  -- ===========================================================================
  -- 1. ATUALIZAR PREÇOS DE PRODUTOS EXISTENTES
  -- ===========================================================================
  -- Margem padrão: 0.46 → valor_compra = valor_venda / 1.46
  -- Exceto VCR4 que tem margem 0.06

  UPDATE produtos SET valor_compra = ROUND(250.00/1.46, 2), updated_at = now()
    WHERE empresa_id = v_empresa_id AND codigo = 'VC4';

  UPDATE produtos SET valor_compra = ROUND(600.00/1.46, 2), updated_at = now()
    WHERE empresa_id = v_empresa_id AND codigo = 'EB4';

  UPDATE produtos SET valor_compra = ROUND(385.00/1.46, 2), updated_at = now()
    WHERE empresa_id = v_empresa_id AND codigo = 'EC4';

  UPDATE produtos SET valor_compra = ROUND(400.00/1.46, 2), updated_at = now()
    WHERE empresa_id = v_empresa_id AND codigo = 'FPA';

  UPDATE produtos SET valor_compra = ROUND(450.00/1.46, 2), updated_at = now()
    WHERE empresa_id = v_empresa_id AND codigo = 'VFV';

  UPDATE produtos SET valor_compra = ROUND(720.00/1.46, 2), updated_at = now()
    WHERE empresa_id = v_empresa_id AND codigo = 'PBPV';

  UPDATE produtos SET valor_compra = ROUND(680.00/1.46, 2), updated_at = now()
    WHERE empresa_id = v_empresa_id AND codigo = 'PBPI';

  -- ===========================================================================
  -- 2. INSERIR PRODUTOS NOVOS (que estão na planilha mas não no seed original)
  -- ===========================================================================

  INSERT INTO produtos (empresa_id, codigo, descricao, unidade, valor_compra, margem_lucro, categoria)
  VALUES
    (v_empresa_id, 'FP',   'Fecha Pia',                 'm²', ROUND(460.00/1.46, 2), 0.46, 'servico'),
    (v_empresa_id, 'JVF8', 'Janela Verde / Fumê 8MM',   'm²', ROUND(330.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'JI8',  'Janela Incolor 8mm',        'm²', ROUND(300.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'VBV',  'Vidro Box Verde / Fumê',    'm²', ROUND(410.00/1.46, 2), 0.46, 'vidro')
  ON CONFLICT (empresa_id, codigo) DO NOTHING;

  -- ===========================================================================
  -- 3. CORRIGIR SERVIÇOS COMPOSTOS
  -- ===========================================================================

  -- 3a. KAE no PCEI: corrigir tipo_preco de PC_FX para PC_ML
  UPDATE servico_componentes sc
  SET tipo_preco = 'PC_ML'
  FROM servicos_compostos svc, produtos p
  WHERE sc.servico_id = svc.id
    AND sc.produto_id = p.id
    AND svc.empresa_id = v_empresa_id
    AND svc.codigo = 'PCEI'
    AND p.codigo = 'KAE';

  -- 3b. KAE no PCEV: corrigir tipo_preco de PC_FX para PC_ML
  UPDATE servico_componentes sc
  SET tipo_preco = 'PC_ML'
  FROM servicos_compostos svc, produtos p
  WHERE sc.servico_id = svc.id
    AND sc.produto_id = p.id
    AND svc.empresa_id = v_empresa_id
    AND svc.codigo = 'PCEV'
    AND p.codigo = 'KAE';

  -- 3c. BV: trocar componente BVF por VBV
  UPDATE servico_componentes sc
  SET produto_id = p_vbv.id
  FROM servicos_compostos svc, produtos p_bvf, produtos p_vbv
  WHERE sc.servico_id = svc.id
    AND sc.produto_id = p_bvf.id
    AND svc.empresa_id = v_empresa_id
    AND svc.codigo = 'BV'
    AND p_bvf.codigo = 'BVF'
    AND p_vbv.codigo = 'VBV'
    AND p_vbv.empresa_id = v_empresa_id;

  RAISE NOTICE 'Migração 20260519_fix_produtos_precos aplicada com sucesso.';
END $$;
