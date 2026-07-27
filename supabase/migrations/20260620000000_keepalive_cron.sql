-- ============================================
-- Migration: Keep-alive Cron Job (pg_cron)
-- Descrição: Cria um cron job que executa a cada 24h
--            para manter o banco de dados Supabase ativo
--            e evitar hibernação por inatividade.
-- ============================================

-- 1. Habilitar a extensão pg_cron (já vem pré-instalada no Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Garantir que o schema cron existe e está acessível
GRANT USAGE ON SCHEMA cron TO postgres;

-- 3. Remover job anterior se existir (idempotente)
SELECT cron.unschedule('keepalive-ping')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'keepalive-ping'
);

-- 4. Criar o cron job: executa todo dia às 06:00 UTC (03:00 BRT)
--    Faz um SELECT simples na tabela empresas para manter o banco ativo
SELECT cron.schedule(
  'keepalive-ping',           -- nome do job
  '0 6 * * *',                -- cron expression: todo dia às 06:00 UTC
  $$
    -- Query leve para manter o banco ativo
    SELECT
      now() AS keepalive_at,
      (SELECT count(*) FROM empresas) AS empresas_count;
  $$
);

-- 5. (Opcional) Criar tabela de log para monitorar execuções do keepalive
CREATE TABLE IF NOT EXISTS _keepalive_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  executed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'ok',
  details jsonb
);

-- RLS: apenas service_role pode acessar (tabela interna)
ALTER TABLE _keepalive_log ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura por admins via service_role
CREATE POLICY "Service role full access on _keepalive_log"
  ON _keepalive_log
  FOR ALL
  USING (
    (SELECT auth.role()) = 'service_role'
  )
  WITH CHECK (
    (SELECT auth.role()) = 'service_role'
  );

-- 6. Criar função para o keepalive com logging
CREATE OR REPLACE FUNCTION public.fn_keepalive_ping()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empresas_count integer;
BEGIN
  -- Query leve para manter o banco ativo
  SELECT count(*) INTO v_empresas_count FROM empresas;

  -- Registrar execução no log
  INSERT INTO _keepalive_log (status, details)
  VALUES (
    'ok',
    jsonb_build_object(
      'empresas_count', v_empresas_count,
      'timestamp_utc', now(),
      'source', 'pg_cron'
    )
  );

  -- Limpar logs antigos (manter apenas últimos 30 dias)
  DELETE FROM _keepalive_log
  WHERE executed_at < now() - INTERVAL '30 days';
END;
$$;

-- 7. Atualizar o cron job para usar a função com logging
SELECT cron.unschedule('keepalive-ping');

SELECT cron.schedule(
  'keepalive-ping',           -- nome do job
  '0 6 * * *',                -- cron expression: todo dia às 06:00 UTC (03:00 BRT)
  $$ SELECT public.fn_keepalive_ping(); $$
);

-- ============================================
-- RESUMO:
-- ✅ pg_cron habilitado
-- ✅ Job 'keepalive-ping' agendado para rodar todo dia às 06:00 UTC
-- ✅ Tabela _keepalive_log para monitoramento
-- ✅ Auto-limpeza de logs > 30 dias
-- ✅ RLS habilitado na tabela de log
-- ============================================
