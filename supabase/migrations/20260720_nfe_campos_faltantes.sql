-- =================================================================
-- Migração: Campos faltantes para NF-e completa
-- Data: 2026-07-20
-- Descrição: Adiciona campos obrigatórios para emissão de NF-e
--            sem alterar nenhuma constraint ou validação existente
-- =================================================================

-- ── 1. UF na tabela empresas ─────────────────────────────────────
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS uf TEXT;

COMMENT ON COLUMN public.empresas.uf IS 'UF do emitente (ex: BA, SP, RJ)';

-- ── 2. Campos fiscais na tabela clientes ─────────────────────────
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS codigo_municipio INTEGER,
  ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;

COMMENT ON COLUMN public.clientes.codigo_municipio IS 'Código IBGE do município do cliente';
COMMENT ON COLUMN public.clientes.inscricao_estadual IS 'Inscrição Estadual do cliente (quando contribuinte ICMS)';

-- ── 3. Modalidade de frete na nfe_saida ──────────────────────────
ALTER TABLE public.nfe_saida
  ADD COLUMN IF NOT EXISTS modalidade_frete TEXT DEFAULT '9'
  CHECK (modalidade_frete IN ('0', '1', '2', '3', '4', '9'));

COMMENT ON COLUMN public.nfe_saida.modalidade_frete IS 
'Modalidade de frete: 0=Emitente, 1=Destinatário, 2=Terceiros, 3=Próprio Remetente, 4=Próprio Destinatário, 9=Sem Frete';
