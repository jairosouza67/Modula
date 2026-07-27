import { describe, it, expect } from "vitest";
import { calcularFolha, alertaFerias, type Colaborador } from "./rh";

describe("Sprint 11: RH (Colaboradores, Folha e Férias)", () => {
  const mockColaboradores: Colaborador[] = [
    {
      id: "C1",
      nome: "Ana",
      cargo: "Vendedora",
      salario: 3000,
      status: "Ativo",
      dataAdmissao: "2024-01-01",
      dataLimiteFerias: "2026-06-30", // Ref 2026-05-15 -> ~46 dias
    },
    {
      id: "C2",
      nome: "Bruno",
      cargo: "Técnico Instalador",
      salario: 2500,
      status: "Ativo",
      dataAdmissao: "2024-03-01",
      dataLimiteFerias: "2026-09-30", // Ref 2026-05-15 -> ~138 dias (sem alerta)
    },
    {
      id: "C3",
      nome: "Carlos",
      cargo: "Gerente",
      salario: 5000,
      status: "Inativo",
      dataAdmissao: "2023-01-01",
      dataLimiteFerias: "2026-05-20", // Inativo não deve alertar
    },
  ];

  it("deve calcular folha de pagamento apenas com colaboradores ativos", () => {
    const total = calcularFolha(mockColaboradores);
    // Ana (3000) + Bruno (2500) = 5500. Carlos (5000) é inativo.
    expect(total).toBe(5500);
  });

  it("deve gerar alerta de férias a vencer em <= 90 dias", () => {
    // Vamos fixar a data de referência para o teste ser determinístico
    const dataRef = "2026-05-15T00:00:00Z";
    const alertas = alertaFerias(mockColaboradores, dataRef);

    // Apenas Ana deve ter alerta (vence em 46 dias).
    // Bruno vence em 138 dias (> 90). Carlos é inativo.
    expect(alertas).toHaveLength(1);
    expect(alertas[0].colaboradorId).toBe("C1");
    expect(alertas[0].diasRestantes).toBe(46);
  });

  it("não deve gerar alerta de férias a vencer em > 90 dias", () => {
    const dataRef = "2026-02-01T00:00:00Z";
    // Nessa data, Ana vence em 149 dias, Bruno em ~241.
    const alertas = alertaFerias(mockColaboradores, dataRef);
    expect(alertas).toHaveLength(0);
  });
});
