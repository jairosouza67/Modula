import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PedidoCompra } from "@/lib/compras/types";

export function usePedidosCompra() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["pedidos_compra"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos_compra")
        .select(`
          *,
          fornecedor:fornecedores(nome),
          itens:pedidos_compra_itens(*),
          etapas:pedidos_compra_etapas(*)
        `)
        .order("criado_em", { ascending: false });

      if (error) throw error;

      // Map Supabase data to PedidoCompra interface
      return (data || []).map((pedido: any) => ({
        ...pedido,
        fornecedor_nome: pedido.fornecedor?.nome || "Fornecedor não encontrado",
        itens: pedido.itens || [],
        etapas: pedido.etapas || [],
      })) as PedidoCompra[];
    },
  });
}

export function usePedidoCompra(id: string) {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["pedidos_compra", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("pedidos_compra")
        .select(`
          *,
          fornecedor:fornecedores(nome),
          itens:pedidos_compra_itens(*),
          etapas:pedidos_compra_etapas(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        ...data,
        fornecedor_nome: data.fornecedor?.nome || "Fornecedor não encontrado",
        itens: data.itens || [],
        etapas: data.etapas || [],
      } as PedidoCompra;
    },
    enabled: !!id,
  });
}
