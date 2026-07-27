import { useState, useMemo, useEffect } from "react";
import { useEditarPedido } from "@/hooks/compras/useMutationsPedido";
import { useFornecedores } from "@/hooks/compras/useFornecedores";
import { useProdutos } from "@/hooks/useProdutos";
import { PedidoCompra } from "@/lib/compras/types";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { formatCurrency } from "@/lib/utils";

interface ItemPedidoDraft {
  id: string; // temp id
  produto_id: string | null;
  produto_nome: string;
  descricao_customizada: string;
  quantidade: number;
  preco_unitario: number;
}

export function EditarPedidoModal({ pedido }: { pedido: PedidoCompra }) {
  const [open, setOpen] = useState(false);
  const { data: fornecedores } = useFornecedores();
  const { data: produtos } = useProdutos();
  const { mutate: editarPedido, isPending } = useEditarPedido();
  
  const [fornecedorId, setFornecedorId] = useState("");
  const [itens, setItens] = useState<ItemPedidoDraft[]>([]);

  useEffect(() => {
    if (open && pedido) {
      setFornecedorId(pedido.fornecedor_id);
      
      const itensMapeados: ItemPedidoDraft[] = (pedido.itens || []).map((i: any) => {
        let prodNome = i.produto;
        let descCust = "";
        
        if (i.produto && i.produto.includes(" - ")) {
          const parts = i.produto.split(" - ");
          prodNome = parts[0];
          descCust = parts.slice(1).join(" - ");
        }

        return {
          id: i.id || Math.random().toString(36).substr(2, 9),
          produto_id: i.produto_id || null,
          produto_nome: prodNome,
          descricao_customizada: descCust,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
        };
      });
      setItens(itensMapeados);
    }
  }, [open, pedido]);

  // Campos para novo item
  const [isCustomProduto, setIsCustomProduto] = useState(false);
  const [produtoCustomName, setProdutoCustomName] = useState("");
  const [produtoSel, setProdutoSel] = useState("");
  const [descSel, setDescSel] = useState("");
  const [precoSel, setPrecoSel] = useState<number>(0);
  const [qtdSel, setQtdSel] = useState<number>(1);

  const valorTotal = useMemo(() => {
    return itens.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);
  }, [itens]);

  const handleAddItem = () => {
    let prodId: string | null = null;
    let prodName = "";

    if (isCustomProduto) {
      if (!produtoCustomName.trim()) return;
      prodName = produtoCustomName.trim();
    } else {
      if (!produtoSel) return;
      const prod = produtos?.find(p => p.id === produtoSel);
      if (!prod) return;
      prodId = prod.id;
      prodName = prod.descricao;
    }

    const newItem: ItemPedidoDraft = {
      id: Math.random().toString(36).substr(2, 9),
      produto_id: prodId,
      produto_nome: prodName,
      descricao_customizada: descSel,
      quantidade: qtdSel,
      preco_unitario: precoSel,
    };

    setItens([...itens, newItem]);
    setProdutoSel("");
    setProdutoCustomName("");
    setDescSel("");
    setPrecoSel(0);
    setQtdSel(1);
  };

  const handleRemoveItem = (id: string) => {
    setItens(itens.filter(i => i.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itens.length === 0) return;

    const pedidoToSave = {
      fornecedor_id: fornecedorId,
      valor_total: valorTotal,
    };

    const itensParaSalvar = itens.map(item => ({
      produto_id: item.produto_id || null,
      produto: item.descricao_customizada ? `${item.produto_nome} - ${item.descricao_customizada}` : item.produto_nome,
      quantidade: item.quantidade,
      quantidade_recebida: 0,
      preco_unitario: item.preco_unitario,
      total: item.quantidade * item.preco_unitario,
    }));

    editarPedido({ pedidoId: pedido.id, pedido: pedidoToSave, itens: itensParaSalvar }, {
      onSuccess: () => {
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pedido de Compra {pedido.numero}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fornecedor">Fornecedor</Label>
            <Select value={fornecedorId} onValueChange={setFornecedorId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {fornecedores?.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-4 border-t border-border">
            <Label className="mb-2 block">Itens do Pedido</Label>
            
            <div className="flex gap-2 items-end mb-4 bg-muted/30 p-3 rounded-md flex-wrap">
              <div className="w-full sm:flex-1 space-y-1 min-w-[200px]">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Produto base</Label>
                  <button 
                    type="button" 
                    onClick={() => setIsCustomProduto(!isCustomProduto)}
                    className="text-[10px] text-primary hover:underline"
                  >
                    {isCustomProduto ? "Selecionar da lista" : "+ Digitar avulso"}
                  </button>
                </div>
                {isCustomProduto ? (
                  <Input 
                    type="text" 
                    placeholder="Nome do produto avulso..."
                    className="h-8 text-xs"
                    value={produtoCustomName}
                    onChange={e => setProdutoCustomName(e.target.value)}
                  />
                ) : (
                  <Select value={produtoSel} onValueChange={(val) => {
                    setProdutoSel(val);
                    const prod = produtos?.find(p => p.id === val);
                    if (prod) setPrecoSel(prod.valor_compra || 0);
                  }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.descricao}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="w-full sm:flex-1 space-y-1 min-w-[200px]">
                <Label className="text-xs">Discriminar Item (Opcional)</Label>
                <Input 
                  type="text" 
                  placeholder="Ex: Para montagem da porta..."
                  className="h-8 text-xs" 
                  value={descSel} 
                  onChange={e => setDescSel(e.target.value)} 
                />
              </div>

              <div className="w-24 space-y-1">
                <Label className="text-xs">Valor (R$)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  min="0" 
                  className="h-8 text-xs" 
                  value={precoSel} 
                  onChange={e => setPrecoSel(Number(e.target.value))} 
                />
              </div>

              <div className="w-20 space-y-1">
                <Label className="text-xs">Qtd</Label>
                <Input 
                  type="number" 
                  min="1" 
                  className="h-8 text-xs" 
                  value={qtdSel} 
                  onChange={e => setQtdSel(Number(e.target.value))} 
                />
              </div>
              <Button 
                type="button" 
                size="sm" 
                className="h-8 w-full sm:w-auto mt-2 sm:mt-0" 
                onClick={handleAddItem} 
                disabled={(isCustomProduto ? !produtoCustomName.trim() : !produtoSel) || qtdSel < 1}
              >
                Adicionar
              </Button>
            </div>

            {itens.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="pb-2">Produto</th>
                    <th className="pb-2 text-right">Qtd</th>
                    <th className="pb-2 text-right">Unitário</th>
                    <th className="pb-2 text-right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map(item => (
                    <tr key={item.id} className="border-b border-border/30 last:border-0">
                      <td className="py-2">
                        <div className="font-medium">{item.produto_nome}</div>
                        {item.descricao_customizada && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                            {item.descricao_customizada}
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-right">{item.quantidade}</td>
                      <td className="py-2 text-right">{formatCurrency(item.preco_unitario)}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(item.quantidade * item.preco_unitario)}</td>
                      <td className="py-2 text-right">
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-danger hover:bg-danger/20" onClick={() => handleRemoveItem(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border">
                    <td colSpan={3} className="py-3 text-right font-medium">Total do Pedido:</td>
                    <td className="py-3 text-right font-bold text-primary">{formatCurrency(valorTotal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground italic border border-dashed border-border rounded-md">
                Nenhum item adicionado ao pedido.
              </div>
            )}
          </div>

            <DialogFooter>
            <Button type="submit" disabled={isPending || !fornecedorId || itens.length === 0}>
              {isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
