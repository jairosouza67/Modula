import { describe, it, expect, vi, beforeEach } from "vitest";
import { useInstaladores } from "@/hooks/useInstaladores";
import * as reactQuery from "@tanstack/react-query";
import * as supabaseClient from "@/lib/supabase/client";
import * as companyLib from "@/lib/supabase/company";

vi.mock('@tanstack/react-query', () => ({ useQuery: vi.fn() }));
vi.mock('@/lib/supabase/client');
vi.mock('@/lib/supabase/company');

describe('Hook useInstaladores', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // restaura o encadeamento padrão: cada método devolve o próprio mock
    (mockSupabase as any).from.mockImplementation(function (this: any) { return mockSupabase; });
    (mockSupabase as any).select.mockImplementation(function () { return mockSupabase; });
    (mockSupabase as any).eq.mockImplementation(function () { return mockSupabase; });
    (supabaseClient.getSupabaseBrowserClient as any).mockReturnValue(mockSupabase);
    (companyLib.getDefaultEmpresaId as any).mockReturnValue('emp-77');
  });

  it('filtra apenas colaboradores com status Ativo', async () => {
    const eqStatuses: string[] = [];
    // Chain do hook: from().select().eq(empresa_id).eq(status).
    // A primeira chamada encadeia, a segunda terminaliza — capturamos o valor de `status` na segunda.
    (mockSupabase as any).eq
      .mockReturnValueOnce(mockSupabase) // 1ª chamada: encadeia
      .mockImplementationOnce((col: string, val: any) => {
        if (col === 'status') eqStatuses.push(val);
        mockSupabase.eq.mockResolvedValueOnce({ data: [], error: null });
        return mockSupabase;
      });

    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => ({ queryFn }));
    const { queryFn } = useInstaladores() as any;

    await queryFn();
    expect(eqStatuses).toContain('Ativo');
  });

  it('retorna dados retornados pelo Supabase sem transformação', async () => {
    const rows = [
      { id: 'inst-1', nome: 'Carlos', status: 'Ativo' },
      { id: 'inst-2', nome: 'João', status: 'Ativo' },
    ];
    (mockSupabase as any).eq.mockImplementation(() => {
      mockSupabase.eq.mockResolvedValueOnce({ data: rows, error: null });
      return mockSupabase;
    });

    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => ({ queryFn }));
    const { queryFn } = useInstaladores() as any;
    const data = await queryFn();
    expect(data).toHaveLength(2);
    expect(data[0].nome).toBe('Carlos');
  });

  it('propaga erro do Supabase', async () => {
    (mockSupabase as any).eq.mockImplementation(() => {
      mockSupabase.eq.mockResolvedValueOnce({ data: null, error: new Error('RLS') });
      return mockSupabase;
    });
    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => ({ queryFn }));
    const { queryFn } = useInstaladores() as any;
    await expect(queryFn()).rejects.toThrow('RLS');
  });

  it('retorna dados retornados pelo Supabase sem transformação', async () => {
    const rows = [
      { id: 'inst-1', nome: 'Carlos', status: 'Ativo' },
      { id: 'inst-2', nome: 'João', status: 'Ativo' },
    ];
    // Na primeira chamada de eq (empresa_id) encadeamos; na segunda (status) terminalizamos.
    (mockSupabase as any).eq.mockImplementation(() => {
      mockSupabase.eq.mockResolvedValueOnce({ data: rows, error: null });
      return mockSupabase;
    });

    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => ({ queryFn }));
    const { queryFn } = useInstaladores() as any;
    const data = await queryFn();
    expect(data).toHaveLength(2);
    expect(data[0].nome).toBe('Carlos');
  });

  it('propaga erro do Supabase', async () => {
    (mockSupabase as any).eq.mockImplementation(() => {
      mockSupabase.eq.mockResolvedValueOnce({ data: null, error: new Error('RLS') });
      return mockSupabase;
    });
    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => ({ queryFn }));
    const { queryFn } = useInstaladores() as any;
    await expect(queryFn()).rejects.toThrow('RLS');
  });

  it('está desabilitado sem empresaId', () => {
    (companyLib.getDefaultEmpresaId as any).mockReturnValue(null);
    let captured: boolean | undefined;
    (reactQuery.useQuery as any).mockImplementation((opts: any) => {
      captured = opts.enabled;
      return { data: [] };
    });
    useInstaladores();
    expect(captured).toBe(false);
  });
});