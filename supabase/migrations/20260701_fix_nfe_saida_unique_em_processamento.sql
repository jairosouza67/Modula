-- =================================================================
-- Corrige constraint UNIQUE em nfe_saida para permitir múltiplas
-- notas EM_PROCESSAMENTO com número temporário "0".
-- =================================================================

-- Remove a unique constraint original que impedia mais de uma nota
-- em processamento por empresa (todas usam numero='0' temporariamente).
ALTER TABLE public.nfe_saida
  DROP CONSTRAINT IF EXISTS nfe_saida_empresa_id_numero_serie_key;

-- Recria como índice parcial: só exige unicidade quando a nota
-- já foi autorizada/cancelada/denegada, não enquanto aguarda a SEFAZ.
CREATE UNIQUE INDEX IF NOT EXISTS idx_nfe_saida_numero_unico
  ON public.nfe_saida (empresa_id, numero, serie)
  WHERE status <> 'EM_PROCESSAMENTO';
