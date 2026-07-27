import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePedidos, usePedidoMutations } from '@/hooks/usePedidos';
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

describe('usePedidos', () => {
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

  it('deve chamar useQuery com a queryKey correta', () => {
    usePedidos();
    expect(reactQuery.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['pedidos', 'emp-123'],
      })
    );
  });

  it('deve configurar as mutações corretamente', () => {
    const mutations = usePedidoMutations();
    expect(reactQuery.useMutation).toHaveBeenCalledTimes(3); // create, update, delete
    expect(mutations).toHaveProperty('createPedido');
    expect(mutations).toHaveProperty('updatePedido');
    expect(mutations).toHaveProperty('deletePedido');
  });
});
