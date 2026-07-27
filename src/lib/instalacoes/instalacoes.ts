export type TecnicoStatus = "Livre" | "Em_Campo" | "Retornando";
export type InstalacaoStatus = "Agendada" | "Em_Andamento" | "Concluida" | "Cancelada";

export interface Instalacao {
  id: string;
  osId: string;
  tecnicoId: string;
  dataInicio: string; // ISO date time
  dataFim: string; // ISO date time
  status: InstalacaoStatus;
}

/**
 * Detecta se há conflito de horários para um determinado técnico na agenda existente.
 * Retorna true se houver conflito (sobreposição), false caso contrário.
 */
export function detectarConflito(
  agenda: Instalacao[],
  tecnicoId: string,
  novoInicio: string,
  novoFim: string
): boolean {
  const inicio = new Date(novoInicio).getTime();
  const fim = new Date(novoFim).getTime();

  return agenda.some((inst) => {
    // Apenas verifica instalações ativas do mesmo técnico
    if (inst.tecnicoId !== tecnicoId) return false;
    if (inst.status === "Cancelada" || inst.status === "Concluida") return false;

    const instInicio = new Date(inst.dataInicio).getTime();
    const instFim = new Date(inst.dataFim).getTime();

    // Lógica de sobreposição de intervalos: Max(start1, start2) < Min(end1, end2)
    return Math.max(inicio, instInicio) < Math.min(fim, instFim);
  });
}

/**
 * Tenta agendar uma nova instalação. Lança erro se houver conflito.
 */
export function agendarInstalacao(
  agendaAtual: Instalacao[],
  novaInstalacao: Instalacao
): Instalacao[] {
  const temConflito = detectarConflito(
    agendaAtual,
    novaInstalacao.tecnicoId,
    novaInstalacao.dataInicio,
    novaInstalacao.dataFim
  );

  if (temConflito) {
    throw new Error("CONFLITO_AGENDA: Técnico já possui agendamento neste horário.");
  }

  return [...agendaAtual, novaInstalacao];
}

/**
 * Conclui uma instalação e retorna a nova agenda atualizada.
 * Na aplicação real, isso também dispararia um evento para atualizar o status da OS.
 */
export function concluirInstalacao(agenda: Instalacao[], instalacaoId: string): Instalacao[] {
  return agenda.map((inst) => {
    if (inst.id === instalacaoId) {
      return { ...inst, status: "Concluida" };
    }
    return inst;
  });
}
