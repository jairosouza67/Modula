export type OsStatus = "Na Fila" | "Em Producao" | "Instalacao" | "Concluido";

export interface OsItem {
  tipo: string;
  vidro?: string;
  area: number;
  processamentos?: string[];
  valor?: number;
}

export interface OrdemServico {
  id: string;
  empresaId: string;
  orcamentoId: string;
  clienteId?: string;
  tecnicoId?: string;
  numero: string;
  status: OsStatus;
  dataPrevisao: string;
  itens: OsItem[];
  createdAt: string;
  updatedAt?: string;
}

const parseDateAsLocalStart = (value: string): Date => {
  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
  }

  const parsed = new Date(value);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

// ─── Conversor ────────────────────────────────────────────────────────────────

export function converterOrcamentoParaOS(orcamento: any): OrdemServico {
  if (orcamento.status !== "Aprovado") {
    throw new Error("Apenas orçamentos aprovados podem ser convertidos em OS.");
  }

  const dataAtual = new Date();
  const dataPrevisao = new Date(dataAtual);
  dataPrevisao.setDate(dataAtual.getDate() + 7); // Prazo padrão 7 dias

  return {
    id: crypto.randomUUID(),
    empresaId: orcamento.empresaId || "empresa-123",
    orcamentoId: orcamento.id,
    clienteId: orcamento.clienteId,
    tecnicoId: undefined,
    numero: `OS-${orcamento.numero?.split("-")[1] || Math.floor(Math.random() * 10000)}`,
    status: "Na Fila",
    dataPrevisao: dataPrevisao.toISOString().split("T")[0],
    itens: orcamento.itens || [],
    createdAt: dataAtual.toISOString(),
  };
}

// ─── Utilitários de status ─────────────────────────────────────────────────

export function isOsAtrasada(dataPrevisao: string): boolean {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const previsao = parseDateAsLocalStart(dataPrevisao);
  return previsao.getTime() < hoje.getTime();
}

export function diasAtePrevisao(dataPrevisao: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const previsao = parseDateAsLocalStart(dataPrevisao);
  return Math.ceil((previsao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Limites WIP por coluna ───────────────────────────────────────────────

export const WIP_LIMITS: Record<OsStatus, number> = {
  "Na Fila": 10,
  "Em Producao": 5,
  Instalacao: 4,
  Concluido: Infinity,
};

// ─── Transições válidas ───────────────────────────────────────────────────

export const TRANSICOES_VALIDAS: Record<OsStatus, OsStatus[]> = {
  "Na Fila": ["Em Producao"],
  "Em Producao": ["Na Fila", "Instalacao"],
  Instalacao: ["Em Producao", "Concluido"],
  Concluido: [],
};

export function podeTransicionar(atual: OsStatus, destino: OsStatus): boolean {
  return TRANSICOES_VALIDAS[atual].includes(destino);
}

// ─── Hook de filtros/ordenação ────────────────────────────────────────────

export interface OsFiltros {
  busca?: string;
  status?: OsStatus | "Todos";
  apenasAtrasadas?: boolean;
  apenasSemsemTecnico?: boolean;
  ordenarPor?: "prazo" | "numero" | "cliente";
}

export function filtrarOrdenarOS<T extends { numero?: string; status?: string; dataPrevisao?: string; tecnicoId?: string; cliente?: string }>(
  lista: T[],
  filtros: OsFiltros
): T[] {
  let result = [...lista];

  if (filtros.busca) {
    const q = filtros.busca.toLowerCase();
    result = result.filter(
      (o: any) =>
        (o.numero || o.os || "").toLowerCase().includes(q) ||
        (o.cliente || "").toLowerCase().includes(q)
    );
  }

  if (filtros.status && filtros.status !== "Todos") {
    result = result.filter((o: any) => (o.status || o.statusAtual) === filtros.status);
  }

  if (filtros.apenasAtrasadas) {
    result = result.filter((o: any) => isOsAtrasada(o.dataPrevisao || ""));
  }

  if (filtros.apenasSemsemTecnico) {
    result = result.filter((o: any) => !o.tecnicoId && (!o.tecnico || o.tecnico === "—"));
  }

  if (filtros.ordenarPor === "prazo") {
    result.sort((a: any, b: any) => {
      const da = new Date(a.dataPrevisao || a.prazo || "").getTime();
      const db = new Date(b.dataPrevisao || b.prazo || "").getTime();
      return da - db;
    });
  } else if (filtros.ordenarPor === "numero") {
    result.sort((a: any, b: any) =>
      (a.numero || a.os || "").localeCompare(b.numero || b.os || "")
    );
  } else if (filtros.ordenarPor === "cliente") {
    result.sort((a: any, b: any) =>
      (a.cliente || "").localeCompare(b.cliente || "")
    );
  }

  return result;
}

// ─── KPIs de OS ───────────────────────────────────────────────────────────

export interface OsKpis {
  total: number;
  naFila: number;
  emProducao: number;
  instalacao: number;
  concluidas: number;
  atrasadas: number;
  semTecnico: number;
  prazoMedioDias: number;
}

export function calcularKpisOS(lista: any[]): OsKpis {
  const ativas = lista.filter((o) => (o.statusAtual || o.status) !== "Concluido");
  const atrasadas = lista.filter((o) => {
    if (o.atrasada) {
      return true;
    }

    const dataPrevisao = typeof o.dataPrevisao === "string" ? o.dataPrevisao : typeof o.prazo === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.prazo) ? o.prazo : "";
    return dataPrevisao ? isOsAtrasada(dataPrevisao) : false;
  });
  const semTecnico = lista.filter((o) => !o.tecnicoId && (!o.tecnico || o.tecnico === "—"));

  return {
    total: lista.length,
    naFila: lista.filter((o) => (o.statusAtual || o.status) === "Na Fila").length,
    emProducao: lista.filter((o) => (o.statusAtual || o.status) === "Em Producao").length,
    instalacao: lista.filter((o) => (o.statusAtual || o.status) === "Instalacao").length,
    concluidas: lista.filter((o) => (o.statusAtual || o.status) === "Concluido").length,
    atrasadas: atrasadas.length,
    semTecnico: semTecnico.length,
    prazoMedioDias: ativas.length > 0 ? 5.2 : 0, // placeholder até integração real
  };
}
