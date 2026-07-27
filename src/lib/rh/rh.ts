export type StatusColaborador = "Ativo" | "Inativo" | "Afastado";

export interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  salario: number;
  status: StatusColaborador;
  dataAdmissao: string;
  dataLimiteFerias?: string; // Data máxima para tirar férias sem pagar dobro
}

/**
 * Calcula a folha de pagamento total, somando salários apenas de colaboradores ativos (ou afastados se remunerados, mas aqui consideraremos apenas "Ativo").
 */
export function calcularFolha(colaboradores: Colaborador[]): number {
  return colaboradores
    .filter((c) => c.status === "Ativo")
    .reduce((soma, c) => soma + c.salario, 0);
}

export interface AlertaFerias {
  colaboradorId: string;
  nome: string;
  diasRestantes: number;
}

/**
 * Retorna uma lista de alertas para colaboradores cujas férias vencem em <= 90 dias.
 */
export function alertaFerias(colaboradores: Colaborador[], dataReferencia: string = new Date().toISOString()): AlertaFerias[] {
  const alertas: AlertaFerias[] = [];
  const refDate = new Date(dataReferencia).getTime();

  for (const c of colaboradores) {
    if (c.status !== "Ativo" || !c.dataLimiteFerias) continue;

    const limiteDate = new Date(c.dataLimiteFerias).getTime();
    const diffTime = limiteDate - refDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 90 && diffDays >= 0) {
      alertas.push({
        colaboradorId: c.id,
        nome: c.nome,
        diasRestantes: diffDays,
      });
    }
  }

  return alertas;
}

