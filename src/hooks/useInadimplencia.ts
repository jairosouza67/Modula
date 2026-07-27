import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface InadimplenciaResumo {
  total_vencido: number;
  quantidade_titulos: number;
  idade_media_dias: number;
  top_devedores: InadimplenciaCliente[];
  titulos_vencidos: TituloVencido[];
}

export interface InadimplenciaCliente {
  cliente_id: string;
  cliente: string;
  total_devido: number;
  quantidade_titulos: number;
}

export interface TituloVencido {
  id: string;
  cliente: string;
  cliente_id: string;
  vencimento: string;
  valor: number;
  dias_atraso: number;
  referencia: string;
}

export function useInadimplencia() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["relatorio_inadimplencia"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];

      // Buscar contas vencidas não pagas
      const { data: titulos, error } = await supabase
        .from("contas_pagar_receber")
        .select("*, clientes(nome)")
        .eq("status", "ATRASADO")
        .or(`status.eq.PENDENTE,data_vencimento.lt.${hoje}`)
        .is("fornecedor_id", null) // Apenas contas a receber
        .order("data_vencimento", { ascending: true });

      if (error) throw error;

      const hojeDate = new Date();
      const titulosVencidos: TituloVencido[] = [];
      const clienteMap = new Map<string, InadimplenciaCliente>();
      let totalVencido = 0;
      let totalDiasAtraso = 0;

      titulos?.forEach((titulo) => {
        const cliente = titulo.clientes as any;
        const clienteId = titulo.cliente_id || "sem_cliente";
        const clienteNome = cliente?.nome || "Cliente não identificado";
        const valor = Number(titulo.valor_previsto || 0);
        const vencimento = new Date(titulo.data_vencimento);
        const diasAtraso = Math.max(0, Math.ceil((hojeDate.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)));

        const tituloVencido: TituloVencido = {
          id: titulo.id,
          cliente: clienteNome,
          cliente_id: clienteId,
          vencimento: titulo.data_vencimento,
          valor: valor,
          dias_atraso: diasAtraso,
          referencia: titulo.documento_ref || titulo.observacoes || `CP-${titulo.id.slice(0, 8)}`,
        };

        titulosVencidos.push(tituloVencido);

        // Agrupar por cliente
        const clienteData = clienteMap.get(clienteId) || {
          cliente_id: clienteId,
          cliente: clienteNome,
          total_devido: 0,
          quantidade_titulos: 0,
        };

        clienteData.total_devido += valor;
        clienteData.quantidade_titulos += 1;
        clienteMap.set(clienteId, clienteData);

        totalVencido += valor;
        totalDiasAtraso += diasAtraso;
      });

      const topDevedores = Array.from(clienteMap.values())
        .sort((a, b) => b.total_devido - a.total_devido)
        .slice(0, 10)
        .map((data) => ({
          ...data,
          total_devido: parseFloat(data.total_devido.toFixed(2)),
        }));

      const resumo: InadimplenciaResumo = {
        total_vencido: parseFloat(totalVencido.toFixed(2)),
        quantidade_titulos: titulosVencidos.length,
        idade_media_dias: titulosVencidos.length > 0 ? Math.round(totalDiasAtraso / titulosVencidos.length) : 0,
        top_devedores: topDevedores,
        titulos_vencidos: titulosVencidos.map((t) => ({
          ...t,
          valor: parseFloat(t.valor.toFixed(2)),
        })),
      };

      return resumo;
    },
  });
}
