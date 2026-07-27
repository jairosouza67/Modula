-- Adicionar horário previsto para a instalação
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS hora_previsao time;

-- Adicionar status específico para o campo/instalação
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS status_instalacao text CHECK (status_instalacao IN ('Agendado', 'Em Rota', 'Concluido')) DEFAULT 'Agendado';
