import { readJson, writeJson, isBrowser } from "@/lib/utils/localStorage";

export const CLIENTE_SEGMENTOS = [
  "Construtoras",
  "Residencial",
  "Arquitetos",
  "Comercial",
] as const;

export const FORNECEDOR_CATEGORIAS = [
  "Chapas temperadas",
  "Perfis aluminio",
  "Ferragens box/janela",
  "Espelhos lapidados",
  "Consumiveis",
] as const;

export type ClienteSegmento = (typeof CLIENTE_SEGMENTOS)[number];
export type FornecedorCategoria = (typeof FORNECEDOR_CATEGORIAS)[number];

export interface ClienteRecord {
  id: string;
  nome: string;
  documento: string;
  tipoDocumento: "cpf" | "cnpj";
  contato: string;
  segmento: ClienteSegmento;
  ultimoContato: string;
  volumeTotal: number;
  deletedAt: string | null;
}

export interface FornecedorRecord {
  id: string;
  nome: string;
  cnpj: string;
  contato: string;
  categoria: FornecedorCategoria;
  dadosFiscais: string;
  dadosBancarios: string;
  aPagar: number;
  prazoEntrega: number;
  deletedAt: string | null;
}

type ClienteDraft = Omit<ClienteRecord, "id" | "deletedAt" | "ultimoContato"> & {
  id?: string;
};

type FornecedorDraft = Omit<FornecedorRecord, "id" | "deletedAt"> & {
  id?: string;
};

const CLIENTES_KEY = "vidraerp:crm:clientes";
const FORNECEDORES_KEY = "vidraerp:crm:fornecedores";

const defaultClientes: ClienteRecord[] = [
  {
    id: "cli_construtora_nova_era",
    nome: "Construtora Nova Era",
    documento: "12345678000190",
    tipoDocumento: "cnpj",
    contato: "(11) 4002-8922",
    segmento: "Construtoras",
    ultimoContato: "2026-05-09",
    volumeTotal: 84200,
    deletedAt: null,
  },
  {
    id: "cli_amanda_silva",
    nome: "Amanda Silva",
    documento: "98765432100",
    tipoDocumento: "cpf",
    contato: "(11) 99876-5432",
    segmento: "Arquitetos",
    ultimoContato: "2026-05-06",
    volumeTotal: 18940,
    deletedAt: null,
  },
  {
    id: "cli_residencial_park_towers",
    nome: "Residencial Park Towers",
    documento: "23456789000112",
    tipoDocumento: "cnpj",
    contato: "(11) 3344-5566",
    segmento: "Residencial",
    ultimoContato: "2026-05-11",
    volumeTotal: 32180,
    deletedAt: null,
  },
  {
    id: "cli_hotel_bela_vista",
    nome: "Hotel Bela Vista",
    documento: "34567890000123",
    tipoDocumento: "cnpj",
    contato: "(11) 2222-3333",
    segmento: "Comercial",
    ultimoContato: "2026-04-29",
    volumeTotal: 56700,
    deletedAt: null,
  },
];

const defaultFornecedores: FornecedorRecord[] = [
  {
    id: "for_vidro_nobre",
    nome: "Vidro Nobre",
    cnpj: "45678901000134",
    contato: "(11) 3256-8800",
    categoria: "Chapas temperadas",
    dadosFiscais: "IE 99887766",
    dadosBancarios: "Banco 001 Ag 1234 Cc 99887-6",
    aPagar: 4200,
    prazoEntrega: 5,
    deletedAt: null,
  },
  {
    id: "for_aluminio_sul",
    nome: "Aluminio Sul",
    cnpj: "56789012000145",
    contato: "(11) 3188-1020",
    categoria: "Perfis aluminio",
    dadosFiscais: "IE 66554433",
    dadosBancarios: "Banco 341 Ag 5555 Cc 11111-2",
    aPagar: 8900,
    prazoEntrega: 7,
    deletedAt: null,
  },
  {
    id: "for_ferragens_premium",
    nome: "Ferragens Premium",
    cnpj: "67890123000156",
    contato: "(11) 3199-7788",
    categoria: "Ferragens box/janela",
    dadosFiscais: "IE 22334455",
    dadosBancarios: "Banco 237 Ag 7777 Cc 44444-0",
    aPagar: 2150,
    prazoEntrega: 3,
    deletedAt: null,
  },
];

const ensureClientes = (): ClienteRecord[] => {
  const stored = readJson<ClienteRecord[]>(CLIENTES_KEY);
  if (stored) {
    return stored;
  }
  writeJson(CLIENTES_KEY, defaultClientes);
  return defaultClientes;
};

const ensureFornecedores = (): FornecedorRecord[] => {
  const stored = readJson<FornecedorRecord[]>(FORNECEDORES_KEY);
  if (stored) {
    return stored;
  }
  writeJson(FORNECEDORES_KEY, defaultFornecedores);
  return defaultFornecedores;
};

const persistClientes = (clientes: ClienteRecord[]): ClienteRecord[] => {
  writeJson(CLIENTES_KEY, clientes);
  return clientes;
};

const persistFornecedores = (fornecedores: FornecedorRecord[]): FornecedorRecord[] => {
  writeJson(FORNECEDORES_KEY, fornecedores);
  return fornecedores;
};

export const listClientes = (): ClienteRecord[] =>
  ensureClientes()
    .filter((item) => item.deletedAt === null)
    .sort((a, b) => a.nome.localeCompare(b.nome));

export const listFornecedores = (): FornecedorRecord[] =>
  ensureFornecedores()
    .filter((item) => item.deletedAt === null)
    .sort((a, b) => a.nome.localeCompare(b.nome));

export const upsertCliente = (draft: ClienteDraft): ClienteRecord[] => {
  const clientes = ensureClientes();
  const nextRecord: ClienteRecord = {
    id: draft.id ?? crypto.randomUUID(),
    nome: draft.nome,
    documento: draft.documento,
    tipoDocumento: draft.tipoDocumento,
    contato: draft.contato,
    segmento: draft.segmento,
    ultimoContato: new Date().toISOString().slice(0, 10),
    volumeTotal: draft.volumeTotal,
    deletedAt: null,
  };

  const updated = draft.id
    ? clientes.map((item) => (item.id === draft.id ? nextRecord : item))
    : [...clientes, nextRecord];

  return persistClientes(updated);
};

export const upsertFornecedor = (draft: FornecedorDraft): FornecedorRecord[] => {
  const fornecedores = ensureFornecedores();
  const nextRecord: FornecedorRecord = {
    id: draft.id ?? crypto.randomUUID(),
    nome: draft.nome,
    cnpj: draft.cnpj,
    contato: draft.contato,
    categoria: draft.categoria,
    dadosFiscais: draft.dadosFiscais,
    dadosBancarios: draft.dadosBancarios,
    aPagar: draft.aPagar,
    prazoEntrega: draft.prazoEntrega ?? 0,
    deletedAt: null,
  };

  const updated = draft.id
    ? fornecedores.map((item) => (item.id === draft.id ? nextRecord : item))
    : [...fornecedores, nextRecord];

  return persistFornecedores(updated);
};

export const softDeleteCliente = (id: string): ClienteRecord[] =>
  persistClientes(
    ensureClientes().map((item) =>
      item.id === id
        ? {
            ...item,
            deletedAt: new Date().toISOString(),
          }
        : item,
    ),
  );

export const softDeleteFornecedor = (id: string): FornecedorRecord[] =>
  persistFornecedores(
    ensureFornecedores().map((item) =>
      item.id === id
        ? {
            ...item,
            deletedAt: new Date().toISOString(),
          }
        : item,
    ),
  );
