-- =================================================================
-- Fiscal Module: NF-e fields and Obrigações Fiscais
-- =================================================================

-- ── 1. Update nfe_saida ──────────────────────────────────────────
ALTER TABLE public.nfe_saida
ADD COLUMN IF NOT EXISTS cliente_nome TEXT,
ADD COLUMN IF NOT EXISTS cliente_documento TEXT,
ADD COLUMN IF NOT EXISTS valor_impostos NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS itens JSONB DEFAULT '[]'::jsonb;

-- ── 2. Table obrigacoes_fiscais ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.obrigacoes_fiscais (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  tipo                TEXT NOT NULL,
  competencia         TEXT NOT NULL,
  data_vencimento     DATE NOT NULL,
  valor               NUMERIC(12,2) NOT NULL,
  status              TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO', 'ATRASADO')),
  data_pagamento      DATE,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.obrigacoes_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "obrigacoes_fiscais_select_by_empresa"
ON public.obrigacoes_fiscais
FOR SELECT
USING (
  auth.role() = 'service_role'
  OR (
    auth.jwt() ->> 'empresa_id' IS NOT NULL
    AND empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
  )
);

CREATE POLICY "obrigacoes_fiscais_write_by_empresa"
ON public.obrigacoes_fiscais
FOR ALL
USING (
  auth.role() = 'service_role'
  OR (
    auth.jwt() ->> 'empresa_id' IS NOT NULL
    AND empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
  )
)
WITH CHECK (
  auth.role() = 'service_role'
  OR (
    auth.jwt() ->> 'empresa_id' IS NOT NULL
    AND empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
  )
);

-- Trigger to update updated_at
CREATE TRIGGER obrigacoes_fiscais_set_updated_at
BEFORE UPDATE ON public.obrigacoes_fiscais
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_obrigacoes_fiscais_empresa ON public.obrigacoes_fiscais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_fiscais_vencimento ON public.obrigacoes_fiscais(data_vencimento);
