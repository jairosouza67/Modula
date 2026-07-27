-- =================================================================
-- Sprint 12D — Créditos de Fornecedor, Representantes e Preços
-- Vidraçaria TOP — 2026-05-12
-- =================================================================

-- ── Créditos de Fornecedor ─────────────────────────────────────

CREATE TABLE creditos_fornecedor (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  fornecedor_id       UUID NOT NULL REFERENCES fornecedores(id) ON DELETE RESTRICT,
  tipo                TEXT NOT NULL 
    CHECK (tipo IN ('devolucao', 'bonificacao', 'desconto_futuro', 'nota_credito')),
  numero              TEXT NOT NULL,
  valor_original      NUMERIC(12,2) NOT NULL CHECK (valor_original > 0),
  valor_disponivel    NUMERIC(12,2) NOT NULL,
  data_emissao        DATE NOT NULL DEFAULT current_date,
  data_vencimento     DATE NOT NULL,
  descricao           TEXT,
  status              TEXT NOT NULL DEFAULT 'disponivel'
    CHECK (status IN ('disponivel', 'parcialmente_utilizado', 'utilizado', 'vencido')),
  criado_por          UUID REFERENCES auth.users(id),
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, fornecedor_id, numero)
);

-- ── Uso de Créditos (Histórico) ────────────────────────────────

CREATE TABLE creditos_uso (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credito_id          UUID NOT NULL REFERENCES creditos_fornecedor(id) ON DELETE CASCADE,
  pedido_compra_id    UUID NOT NULL REFERENCES pedidos_compra(id) ON DELETE RESTRICT,
  valor_utilizado     NUMERIC(12,2) NOT NULL CHECK (valor_utilizado > 0),
  data_uso            TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_por          UUID REFERENCES auth.users(id)
);

-- ── Representantes Comerciais ──────────────────────────────────

CREATE TABLE representantes_comerciais (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  fornecedor_id       UUID NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
  nome                TEXT NOT NULL,
  telefone            TEXT NOT NULL,
  email               TEXT NOT NULL,
  regiao              TEXT,
  observacoes         TEXT,
  ativo               BOOLEAN NOT NULL DEFAULT true,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tabela de Preços por Fornecedor ────────────────────────────

CREATE TABLE tabela_precos_fornecedor (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  fornecedor_id       UUID NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
  produto             TEXT NOT NULL,
  unidade             TEXT NOT NULL DEFAULT 'm2',
  preco               NUMERIC(12,2) NOT NULL CHECK (preco > 0),
  vigencia_inicio     DATE NOT NULL DEFAULT current_date,
  vigencia_fim        DATE NOT NULL,
  criado_por          UUID REFERENCES auth.users(id),
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, fornecedor_id, produto, vigencia_inicio, vigencia_fim)
);

-- ── Trigger: Atualizar Saldo e Status do Crédito ao Usar ───────

CREATE OR REPLACE FUNCTION trg_atualizar_saldo_credito()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_valor_total NUMERIC(12,2);
  v_original NUMERIC(12,2);
BEGIN
  -- Calcula o total utilizado para este crédito
  SELECT COALESCE(SUM(valor_utilizado), 0)
    INTO v_valor_total
    FROM creditos_uso
    WHERE credito_id = COALESCE(NEW.credito_id, OLD.credito_id);
    
  -- Busca o valor original
  SELECT valor_original INTO v_original
    FROM creditos_fornecedor
    WHERE id = COALESCE(NEW.credito_id, OLD.credito_id);
    
  -- Atualiza o valor_disponivel e status na tabela de créditos
  UPDATE creditos_fornecedor SET
    valor_disponivel = v_original - v_valor_total,
    status = CASE 
      WHEN (v_original - v_valor_total) <= 0 THEN 'utilizado'
      WHEN (v_original - v_valor_total) < v_original THEN 'parcialmente_utilizado'
      ELSE 'disponivel'
    END,
    atualizado_em = now()
  WHERE id = COALESCE(NEW.credito_id, OLD.credito_id);
  
  RETURN NULL; -- AFTER trigger
END;
$$;

CREATE TRIGGER trg_credito_uso_saldo
  AFTER INSERT OR UPDATE OR DELETE ON creditos_uso
  FOR EACH ROW EXECUTE FUNCTION trg_atualizar_saldo_credito();

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE creditos_fornecedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE creditos_uso ENABLE ROW LEVEL SECURITY;
ALTER TABLE representantes_comerciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabela_precos_fornecedor ENABLE ROW LEVEL SECURITY;

-- Creditos
CREATE POLICY "creditos_fornecedor_empresa" ON creditos_fornecedor
  USING (empresa_id IN (SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()));

-- Creditos Uso (através do crédito pai)
CREATE POLICY "creditos_uso_empresa" ON creditos_uso
  USING (credito_id IN (
    SELECT id FROM creditos_fornecedor WHERE empresa_id IN (
      SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()
    )
  ));

-- Representantes
CREATE POLICY "representantes_comerciais_empresa" ON representantes_comerciais
  USING (empresa_id IN (SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()));

-- Tabela de Preços
CREATE POLICY "tabela_precos_fornecedor_empresa" ON tabela_precos_fornecedor
  USING (empresa_id IN (SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()));

-- ── Índices ──────────────────────────────────────────────────

CREATE INDEX idx_creditos_fornec_empresa ON creditos_fornecedor(empresa_id);
CREATE INDEX idx_creditos_fornec_fornecedor ON creditos_fornecedor(fornecedor_id);
CREATE INDEX idx_creditos_uso_credito ON creditos_uso(credito_id);
CREATE INDEX idx_representantes_empresa ON representantes_comerciais(empresa_id);
CREATE INDEX idx_representantes_fornecedor ON representantes_comerciais(fornecedor_id);
CREATE INDEX idx_tabela_precos_empresa ON tabela_precos_fornecedor(empresa_id);
CREATE INDEX idx_tabela_precos_fornecedor ON tabela_precos_fornecedor(fornecedor_id);
