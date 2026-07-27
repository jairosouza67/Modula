-- =================================================================
-- FIX: Trigger de updated_at na obrigacoes_fiscais
-- A coluna se chama 'atualizado_em', não 'updated_at'
-- =================================================================

DROP TRIGGER IF EXISTS obrigacoes_fiscais_set_updated_at ON public.obrigacoes_fiscais;

CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER obrigacoes_fiscais_set_atualizado_em
BEFORE UPDATE ON public.obrigacoes_fiscais
FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();
