-- Sprint 11: RH - Colaboradores
-- Criação da tabela de colaboradores com suporte a RLS por empresa

CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  cargo VARCHAR(100) NOT NULL,
  salario DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Afastado')),
  data_admissao DATE NOT NULL,
  data_demissao DATE,
  data_limite_ferias DATE,
  horas_extras_mes DECIMAL(5, 2) DEFAULT 0,
  telefone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_colaboradores_empresa ON colaboradores(empresa_id);
CREATE INDEX idx_colaboradores_status ON colaboradores(status);
CREATE INDEX idx_colaboradores_cargo ON colaboradores(cargo);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_colaboradores
  BEFORE UPDATE ON colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver colaboradores da sua empresa
CREATE POLICY "Colaboradores são isolados por empresa"
  ON colaboradores
  FOR ALL
  USING (empresa_id IN (
    SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()
  ));

-- Política: insert apenas se pertencer à empresa
CREATE POLICY "Insert colaboradores da própria empresa"
  ON colaboradores
  FOR INSERT
  WITH CHECK (empresa_id IN (
    SELECT empresa_id FROM perfis_usuario WHERE user_id = auth.uid()
  ));
