-- =============================================================================
-- Loop 1 — Seed: Catálogo de Produtos e Serviços Compostos
-- Arquivo: supabase/seed_produtos.sql
-- Base: Planilha ORÇ VIDRAÇARIA ATUALIZADO.xlsm
-- =============================================================================
-- ATENÇÃO: Este seed depende de:
--   1. Migration 20260518_orcamento_produtos aplicada
--   2. Pelo menos 1 empresa existente na tabela 'empresas'
-- O empresa_id usado aqui DEVE ser substituído pelo UUID real da empresa no ambiente alvo.
-- =============================================================================

-- Ajuste o UUID abaixo conforme o ambiente (dev / staging / prod).
-- Para testes locais, use o id da empresa criada via seed.sql principal.
DO $$
DECLARE
  v_empresa_id UUID;
BEGIN

  -- Obtém o primeiro empresa_id disponível (para seed de desenvolvimento)
  SELECT id INTO v_empresa_id FROM empresas ORDER BY created_at ASC LIMIT 1;
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma empresa encontrada. Execute o seed principal (supabase/seed.sql) antes deste arquivo.';
  END IF;

  -- ===========================================================================
  -- 1. PRODUTOS (41 itens)
  -- ===========================================================================
  -- Formula: valor_venda = valor_compra * (1 + margem_lucro)
  -- Para margem 0.46: valor_compra = valor_venda / 1.46
  -- ===========================================================================

  -- VIDROS (15 itens)
  INSERT INTO produtos (empresa_id, codigo, descricao, unidade, valor_compra, margem_lucro, categoria)
  VALUES
    (v_empresa_id, 'VI6',  'Vidro Incolor 6mm',                'm²', ROUND(200.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'VI8',  'Vidro Incolor 8mm',                'm²', ROUND(360.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'VI10', 'Vidro Incolor 10mm',               'm²', ROUND(470.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'VV8',  'Vidro Verde/Fumê 8mm',             'm²', ROUND(460.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'VV10', 'Vidro Verde/Fumê 10mm',            'm²', ROUND(80.00/1.46, 2),  0.46, 'vidro'),
    (v_empresa_id, 'VC4',  'Vidro Comum 4mm',                  'm²', ROUND(250.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'VC6',  'Vidro Comum 6mm',                  'm²', ROUND(290.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'VPGV', 'Vidro Pivotante Verde G.',         'm²', ROUND(550.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'VPGI', 'Vidro Pivotante Incolor G.',       'm²', ROUND(500.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'BVF',  'Vidro Box Verde/Fumê',             'm²', ROUND(410.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'BI',   'Box Incolor',                      'm²', ROUND(350.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'JVF8', 'Janela Verde / Fumê 8MM',          'm²', ROUND(330.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'JI8',  'Janela Incolor 8mm',               'm²', ROUND(300.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'VBV',  'Vidro Box Verde / Fumê',           'm²', ROUND(410.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'VCR4', 'Vidro Reflect Bronze 4mm',         'm²', 374.60, 0.06, 'vidro')
  ON CONFLICT (empresa_id, codigo) DO NOTHING;

  -- ESPELHOS (2 itens)
  INSERT INTO produtos (empresa_id, codigo, descricao, unidade, valor_compra, margem_lucro, categoria)
  VALUES
    (v_empresa_id, 'EB4', 'Espelho Bisotado 4mm', 'm²', ROUND(600.00/1.46, 2), 0.46, 'vidro'),
    (v_empresa_id, 'EC4', 'Espelho Comum 4mm',    'm²', ROUND(385.00/1.46, 2), 0.46, 'vidro')
  ON CONFLICT (empresa_id, codigo) DO NOTHING;

  -- KITS (8 itens)
  INSERT INTO produtos (empresa_id, codigo, descricao, unidade, valor_compra, margem_lucro, categoria)
  VALUES
    (v_empresa_id, 'KA',  'Kit Alumínio',              'und', ROUND(85.00/1.46, 2),  0.46, 'kit'),
    (v_empresa_id, 'KAE', 'Kit Alumínio Externo',       'und', ROUND(120.00/1.46, 2), 0.46, 'kit'),
    (v_empresa_id, 'KAB', 'Kit Acessório Box',          'und', ROUND(30.00/1.46, 2),  0.46, 'kit'),
    (v_empresa_id, 'KP',  'Kit Pivotante',              'und', ROUND(55.00/1.46, 2),  0.46, 'kit'),
    (v_empresa_id, 'KPP', 'Kit Porta Pivotante',        'und', ROUND(80.00/1.46, 2),  0.46, 'kit'),
    (v_empresa_id, 'KB',  'Kit Basculante',             'und', ROUND(60.00/1.46, 2),  0.46, 'kit'),
    (v_empresa_id, 'KF',  'Kit Ferragem Porta Correr',  'und', ROUND(70.00/1.46, 2),  0.46, 'kit'),
    (v_empresa_id, 'KJ',  'Kit Alumínio Janela',        'und', ROUND(85.00/1.46, 2),  0.46, 'kit')
  ON CONFLICT (empresa_id, codigo) DO NOTHING;

  -- FERRAGENS (7 itens)
  INSERT INTO produtos (empresa_id, codigo, descricao, unidade, valor_compra, margem_lucro, categoria)
  VALUES
    (v_empresa_id, 'PX40', 'Puxador Inox 40cm',            'und', ROUND(50.00/1.46, 2), 0.46, 'ferragem'),
    (v_empresa_id, 'FVA',  'Fechadura Porta Correr VA',    'und', ROUND(70.00/1.46, 2), 0.46, 'ferragem'),
    (v_empresa_id, 'FVV',  'Fechadura Porta Correr VV',    'und', ROUND(80.00/1.46, 2), 0.46, 'ferragem'),
    (v_empresa_id, 'FX',   'Fixador Porta Pivotante',      'und', ROUND(40.00/1.46, 2), 0.46, 'ferragem'),
    (v_empresa_id, 'BFJ',  'Bate Fecha Janela',            'und', ROUND(20.00/1.46, 2), 0.46, 'ferragem'),
    (v_empresa_id, 'BPC',  'Batedor Porta de Correr',      'und', ROUND(55.00/1.46, 2), 0.46, 'ferragem'),
    (v_empresa_id, 'JAT',  'Jateado',                      'm²',  ROUND(85.00/1.46, 2), 0.46, 'ferragem')
  ON CONFLICT (empresa_id, codigo) DO NOTHING;

  -- SERVICOS (9 itens - produtos que tambem sao servicos)
  INSERT INTO produtos (empresa_id, codigo, descricao, unidade, valor_compra, margem_lucro, categoria)
  VALUES
    (v_empresa_id, 'AD',   'Adesivo',                      'm²', ROUND(50.00/1.46, 2),  0.46, 'servico'),
    (v_empresa_id, 'FPA',  'Fecha Pia Acrilico',           'm²', ROUND(400.00/1.46, 2), 0.46, 'servico'),
    (v_empresa_id, 'FPV',  'Fecha Pia Vidro',              'm²', ROUND(530.00/1.46, 2), 0.46, 'servico'),
    (v_empresa_id, 'FV',   'Fechamento em Vidro',          'm²', ROUND(520.00/1.46, 2), 0.46, 'servico'),
    (v_empresa_id, 'VFI',  'Vidro Fixo Incolor 8mm',       'm²', ROUND(385.00/1.46, 2), 0.46, 'servico'),
    (v_empresa_id, 'VFV',  'Vidro Fixo Verde/Fumê 8mm',    'm²', ROUND(450.00/1.46, 2), 0.46, 'servico'),
    (v_empresa_id, 'PBPV', 'Vitrô Piv./Basc. Verde 8mm',   'm²', ROUND(720.00/1.46, 2), 0.46, 'servico'),
    (v_empresa_id, 'PBPI', 'Vitrô Piv./Basc. Incolor 8mm', 'm²', ROUND(680.00/1.46, 2), 0.46, 'servico'),
    (v_empresa_id, 'FP',   'Fecha Pia',                      'm²', ROUND(460.00/1.46, 2), 0.46, 'servico')
  ON CONFLICT (empresa_id, codigo) DO NOTHING;

  -- ===========================================================================
  -- 2. SERVIÇOS COMPOSTOS (27 itens) + COMPONENTES (validados contra planilha)
  -- ===========================================================================

  -- PPI8: Porta Pivotante Incolor 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'PPI8', 'Porta Pivotante Incolor 8mm', 'porta_pivotante')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VI8',  1, 'M2',    1),
    ('PX40', 1, 'PC_FX', 2),
    ('KPP',  1, 'PC_FX', 3),
    ('FX',   1, 'PC_FX', 4)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- PPV8: Porta Pivotante Verde 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'PPV8', 'Porta Pivotante Verde 8mm', 'porta_pivotante')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VV8',  1, 'M2',    1),
    ('PX40', 1, 'PC_FX', 2),
    ('KPP',  1, 'PC_FX', 3),
    ('FX',   1, 'PC_FX', 4)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- PP2V8: Porta Pivotante 2 Folhas Verde 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'PP2V8', 'Porta Pivotante 2 Folhas Verde 8mm', 'porta_pivotante')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VV8',  1, 'M2',    1),
    ('PX40', 2, 'PC_FX', 2),
    ('KPP',  2, 'PC_FX', 3)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- PPI10: Porta Pivotante Incolor 10mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'PPI10', 'Porta Pivotante Incolor 10mm', 'porta_pivotante')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VI10', 1, 'M2',    1),
    ('PX40', 1, 'PC_FX', 2),
    ('KPP',  1, 'PC_FX', 3)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- PCI2: Porta Correr 2 Folhas Incolor 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'PCI2', 'Porta Correr 2 Folhas Incolor 8mm', 'porta_correr')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VI8',  1, 'M2',    1),
    ('KA',   1, 'PC_ML', 2),
    ('PX40', 1, 'PC_FX', 3),
    ('FVA',  1, 'PC_FX', 4)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- PCV2: Porta Correr 2 Folhas Verde 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'PCV2', 'Porta Correr 2 Folhas Verde 8mm', 'porta_correr')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VV8',  1, 'M2',    1),
    ('KA',   1, 'PC_ML', 2),
    ('PX40', 1, 'PC_FX', 3),
    ('FVA',  1, 'PC_FX', 4)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- PCI4: Porta Correr 4 Folhas Incolor 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'PCI4', 'Porta Correr 4 Folhas Incolor 8mm', 'porta_correr')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VI8',  1, 'M2',    1),
    ('KA',   1, 'PC_ML', 2),
    ('PX40', 2, 'PC_FX', 3),
    ('FVV',  1, 'PC_FX', 4)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- PCV4: Porta Correr 4 Folhas Verde 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'PCV4', 'Porta Correr 4 Folhas Verde 8mm', 'porta_correr')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VV8',  1, 'M2',    1),
    ('KA',   1, 'PC_ML', 2),
    ('PX40', 2, 'PC_FX', 3),
    ('FVV',  1, 'PC_FX', 4)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- PCEI: Porta Correr Externa Incolor 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'PCEI', 'Porta Correr Externa Incolor 8mm', 'porta_correr')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VI8',  1, 'M2',    1),
    ('KAE',  1, 'PC_ML', 2),
    ('PX40', 1, 'PC_FX', 3),
    ('FVA',  1, 'PC_FX', 4),
    ('BPC',  1, 'PC_FX', 5)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- PCEV: Porta Correr Externa Verde 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'PCEV', 'Porta Correr Externa Verde 8mm', 'porta_correr')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VV8',  1, 'M2',    1),
    ('KAE',  1, 'PC_ML', 2),
    ('PX40', 1, 'PC_FX', 3),
    ('FVA',  1, 'PC_FX', 4),
    ('BPC',  1, 'PC_FX', 5)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- JI8: Janela Incolor 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'JI8', 'Janela Incolor 8mm', 'janela')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VI8', 1, 'M2',    1),
    ('KA',  1, 'PC_ML', 2),
    ('BFJ', 1, 'PC_FX', 3)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- JV8: Janela Verde/Fumê 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'JV8', 'Janela Verde/Fumê 8mm', 'janela')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VV8', 1, 'M2',    1),
    ('KA',  1, 'PC_ML', 2),
    ('BFJ', 1, 'PC_FX', 3)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- PGV: Pivotante/Basc. Verde
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'PGV', 'Pivotante/Basc. Verde', 'porta_pivotante')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VPGV', 1, 'M2',    1),
    ('KP',   1, 'PC_FX', 2)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- PGI: Pivotante/Basc. Incolor
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'PGI', 'Pivotante/Basc. Incolor', 'porta_pivotante')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VPGI', 1, 'M2',    1),
    ('KP',   1, 'PC_FX', 2)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- BI: Box Incolor 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'BI', 'Box Incolor 8mm', 'box')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('BI',  1, 'M2',    1),
    ('KA',  1, 'PC_ML', 2),
    ('KAB', 1, 'PC_FX', 3)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- BV: Box Verde/Fumê 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'BV', 'Box Verde/Fumê 8mm', 'box')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VBV', 1, 'M2',    1),
    ('KA',  1, 'PC_ML', 2),
    ('KAB', 1, 'PC_FX', 3)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- JT: Jateamento
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'JT', 'Jateamento', 'especial')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('JAT', 1, 'M2', 1)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- PBPV: Vitrô Piv./Basc. Verde 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'PBPV', 'Vitrô Piv./Basc. Verde 8mm', 'especial')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('PBPV', 1, 'M2', 1)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- PBPI: Vitrô Piv./Basc. Incolor 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'PBPI', 'Vitrô Piv./Basc. Incolor 8mm', 'especial')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('PBPI', 1, 'M2', 1)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- FPA: Fecha Pia Acrilico
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'FPA', 'Fecha Pia Acrilico', 'especial')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('FPA', 1, 'M2', 1)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- FPV: Fecha Pia Vidro
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'FPV', 'Fecha Pia Vidro', 'especial')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('FPV', 1, 'M2', 1)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- FV: Fechamento em Vidro
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'FV', 'Fechamento em Vidro', 'especial')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('FV', 1, 'M2', 1)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- VFI: Vidro Fixo/Bandeira Incolor 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'VFI', 'Vidro Fixo/Bandeira Incolor 8mm', 'especial')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VFI', 1, 'M2', 1)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- VFV: Vidro Fixo/Bandeira Verde 8mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'VFV', 'Vidro Fixo/Bandeira Verde 8mm', 'especial')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VFV', 1, 'M2', 1)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- VC4: Vidro Comum 4mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'VC4', 'Vidro Comum 4mm', 'especial')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VC4', 1, 'M2', 1)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- VC6: Vidro Comum 6mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'VC6', 'Vidro Comum 6mm', 'especial')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VC6', 1, 'M2', 1)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

  -- VCR4: Vidro Reflect Bronze 4mm
  WITH svc AS (
    INSERT INTO servicos_compostos (empresa_id, codigo, nome, categoria)
    VALUES (v_empresa_id, 'VCR4', 'Vidro Reflect Bronze 4mm', 'especial')
    ON CONFLICT (empresa_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
    RETURNING id
  )
  INSERT INTO servico_componentes (servico_id, produto_id, quantidade, tipo_preco, ordem)
  SELECT svc.id, p.id, comp.qtd, comp.tipo, comp.ord
  FROM svc
  CROSS JOIN (VALUES
    ('VCR4', 1, 'M2', 1)
  ) AS comp(cod, qtd, tipo, ord)
  JOIN produtos p ON p.codigo = comp.cod AND p.empresa_id = v_empresa_id;

END $$;