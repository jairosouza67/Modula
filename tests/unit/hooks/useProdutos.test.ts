import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProdutos, useServicosCompostos, useProdutoPorCodigo } from '@/hooks/useProdutos';
import * as reactQuery from '@tanstack/react-query';
import * as supabaseClient from '@/lib/supabase/client';
import * as companyLib from '@/lib/supabase/company';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));
vi.mock('@/lib/supabase/client');
vi.mock('@/lib/supabase/company');
vi.mock('sonner');

describe('T1.5 — Hook useProdutos', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabaseClient.getSupabaseBrowserClient as any).mockReturnValue(mockSupabase);
    (companyLib.getDefaultEmpresaId as any).mockReturnValue('emp-123');
  });

  describe('useProdutos — listagem', () => {
    it('retorna lista de produtos ativos ordenados por código', async () => {
      const mockData = [
        { id: '1', empresa_id: 'emp-123', codigo: 'BFJ', descricao: 'Bate Fecha Janela', unidade: 'und', valor_compra: 13.70, margem_lucro: 0.46, valor_venda: 20.00, categoria: 'ferragem', ativo: true },
        { id: '2', empresa_id: 'emp-123', codigo: 'VI8', descricao: 'Vidro Incolor 8mm', unidade: 'm²', valor_compra: 246.58, margem_lucro: 0.46, valor_venda: 360.01, categoria: 'vidro', ativo: true },
      ];

      (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => {
        return { data: undefined, queryFn };
      });

      const { queryFn } = useProdutos() as any;

      mockSupabase.order.mockResolvedValue({ data: mockData, error: null });

      const result = await queryFn();
      expect(result).toHaveLength(2);
      expect(result[0].codigo).toBe('BFJ');
      expect(result[1].codigo).toBe('VI8');
    });

    it('retorna array vazio quando não há produtos', async () => {
      (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => {
        return { data: undefined, queryFn };
      });

      const { queryFn } = useProdutos() as any;

      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const result = await queryFn();
      expect(result).toEqual([]);
    });

    it('propaga erro do Supabase', async () => {
      (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => {
        return { data: undefined, queryFn };
      });

      const { queryFn } = useProdutos() as any;

      mockSupabase.order.mockResolvedValue({ data: null, error: new Error('DB error') });

      await expect(queryFn()).rejects.toThrow('DB error');
    });

    it('está desabilitado se empresaId é nulo', () => {
      (companyLib.getDefaultEmpresaId as any).mockReturnValue(null);

      let capturedEnabled: boolean | undefined;
      (reactQuery.useQuery as any).mockImplementation((options: any) => {
        capturedEnabled = options.enabled;
        return { data: null };
      });

      useProdutos();
      expect(capturedEnabled).toBe(false);
    });
  });

  describe('useServicosCompostos — serviços expandidos', () => {
    it('retorna serviços com componentes e produtos aninhados', async () => {
      const mockServicos = [
        {
          id: 'svc-1',
          empresa_id: 'emp-123',
          codigo: 'PPI8',
          nome: 'Porta Pivotante Incolor 8mm',
          categoria: 'porta_pivotante',
          componentes: [
            {
              id: 'comp-1',
              servico_id: 'svc-1',
              produto_id: 'p-vi8',
              quantidade: 1,
              tipo_preco: 'M2',
              ordem: 1,
              produto: { id: 'p-vi8', codigo: 'VI8', descricao: 'Vidro Incolor 8mm', valor_venda: 360.01, categoria: 'vidro', unidade: 'm²' },
            },
            {
              id: 'comp-2',
              servico_id: 'svc-1',
              produto_id: 'p-px40',
              quantidade: 1,
              tipo_preco: 'PC_FX',
              ordem: 2,
              produto: { id: 'p-px40', codigo: 'PX40', descricao: 'Puxador Inox 40cm', valor_venda: 50.00, categoria: 'ferragem', unidade: 'und' },
            },
          ],
        },
      ];

      (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => {
        return { data: undefined, queryFn };
      });

      const { queryFn } = useServicosCompostos() as any;

      mockSupabase.order.mockResolvedValue({ data: mockServicos, error: null });

      const result = await queryFn();
      expect(result).toHaveLength(1);
      expect(result[0].codigo).toBe('PPI8');
      expect(result[0].componentes).toHaveLength(2);
      expect(result[0].componentes[0].produto.codigo).toBe('VI8');
      expect(result[0].componentes[1].produto.codigo).toBe('PX40');
    });

    it('retorna array vazio quando não há serviços', async () => {
      (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => {
        return { data: undefined, queryFn };
      });

      const { queryFn } = useServicosCompostos() as any;

      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const result = await queryFn();
      expect(result).toEqual([]);
    });
  });

  describe('useProdutoPorCodigo — busca pontual', () => {
    it('retorna produto quando código existe', async () => {
      const mockProduto = { id: '1', empresa_id: 'emp-123', codigo: 'VI8', descricao: 'Vidro Incolor 8mm', unidade: 'm²', valor_compra: 246.58, margem_lucro: 0.46, valor_venda: 360.01, categoria: 'vidro', ativo: true };

      (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => {
        return { data: undefined, queryFn };
      });

      const { queryFn } = useProdutoPorCodigo('VI8') as any;

      mockSupabase.single.mockResolvedValue({ data: mockProduto, error: null });

      const result = await queryFn();
      expect(result).not.toBeNull();
      expect(result!.codigo).toBe('VI8');
      expect(result!.valor_venda).toBe(360.01);
    });

    it('retorna null quando código não existe', async () => {
      (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => {
        return { data: undefined, queryFn };
      });

      const { queryFn } = useProdutoPorCodigo('XYZ') as any;

      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await queryFn();
      expect(result).toBeNull();
    });

    it('retorna null quando código é null', async () => {
      (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => {
        return { data: undefined, queryFn };
      });

      const { queryFn } = useProdutoPorCodigo(null) as any;

      const result = await queryFn();
      expect(result).toBeNull();
    });

    it('está desabilitado sem empresaId', () => {
      (companyLib.getDefaultEmpresaId as any).mockReturnValue(null);

      let capturedEnabled: boolean | undefined;
      (reactQuery.useQuery as any).mockImplementation((options: any) => {
        capturedEnabled = options.enabled;
        return { data: null };
      });

      useProdutoPorCodigo('VI8');
      expect(capturedEnabled).toBe(false);
    });

    it('está desabilitado sem código', () => {
      let capturedEnabled: boolean | undefined;
      (reactQuery.useQuery as any).mockImplementation((options: any) => {
        capturedEnabled = options.enabled;
        return { data: null };
      });

      useProdutoPorCodigo(null);
      expect(capturedEnabled).toBe(false);
    });
  });
});