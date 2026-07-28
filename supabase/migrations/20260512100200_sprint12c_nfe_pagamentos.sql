-- =================================================================
-- Sprint 12C — NFe de Entrada + Formas/Condições de Pagamento
-- ModulaAPP — 2026-05-12
-- =================================================================

-- ── NFe de Entrada ───────────────────────────────────────────

CREATE TABLE nfe_entrada (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  fornecedor_id       UUID REFERENCES fornecedores(id) ON DELETE RESTRICT,
  fornecedor_nome     TEXT NOT NULL,
  numero              TEXT NOT NULL,
  serie               TEXT NOT NULL,
  chave_acesso        TEXT NOT NULL UNIQUE,
  data_emissao        DATE NOT NULL,
  valor_total         NUMERIC(12,2) NOT NULL,
  pedido_compra_id    UUID REFERENCES pedidos_compra(id),
  status_sped         TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status_sped IN ('pendente','lancada')),
  xml_url             TEXT, -- Path no Storage
  dados_xml           JSONB, -- Parse do XML completo para buscas
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Formas de Pagamento ──────────────────────────────────────

CREATE TABLE formas_pagamento (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  codigo              TEXT NOT NULL,
  descricao           TEXT NOT NULL,
  aplicacao           TEXT NOT NULL DEFAULT 'ambos'
    CHECK (aplicacao IN ('venda','compra','ambos')),
  ativo               BOOLEAN NOT NULL DEFAULT true,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, codigo)
);

-- ── Condições de Pagamento ───────────────────────────────────

CREATE TABLE condicoes_pagamento (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  codigo              TEXT NOT NULL,
  descricao           TEXT NOT NULL,
  prazos_dias         INTEGER[] NOT NULL, -- Array de dias. Ex: {30,60,90}
  desconto_pct        NUMERIC(5,2) NOT NULL DEFAULT 0,
  acrescimo_pct       NUMERIC(5,2) NOT NULL DEFAULT 0,
  aplicacao           TEXT NOT NULL DEFAULT 'ambos'
    CHECK (aplicacao IN ('venda','compra','ambos')),
  ativo               BOOLEAN NOT NULL DEFAULT true,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, codigo)
);

-- ── Seed Inicial de Formas de Pagamento ──────────────────────

-- Para injetar formas padrão quando uma empresa é criada (usar em trigger ou Edge Function)
-- Boleto, PIX, TED, Cartão, Dinheiro.

-- ── Storage Bucket para XMLs ─────────────────────────────────

-- INSERT INTO storage.buckets (id, name, public) VALUES ('nfe_xml', 'nfe_xml', false) ON CONFLICT DO NOTHING;
-- (Depende de configuração no Storage via dashboard ou seeds globais).

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE nfe_entrada ENABLE ROW LEVEL SECURITY;
ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE condicoes_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nfe_entrada_empresa" ON nfe_entrada
  USING (
    empresa_id IN (
      SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "formas_pagamento_empresa" ON formas_pagamento
  USING (
    empresa_id IN (
      SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "condicoes_pagamento_empresa" ON condicoes_pagamento
  USING (
    empresa_id IN (
      SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()
    )
  );

-- ── Índices ──────────────────────────────────────────────────

CREATE INDEX idx_nfe_entrada_empresa ON nfe_entrada(empresa_id);
CREATE INDEX idx_nfe_entrada_pedido ON nfe_entrada(pedido_compra_id);
CREATE INDEX idx_nfe_entrada_chave ON nfe_entrada(chave_acesso);
CREATE INDEX idx_formas_pagamento_empresa ON formas_pagamento(empresa_id);
CREATE INDEX idx_condicoes_pagamento_empresa ON condicoes_pagamento(empresa_id);
