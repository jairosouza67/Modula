-- Add fornecedor_id to produtos table
ALTER TABLE public.produtos
ADD COLUMN fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL;
