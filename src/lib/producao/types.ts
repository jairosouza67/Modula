export type TipoProcessamento =
  | "Corte"
  | "Lapidação"
  | "Furação"
  | "Temperagem"
  | "Laminação"
  | "Jateamento"
  | "Pintura"
  | "Insulação";

export type StatusProcessamento = "Aguardando" | "Em_Processamento" | "Concluido";

export interface ProcessamentoEtapa {
  id: string;
  tipo: TipoProcessamento;
  status: StatusProcessamento;
  responsavelId?: string;
  dataInicio?: string;
  dataConclusao?: string;
}

export interface FilaProducaoItem {
  id: string; // OS ID ou Fila ID
  osNumero: string;
  clienteNome: string;
  prazoEntrega: string; // ISO date
  prioridade: "Baixa" | "Normal" | "Alta" | "Urgente";
  etapas: ProcessamentoEtapa[];
  chapasEmUso?: number; // Para cálculo de KPI
  areaProcessadaM2?: number; // m2 para o índice
  quebras?: number; // quantidade de peças quebradas
}

export interface KPIProducao {
  totalFila: number;
  chapasEmUso: number;
  indiceAproveitamento: number; // Porcentagem (0 a 100)
  totalQuebras: number;
}
