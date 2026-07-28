-- =================================================================
-- Sprint 13 — Financeiro Core: Plano de Contas, Contas e Lançamentos
-- ModulaAPP — 2026-05-12
-- =================================================================

-- ── 1. Plano de Contas (Categorias Financeiras) ───────────────

CREATE TABLE categorias_financeiras (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  parent_id           UUID REFERENCES categorias_financeiras(id) ON DELETE SET NULL,
  codigo              TEXT NOT NULL,
  nome                TEXT NOT NULL,
  tipo                TEXT NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA', 'CUSTO')),
  ativo               BOOLEAN NOT NULL DEFAULT true,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, codigo)
);

-- ── 2. Contas Bancárias / Caixas ──────────────────────────────

CREATE TABLE contas_bancarias (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  nome                TEXT NOT NULL,
  tipo                TEXT NOT NULL CHECK (tipo IN ('BANCO', 'CAIXA', 'APLICAÇÃO')),
  saldo_inicial       NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo_atual         NUMERIC(12,2) NOT NULL DEFAULT 0,
  ativo               BOOLEAN NOT NULL DEFAULT true,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Lançamentos (Movimentações de Caixa) ───────────────────

CREATE TABLE lancamentos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  conta_id            UUID NOT NULL REFERENCES contas_bancarias(id) ON DELETE RESTRICT,
  categoria_id        UUID NOT NULL REFERENCES categorias_financeiras(id) ON DELETE RESTRICT,
  data_pagamento      DATE NOT NULL DEFAULT CURRENT_DATE,
  valor               NUMERIC(12,2) NOT NULL,
  tipo                TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
  descricao           TEXT NOT NULL,
  documento_ref       TEXT,
  conciliado          BOOLEAN NOT NULL DEFAULT false,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. Contas a Pagar / Receber (Títulos) ────────────────────

CREATE TABLE contas_pagar_receber (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  cliente_id          UUID REFERENCES clientes(id) ON DELETE SET NULL,
  fornecedor_id       UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
  categoria_id        UUID NOT NULL REFERENCES categorias_financeiras(id) ON DELETE RESTRICT,
  data_vencimento     DATE NOT NULL,
  data_competencia    DATE NOT NULL DEFAULT CURRENT_DATE,
  valor_previsto      NUMERIC(12,2) NOT NULL,
  valor_pago          NUMERIC(12,2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'PENDENTE' 
    CHECK (status IN ('PENDENTE', 'PAGO', 'CANCELADO', 'ATRASADO')),
  lancamento_id       UUID REFERENCES lancamentos(id) ON DELETE SET NULL,
  observacoes         TEXT,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Triggers para Atualização de Saldo ─────────────────────────

CREATE OR REPLACE FUNCTION fn_atualizar_saldo_conta()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.tipo = 'ENTRADA') THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual + NEW.valor WHERE id = NEW.conta_id;
    ELSE
      UPDATE contas_bancarias SET saldo_atual = saldo_atual - NEW.valor WHERE id = NEW.conta_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.tipo = 'ENTRADA') THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual - OLD.valor WHERE id = OLD.conta_id;
    ELSE
      UPDATE contas_bancarias SET saldo_atual = saldo_atual + OLD.valor WHERE id = OLD.conta_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Primeiro estorna o antigo
    IF (OLD.tipo = 'ENTRADA') THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual - OLD.valor WHERE id = OLD.conta_id;
    ELSE
      UPDATE contas_bancarias SET saldo_atual = saldo_atual + OLD.valor WHERE id = OLD.conta_id;
    END IF;
    -- Depois aplica o novo
    IF (NEW.tipo = 'ENTRADA') THEN
      UPDATE contas_bancarias SET saldo_atual = saldo_atual + NEW.valor WHERE id = NEW.conta_id;
    ELSE
      UPDATE contas_bancarias SET saldo_atual = saldo_atual - NEW.valor WHERE id = NEW.conta_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_lancamento_atualiza_saldo
AFTER INSERT OR UPDATE OR DELETE ON lancamentos
FOR EACH ROW EXECUTE FUNCTION fn_atualizar_saldo_conta();

-- ── RLS Policies ─────────────────────────────────────────────

ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar_receber ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias_financeiras_empresa" ON categorias_financeiras
  USING (empresa_id IN (SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()));

CREATE POLICY "contas_bancarias_empresa" ON contas_bancarias
  USING (empresa_id IN (SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()));

CREATE POLICY "lancamentos_empresa" ON lancamentos
  USING (empresa_id IN (SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()));

CREATE POLICY "contas_pagar_receber_empresa" ON contas_pagar_receber
  USING (empresa_id IN (SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()));

-- ── Índices ──────────────────────────────────────────────────

CREATE INDEX idx_categorias_empresa ON categorias_financeiras(empresa_id);
CREATE INDEX idx_contas_bancarias_empresa ON contas_bancarias(empresa_id);
CREATE INDEX idx_lancamentos_empresa ON lancamentos(empresa_id);
CREATE INDEX idx_lancamentos_conta ON lancamentos(conta_id);
CREATE INDEX idx_lancamentos_data ON lancamentos(data_pagamento);
CREATE INDEX idx_cp_receber_empresa ON contas_pagar_receber(empresa_id);
CREATE INDEX idx_cp_receber_vencimento ON contas_pagar_receber(data_vencimento);
