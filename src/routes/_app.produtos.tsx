import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Pencil,
  Plus,
  Search,
  Package,
  Check,
  X,
  Coins,
  Percent,
  Layers,
  Power,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/erp/PageHeader";
import { KpiCard } from "@/components/erp/KpiCard";
import { ErpCard } from "@/components/erp/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useProdutos, type Produto } from "@/hooks/useProdutos";
import { useFornecedores } from "@/hooks/compras/useFornecedores";
import { KitList } from "@/components/features/produtos/KitList";
import { KitFormModal } from "@/components/features/produtos/KitFormModal";
import type { KitCompleto } from "@/hooks/useKits";
import { formatCurrency, cn } from "@/lib/utils";

const PAGE_SIZE = 8;

const CATEGORIAS = ["vidro", "kit", "ferragem", "servico", "processamento"] as const;
type CategoriaProduto = (typeof CATEGORIAS)[number];

const CATEGORIA_LABELS: Record<CategoriaProduto, string> = {
  vidro: "Vidro",
  kit: "Kit / Perfil",
  ferragem: "Ferragem",
  servico: "Serviço composto",
  processamento: "Processamento / Acabamento",
};

const CATEGORIA_COLORS: Record<CategoriaProduto, string> = {
  vidro: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  kit: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ferragem: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  servico: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  processamento: "bg-pink-500/10 text-pink-500 border-pink-500/20",
};

// Zod Schema for validation
const productFormSchema = z.object({
  codigo: z
    .string()
    .min(2, "O código deve ter pelo menos 2 caracteres")
    .max(10, "O código não pode passar de 10 caracteres")
    .toUpperCase(),
  descricao: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),
  unidade: z.string().min(1, "A unidade é obrigatória"),
  categoria: z.enum(CATEGORIAS),
  valor_compra: z.coerce.number().min(0, "O valor de compra deve ser maior ou igual a zero"),
  margem_lucro: z.coerce
    .number()
    .min(0, "A margem de lucro deve ser maior ou igual a zero")
    .max(0.99, "A margem não pode ser 100% ou maior"),
  fornecedor_id: z.string().optional(),
  ncm: z
    .string()
    .regex(/^\d{8}$/, "NCM deve conter 8 dígitos numéricos")
    .optional()
    .or(z.literal("")),
  cfop: z.string().optional(),
  unidade_fiscal: z.string().optional(),
  origem: z.coerce.number().min(0).max(8).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export const Route = createFileRoute("/_app/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — Vidraçaria Ornamental" },
      {
        name: "description",
        content: "Gerenciamento do catálogo de produtos e tabelas de preços.",
      },
    ],
  }),
  component: ProdutosPage,
});

function ProdutosPage() {
  const {
    data: produtos = [],
    isLoading,
    createProduto,
    updateProduto,
    toggleAtivo,
    isCreating,
    isUpdating,
  } = useProdutos();
  const { data: fornecedores = [], isLoading: isLoadingFornecedores } = useFornecedores();

  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaProduto | "todos">("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);

  // Kit modal state
  const [activeTab, setActiveTab] = useState("produtos");
  const [isKitFormOpen, setIsKitFormOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<KitCompleto | null>(null);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      codigo: "",
      descricao: "",
      unidade: "m²",
      categoria: "vidro",
      valor_compra: 0,
      margem_lucro: 0.46,
      fornecedor_id: "",
      ncm: "",
      cfop: "5102",
      unidade_fiscal: "UN",
      origem: 0,
    },
  });

  const watchValorCompra = Number(watch("valor_compra")) || 0;
  const watchMargemLucro = Number(watch("margem_lucro")) || 0;

  const calculatedSellingPrice = useMemo(() => {
    return watchValorCompra * (1 + watchMargemLucro);
  }, [watchValorCompra, watchMargemLucro]);

  // Sync edit product values to form
  useEffect(() => {
    if (editingProduct) {
      reset({
        codigo: editingProduct.codigo,
        descricao: editingProduct.descricao,
        unidade: editingProduct.unidade,
        categoria: editingProduct.categoria as CategoriaProduto,
        valor_compra: Number(editingProduct.valor_compra) || 0,
        margem_lucro: Number(editingProduct.margem_lucro) || 0,
        fornecedor_id: editingProduct.fornecedor_id || "",
        ncm: editingProduct.ncm || "",
        cfop: editingProduct.cfop || "5102",
        unidade_fiscal: editingProduct.unidade_fiscal || "UN",
        origem: editingProduct.origem ?? 0,
      });
    } else {
      reset({
        codigo: "",
        descricao: "",
        unidade: "m²",
        categoria: "vidro",
        valor_compra: 0,
        margem_lucro: 0.46,
        fornecedor_id: "",
        ncm: "",
        cfop: "5102",
        unidade_fiscal: "UN",
        origem: 0,
      });
    }
  }, [editingProduct, reset, isFormOpen]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const active = produtos.filter((p) => p.ativo);
    const vidros = produtos.filter((p) => p.categoria === "vidro");
    const processamentos = produtos.filter((p) => p.categoria === "processamento");
    const acessorios = produtos.filter((p) => ["kit", "ferragem", "servico"].includes(p.categoria));

    return {
      total: produtos.length,
      ativos: active.length,
      vidros: vidros.length,
      processamentos: processamentos.length,
      acessorios: acessorios.length,
    };
  }, [produtos]);

  // Filtering products
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return produtos.filter((p) => {
      const matchSearch =
        query.length === 0 ||
        p.codigo.toLowerCase().includes(query) ||
        p.descricao.toLowerCase().includes(query);
      const matchCategory = categoriaFiltro === "todos" || p.categoria === categoriaFiltro;
      return matchSearch && matchCategory;
    });
  }, [produtos, search, categoriaFiltro]);

  // No Pagination - Show all filtered products
  const pagedProducts = filteredProducts;

  const onSubmitForm = async (values: ProductFormValues) => {
    try {
      const fiscalFields = {
        ncm: values.ncm || null,
        cfop: values.cfop || "5102",
        unidade_fiscal: values.unidade_fiscal || "UN",
        origem: values.origem ?? 0,
      };

      if (editingProduct) {
        await updateProduto({
          id: editingProduct.id,
          codigo: values.codigo,
          descricao: values.descricao,
          unidade: values.unidade,
          categoria: values.categoria,
          valor_compra: values.valor_compra,
          margem_lucro: values.margem_lucro,
          fornecedor_id: values.fornecedor_id || null,
          ...fiscalFields,
        });
      } else {
        await createProduto({
          codigo: values.codigo,
          descricao: values.descricao,
          unidade: values.unidade,
          categoria: values.categoria,
          valor_compra: values.valor_compra,
          margem_lucro: values.margem_lucro,
          fornecedor_id: values.fornecedor_id || null,
          ...fiscalFields,
        });
      }
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (err) {
      // toast is already handled by hook mutations
    }
  };

  const handleToggleAtivo = async (id: string, currentStatus: boolean) => {
    try {
      await toggleAtivo({ id, ativo: !currentStatus });
    } catch (err) {
      // error handled by hook
    }
  };

  const handleEdit = (product: Produto) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  // Kit handlers
  const handleEditKit = (kit: KitCompleto) => {
    setEditingKit(kit);
    setIsKitFormOpen(true);
  };

  const handleNewKit = () => {
    setEditingKit(null);
    setIsKitFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Catálogo de Produtos"
        subtitle={`${kpis.total} produtos cadastrados no sistema`}
        actions={
          activeTab === "kits" ? (
            <Button size="sm" className="text-xs" onClick={handleNewKit}>
              <Layers className="mr-1 h-3.5 w-3.5" /> Novo kit
            </Button>
          ) : (
            <Button size="sm" className="text-xs" onClick={handleNew}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Novo produto
            </Button>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-3">
          <TabsTrigger value="produtos" className="text-xs">
            <Package className="mr-1.5 h-3.5 w-3.5" /> Produtos
          </TabsTrigger>
          <TabsTrigger value="kits" className="text-xs">
            <Layers className="mr-1.5 h-3.5 w-3.5" /> Kits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="mt-0">
          {/* KPI Section */}
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 mb-3.5">
            <KpiCard
              label="Total de itens"
              value={String(kpis.total)}
              hint={`${kpis.ativos} ativos`}
            />
            <KpiCard
              label="Tipos de Vidro"
              value={String(kpis.vidros)}
              hint="Precificados por m²"
            />
            <KpiCard
              label="Acessórios e Kits"
              value={String(kpis.acessorios)}
              hint="Ferragens e perfis"
            />
            <KpiCard
              label="Processamentos"
              value={String(kpis.processamentos)}
              hint="Acabamentos de vidro"
            />
          </div>

          {/* Filter and Table Card */}
          <ErpCard>
            <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código ou descrição"
                  className="h-8 pl-8 text-xs"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  value={categoriaFiltro}
                  onChange={(e) => {
                    setCategoriaFiltro(e.target.value as CategoriaProduto | "todos");
                    setCurrentPage(1);
                  }}
                >
                  <option value="todos">Todas as categorias</option>
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORIA_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Carregando catálogo...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg border-border/60">
                <Package className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      <th className="py-2 px-3">Código</th>
                      <th className="py-2 px-3">Descrição</th>
                      <th className="py-2 px-3">Categoria</th>
                      <th className="py-2 px-3">Fornecedor</th>
                      <th className="py-2 px-3">Unid</th>
                      <th className="py-2 px-3 text-right">Preço Custo</th>
                      <th className="py-2 px-3 text-right">Margem</th>
                      <th className="py-2 px-3 text-right">Preço Venda</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedProducts.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40 transition-colors"
                      >
                        <td className="py-2 px-3">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-muted font-mono font-medium text-[10px] text-foreground border">
                            {p.codigo}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-foreground">{p.descricao}</td>
                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              "inline-block px-1.5 py-0.5 rounded-full text-[9px] font-medium border",
                              CATEGORIA_COLORS[p.categoria as CategoriaProduto] ||
                                "bg-muted text-muted-foreground",
                            )}
                          >
                            {CATEGORIA_LABELS[p.categoria as CategoriaProduto] || p.categoria}
                          </span>
                        </td>
                        <td
                          className="py-2 px-3 text-muted-foreground truncate max-w-[120px]"
                          title={p.fornecedor?.nome}
                        >
                          {p.fornecedor?.nome || "-"}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{p.unidade}</td>
                        <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                          {formatCurrency(Number(p.valor_compra) || 0)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                          {(Number(p.margem_lucro) * 100).toFixed(0)}%
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-primary">
                          {formatCurrency(Number(p.valor_venda) || 0)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleToggleAtivo(p.id, p.ativo)}
                            className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border cursor-pointer hover:opacity-85 transition-opacity",
                              p.ativo
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
                            )}
                          >
                            {p.ativo ? (
                              <>
                                <Check className="h-2.5 w-2.5" /> Ativo
                              </>
                            ) : (
                              <>
                                <X className="h-2.5 w-2.5" /> Inativo
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => handleEdit(p)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Results Count Control */}
            {filteredProducts.length > 0 && (
              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Exibindo todos os {filteredProducts.length} produtos</span>
              </div>
            )}
          </ErpCard>
        </TabsContent>

        <TabsContent value="kits" className="mt-0">
          <KitList onEdit={handleEditKit} />
        </TabsContent>
      </Tabs>

      {/* Form Modal (Create / Edit) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {editingProduct
                ? `Editar Produto: ${editingProduct.codigo}`
                : "Cadastrar Novo Produto"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="codigo" className="text-xs">
                  Código
                </Label>
                <Input
                  id="codigo"
                  placeholder="Ex: VI12"
                  className="h-8 text-xs font-mono uppercase"
                  disabled={!!editingProduct}
                  {...register("codigo")}
                />
                {errors.codigo && (
                  <p className="text-[10px] text-destructive">{errors.codigo.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="categoria" className="text-xs">
                  Categoria
                </Label>
                <select
                  id="categoria"
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                  {...register("categoria")}
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORIA_LABELS[cat]}
                    </option>
                  ))}
                </select>
                {errors.categoria && (
                  <p className="text-[10px] text-destructive">{errors.categoria.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="descricao" className="text-xs">
                Descrição
              </Label>
              <Input
                id="descricao"
                placeholder="Ex: Vidro Incolor 12mm Temperado"
                className="h-8 text-xs"
                {...register("descricao")}
              />
              {errors.descricao && (
                <p className="text-[10px] text-destructive">{errors.descricao.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="fornecedor_id" className="text-xs">
                Fornecedor <span className="text-muted-foreground font-normal">(Opcional)</span>
              </Label>
              <select
                id="fornecedor_id"
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                disabled={isLoadingFornecedores}
                {...register("fornecedor_id")}
              >
                <option value="">Selecione um fornecedor...</option>
                {fornecedores.map((forn) => (
                  <option key={forn.id} value={forn.id}>
                    {forn.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ncm" className="text-xs">
                  NCM <span className="text-muted-foreground font-normal">(8 dígitos)</span>
                </Label>
                <Input
                  id="ncm"
                  placeholder="Ex: 70051000"
                  maxLength={8}
                  className="h-8 text-xs font-mono"
                  {...register("ncm")}
                />
                {errors.ncm && <p className="text-[10px] text-destructive">{errors.ncm.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="cfop" className="text-xs">
                  CFOP <span className="text-muted-foreground font-normal">(Opcional)</span>
                </Label>
                <Input
                  id="cfop"
                  placeholder="5102"
                  className="h-8 text-xs font-mono"
                  {...register("cfop")}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="unidade" className="text-xs">
                  Unidade
                </Label>
                <Input
                  id="unidade"
                  placeholder="Ex: m², und, ML"
                  className="h-8 text-xs"
                  {...register("unidade")}
                />
                {errors.unidade && (
                  <p className="text-[10px] text-destructive">{errors.unidade.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="valor_compra" className="text-xs">
                  Custo (R$)
                </Label>
                <Input
                  id="valor_compra"
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-8 text-xs"
                  {...register("valor_compra", { valueAsNumber: true })}
                />
                {errors.valor_compra && (
                  <p className="text-[10px] text-destructive">{errors.valor_compra.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="margem_lucro" className="text-xs">
                  Margem (Ex: 0.46)
                </Label>
                <Input
                  id="margem_lucro"
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-8 text-xs"
                  {...register("margem_lucro", { valueAsNumber: true })}
                />
                {errors.margem_lucro && (
                  <p className="text-[10px] text-destructive">{errors.margem_lucro.message}</p>
                )}
              </div>
            </div>

            {/* Calculated Preview Panel */}
            <div className="rounded-lg bg-muted/50 border p-3 flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block font-semibold">
                  Preço de Venda Estimado
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Fórmula: Custo × (1 + Margem)
                </span>
              </div>
              <span className="text-base font-bold text-primary font-mono">
                {formatCurrency(calculatedSellingPrice)}
              </span>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Salvando...
                  </>
                ) : (
                  "Salvar Produto"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Kit Form Modal */}
      <KitFormModal open={isKitFormOpen} onOpenChange={setIsKitFormOpen} editingKit={editingKit} />
    </>
  );
}
