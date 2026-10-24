import { describe, it, expect, vi, beforeEach } from "vitest";
import { useClientes } from "@/hooks/useClientes";
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

describe('Hook useClientes — listagem', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabaseClient.getSupabaseBrowserClient as any).mockReturnValue(mockSupabase);
    (companyLib.getDefaultEmpresaId as any).mockReturnValue('emp-1');
  });

  it('mapeia snake_case para camelCase e descarta soft-deleted', async () => {
    const mockData = [
      {
        id: 'cli-1',
        nome: 'Maria Vidros',
        documento: '12345678900',
        tipo_documento: 'cpf',
        contato: 'Maria',
        segmento: 'Vidraçaria',
        ultimo_contato: '2026-01-10',
        volume_total: 12000,
        email: 'maria@vidros.com',
        telefone: '11987654321',
        endereco: 'Rua A, 100',
        deleted_at: null,
      },
    ];

    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => ({ queryFn }));

    const { queryFn } = useClientes() as any;
    mockSupabase.order.mockResolvedValue({ data: mockData, error: null });

    const result = await queryFn();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'cli-1',
      nome: 'Maria Vidros',
      documento: '12345678900',
      tipoDocumento: 'cpf',
      segmento: 'Vidraçaria',
      ultimoContato: '2026-01-10',
      volumeTotal: 12000,
      email: 'maria@vidros.com',
      telefone: '11987654321',
    });
  });

  it('preenche campos opcionais com string vazia quando nulos', async () => {
    const mockData = [
      {
        id: 'cli-2',
        nome: 'Loja sem endereço',
        documento: null,
        tipo_documento: null,
        contato: null,
        segmento: null,
        ultimo_contato: null,
        volume_total: null,
        email: null,
        telefone: null,
        endereco: null,
        deleted_at: null,
      },
    ];
    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => ({ queryFn }));
    const { queryFn } = useClientes() as any;
    mockSupabase.order.mockResolvedValue({ data: mockData, error: null });

    const result = await queryFn();
    expect(result[0].cidade).toBe('');
    expect(result[0].representante).toBe('');
    expect(result[0].bairro).toBe('');
    expect(result[0].uf).toBe('');
    expect(result[0].complemento).toBe('');
  });

  it('retorna array vazio quando não há dados', async () => {
    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => ({ queryFn }));
    const { queryFn } = useClientes() as any;
    mockSupabase.order.mockResolvedValue({ data: [], error: null });
    expect(await queryFn()).toEqual([]);
  });

  it('lida com data=null (registro sem linhas)', async () => {
    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => ({ queryFn }));
    const { queryFn } = useClientes() as any;
    mockSupabase.order.mockResolvedValue({ data: null, error: null });
    expect(await queryFn()).toEqual([]);
  });

  it('propaga erro do Supabase', async () => {
    (reactQuery.useQuery as any).mockImplementation(({ queryFn }: any) => ({ queryFn }));
    const { queryFn } = useClientes() as any;
    mockSupabase.order.mockResolvedValue({ data: null, error: new Error('RLS blocked') });
    await expect(queryFn()).rejects.toThrow('RLS blocked');
  });

  it('inclui o filtro deleted_at IS NULL na query', () => {
    const isSpy = vi.fn().mockReturnThis();
    (mockSupabase as any).is = isSpy;
    (reactQuery.useQuery as any).mockImplementation((opts: any) => {
      opts.queryFn();
      return { data: [], queryFn: opts.queryFn };
    });
    (mockSupabase as any).order.mockResolvedValue({ data: [], error: null });
    useClientes();
    expect(isSpy).toHaveBeenCalledWith('deleted_at', null);
  });

  it('está desabilitado quando não há empresaId', () => {
    (companyLib.getDefaultEmpresaId as any).mockReturnValue(null);
    let captured: boolean | undefined;
    (reactQuery.useQuery as any).mockImplementation((opts: any) => {
      captured = opts.enabled;
      return { data: [] };
    });
    useClientes();
    expect(captured).toBe(false);
  });
});