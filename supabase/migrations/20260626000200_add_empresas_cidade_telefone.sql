-- Adiciona campos cidade e telefone na tabela empresas
-- Esses campos são usados pela tela de configurações e pelo repository de settings.
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS telefone text;
