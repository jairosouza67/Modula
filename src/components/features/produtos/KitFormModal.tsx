import { useEffect, useState, useMemo } from "react";
import { Loader2, Layers, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useKits, type KitCompleto, type KitFormData } from "@/hooks/useKits";
import { useProdutos } from "@/hooks/useProdutos";
import {
  CATEGORIAS_KIT,
  CATEGORIA_KIT_LABELS,
  type TipoPreco,
} from "@/lib/sales/types";

// ─── Props ──────────────────────────────────────────────────────────────────

interface KitFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingKit: KitCompleto | null;
}

// ─── Tipo local para o formulário de componente ─────────────────────────────

interface ComponenteForm {
  produto_id: string;
  quantidade: number;
  tipo_preco: TipoPreco;
}

// ─── Componente ─────────────────────────────────────────────────────────────

export function KitFormModal({
  open,
  onOpenChange,
  editingKit,
}: KitFormModalProps) {
  const { createKit, updateKit, isCreating, isUpdating } = useKits();
  const { data: produtos = [] } = useProdutos();

  // Estado do formulário
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_KIT[0]);
  const [componentes, setComponentes] = useState<ComponenteForm[]>([]);

  // Reset quando abrir/editar
  useEffect(() => {
    if (editingKit) {
      setCodigo(editingKit.codigo);
      setNome(editingKit.nome);
      setCategoria(editingKit.categoria);
      setComponentes(
        (editingKit.componentes ?? []).map((c) => ({
          produto_id: c.produto_id,
          quantidade: c.quantidade,
          tipo_preco: c.tipo_preco as TipoPreco,
        })),
      );
    } else {
      setCodigo("");
      setNome("");
      setCategoria(CATEGORIAS_KIT[0]);
      setComponentes([]);
    }
  }, [editingKit, open]);

  // Produtos disponíveis para adicionar (exclui os já selecionados)
  const produtosDisponiveis = useMemo(() => {
    const selecionados = new Set(componentes.map((c) => c.produto_id));
    return produtos.filter((p) => !selecionados.has(p.id));
  }, [produtos, componentes]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleAddComponente = () => {
    if (produtosDisponiveis.length === 0) return;
    setComponentes((prev) => [
      ...prev,
      {
        produto_id: produtosDisponiveis[0].id,
        quantidade: 1,
        tipo_preco: "PC_FX",
      },
    ]);
  };

  const handleRemoveComponente = (index: number) => {
    setComponentes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateComponente = (
    index: number,
    changes: Partial<ComponenteForm>,
  ) => {
    setComponentes((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...changes } : c)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: KitFormData = {
      codigo: codigo.toUpperCase(),
      nome,
      categoria,
      componentes,
    };

    try {
      if (editingKit) {
        await updateKit({ id: editingKit.id, ...formData });
      } else {
        await createKit(formData);
      }
      onOpenChange(false);
    } catch {
      // toast já é tratado pelo hook
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {editingKit ? `Editar Kit: ${editingKit.codigo}` : "Criar Novo Kit"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Dados do Kit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Código</Label>
              <Input
                placeholder="Ex: BPV"
                className="h-8 text-xs font-mono uppercase"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                required
                disabled={!!editingKit}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Nome do Kit</Label>
              <Input
                placeholder="Ex: Box Pivotante"
                className="h-8 text-xs"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_KIT.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORIA_KIT_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Componentes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Componentes ({componentes.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[10px]"
                onClick={handleAddComponente}
                disabled={produtosDisponiveis.length === 0}
              >
                <Plus className="mr-1 h-3 w-3" /> Adicionar
              </Button>
            </div>

            {componentes.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-lg border-border/60">
                <p className="text-[10px] text-muted-foreground">
                  Nenhum componente adicionado. Clique em "Adicionar" para
                  associar produtos a este kit.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {componentes.map((comp, idx) => {
                  const produto = produtos.find(
                    (p) => p.id === comp.produto_id,
                  );
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_80px_90px_32px] gap-2 items-center rounded-md border border-border/60 p-2"
                    >
                      <Select
                        value={comp.produto_id}
                        onValueChange={(v) =>
                          handleUpdateComponente(idx, { produto_id: v })
                        }
                      >
                        <SelectTrigger className="h-7 text-[11px]">
                          <SelectValue placeholder="Produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            ...(produto ? [produto] : []),
                            ...produtosDisponiveis,
                          ]
                            .filter(
                              (p, i, arr) =>
                                arr.findIndex((x) => x.id === p.id) === i,
                            )
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                <span className="flex items-center gap-1.5">
                                  <span className="font-mono text-[9px] text-muted-foreground">
                                    {p.codigo}
                                  </span>
                                  {p.descricao}
                                </span>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-7 text-[11px] text-center"
                        value={comp.quantidade}
                        onChange={(e) =>
                          handleUpdateComponente(idx, {
                            quantidade: Number(e.target.value) || 0,
                          })
                        }
                      />

                      <Select
                        value={comp.tipo_preco}
                        onValueChange={(v) =>
                          handleUpdateComponente(idx, {
                            tipo_preco: v as TipoPreco,
                          })
                        }
                      >
                        <SelectTrigger className="h-7 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M2">m²</SelectItem>
                          <SelectItem value="PC_FX">Peça/Faixa</SelectItem>
                          <SelectItem value="PC_ML">Peça/ML</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveComponente(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !nome}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : editingKit ? (
                "Atualizar Kit"
              ) : (
                "Criar Kit"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
