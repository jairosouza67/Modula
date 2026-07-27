-- =================================================================
-- Sprint 12A — Pedido de Compra, Liberação e Tracker (Fase 2.5)
-- Vidraçaria TOP — 2026-05-12
-- =================================================================

-- ── Pedidos de Compra ─────────────────────────────────────────

CREATE TABLE pedidos_compra (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  numero              TEXT NOT NULL, -- PC-0001
  fornecedor_id       UUID NOT NULL REFERENCES fornecedores(id) ON DELETE RESTRICT,
  condicao_pagamento_id UUID REFERENCES condicoes_pagamento(id),
  forma_pagamento_id  UUID REFERENCES formas_pagamento(id),
  previsao_entrega    DATE NOT NULL,
  observacoes         TEXT,
  status              TEXT NOT NULL DEFAULT 'emissao'
    CHECK (status IN (
      'emissao','aguardando_liberacao','autorizado',
      'enviado_fornecedor','previsao_confirmada',
      'em_producao','em_transporte','concluido'
    )),
  status_liberacao    TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status_liberacao IN ('pendente','liberado','reprovado','revisao')),
  justificativa_reprovacao TEXT,
  limite_liberacao    NUMERIC(12,2) NOT NULL DEFAULT 5000,
  valor_total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  area_total_m2       NUMERIC(10,4) NOT NULL DEFAULT 0,
  qtd_total_pecas     INTEGER NOT NULL DEFAULT 0,
  data_conclusao      TIMESTAMPTZ,
  criado_por          UUID REFERENCES auth.users(id),
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, numero)
);

-- ── Itens do Pedido de Compra ────────────────────────────────

CREATE TABLE pedidos_compra_itens (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id           UUID NOT NULL REFERENCES pedidos_compra(id) ON DELETE CASCADE,
  produto             TEXT NOT NULL,
  projeto_vinculado   TEXT,
  os_vinculada        UUID REFERENCES ordens_servico(id),
  largura_mm          NUMERIC(8,2) NOT NULL,
  altura_mm           NUMERIC(8,2) NOT NULL,
  quantidade          INTEGER NOT NULL CHECK (quantidade > 0),
  m2_calculado        NUMERIC(10,4) NOT NULL,
  preco_m2            NUMERIC(10,2) NOT NULL,
  total               NUMERIC(12,2) NOT NULL
);

-- ── Rastreio de Etapas por Pedido ───────────────────────────

CREATE TABLE pedidos_compra_etapas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id           UUID NOT NULL REFERENCES pedidos_compra(id) ON DELETE CASCADE,
  etapa               TEXT NOT NULL,
  data_hora           TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_id          UUID REFERENCES auth.users(id),
  usuario_nome        TEXT,
  observacao          TEXT
);

-- ── Sequência de Número de Pedido por Empresa ────────────────

CREATE SEQUENCE IF NOT EXISTS pedido_compra_seq START 1;

CREATE OR REPLACE FUNCTION gerar_numero_pedido_compra(p_empresa_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_seq BIGINT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 4) AS BIGINT)), 0) + 1
    INTO v_seq
    FROM pedidos_compra
    WHERE empresa_id = p_empresa_id;
  RETURN 'PC-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$;

-- ── Trigger: Registra etapa ao UPDATE de status ──────────────

CREATE OR REPLACE FUNCTION trg_registrar_etapa_pedido()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO pedidos_compra_etapas (pedido_id, etapa, usuario_nome)
    VALUES (NEW.id, NEW.status, 'Sistema');

    -- Marca data_conclusao quando concluído
    IF NEW.status = 'concluido' THEN
      NEW.data_conclusao = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pedido_compra_etapa
  BEFORE UPDATE ON pedidos_compra
  FOR EACH ROW EXECUTE FUNCTION trg_registrar_etapa_pedido();

-- ── Trigger: Auto-atualiza valor_total e totalizadores ───────

CREATE OR REPLACE FUNCTION trg_atualizar_totais_pedido()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE pedidos_compra SET
    valor_total    = (SELECT COALESCE(SUM(total), 0) FROM pedidos_compra_itens WHERE pedido_id = NEW.pedido_id),
    area_total_m2  = (SELECT COALESCE(SUM(m2_calculado), 0) FROM pedidos_compra_itens WHERE pedido_id = NEW.pedido_id),
    qtd_total_pecas = (SELECT COALESCE(SUM(quantidade), 0) FROM pedidos_compra_itens WHERE pedido_id = NEW.pedido_id),
    atualizado_em  = now()
  WHERE id = NEW.pedido_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_item_pedido_totais
  AFTER INSERT OR UPDATE OR DELETE ON pedidos_compra_itens
  FOR EACH ROW EXECUTE FUNCTION trg_atualizar_totais_pedido();

-- ── Trigger: Auto-status baseado no limite de liberação ──────

CREATE OR REPLACE FUNCTION trg_status_inicial_pedido()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Após calcular o total, define o status inicial
  IF NEW.status = 'emissao' AND NEW.valor_total > NEW.limite_liberacao THEN
    NEW.status = 'aguardando_liberacao';
  ELSIF NEW.status = 'emissao' THEN
    NEW.status = 'autorizado';
  END IF;
  RETURN NEW;
END;
$$;

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_compra_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_compra_etapas ENABLE ROW LEVEL SECURITY;

-- Pedidos: isolamento por empresa
CREATE POLICY "pedidos_compra_empresa" ON pedidos_compra
  USING (
    empresa_id IN (
      SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()
    )
  );

-- Itens: via pedido da empresa
CREATE POLICY "pedidos_compra_itens_empresa" ON pedidos_compra_itens
  USING (
    pedido_id IN (
      SELECT id FROM pedidos_compra WHERE empresa_id IN (
        SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()
      )
    )
  );

-- Etapas: via pedido da empresa
CREATE POLICY "pedidos_compra_etapas_empresa" ON pedidos_compra_etapas
  USING (
    pedido_id IN (
      SELECT id FROM pedidos_compra WHERE empresa_id IN (
        SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()
      )
    )
  );

-- ── Índices ──────────────────────────────────────────────────

CREATE INDEX idx_pedidos_compra_empresa ON pedidos_compra(empresa_id);
CREATE INDEX idx_pedidos_compra_fornecedor ON pedidos_compra(fornecedor_id);
CREATE INDEX idx_pedidos_compra_status ON pedidos_compra(status);
CREATE INDEX idx_pedidos_compra_etapas_pedido ON pedidos_compra_etapas(pedido_id);
CREATE INDEX idx_pedidos_compra_itens_pedido ON pedidos_compra_itens(pedido_id);
