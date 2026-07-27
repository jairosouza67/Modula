import { describe, it, expect } from "vitest";
import { detectarConflito, agendarInstalacao, concluirInstalacao, type Instalacao } from "./instalacoes";

const mockAgenda: Instalacao[] = [
  {
    id: "I-001",
    osId: "OS-123",
    tecnicoId: "T-01",
    dataInicio: "2026-05-20T08:00:00Z",
    dataFim: "2026-05-20T12:00:00Z",
    status: "Agendada",
  },
  {
    id: "I-002",
    osId: "OS-124",
    tecnicoId: "T-02",
    dataInicio: "2026-05-20T14:00:00Z",
    dataFim: "2026-05-20T18:00:00Z",
    status: "Agendada",
  },
];

describe("Sprint 9: Instalações (Calendário e Campo)", () => {
  it("deve detectar conflito de horário para o mesmo técnico", () => {
    // Conflito total (dentro do horário)
    expect(detectarConflito(mockAgenda, "T-01", "2026-05-20T09:00:00Z", "2026-05-20T11:00:00Z")).toBe(true);
    
    // Conflito parcial (termina durante)
    expect(detectarConflito(mockAgenda, "T-01", "2026-05-20T07:00:00Z", "2026-05-20T09:00:00Z")).toBe(true);

    // Conflito parcial (inicia durante)
    expect(detectarConflito(mockAgenda, "T-01", "2026-05-20T11:00:00Z", "2026-05-20T13:00:00Z")).toBe(true);

    // Sem conflito (antes)
    expect(detectarConflito(mockAgenda, "T-01", "2026-05-20T06:00:00Z", "2026-05-20T08:00:00Z")).toBe(false);

    // Sem conflito (depois)
    expect(detectarConflito(mockAgenda, "T-01", "2026-05-20T13:00:00Z", "2026-05-20T18:00:00Z")).toBe(false);
  });

  it("não deve detectar conflito se for para outro técnico", () => {
    expect(detectarConflito(mockAgenda, "T-02", "2026-05-20T09:00:00Z", "2026-05-20T11:00:00Z")).toBe(false);
  });

  it("não deve detectar conflito se a instalação existente estiver cancelada ou concluída", () => {
    const agendaConcluida: Instalacao[] = [{ ...mockAgenda[0], status: "Concluida" }];
    expect(detectarConflito(agendaConcluida, "T-01", "2026-05-20T09:00:00Z", "2026-05-20T11:00:00Z")).toBe(false);
  });

  it("deve agendar instalação se não houver conflito", () => {
    const novaInstalacao: Instalacao = {
      id: "I-003",
      osId: "OS-125",
      tecnicoId: "T-01",
      dataInicio: "2026-05-20T14:00:00Z",
      dataFim: "2026-05-20T18:00:00Z",
      status: "Agendada",
    };

    const novaAgenda = agendarInstalacao(mockAgenda, novaInstalacao);
    expect(novaAgenda).toHaveLength(3);
    expect(novaAgenda[2].id).toBe("I-003");
  });

  it("deve lançar erro CONFLITO_AGENDA ao agendar com conflito", () => {
    const novaInstalacao: Instalacao = {
      id: "I-004",
      osId: "OS-126",
      tecnicoId: "T-01",
      dataInicio: "2026-05-20T10:00:00Z", // Conflito com I-001
      dataFim: "2026-05-20T14:00:00Z",
      status: "Agendada",
    };

    expect(() => agendarInstalacao(mockAgenda, novaInstalacao)).toThrowError(/CONFLITO_AGENDA/);
  });

  it("deve concluir uma instalação", () => {
    const novaAgenda = concluirInstalacao(mockAgenda, "I-001");
    expect(novaAgenda.find(i => i.id === "I-001")?.status).toBe("Concluida");
  });
});
