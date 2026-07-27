-- =============================================================================
-- Loop 4 — Correção de Divergências (fonte operacional CALCULO prevalece)
-- =============================================================================

-- 1) Limpeza defensiva de duplicatas por (empresa_id, codigo) em produtos
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY empresa_id, codigo ORDER BY created_at ASC, id ASC) AS rn
  FROM produtos
)
DELETE FROM produtos p
USING ranked r
WHERE p.id = r.id
  AND r.rn > 1;

-- 2) Limpeza defensiva de duplicatas por (empresa_id, codigo) em servicos_compostos
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY empresa_id, codigo ORDER BY created_at ASC, id ASC) AS rn
  FROM servicos_compostos
)
DELETE FROM servicos_compostos s
USING ranked r
WHERE s.id = r.id
  AND r.rn > 1;

-- 3) Garantia de unicidade (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_produto_codigo_empresa'
  ) THEN
    ALTER TABLE produtos
      ADD CONSTRAINT uq_produto_codigo_empresa UNIQUE (empresa_id, codigo);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_servico_codigo_empresa'
  ) THEN
    ALTER TABLE servicos_compostos
      ADD CONSTRAINT uq_servico_codigo_empresa UNIQUE (empresa_id, codigo);
  END IF;
END $$;

-- 4) Canonical code para box verde/fumê: BVF (remove alias legado VBV, se existir)
UPDATE produtos
SET codigo = 'BVF'
WHERE codigo = 'VBV';

-- 5) Ajustes de referência de valores oficiais da planilha na tabela de produtos
-- Obs: VCR4 e PP2V8 com margem negativa seguem como override no motor de cálculo.
UPDATE produtos
SET valor_compra = ROUND(700.00 / (1 + margem_lucro), 2)
WHERE codigo = 'EB4';

UPDATE produtos
SET valor_compra = ROUND(410.00 / (1 + margem_lucro), 2)
WHERE codigo = 'EC4';

UPDATE produtos
SET valor_compra = ROUND(265.00 / (1 + margem_lucro), 2)
WHERE codigo = 'VC4';

UPDATE produtos
SET valor_compra = ROUND(380.00 / (1 + margem_lucro), 2)
WHERE codigo = 'VFV';

UPDATE produtos
SET valor_compra = ROUND(780.00 / (1 + margem_lucro), 2)
WHERE codigo = 'PBPV';

UPDATE produtos
SET valor_compra = ROUND(760.00 / (1 + margem_lucro), 2)
WHERE codigo = 'PBPI';

UPDATE produtos
SET valor_compra = ROUND(410.00 / (1 + margem_lucro), 2)
WHERE codigo = 'FPA';
