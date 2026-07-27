-- =================================================================
-- Fiscal: Add cliente_email to nfe_saida for direct email delivery
-- =================================================================

ALTER TABLE public.nfe_saida
ADD COLUMN IF NOT EXISTS cliente_email TEXT;

COMMENT ON COLUMN public.nfe_saida.cliente_email IS 'E-mail do cliente para envio da NF-e';
