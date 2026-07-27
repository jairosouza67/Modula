-- =============================================================================
-- Fase 1 — Vincular Estoque ao Catálogo de Produtos
-- Migration: 20260617_vincular_estoque_produtos
-- =============================================================================
-- Adiciona produto_id em estoque_itens para permitir baixa automática
-- ao aprovar orçamentos com serviços compostos.
-- =============================================================================

-- 1. Adicionar coluna produto_id em estoque_itens
ALTER TABLE public.estoque_itens
  ADD COLUMN IF NOT EXISTS produto_id UUID REFERENCES public.produtos(id);

COMMENT ON COLUMN public.estoque_itens.produto_id IS
  'Vínculo opcional com o catálogo de produtos — usado para baixa automática de estoque ao aprovar orçamentos.';

-- 2. Índice para lookup rápido por produto
CREATE INDEX IF NOT EXISTS idx_estoque_itens_produto_id
  ON public.estoque_itens(produto_id)
  WHERE produto_id IS NOT NULL;

-- 3. Auto-vincular itens existentes por código + empresa (best-effort)
UPDATE public.estoque_itens ei
SET produto_id = p.id
FROM public.produtos p
WHERE ei.codigo = p.codigo
  AND ei.empresa_id = p.empresa_id
  AND ei.produto_id IS NULL
  AND ei.deleted_at IS NULL;

-- 4. Também adicionar referência ao orçamento nas movimentações
-- para facilitar rastreabilidade e devolução de estoque
ALTER TABLE public.estoque_movimentacoes
  ADD COLUMN IF NOT EXISTS orcamento_id UUID REFERENCES public.orcamentos(id);

COMMENT ON COLUMN public.estoque_movimentacoes.orcamento_id IS
  'Orçamento que originou a movimentação — usado para devolução ao cancelar produção.';

CREATE INDEX IF NOT EXISTS idx_estoque_mov_orcamento
  ON public.estoque_movimentacoes(orcamento_id)
  WHERE orcamento_id IS NOT NULL;
