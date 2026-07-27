-- =============================================================================
-- Migração: 20260525_processamentos_supabase
-- Objetivo: Adicionar itens de processamento (Lapidação, Bisotê, Furação) como
--           produtos na tabela 'produtos' para eliminar dados hardcoded.
--           JAT (Jateado) e AD (Adesivo) já existem como produtos.
-- =============================================================================

DO $$
DECLARE
  v_empresa_id UUID;
BEGIN
  SELECT id INTO v_empresa_id FROM empresas ORDER BY created_at ASC LIMIT 1;
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma empresa encontrada.';
  END IF;

  -- Processamentos que ainda não existem na tabela produtos
  INSERT INTO produtos (empresa_id, codigo, descricao, unidade, valor_compra, margem_lucro, categoria)
  VALUES
    (v_empresa_id, 'LAP', 'Lapidação',       'und', 15.00, 0.00, 'processamento'),
    (v_empresa_id, 'BST', 'Bisotê',          'und', 25.00, 0.00, 'processamento'),
    (v_empresa_id, 'FUR', 'Furação simples',  'und', 20.00, 0.00, 'processamento')
  ON CONFLICT (empresa_id, codigo) DO NOTHING;

  -- Garantir que JAT e AD tenham categoria acessível como processamento também
  -- (eles já existem, apenas adicionamos uma nota semântica)

  RAISE NOTICE 'Migração 20260525_processamentos_supabase aplicada.';
END $$;
