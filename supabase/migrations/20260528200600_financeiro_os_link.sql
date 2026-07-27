-- Adiciona link com Ordem de Serviço em contas a pagar/receber
ALTER TABLE public.contas_pagar_receber 
ADD COLUMN IF NOT EXISTS ordem_servico_id UUID REFERENCES public.ordens_servico(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS parcela TEXT;

-- Adiciona índice para buscas mais rápidas
CREATE INDEX IF NOT EXISTS idx_cp_receber_os ON public.contas_pagar_receber(ordem_servico_id);

-- Cria uma conta bancária padrão e categorias padrões via trigger quando uma empresa é criada (Opcional, mas útil para o MVP)
-- Vamos inserir uma conta e categorias padrão para empresas existentes caso não tenham
DO $$
DECLARE
    empresa RECORD;
    caixa_id UUID;
    cat_receita_id UUID;
    cat_despesa_id UUID;
BEGIN
    FOR empresa IN SELECT id FROM public.empresas LOOP
        -- Cria Caixa Principal se não existir
        IF NOT EXISTS (SELECT 1 FROM public.contas_bancarias WHERE empresa_id = empresa.id AND nome = 'Caixa Principal') THEN
            INSERT INTO public.contas_bancarias (empresa_id, nome, tipo, saldo_inicial, saldo_atual, ativo)
            VALUES (empresa.id, 'Caixa Principal', 'CAIXA', 0, 0, true)
            RETURNING id INTO caixa_id;
        END IF;

        -- Cria Categoria de Receita padrão se não existir
        IF NOT EXISTS (SELECT 1 FROM public.categorias_financeiras WHERE empresa_id = empresa.id AND codigo = '1.01') THEN
            INSERT INTO public.categorias_financeiras (empresa_id, codigo, nome, tipo, ativo)
            VALUES (empresa.id, '1.01', 'Receita de Serviços', 'RECEITA', true)
            RETURNING id INTO cat_receita_id;
        END IF;

        -- Cria Categoria de Despesa padrão se não existir
        IF NOT EXISTS (SELECT 1 FROM public.categorias_financeiras WHERE empresa_id = empresa.id AND codigo = '2.01') THEN
            INSERT INTO public.categorias_financeiras (empresa_id, codigo, nome, tipo, ativo)
            VALUES (empresa.id, '2.01', 'Despesas Operacionais', 'DESPESA', true)
            RETURNING id INTO cat_despesa_id;
        END IF;
    END LOOP;
END $$;
