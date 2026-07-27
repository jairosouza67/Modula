-- =================================================================
-- Sprint 17 — NF-e Saída e Integridade Referencial
-- Vidraçaria TOP — 2026-05-12
-- =================================================================

-- ── 1. NF-e de Saída (Vendas) ──────────────────────────────────
-- Tabela necessária para o gate INT-01 (bloqueio de exclusão de OS com nota)

CREATE TABLE nfe_saida (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  os_id               UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE RESTRICT,
  numero              TEXT NOT NULL,
  serie               TEXT NOT NULL DEFAULT '1',
  chave_acesso        TEXT UNIQUE,
  valor_total         NUMERIC(12,2) NOT NULL,
  status              TEXT NOT NULL DEFAULT 'EMITIDA' 
    CHECK (status IN ('EMITIDA', 'CANCELADA', 'EM_PROCESSAMENTO', 'DENEGADA')),
  xml_path            TEXT, -- Caminho no Supabase Storage
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, numero, serie)
);

-- ── 2. Políticas de RLS ───────────────────────────────────────

ALTER TABLE nfe_saida ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nfe_saida_empresa" ON nfe_saida
  USING (empresa_id IN (SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()));

-- ── 3. Índices ────────────────────────────────────────────────

CREATE INDEX idx_nfe_saida_empresa ON nfe_saida(empresa_id);
CREATE INDEX idx_nfe_saida_os ON nfe_saida(os_id);
CREATE INDEX idx_nfe_saida_numero ON nfe_saida(numero);
