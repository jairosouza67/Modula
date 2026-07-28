-- =================================================================
-- Integração NF-e Real com SEFAZ-BA via Focus NFe
-- =================================================================

-- ── 1. Campos fiscais na tabela empresas ─────────────────────────
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS inscricao_estadual    TEXT,
  ADD COLUMN IF NOT EXISTS codigo_municipio      INTEGER DEFAULT 2919504,
  ADD COLUMN IF NOT EXISTS crt                   INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cep                   TEXT,
  ADD COLUMN IF NOT EXISTS bairro                TEXT,
  ADD COLUMN IF NOT EXISTS logradouro            TEXT,
  ADD COLUMN IF NOT EXISTS numero_endereco       TEXT,
  ADD COLUMN IF NOT EXISTS complemento           TEXT;

-- Seed com dados reais da ModulaAPP
UPDATE public.empresas
SET
  inscricao_estadual  = '096918958',
  codigo_municipio    = 2919504,
  crt                 = 1,
  cep                 = '46140000',
  bairro              = 'Taquari',
  logradouro          = 'Avenida Gil Ferreira Pessoa',
  numero_endereco     = '70',
  complemento         = 'Galpao'
WHERE cnpj = '14032864000108'
   OR id = (SELECT id FROM public.empresas LIMIT 1);

-- ── 2. Campos fiscais na tabela produtos ─────────────────────────
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS ncm               TEXT,
  ADD COLUMN IF NOT EXISTS cest              TEXT,
  ADD COLUMN IF NOT EXISTS cfop              TEXT DEFAULT '5102',
  ADD COLUMN IF NOT EXISTS unidade_fiscal    TEXT DEFAULT 'UN',
  ADD COLUMN IF NOT EXISTS origem            INTEGER DEFAULT 0;

-- ── 3. Campos de endereço completo na tabela clientes ────────────
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS cep               TEXT,
  ADD COLUMN IF NOT EXISTS bairro            TEXT,
  ADD COLUMN IF NOT EXISTS uf                TEXT,
  ADD COLUMN IF NOT EXISTS numero_endereco   TEXT,
  ADD COLUMN IF NOT EXISTS complemento       TEXT;

-- ── 4. Campos de autorização SEFAZ na nfe_saida ──────────────────
ALTER TABLE public.nfe_saida
  ADD COLUMN IF NOT EXISTS protocolo_autorizacao TEXT,
  ADD COLUMN IF NOT EXISTS xml_autorizado        TEXT,
  ADD COLUMN IF NOT EXISTS xml_cancelamento      TEXT,
  ADD COLUMN IF NOT EXISTS focus_nfe_ref         TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS danfe_url             TEXT,
  ADD COLUMN IF NOT EXISTS data_autorizacao      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motivo_rejeicao       TEXT,
  ADD COLUMN IF NOT EXISTS forma_pagamento       TEXT DEFAULT 'dinheiro',
  ADD COLUMN IF NOT EXISTS cliente_email         TEXT,
  ADD COLUMN IF NOT EXISTS descricao_itens       TEXT;

-- ── 5. Tabela de secrets por empresa ─────────────────────────────
-- (armazena o token Focus NFe de cada empresa com segurança)
CREATE TABLE IF NOT EXISTS public.empresa_secrets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  chave       TEXT NOT NULL,
  valor       TEXT NOT NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, chave)
);

ALTER TABLE public.empresa_secrets ENABLE ROW LEVEL SECURITY;

-- Apenas service_role acessa (nunca exposto ao browser)
CREATE POLICY empresa_secrets_service_only ON public.empresa_secrets
  USING (auth.role() = 'service_role');

-- ── 6. Índices ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_nfe_saida_focus_ref ON public.nfe_saida(focus_nfe_ref);
CREATE INDEX IF NOT EXISTS idx_empresa_secrets_empresa ON public.empresa_secrets(empresa_id);
