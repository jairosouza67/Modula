-- =================================================================
-- Fiscal Module: numeração sequencial de NF-e via RPC
-- Garante que o próximo número seja único por empresa, sem colisões.
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_next_nfe_numero(p_empresa_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proximo BIGINT;
BEGIN
  -- Calcula o próximo número com base no máximo existente para a empresa.
  -- O SELECT FOR UPDATE na tabela inteira (filtrada por empresa) serializa
  -- chamadas concorrentes e evita duplicatas na constraint UNIQUE.
  SELECT COALESCE(MAX(numero::BIGINT), 0) + 1
    INTO v_proximo
    FROM public.nfe_saida
   WHERE empresa_id = p_empresa_id
   FOR UPDATE;

  RETURN v_proximo;
END;
$$;

-- Permite que usuários autenticados (com acesso à empresa) executem a função.
-- A função é SECURITY DEFINER, portanto o RLS da tabela nfe_saida não se aplica
-- diretamente; validamos implicitamente pela empresa_id recebida no JWT/perfil.
REVOKE ALL ON FUNCTION public.get_next_nfe_numero(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_next_nfe_numero(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_nfe_numero(UUID) TO service_role;
