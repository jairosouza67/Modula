-- =================================================================
-- Simplificação do Módulo de Compras
-- Status: rascunho / aguardando_aprovacao / aprovado / enviado / recebido_parcial / recebido_total / cancelado
-- Modificação dos itens para focar em produtos e quantidade recebida
-- =================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Remover restrições de verificação (CHECK) da coluna status em pedidos_compra
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'pedidos_compra'::regclass 
      AND contype = 'c' 
      AND conname LIKE '%status%'
  ) LOOP
    EXECUTE 'ALTER TABLE pedidos_compra DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- Atualizar status existentes para os novos
UPDATE pedidos_compra SET status = 'rascunho' WHERE status = 'emissao';
UPDATE pedidos_compra SET status = 'aguardando_aprovacao' WHERE status = 'aguardando_liberacao';
UPDATE pedidos_compra SET status = 'enviado' WHERE status = 'enviado_fornecedor' OR status = 'previsao_confirmada' OR status = 'em_producao' OR status = 'em_transporte';
UPDATE pedidos_compra SET status = 'recebido_total' WHERE status = 'concluido';

-- Adicionar nova restrição
ALTER TABLE pedidos_compra
  ADD CONSTRAINT pedidos_compra_status_check
  CHECK (status IN (
    'rascunho',
    'aguardando_aprovacao',
    'aprovado',
    'enviado',
    'recebido_parcial',
    'recebido_total',
    'cancelado'
  ));

-- Alterar padrão do status
ALTER TABLE pedidos_compra ALTER COLUMN status SET DEFAULT 'rascunho';

-- =================================================================
-- Alterações em pedidos_compra_itens
-- =================================================================

ALTER TABLE pedidos_compra_itens 
  ADD COLUMN IF NOT EXISTS produto_id UUID REFERENCES produtos(id),
  ADD COLUMN IF NOT EXISTS quantidade_recebida INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preco_unitario NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Atualizar os preços unitários com base no que já existia
UPDATE pedidos_compra_itens SET preco_unitario = preco_m2 WHERE preco_unitario = 0;

-- Permitir null nas colunas que antes eram NOT NULL mas são irrelevantes para kits/ferragens
ALTER TABLE pedidos_compra_itens
  ALTER COLUMN largura_mm DROP NOT NULL,
  ALTER COLUMN largura_mm SET DEFAULT 0,
  ALTER COLUMN altura_mm DROP NOT NULL,
  ALTER COLUMN altura_mm SET DEFAULT 0,
  ALTER COLUMN m2_calculado DROP NOT NULL,
  ALTER COLUMN m2_calculado SET DEFAULT 0,
  ALTER COLUMN preco_m2 DROP NOT NULL,
  ALTER COLUMN preco_m2 SET DEFAULT 0;
