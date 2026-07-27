import type { FilaProducaoItem, KPIProducao, StatusProcessamento } from "./types";

/**
 * Ordena a fila de produção pelo prazo de entrega (crescente).
 * Itens com status global "Concluído" podem ser filtrados ou jogados pro final.
 * Por enquanto, ordenamos puramente por prazo e prioridade.
 */
export function ordenarFilaProducao(fila: FilaProducaoItem[]): FilaProducaoItem[] {
  const prioridadePeso = {
    Urgente: 1,
    Alta: 2,
    Normal: 3,
    Baixa: 4,
  };

  return [...fila].sort((a, b) => {
    // Primeiro por data de entrega
    const dataA = new Date(a.prazoEntrega).getTime();
    const dataB = new Date(b.prazoEntrega).getTime();
    if (dataA !== dataB) {
      return dataA - dataB;
    }
    // Desempate por prioridade
    return prioridadePeso[a.prioridade] - prioridadePeso[b.prioridade];
  });
}

/**
 * Filtra a fila de produção para mostrar apenas OS que contêm uma etapa
 * de processamento específica (ex: 'Lapidação') que não esteja concluída (opcional).
 */
export function filtrarFilaPorProcessamento(
  fila: FilaProducaoItem[],
  tipo: string,
  apenasPendentes = true,
): FilaProducaoItem[] {
  if (!tipo || tipo === "Todos") return fila;

  return fila.filter((item) =>
    item.etapas.some((etapa) => {
      if (etapa.tipo !== tipo) return false;
      if (apenasPendentes && etapa.status === "Concluido") return false;
      return true;
    }),
  );
}

/**
 * Atualiza o status de uma etapa específica de um item da fila.
 */
export function atualizarStatusEtapa(
  item: FilaProducaoItem,
  etapaId: string,
  novoStatus: StatusProcessamento,
  responsavelId?: string,
): FilaProducaoItem {
  const agora = new Date().toISOString();

  const novasEtapas = item.etapas.map((etapa) => {
    if (etapa.id !== etapaId) return etapa;

    const atualizada = { ...etapa, status: novoStatus };

    if (novoStatus === "Em_Processamento" && etapa.status === "Aguardando") {
      atualizada.dataInicio = agora;
      if (responsavelId) atualizada.responsavelId = responsavelId;
    }

    if (novoStatus === "Concluido") {
      atualizada.dataConclusao = agora;
    }

    // Se retrocedeu de Concluido para algo, remove dataConclusao
    if (novoStatus !== "Concluido" && etapa.status === "Concluido") {
      atualizada.dataConclusao = undefined;
    }

    return atualizada;
  });

  return { ...item, etapas: novasEtapas };
}

/**
 * Calcula os KPIs da linha de produção atual.
 * Índice de aproveitamento é mockado na falta do SVG interativo da Sprint 8.
 */
export function calcularKPIsProducao(fila: FilaProducaoItem[]): KPIProducao {
  let chapasEmUso = 0;
  let totalQuebras = 0;
  let somaAproveitamento = 0;
  let qtdComAproveitamento = 0; // Para média

  for (const item of fila) {
    chapasEmUso += item.chapasEmUso || 0;
    totalQuebras += item.quebras || 0;

    // Simulação do aproveitamento:
    // Na Sprint 8 isso virá do bin-packing SVG.
    // Aqui usaremos um pseudo-cálculo ou valor padrão para compor o KPI.
    // Vamos supor que, se houver chapa em uso e m2, o aproveitamento seja M2 / (Chapas * 6.5) (ex chapa 3210x2000 = 6.42m2)
    if ((item.chapasEmUso || 0) > 0 && (item.areaProcessadaM2 || 0) > 0) {
      const areaChapas = item.chapasEmUso! * 6.42;
      let aprov = (item.areaProcessadaM2! / areaChapas) * 100;
      if (aprov > 100) aprov = 100;
      
      somaAproveitamento += aprov;
      qtdComAproveitamento++;
    }
  }

  const indiceAproveitamento =
    qtdComAproveitamento > 0 ? somaAproveitamento / qtdComAproveitamento : 0;

  return {
    totalFila: fila.length,
    chapasEmUso,
    indiceAproveitamento: Number(indiceAproveitamento.toFixed(1)),
    totalQuebras,
  };
}
