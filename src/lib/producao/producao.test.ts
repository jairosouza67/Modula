import { describe, it, expect } from "vitest";
import {
  ordenarFilaProducao,
  filtrarFilaPorProcessamento,
  atualizarStatusEtapa,
  calcularKPIsProducao,
} from "./producao";
import type { FilaProducaoItem } from "./types";

const mockFila: FilaProducaoItem[] = [
  {
    id: "OS-001",
    osNumero: "001",
    clienteNome: "João",
    prazoEntrega: "2026-05-20",
    prioridade: "Normal",
    chapasEmUso: 2,
    areaProcessadaM2: 10,
    quebras: 0,
    etapas: [
      { id: "e1", tipo: "Corte", status: "Concluido" },
      { id: "e2", tipo: "Lapidação", status: "Aguardando" },
    ],
  },
  {
    id: "OS-002",
    osNumero: "002",
    clienteNome: "Maria",
    prazoEntrega: "2026-05-18",
    prioridade: "Normal",
    chapasEmUso: 1,
    areaProcessadaM2: 5,
    quebras: 1,
    etapas: [
      { id: "e3", tipo: "Corte", status: "Em_Processamento" },
      { id: "e4", tipo: "Furação", status: "Aguardando" },
    ],
  },
  {
    id: "OS-003",
    osNumero: "003",
    clienteNome: "Carlos",
    prazoEntrega: "2026-05-18",
    prioridade: "Urgente",
    chapasEmUso: 0,
    areaProcessadaM2: 0,
    quebras: 0,
    etapas: [
      { id: "e5", tipo: "Temperagem", status: "Aguardando" },
    ],
  },
];

describe("Módulo de Produção - Fila e Processamentos", () => {
  it("deve ordenar a fila por prazo crescente e desempatar por prioridade", () => {
    const ordenada = ordenarFilaProducao(mockFila);
    
    // Carlos e Maria têm o mesmo prazo (18), mas Carlos é Urgente
    expect(ordenada[0].id).toBe("OS-003"); // Carlos
    expect(ordenada[1].id).toBe("OS-002"); // Maria
    expect(ordenada[2].id).toBe("OS-001"); // João (prazo dia 20)
  });

  it("deve filtrar a fila por tipo de processamento (apenas pendentes)", () => {
    // Filtra lapidação pendente -> OS-001
    const lapidacao = filtrarFilaPorProcessamento(mockFila, "Lapidação", true);
    expect(lapidacao).toHaveLength(1);
    expect(lapidacao[0].id).toBe("OS-001");

    // Filtra Corte pendente -> OS-002 (OS-001 já concluiu o corte)
    const cortePend = filtrarFilaPorProcessamento(mockFila, "Corte", true);
    expect(cortePend).toHaveLength(1);
    expect(cortePend[0].id).toBe("OS-002");

    // Filtra Corte geral (inclui concluídos) -> OS-001 e OS-002
    const corteTodos = filtrarFilaPorProcessamento(mockFila, "Corte", false);
    expect(corteTodos).toHaveLength(2);
  });

  it("deve atualizar o status de uma etapa e registrar dataInicio", () => {
    const item = mockFila[1]; // OS-002
    // Atualizar e4 (Furação) para Em_Processamento
    const atualizado = atualizarStatusEtapa(item, "e4", "Em_Processamento", "user-123");

    const etapaFuracao = atualizado.etapas.find(e => e.id === "e4")!;
    expect(etapaFuracao.status).toBe("Em_Processamento");
    expect(etapaFuracao.responsavelId).toBe("user-123");
    expect(etapaFuracao.dataInicio).toBeDefined();
    expect(etapaFuracao.dataConclusao).toBeUndefined();
  });

  it("deve calcular KPIs de produção corretamente", () => {
    const kpis = calcularKPIsProducao(mockFila);
    
    expect(kpis.totalFila).toBe(3);
    expect(kpis.chapasEmUso).toBe(3); // 2 + 1 + 0
    expect(kpis.totalQuebras).toBe(1); // 0 + 1 + 0
    
    // Aproveitamento:
    // OS-1: 10m2 / (2 * 6.42) = 10 / 12.84 = 77.88%
    // OS-2: 5m2 / (1 * 6.42) = 5 / 6.42 = 77.88%
    // Média = 77.88% -> 77.9 arredondado (1 casa decimal)
    expect(kpis.indiceAproveitamento).toBeGreaterThan(70);
    expect(kpis.indiceAproveitamento).toBeLessThan(80);
  });
});
