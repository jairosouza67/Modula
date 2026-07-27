import { useState } from "react";
import { Pencil, Trash2, Loader2, Package, Layers } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ErpCard } from "@/components/erp/Card";
import { cn } from "@/lib/utils";
import { useKits, type KitCompleto } from "@/hooks/useKits";
import {
  CATEGORIAS_KIT,
  CATEGORIA_KIT_LABELS,
  type CategoriaKit,
} from "@/lib/sales/types";

// ─── Props ──────────────────────────────────────────────────────────────────

interface KitListProps {
  onEdit: (kit: KitCompleto) => void;
}

// ─── Helpers de cor por categoria ───────────────────────────────────────────

const CATEGORIA_COLORS: Record<string, string> = {
  porta_pivotante: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  porta_correr: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  box: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  janela: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  espelho: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  fachada: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  painel: "bg-teal-500/10 text-teal-500 border-teal-500/20",
};

// ─── Componente ─────────────────────────────────────────────────────────────

export function KitList({ onEdit }: KitListProps) {
  const { data: kits = [], isLoading, deleteKit, isDeleting } = useKits();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todos");

  // Filtrar kits
  const filteredKits = kits.filter((kit) => {
    const query = search.trim().toLowerCase();
    const matchSearch =
      query.length === 0 ||
      kit.codigo.toLowerCase().includes(query) ||
      kit.nome.toLowerCase().includes(query);
    const matchCategory =
      categoriaFiltro === "todos" || kit.categoria === categoriaFiltro;
    return matchSearch && matchCategory;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteKit(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ErpCard>
      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Buscar por código ou nome"
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
        >
          <option value="todos">Todas as categorias</option>
          {CATEGORIAS_KIT.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORIA_KIT_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Carregando kits...</span>
        </div>
      ) : filteredKits.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg border-border/60">
          <Package className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            Nenhum kit encontrado.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <th className="py-2 px-3">Código</th>
                <th className="py-2 px-3">Nome</th>
                <th className="py-2 px-3">Categoria</th>
                <th className="py-2 px-3 text-center">Componentes</th>
                <th className="py-2 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredKits.map((kit) => (
                <tr
                  key={kit.id}
                  className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40 transition-colors"
                >
                  <td className="py-2 px-3">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-muted font-mono font-medium text-[10px] text-foreground border">
                      {kit.codigo}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium text-foreground">
                    {kit.nome}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={cn(
                        "inline-block px-1.5 py-0.5 rounded-full text-[9px] font-medium border",
                        CATEGORIA_COLORS[kit.categoria] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {CATEGORIA_KIT_LABELS[kit.categoria as CategoriaKit] ??
                        kit.categoria}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 text-[10px] font-medium">
                      <Layers className="h-2.5 w-2.5" />
                      {kit.componentes?.length ?? 0}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => onEdit(kit)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeletingId(kit.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rodapé */}
      {filteredKits.length > 0 && (
        <div className="mt-4 text-[11px] text-muted-foreground">
          Exibindo {filteredKits.length} kit(s)
        </div>
      )}

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir kit?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover o kit e todos os seus componentes. Os
              orçamentos que já utilizam este kit não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ErpCard>
  );
}
