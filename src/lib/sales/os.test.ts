import { describe, it, expect } from "vitest";
import {
  converterOrcamentoParaOS,
  isOsAtrasada,
  diasAtePrevisao,
  podeTransicionar,
  filtrarOrdenarOS,
  calcularKpisOS,
  WIP_LIMITS,
} from "./os";

// ─── Conversão ─────────────────────────────────────────────────────────────

describe("Ordem de Servico Converter", () => {
  it("converte orçamento aprovado corretamente", () => {
    const orcamentoMock = {
      id: "orc-123",
      empresaId: "emp-1",
      clienteId: "cli-1",
      numero: "ORC-999",
      status: "Aprovado",
      itens: [{ tipo: "vidro", area: 10 }],
    };

    const os = converterOrcamentoParaOS(orcamentoMock);

    expect(os.orcamentoId).toBe("orc-123");
    expect(os.status).toBe("Na Fila");
    expect(os.numero).toContain("OS-999");
    expect(os.itens.length).toBe(1);
    expect(os.itens[0].area).toBe(10);
    expect(os.tecnicoId).toBeUndefined();
  });

  it("rejeita orcamento que nao esta aprovado", () => {
    const orcamentoMock = {
      id: "orc-123",
      numero: "ORC-999",
      status: "Em revisao",
    };

    expect(() => converterOrcamentoParaOS(orcamentoMock)).toThrow(
      "Apenas orçamentos aprovados podem ser convertidos em OS."
    );
  });

  it("define prazo padrão de 7 dias", () => {
    const os = converterOrcamentoParaOS({
      id: "orc-1",
      numero: "ORC-1",
      status: "Aprovado",
      itens: [],
    });

    const dias = diasAtePrevisao(os.dataPrevisao);
    expect(dias).toBeGreaterThanOrEqual(6);
    expect(dias).toBeLessThanOrEqual(8);
  });
});

// ─── Atraso ────────────────────────────────────────────────────────────────

describe("isOsAtrasada", () => {
  it("calcula corretamente se esta atrasada", () => {
    const dataPassada = new Date();
    dataPassada.setDate(dataPassada.getDate() - 1);
    expect(isOsAtrasada(dataPassada.toISOString())).toBe(true);

    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 1);
    expect(isOsAtrasada(dataFutura.toISOString())).toBe(false);
  });

  it("data de hoje não é atrasada", () => {
    const hoje = new Date().toISOString().split("T")[0];
    expect(isOsAtrasada(hoje)).toBe(false);
  });
});

// ─── Transições ────────────────────────────────────────────────────────────

describe("podeTransicionar", () => {
  it("permite transição válida Na Fila -> Em Producao", () => {
    expect(podeTransicionar("Na Fila", "Em Producao")).toBe(true);
  });

  it("bloqueia transição inválida Na Fila -> Concluido", () => {
    expect(podeTransicionar("Na Fila", "Concluido")).toBe(false);
  });

  it("bloqueia transição de Concluido para qualquer status", () => {
    expect(podeTransicionar("Concluido", "Na Fila")).toBe(false);
    expect(podeTransicionar("Concluido", "Em Producao")).toBe(false);
    expect(podeTransicionar("Concluido", "Instalacao")).toBe(false);
  });

  it("permite retrocesso Em Producao -> Na Fila", () => {
    expect(podeTransicionar("Em Producao", "Na Fila")).toBe(true);
  });
});

// ─── WIP Limits ───────────────────────────────────────────────────────────

describe("WIP_LIMITS", () => {
  it("produção tem limite de 5", () => {
    expect(WIP_LIMITS["Em Producao"]).toBe(5);
  });

  it("concluido é ilimitado", () => {
    expect(WIP_LIMITS["Concluido"]).toBe(Infinity);
  });
});

// ─── Filtro e ordenação ───────────────────────────────────────────────────

describe("filtrarOrdenarOS", () => {
  const lista = [
    { numero: "OS-001", cliente: "Alfa", status: "Na Fila", dataPrevisao: "2026-06-01", tecnico: "Lucas" },
    { numero: "OS-002", cliente: "Beta", status: "Em Producao", dataPrevisao: "2026-05-01", tecnico: "—" },
    { numero: "OS-003", cliente: "Gama", status: "Concluido", dataPrevisao: "2026-06-15", tecnico: "Carlos" },
  ];

  it("filtra por busca no número", () => {
    const result = filtrarOrdenarOS(lista, { busca: "OS-002" });
    expect(result).toHaveLength(1);
    expect(result[0].numero).toBe("OS-002");
  });

  it("filtra por busca no cliente", () => {
    const result = filtrarOrdenarOS(lista, { busca: "alfa" });
    expect(result).toHaveLength(1);
    expect(result[0].cliente).toBe("Alfa");
  });

  it("filtra por status", () => {
    const result = filtrarOrdenarOS(lista, { status: "Em Producao" });
    expect(result).toHaveLength(1);
    expect(result[0].numero).toBe("OS-002");
  });

  it("filtra sem técnico", () => {
    const result = filtrarOrdenarOS(lista, { apenasSemsemTecnico: true });
    expect(result).toHaveLength(1);
    expect(result[0].numero).toBe("OS-002");
  });

  it("ordena por prazo ascendente", () => {
    const result = filtrarOrdenarOS(lista, { ordenarPor: "prazo" });
    expect(result[0].dataPrevisao).toBe("2026-05-01");
  });

  it("ordena por cliente alfabeticamente", () => {
    const result = filtrarOrdenarOS(lista, { ordenarPor: "cliente" });
    expect(result[0].cliente).toBe("Alfa");
    expect(result[2].cliente).toBe("Gama");
  });

  it("retorna todos quando status = Todos", () => {
    const result = filtrarOrdenarOS(lista, { status: "Todos" });
    expect(result).toHaveLength(3);
  });
});

// ─── KPIs ─────────────────────────────────────────────────────────────────

describe("calcularKpisOS", () => {
  const futuro = new Date();
  futuro.setFullYear(futuro.getFullYear() + 1);
  const futuroStr = futuro.toISOString().split("T")[0];

  const lista = [
    { statusAtual: "Na Fila", atrasada: false, tecnico: "Lucas", dataPrevisao: futuroStr },
    { statusAtual: "Em Producao", atrasada: true, tecnico: "—", dataPrevisao: "2020-01-01" },
    { statusAtual: "Instalacao", atrasada: false, tecnico: "Carlos", dataPrevisao: futuroStr },
    { statusAtual: "Concluido", atrasada: false, tecnico: "André", dataPrevisao: futuroStr },
  ];

  it("conta totais corretamente", () => {
    const kpis = calcularKpisOS(lista);
    expect(kpis.total).toBe(4);
    expect(kpis.naFila).toBe(1);
    expect(kpis.emProducao).toBe(1);
    expect(kpis.instalacao).toBe(1);
    expect(kpis.concluidas).toBe(1);
  });

  it("conta atrasadas corretamente", () => {
    const kpis = calcularKpisOS(lista);
    expect(kpis.atrasadas).toBe(1);
  });

  it("conta sem tecnico corretamente", () => {
    const kpis = calcularKpisOS(lista);
    expect(kpis.semTecnico).toBe(1);
  });
});
