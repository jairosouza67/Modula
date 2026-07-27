-- Migração: adicionar role superadmin à tabela perfis_usuario
-- Permite que o usuário-chave do sistema (REDACTED@dev.local) tenha role superadmin

DO $$
BEGIN
    -- Remove a constraint antiga se existir (PostgreSQL gera nome automaticamente para CHECK inline)
    ALTER TABLE public.perfis_usuario
    DROP CONSTRAINT IF EXISTS perfis_usuario_role_check;

    -- Adiciona nova constraint com superadmin incluído
    ALTER TABLE public.perfis_usuario
    ADD CONSTRAINT perfis_usuario_role_check
    CHECK (role IN ('superadmin', 'admin', 'gestor', 'vendedor', 'tecnico', 'financeiro'));
END
$$;

-- Atualiza qualquer usuário com email REDACTED@dev.local para superadmin (case-insensitive)
UPDATE public.perfis_usuario
SET role = 'superadmin'
WHERE LOWER(email) = 'REDACTED@dev.local';
