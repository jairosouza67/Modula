-- =============================================================================
-- Loop 1 — Catálogo de Produtos e Serviços Compostos
-- Migração: 20260518_orcamento_produtos
-- Tabelas: produtos, servicos_compostos, servico_componentes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tabela de Produtos (vidros, kits, ferragens, serviços)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'm²',   -- m², und, ML
  valor_compra NUMERIC(10,2) NOT NULL DEFAULT 0,
  margem_lucro NUMERIC(5,4) NOT NULL DEFAULT 0.46,
  valor_venda NUMERIC(10,2) GENERATED ALWAYS AS (valor_compra * (1 + margem_lucro)) STORED,
  categoria TEXT NOT NULL DEFAULT 'vidro',  -- vidro, kit, ferragem, servico
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_produto_codigo_empresa UNIQUE(empresa_id, codigo)
);

COMMENT ON TABLE produtos IS 'Catálogo de produtos base (vidros, kits, ferragens) — valores extraídos da planilha ORÇ VIDRAÇARIA ATUALIZADO';
COMMENT ON COLUMN produtos.codigo IS 'Código do produto: VI8, KA, PX40, etc.';
COMMENT ON COLUMN produtos.categoria IS 'vidro | kit | ferragem | servico';
COMMENT ON COLUMN produtos.valor_venda IS 'Valor gerado por fórmula: valor_compra × (1 + margem_lucro) — coluna STORED';

-- ---------------------------------------------------------------------------
-- 2. Tabela de Serviços Compostos (ex: PPI8, PCV2…)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicos_compostos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,              -- porta_pivotante, porta_correr, janela, box, especial
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_servico_codigo_empresa UNIQUE(empresa_id, codigo)
);

COMMENT ON TABLE servicos_compostos IS 'Serviços formados por combinação de produtos (≈ aba CALCULO da planilha)';
COMMENT ON COLUMN servicos_compostos.categoria IS 'porta_pivotante | porta_correr | janela | box | especial';

-- ---------------------------------------------------------------------------
-- 3. Componentes de cada Serviço Composto
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servico_componentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID NOT NULL REFERENCES servicos_compostos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  quantidade NUMERIC(6,2) NOT NULL DEFAULT 1,
  tipo_preco TEXT NOT NULL DEFAULT 'M2',  -- M2, PC_FX, PC_ML
  ordem INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE servico_componentes IS 'Itens que compõem um serviço composto (vidro + kits + ferragens)';
COMMENT ON COLUMN servico_componentes.tipo_preco IS 'M2 (metro quadrado) | PC_FX (preço fixo) | PC_ML (metro linear)';

-- ---------------------------------------------------------------------------
-- 4. Índices para performance
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_produtos_empresa_ativo ON produtos(empresa_id, ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_servicos_compostos_empresa ON servicos_compostos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_servico_componentes_servico ON servico_componentes(servico_id);

-- ---------------------------------------------------------------------------
-- 5. RLS — Produtos visíveis para todos os membros da empresa
-- ---------------------------------------------------------------------------
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_compostos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servico_componentes ENABLE ROW LEVEL SECURITY;

-- Política: leitura para colaboradores da mesma empresa
CREATE POLICY "leitura_produtos_por_empresa" ON produtos
  FOR SELECT
  USING (empresa_id IN (
    SELECT pe.empresa_id FROM perfis_usuario pe WHERE pe.user_id = auth.uid()
  ));

CREATE POLICY "leitura_servicos_compostos_por_empresa" ON servicos_compostos
  FOR SELECT
  USING (empresa_id IN (
    SELECT pe.empresa_id FROM perfis_usuario pe WHERE pe.user_id = auth.uid()
  ));

CREATE POLICY "leitura_servico_componentes_por_servico" ON servico_componentes
  FOR SELECT
  USING (
    servico_id IN (
      SELECT sc.id FROM servicos_compostos sc
      WHERE sc.empresa_id IN (
        SELECT pe.empresa_id FROM perfis_usuario pe WHERE pe.user_id = auth.uid()
      )
    )
  );

-- Política: escrita restrita a admin / gestor (a implementar conforme necessidade, mantendo SELECT público por ora)