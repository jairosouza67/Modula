import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAgendaSemanal, useInstaladoresStats } from '@/hooks/useInstalacoes';
import * as reactQuery from '@tanstack/react-query';
import * as supabaseClient from '@/lib/supabase/client';
import * as companyLib from '@/lib/supabase/company';
import { format, startOfWeek } from 'date-fns';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));
vi.mock('@/lib/supabase/client');
vi.mock('@/lib/supabase/company');

describe('useInstalacoes Hooks', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabaseClient.getSupabaseBrowserClient as any).mockReturnValue(mockSupabase);
    (companyLib.getDefaultEmpresaId as any).mockReturnValue('emp-123');
  });

  describe('useAgendaSemanal', () => {
    it('deve chamar useQuery com a queryKey correta para a agenda semanal', () => {
      const testDate = new Date(2026, 4, 12); // May 12, 2026
      const start = startOfWeek(testDate, { weekStartsOn: 1 });
      const expectedKey = ['agenda-semanal', 'emp-123', format(start, "yyyy-MM-dd")];
      
      useAgendaSemanal(testDate);
      
      expect(reactQuery.useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expectedKey,
        })
      );
    });
  });

  describe('useInstaladoresStats', () => {
    it('deve chamar useQuery com a queryKey correta para as estatísticas de instaladores', () => {
      useInstaladoresStats();
      
      expect(reactQuery.useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['instaladores-stats', 'emp-123'],
        })
      );
    });
  });
});
