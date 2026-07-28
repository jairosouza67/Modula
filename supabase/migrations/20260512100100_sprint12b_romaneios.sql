-- =================================================================
-- Sprint 12B — Romaneios de Entrega + Entrada no Estoque
-- ModulaAPP — 2026-05-12
-- =================================================================

-- ── Romaneios ─────────────────────────────────────────────────

CREATE TABLE romaneios (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  pedido_compra_id    UUID NOT NULL REFERENCES pedidos_compra(id) ON DELETE RESTRICT,
  numero_nfe          TEXT,
  numero_oe           TEXT,
  data_emissao        DATE NOT NULL,
  data_recebimento    DATE,
  status              TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','em_conferencia','concluido','divergencia')),
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Itens do Romaneio ─────────────────────────────────────────

CREATE TABLE romaneio_itens (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  romaneio_id         UUID NOT NULL REFERENCES romaneios(id) ON DELETE CASCADE,
  produto             TEXT NOT NULL,
  espessura_mm        NUMERIC(6,2),
  largura_mm          NUMERIC(8,2) NOT NULL,
  altura_mm           NUMERIC(8,2) NOT NULL,
  qtd_encomendada     INTEGER NOT NULL,
  qtd_recebida        INTEGER NOT NULL DEFAULT 0,
  m2                  NUMERIC(10,4),
  peso_kg             NUMERIC(10,2),
  situacao            TEXT NOT NULL DEFAULT 'ok'
    CHECK (situacao IN ('ok','faltante','quebrado','fora_especificacao'))
);

-- ── Trigger: Criação automática de romaneio ao pedido ir para em_transporte ──

CREATE OR REPLACE FUNCTION trg_criar_romaneio_em_transporte()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_romaneio_id UUID;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'em_transporte' THEN
    -- Cria o romaneio
    INSERT INTO romaneios (empresa_id, pedido_compra_id, data_emissao)
    VALUES (NEW.empresa_id, NEW.id, CURRENT_DATE)
    RETURNING id INTO v_romaneio_id;

    -- Copia os itens do pedido para o romaneio
    INSERT INTO romaneio_itens (romaneio_id, produto, largura_mm, altura_mm, qtd_encomendada, m2)
    SELECT v_romaneio_id, produto, largura_mm, altura_mm, quantidade, m2_calculado
    FROM pedidos_compra_itens
    WHERE pedido_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pedido_em_transporte_romaneio
  AFTER UPDATE ON pedidos_compra
  FOR EACH ROW EXECUTE FUNCTION trg_criar_romaneio_em_transporte();

-- ── Trigger: Entrada automática no estoque ao concluir romaneio ──

CREATE OR REPLACE FUNCTION trg_entrada_estoque_romaneio()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_item RECORD;
  v_estoque_id UUID;
BEGIN
  -- Só processa quando status muda para concluido
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'concluido' THEN
    FOR v_item IN
      SELECT * FROM romaneio_itens
      WHERE romaneio_id = NEW.id AND situacao = 'ok'
    LOOP
      -- Verifica se item já existe no estoque
      SELECT id INTO v_estoque_id
      FROM estoque_itens
      WHERE empresa_id = NEW.empresa_id AND nome = v_item.produto
      LIMIT 1;

      IF v_estoque_id IS NOT NULL THEN
        -- Registra movimentação de entrada
        INSERT INTO estoque_movimentacoes (
          item_id, tipo, quantidade, referencia_tipo, referencia_id, observacao
        ) VALUES (
          v_estoque_id, 'entrada', v_item.qtd_recebida,
          'romaneio', NEW.id,
          'Entrada automática via romaneio ' || NEW.id::TEXT
        );
      END IF;
    END LOOP;

    -- Avança o pedido para concluído
    UPDATE pedidos_compra
    SET status = 'concluido', atualizado_em = now()
    WHERE id = NEW.pedido_compra_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_romaneio_concluido_estoque
  AFTER UPDATE ON romaneios
  FOR EACH ROW EXECUTE FUNCTION trg_entrada_estoque_romaneio();

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE romaneios ENABLE ROW LEVEL SECURITY;
ALTER TABLE romaneio_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "romaneios_empresa" ON romaneios
  USING (
    empresa_id IN (
      SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "romaneio_itens_empresa" ON romaneio_itens
  USING (
    romaneio_id IN (
      SELECT id FROM romaneios WHERE empresa_id IN (
        SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()
      )
    )
  );

-- ── Índices ──────────────────────────────────────────────────

CREATE INDEX idx_romaneios_empresa ON romaneios(empresa_id);
CREATE INDEX idx_romaneios_pedido ON romaneios(pedido_compra_id);
CREATE INDEX idx_romaneio_itens_romaneio ON romaneio_itens(romaneio_id);
