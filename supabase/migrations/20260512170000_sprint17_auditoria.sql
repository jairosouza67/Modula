-- Sprint 17: Auditoria e Segurança Avançada
-- Tabela para persistência de logs de auditoria

CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    acao TEXT NOT NULL,
    severidade TEXT NOT NULL CHECK (severidade IN ('low', 'medium', 'high', 'critical')),
    detalhes JSONB,
    ip_origem TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Polices
-- Apenas usuários autenticados da empresa podem ler os logs (geralmente admins, mas aqui mantemos o padrão de tenant)
CREATE POLICY "Users can read their company's audit logs"
    ON public.logs_auditoria
    FOR SELECT
    USING (public.can_access_empresa(empresa_id));

-- Inserção permitida para qualquer usuário autenticado (as ações do sistema registram aqui)
CREATE POLICY "Users can insert audit logs"
    ON public.logs_auditoria
    FOR INSERT
    WITH CHECK (public.can_access_empresa(empresa_id));

-- Comentários para documentação
COMMENT ON TABLE public.logs_auditoria IS 'Logs de auditoria para ações críticas e conformidade LGPD.';
COMMENT ON COLUMN public.logs_auditoria.acao IS 'Descrição da ação realizada (ex: anonimizar_titular, login_sucesso).';
COMMENT ON COLUMN public.logs_auditoria.severidade IS 'Nível de criticidade da ação para monitoramento.';
