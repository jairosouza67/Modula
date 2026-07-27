-- Remover foreign key existente (se ela for nomeada de forma diferente, precisaremos ajustar. Por padrao no supabase  ordens_servico_tecnico_id_fkey)
ALTER TABLE public.ordens_servico 
  DROP CONSTRAINT IF EXISTS ordens_servico_tecnico_id_fkey;

-- Limpar tecnico_id de ordens de serviço onde o ID não existe na tabela colaboradores
-- Isso é necessário para não violar a nova constraint ao criá-la.
UPDATE public.ordens_servico 
SET tecnico_id = NULL 
WHERE tecnico_id IS NOT NULL AND tecnico_id NOT IN (SELECT id FROM public.colaboradores);

-- Adicionar nova foreign key apontando para a tabela colaboradores
ALTER TABLE public.ordens_servico
  ADD CONSTRAINT ordens_servico_tecnico_id_fkey 
  FOREIGN KEY (tecnico_id) 
  REFERENCES public.colaboradores(id) 
  ON DELETE SET NULL;
