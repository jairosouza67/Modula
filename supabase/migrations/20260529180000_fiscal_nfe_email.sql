-- =================================================================
-- Fiscal: NF-e email tracking
-- =================================================================

ALTER TABLE public.nfe_saida
ADD COLUMN IF NOT EXISTS email_enviado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_enviado_em TIMESTAMPTZ;

COMMENT ON COLUMN public.nfe_saida.email_enviado IS 'Indica se a NF-e foi enviada por e-mail ao cliente';
COMMENT ON COLUMN public.nfe_saida.email_enviado_em IS 'Data/hora do envio do e-mail';
