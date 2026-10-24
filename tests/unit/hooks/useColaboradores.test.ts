import { describe, it, expect, vi, beforeEach } from "vitest";
import { useColaboradores } from "@/hooks/useColaboradores";
import * as reactQuery from "@tanstack/react-query";
import * as supabaseClient from "@/lib/supabase/client";
import * as companyLib from "@/lib/supabase/company";

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));
vi.mock('@/lib/supabase/client');
vi.mock('@/lib/supabase/company');
vi.mock('sonner');

describe('Hook useColaboradores', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabaseClient.getSupabaseBrowserClient as any).mockReturnValue(mockSupabase);
    (companyLib.getDefaultEmpresaId as any).mockReturnValue('emp-99');
  });

  it('mapeia snake_case para camelCase', async () => {
    const mockData = [
      {
        id: 'col-1',
        nome: 'Lucas Martins',
        cpf: '12345678900',
        cargo: 'Instalador',
        salario: 3500,
        status: 'Ativo',
        data_admissao: '2024-01-15',
        data_demissao: null,
        data_limite_ferias: '2026-04-30',
        horas_extras_mes: 12,
        telefone: '11987654321',
        email: 'lucas@modula.com',
      },
    ];

    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => ({ queryFn }));
    const { queryFn } = useColaboradores() as any;
    mockSupabase.order.mockResolvedValue({ data: mockData, error: null });

    const result = await queryFn();
    expect(result[0]).toMatchObject({
      id: 'col-1',
      nome: 'Lucas Martins',
      cargo: 'Instalador',
      dataAdmissao: '2024-01-15',
      dataLimiteFerias: '2026-04-30',
      horasExtrasMes: 12,
      telefone: '11987654321',
    });
  });

  it('retorna array vazio sem dados', async () => {
    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => ({ queryFn }));
    const { queryFn } = useColaboradores() as any;
    mockSupabase.order.mockResolvedValue({ data: [], error: null });
    expect(await queryFn()).toEqual([]);
  });

  it('lida com data=null', async () => {
    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => ({ queryFn }));
    const { queryFn } = useColaboradores() as any;
    mockSupabase.order.mockResolvedValue({ data: null, error: null });
    expect(await queryFn()).toEqual([]);
  });

  it('propaga erro do banco', async () => {
    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => ({ queryFn }));
    const { queryFn } = useColaboradores() as any;
    mockSupabase.order.mockResolvedValue({ data: null, error: new Error('Connection failed') });
    await expect(queryFn()).rejects.toThrow('Connection failed');
  });

  it('está desabilitado sem empresaId', () => {
    (companyLib.getDefaultEmpresaId as any).mockReturnValue(null);
    let captured: boolean | undefined;
    (reactQuery.useQuery as any).mockImplementation((opts: any) => {
      captured = opts.enabled;
      return { data: [] };
    });
    useColaboradores();
    expect(captured).toBe(false);
  });
});