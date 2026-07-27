import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEstoque, useEstoqueMutations } from '@/hooks/useEstoque';
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

describe('useEstoque', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
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

  it('deve mapear os campos do banco (snake_case) para o modelo (camelCase) na listagem', async () => {
    const mockData = [
      {
        id: '1',
        codigo: 'VID-001',
        descricao: 'Vidro Temperado',
        categoria: 'Chapas',
        unidade: 'm2',
        quantidade: 10,
        estoque_minimo: 5,
        custo_unitario: 100,
      },
    ];

    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => {
      // Simulamos a execução da queryFn
      return { data: undefined, queryFn };
    });

    const { queryFn } = useEstoque() as any;
    
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.is.mockReturnThis();
    mockSupabase.order.mockResolvedValue({ data: mockData, error: null });

    const result = await queryFn();

    expect(result[0]).toEqual({
      id: '1',
      codigo: 'VID-001',
      descricao: 'Vidro Temperado',
      categoria: 'Chapas',
      unidade: 'm2',
      quantidade: 10,
      estoqueMinimo: 5,
      custoUnitario: 100,
    });
  });

  it('createMovimentacao deve inserir log e atualizar quantidade do item', async () => {
    const mutations = useEstoqueMutations();
    
    // Pegamos a mutationFn de createMovimentacao
    const mutationCalls = (reactQuery.useMutation as any).mock.calls;
    const createMovCall = mutationCalls.find((call: any) => 
      call[0].mutationFn.toString().includes('estoque_movimentacoes')
    );
    
    const mutationFn = createMovCall[0].mutationFn;

    mockSupabase.insert.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'mov-1' }, error: null }); // Insert mov
    mockSupabase.select.mockReturnThis();
    
    // Configura chamadas sequenciais para eq
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase) // 1ª chamada: no GET (segue para single)
      .mockResolvedValueOnce({ error: null }); // 2ª chamada: no UPDATE (terminal)

    mockSupabase.single.mockResolvedValueOnce({ data: { quantidade: 10 }, error: null }); // Get item qty
    
    mockSupabase.update.mockReturnThis();

    await mutationFn({
      itemId: 'item-1',
      tipo: 'Entrada',
      quantidade: 5,
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('estoque_movimentacoes');
    expect(mockSupabase.insert).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ item_id: 'item-1', tipo: 'Entrada', quantidade: 5 })
    ]));
    
    expect(mockSupabase.from).toHaveBeenCalledWith('estoque_itens');
    expect(mockSupabase.update).toHaveBeenCalledWith({ quantidade: 15 });
  });
});
