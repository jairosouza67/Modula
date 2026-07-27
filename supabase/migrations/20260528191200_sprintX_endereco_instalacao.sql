-- Adicionar campo de endereço de instalação à tabela ordens_servico
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS endereco_instalacao text;
