import { useState, useEffect } from "react";
import { useReceberPedido } from "@/hooks/compras/useMutationsPedido";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PackageCheck } from "lucide-react";
import { PedidoCompra } from "@/lib/compras/types";

interface ItemRecebimento {
  id: string;
  produto: string;
  quantidade_solicitada: number;
  quantidade_ja_recebida: number;
  quantidade_agora: number;
}

interface RecebimentoModalProps {
  pedido: PedidoCompra | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecebimentoModal({ pedido, open, onOpenChange }: RecebimentoModalProps) {
  const [itens, setItens] = useState<ItemRecebimento[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);
  const { mutate: receberPedido, isPending } = useReceberPedido();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (open && pedido) {
      carregarItens();
    }
  }, [open, pedido]);

  const carregarItens = async () => {
    setLoadingItens(true);
    try {
      const { data, error } = await supabase
        .from("pedidos_compra_itens")
        .select("id, produto, quantidade, quantidade_recebida")
        .eq("pedido_id", pedido!.id);
        
      if (error) throw error;
      
      const recebimentoList: ItemRecebimento[] = data.map(i => ({
        id: i.id,
        produto: i.produto,
        quantidade_solicitada: i.quantidade,
        quantidade_ja_recebida: i.quantidade_recebida || 0,
        quantidade_agora: i.quantidade - (i.quantidade_recebida || 0), // Sugere o total faltante
      }));
      
      setItens(recebimentoList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItens(false);
    }
  };

  const handleUpdateQtd = (id: string, qtd: number) => {
    setItens(itens.map(i => i.id === id ? { ...i, quantidade_agora: qtd } : i));
  };

  const handleMarcarTodos = () => {
    setItens(itens.map(i => ({
      ...i,
      quantidade_agora: i.quantidade_solicitada - i.quantidade_ja_recebida
    })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedido) return;
    
    const itensRecebidos = itens
      .filter(i => i.quantidade_agora > 0)
      .map(i => ({
        id: i.id,
        recebido: i.quantidade_ja_recebida + i.quantidade_agora
      }));
      
    if (itensRecebidos.length === 0) {
      onOpenChange(false);
      return;
    }

    receberPedido({ pedidoId: pedido.id, itensRecebidos }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Recebimento de Pedido</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Pedido {pedido?.numero} — {pedido?.fornecedor_nome}
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex justify-end">
             <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={handleMarcarTodos}>
               Marcar Todo o Restante
             </Button>
          </div>
          
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2">Produto</th>
                <th className="pb-2 text-right">Solicitado</th>
                <th className="pb-2 text-right">Já Rec.</th>
                <th className="pb-2 text-right">Receber Agora</th>
              </tr>
            </thead>
            <tbody>
              {loadingItens ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center">Carregando itens...</td>
                </tr>
              ) : itens.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center italic text-muted-foreground">Nenhum item pendente</td>
                </tr>
              ) : (
                itens.map(item => {
                  const maxPermitido = item.quantidade_solicitada - item.quantidade_ja_recebida;
                  const isConcluido = maxPermitido <= 0;
                  
                  return (
                    <tr key={item.id} className="border-b border-border/40">
                      <td className="py-2">{item.produto}</td>
                      <td className="py-2 text-right">{item.quantidade_solicitada}</td>
                      <td className="py-2 text-right text-muted-foreground">{item.quantidade_ja_recebida}</td>
                      <td className="py-2 text-right">
                        {isConcluido ? (
                          <span className="text-success inline-flex items-center gap-1">
                            <PackageCheck className="h-3 w-3" /> OK
                          </span>
                        ) : (
                          <Input 
                            type="number"
                            min="0"
                            max={maxPermitido}
                            className="h-7 w-20 text-xs text-right ml-auto"
                            value={item.quantidade_agora}
                            onChange={(e) => handleUpdateQtd(item.id, Number(e.target.value))}
                          />
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending || loadingItens || itens.length === 0}>
              {isPending ? "Processando..." : "Confirmar Recebimento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
