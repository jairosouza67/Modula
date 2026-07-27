import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { userFriendlyError } from "@/lib/errors/sanitize";
import { PedidoCompra, EtapaPedidoCompra } from "@/lib/compras/types";
import { toast } from "sonner";

export function useAprovarPedido() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pedidoId,
      novoStatus,
    }: {
      pedidoId: string;
      novoStatus: EtapaPedidoCompra;
    }) => {
      const { data, error } = await supabase
        .from("pedidos_compra")
        .update({
          status: novoStatus,
          status_liberacao: "liberado",
        })
        .eq("id", pedidoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos_compra"] });
      toast.success("Pedido aprovado com sucesso! 🛡️");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao aprovar pedido", error));
    },
  });
}

export function useAvancarEtapa() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pedidoId,
      proximaEtapa,
    }: {
      pedidoId: string;
      proximaEtapa: EtapaPedidoCompra;
    }) => {
      const { data, error } = await supabase
        .from("pedidos_compra")
        .update({ status: proximaEtapa })
        .eq("id", pedidoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos_compra"] });
      toast.success("Etapa avançada! ⚔️");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao avançar etapa", error));
    },
  });
}

export function useCriarPedido() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pedido, itens }: { pedido: Partial<PedidoCompra>; itens: any[] }) => {
      // 1. Criar pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from("pedidos_compra")
        .insert([pedido])
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // 2. Criar itens
      if (itens && itens.length > 0) {
        const itensToInsert = itens.map((item) => ({
          ...item,
          pedido_id: pedidoData.id,
        }));

        const { error: itensError } = await supabase
          .from("pedidos_compra_itens")
          .insert(itensToInsert);

        if (itensError) throw itensError;
      }

      return pedidoData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos_compra"] });
      toast.success("Pedido forjado com sucesso! ⚒️");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao criar pedido", error));
    },
  });
}

export function useReceberPedido() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pedidoId,
      itensRecebidos,
    }: {
      pedidoId: string;
      itensRecebidos: { id: string; recebido: number }[];
    }) => {
      // Atualizar cada item
      for (const item of itensRecebidos) {
        const { error } = await supabase
          .from("pedidos_compra_itens")
          .update({ quantidade_recebida: item.recebido })
          .eq("id", item.id);

        if (error) throw error;
      }

      // Buscar o pedido e os itens para ver se o total foi recebido
      const { data: itensDB, error: fetchError } = await supabase
        .from("pedidos_compra_itens")
        .select("quantidade, quantidade_recebida")
        .eq("pedido_id", pedidoId);

      if (fetchError) throw fetchError;

      const totalSolicitado = itensDB.reduce((acc, curr) => acc + curr.quantidade, 0);
      const totalRecebido = itensDB.reduce((acc, curr) => acc + curr.quantidade_recebida, 0);

      const novoStatus: EtapaPedidoCompra =
        totalRecebido >= totalSolicitado ? "recebido_total" : "recebido_parcial";

      // Atualizar status do pedido
      const { error: updateError } = await supabase
        .from("pedidos_compra")
        .update({ status: novoStatus })
        .eq("id", pedidoId);

      if (updateError) throw updateError;

      return novoStatus;
    },
    onSuccess: (novoStatus) => {
      queryClient.invalidateQueries({ queryKey: ["pedidos_compra"] });
      toast.success(
        `Pedido marcado como ${novoStatus === "recebido_total" ? "recebido totalmente" : "recebido parcialmente"}! 📦`,
      );
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao receber pedido", error));
    },
  });
}

export function useExcluirPedido() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pedidoId: string) => {
      const { error } = await supabase.from("pedidos_compra").delete().eq("id", pedidoId);

      if (error) throw error;
      return pedidoId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos_compra"] });
      toast.success("Pedido excluído! 🗑️");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao excluir pedido", error));
    },
  });
}

export function useEditarPedido() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pedidoId,
      pedido,
      itens,
    }: {
      pedidoId: string;
      pedido: Partial<PedidoCompra>;
      itens: any[];
    }) => {
      // 1. Update pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from("pedidos_compra")
        .update(pedido)
        .eq("id", pedidoId)
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // 2. Apagar itens antigos
      const { error: deleteError } = await supabase
        .from("pedidos_compra_itens")
        .delete()
        .eq("pedido_id", pedidoId);

      if (deleteError) throw deleteError;

      // 3. Criar itens novos
      if (itens && itens.length > 0) {
        const itensToInsert = itens.map((item) => ({
          ...item,
          pedido_id: pedidoId,
        }));

        const { error: itensError } = await supabase
          .from("pedidos_compra_itens")
          .insert(itensToInsert);

        if (itensError) throw itensError;
      }

      return pedidoData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos_compra"] });
      toast.success("Pedido editado com sucesso! 📝");
    },
    onError: (error: any) => {
      toast.error(userFriendlyError("Erro ao editar pedido", error));
    },
  });
}
