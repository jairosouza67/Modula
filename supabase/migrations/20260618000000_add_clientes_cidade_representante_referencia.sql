-- Adiciona campos cidade, representante e referencia na tabela clientes
-- para uso no PDF de orçamento (conforme layout profissional)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS representante text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS referencia text;
