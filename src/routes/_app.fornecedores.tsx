import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/erp/PageHeader";
import { KpiCard } from "@/components/erp/KpiCard";
import { ErpCard } from "@/components/erp/Card";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidDocument, maskDocument, normalizeDocument } from "@/lib/documents/validation";
import { formatCurrency, cn } from "@/lib/utils";
import { maskPhone, isValidPhone } from "@/lib/formatters/contact";
import {
  FORNECEDOR_CATEGORIAS,
  listFornecedores,
  softDeleteFornecedor,
  upsertFornecedor,
  type FornecedorCategoria,
  type FornecedorRecord,
} from "@/lib/partners/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const MOCK_PRODUTOS: Record<string, Array<{ nome: string; preco: number; unidade: string }>> = {
  "Chapas temperadas": [
    { nome: "Vidro Temperado Incolor 8mm", preco: 75.5, unidade: "m²" },
    { nome: "Vidro Temperado Verde 8mm", preco: 85.0, unidade: "m²" },
    { nome: "Vidro Temperado Fume 10mm", preco: 110.0, unidade: "m²" },
  ],
  "Perfis aluminio": [
    { nome: "Perfil U Alumínio Fosco", preco: 15.0, unidade: "m" },
    { nome: "Perfil H Alumínio Branco", preco: 22.5, unidade: "m" },
  ],
  "Ferragens box/janela": [
    { nome: "Kit Box Padrão Incolor", preco: 120.0, unidade: "kit" },
    { nome: "Dobradiça Vidro/Vidro", preco: 45.0, unidade: "un" },
  ],
  "Espelhos lapidados": [
    { nome: "Espelho Prata 4mm", preco: 130.0, unidade: "m²" },
  ],
  "Consumiveis": [
    { nome: "Silicone Incolor", preco: 18.5, unidade: "un" },
    { nome: "Fita Dupla Face", preco: 35.0, unidade: "rolo" },
  ]
};

const PAGE_SIZE = 8;

type FornecedorFormState = {
  id: string | null;
  nome: string;
  cnpj: string;
  contato: string;
  categoria: FornecedorCategoria;
  dadosFiscais: string;
  dadosBancarios: string;
  aPagar: string;
  prazoEntrega: string;
};

const initialFormState = (): FornecedorFormState => ({
  id: null,
  nome: "",
  cnpj: "",
  contato: "",
  categoria: "Chapas temperadas",
  dadosFiscais: "",
  dadosBancarios: "",
  aPagar: "",
  prazoEntrega: "0",
});



export const Route = createFileRoute("/_app/fornecedores")({
  head: () => ({
    meta: [
      { title: "Fornecedores — Vidraçaria Ornamental" },
      { name: "description", content: "Gestão de fornecedores de chapas, ferragens, perfis e consumíveis." },
    ],
  }),
  component: FornecedoresPage,
});

function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<FornecedorRecord[]>([]);
  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<FornecedorCategoria | "todos">("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FornecedorFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fornecedorDetalhes, setFornecedorDetalhes] = useState<FornecedorRecord | null>(null);

  useEffect(() => {
    setFornecedores(listFornecedores());
  }, []);

  const filteredFornecedores = useMemo(() => {
    const query = search.trim().toLowerCase();
    const queryDigits = normalizeDocument(query);
    return fornecedores.filter((item) => {
      const categoryMatch = categoriaFiltro === "todos" || item.categoria === categoriaFiltro;
      const searchMatch =
        query.length === 0 ||
        (item.nome && item.nome.toLowerCase().includes(query)) ||
        (queryDigits.length > 0 && item.cnpj && item.cnpj.includes(queryDigits));
      return categoryMatch && searchMatch;
    });
  }, [categoriaFiltro, fornecedores, search]);

  const pagedFornecedores = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredFornecedores.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredFornecedores]);

  const pageCount = Math.max(1, Math.ceil(filteredFornecedores.length / PAGE_SIZE));

  const kpis = useMemo(() => {
    const totalAPagar = fornecedores.reduce((sum, item) => sum + item.aPagar, 0);

    return {
      ativos: fornecedores.length,
      totalAPagar,
    };
  }, [fornecedores]);

  const resetForm = () => {
    setForm(initialFormState());
    setFormErrors({});
    setIsFormOpen(false);
  };

  const handleEdit = (fornecedor: FornecedorRecord) => {
    setForm({
      id: fornecedor.id,
      nome: fornecedor.nome,
      cnpj: maskDocument(fornecedor.cnpj, "cnpj"),
      contato: fornecedor.contato ? maskPhone(fornecedor.contato) : "",
      categoria: fornecedor.categoria,
      dadosFiscais: fornecedor.dadosFiscais,
      dadosBancarios: fornecedor.dadosBancarios,
      aPagar: String(fornecedor.aPagar),
      prazoEntrega: String(fornecedor.prazoEntrega ?? 0),
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};

    if (!form.nome.trim()) errors.nome = "Nome é obrigatório";
    if (!form.cnpj.trim()) errors.cnpj = "CNPJ é obrigatório";
    if (!form.categoria) errors.categoria = "Categoria é obrigatória";

    const normalizedCnpj = normalizeDocument(form.cnpj);
    if (form.cnpj.trim() && !isValidDocument(normalizedCnpj, "cnpj")) {
      errors.cnpj = "CNPJ inválido";
    }

    if (form.contato && !isValidPhone(form.contato)) {
      errors.contato = "Telefone inválido";
    }

    const parsedAPagar = Number(form.aPagar.replace(",", "."));
    if (!Number.isFinite(parsedAPagar) || parsedAPagar < 0) {
      errors.aPagar = "Valor inválido";
    }

    const parsedPrazo = Number(form.prazoEntrega);
    if (!Number.isFinite(parsedPrazo) || parsedPrazo < 0) {
      errors.prazoEntrega = "Prazo inválido";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Corrija os erros do formulário.");
      return;
    }

    setFormErrors({});

    const nextFornecedores = upsertFornecedor({
      id: form.id ?? undefined,
      nome: form.nome.trim(),
      cnpj: normalizedCnpj,
      contato: form.contato.trim(),
      categoria: form.categoria,
      dadosFiscais: form.dadosFiscais.trim(),
      dadosBancarios: form.dadosBancarios.trim(),
      aPagar: parsedAPagar,
      prazoEntrega: parsedPrazo,
    });

    setFornecedores(nextFornecedores.filter((item) => item.deletedAt === null));
    toast.success(form.id ? "Fornecedor atualizado." : "Fornecedor criado.");
    resetForm();
  };

  const handleDelete = (id: string) => {
    const nextFornecedores = softDeleteFornecedor(id);
    setFornecedores(nextFornecedores.filter((item) => item.deletedAt === null));
    toast.success("Fornecedor removido da listagem.");
  };

  return (
    <>
      <PageHeader
        title="Fornecedores"
        subtitle={`${kpis.ativos} ativos`}
        actions={
          <Button
            size="sm"
            className="text-xs"
            onClick={() => {
              setForm(initialFormState());
              setIsFormOpen(true);
            }}
          >
            <Plus className="mr-1 h-3 w-3" /> Novo fornecedor
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 mb-3.5">
        <KpiCard label="Ativos" value={String(kpis.ativos)} />
        <KpiCard label="A pagar total" value={formatCurrency(kpis.totalAPagar)} />
        <KpiCard label="Categorias ativas" value={String(new Set(fornecedores.map((item) => item.categoria)).size)} />
      </div>

      {isFormOpen ? (
        <ErpCard title={form.id ? "Editar fornecedor" : "Novo fornecedor"} className="mb-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Label className={cn("text-[10px]", formErrors.nome ? "text-destructive" : "text-muted-foreground")}>Nome</Label>
              <Input
                className={cn("h-8 text-xs", formErrors.nome && "border-destructive")}
                value={form.nome}
                onChange={(event) => {
                  setForm((current) => ({ ...current, nome: event.target.value }));
                  if (formErrors.nome) setFormErrors(curr => ({ ...curr, nome: "" }));
                }}
              />
              {formErrors.nome && <span className="text-[10px] text-destructive">{formErrors.nome}</span>}
            </div>
            <div>
              <Label className={cn("text-[10px]", formErrors.cnpj ? "text-destructive" : "text-muted-foreground")}>CNPJ</Label>
              <Input
                className={cn("h-8 text-xs", formErrors.cnpj && "border-destructive")}
                value={form.cnpj}
                onChange={(event) => {
                  setForm((current) => ({ ...current, cnpj: maskDocument(event.target.value, "cnpj") }));
                  if (formErrors.cnpj) setFormErrors(curr => ({ ...curr, cnpj: "" }));
                }}
              />
              {formErrors.cnpj && <span className="text-[10px] text-destructive">{formErrors.cnpj}</span>}
            </div>
            <div>
              <Label className={cn("text-[10px]", formErrors.contato ? "text-destructive" : "text-muted-foreground")}>Contato (Telefone)</Label>
              <Input
                className={cn("h-8 text-xs", formErrors.contato && "border-destructive")}
                value={form.contato}
                onChange={(event) => {
                  setForm((current) => ({ ...current, contato: maskPhone(event.target.value) }));
                  if (formErrors.contato) setFormErrors(curr => ({ ...curr, contato: "" }));
                }}
                maxLength={15}
              />
              {formErrors.contato && <span className="text-[10px] text-destructive">{formErrors.contato}</span>}
            </div>
            <div>
              <Label className={cn("text-[10px]", formErrors.categoria ? "text-destructive" : "text-muted-foreground")}>Categoria</Label>
              <select
                className={cn("h-8 w-full rounded-md border bg-background px-2 text-xs", formErrors.categoria ? "border-destructive" : "border-input")}
                value={form.categoria}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    categoria: event.target.value as FornecedorCategoria,
                  }));
                  if (formErrors.categoria) setFormErrors(curr => ({ ...curr, categoria: "" }));
                }}
              >
                {FORNECEDOR_CATEGORIAS.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
              {formErrors.categoria && <span className="text-[10px] text-destructive">{formErrors.categoria}</span>}
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Dados fiscais</Label>
              <Input
                className="h-8 text-xs"
                value={form.dadosFiscais}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dadosFiscais: event.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Dados bancários</Label>
              <Input
                className="h-8 text-xs"
                value={form.dadosBancarios}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dadosBancarios: event.target.value }))
                }
              />
            </div>
            <div>
              <Label className={cn("text-[10px]", formErrors.aPagar ? "text-destructive" : "text-muted-foreground")}>A pagar (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                className={cn("h-8 text-xs", formErrors.aPagar && "border-destructive")}
                value={form.aPagar}
                onChange={(event) => {
                  setForm((current) => ({ ...current, aPagar: event.target.value }));
                  if (formErrors.aPagar) setFormErrors(curr => ({ ...curr, aPagar: "" }));
                }}
              />
              {formErrors.aPagar && <span className="text-[10px] text-destructive">{formErrors.aPagar}</span>}
            </div>
            <div>
              <Label className={cn("text-[10px]", formErrors.prazoEntrega ? "text-destructive" : "text-muted-foreground")}>Prazo Entrega (dias)</Label>
              <Input
                type="number"
                min={0}
                className={cn("h-8 text-xs", formErrors.prazoEntrega && "border-destructive")}
                value={form.prazoEntrega}
                onChange={(event) => {
                  setForm((current) => ({ ...current, prazoEntrega: event.target.value }));
                  if (formErrors.prazoEntrega) setFormErrors(curr => ({ ...curr, prazoEntrega: "" }));
                }}
              />
              {formErrors.prazoEntrega && <span className="text-[10px] text-destructive">{formErrors.prazoEntrega}</span>}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="text-xs" onClick={handleSubmit}>
              Salvar fornecedor
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={resetForm}>
              Cancelar
            </Button>
          </div>
        </ErpCard>
      ) : null}

      <ErpCard>
        <div className="mb-2 flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CNPJ"
              className="h-8 pl-7 text-xs"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={categoriaFiltro}
            onChange={(event) => {
              setCategoriaFiltro(event.target.value as FornecedorCategoria | "todos");
              setCurrentPage(1);
            }}
          >
            <option value="todos">Todas as categorias</option>
            {FORNECEDOR_CATEGORIAS.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                <th className="py-1.5">Nome</th>
                <th>CNPJ</th>
                <th>Categoria</th>
                <th>Contato</th>
                <th>Prazo (dias)</th>
                <th>A pagar</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagedFornecedores.map((f) => {
                return (
                  <tr key={f.id} className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40">
                  <td className="py-1.5 font-medium">{f.nome}</td>
                    <td>{maskDocument(f.cnpj, "cnpj")}</td>
                  <td>{f.categoria}</td>
                    <td>{f.contato}</td>
                    <td>{f.prazoEntrega ?? 0}</td>
                    <td>{formatCurrency(f.aPagar)}</td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <Button size="icon" variant="outline" className="h-7 w-7 text-primary" onClick={() => setFornecedorDetalhes(f)}>
                          <Search className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleEdit(f)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(f.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            Exibindo {pagedFornecedores.length} de {filteredFornecedores.length} fornecedores
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Anterior
            </Button>
            <span>
              Página {currentPage} de {pageCount}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              disabled={currentPage >= pageCount}
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      </ErpCard>

      {/* ── MODAL DETALHES FORNECEDOR ────────────────────────────────────────────── */}
      <Dialog open={!!fornecedorDetalhes} onOpenChange={(open) => !open && setFornecedorDetalhes(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes: {fornecedorDetalhes?.nome}</DialogTitle>
          </DialogHeader>
          
          {fornecedorDetalhes && (
            <div className="space-y-6 mt-2">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-md border border-border/50">
                <div>
                  <span className="font-semibold text-muted-foreground block text-xs">CNPJ</span> 
                  <span>{maskDocument(fornecedorDetalhes.cnpj, "cnpj")}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block text-xs">Telefone / Contato</span> 
                  <span>{fornecedorDetalhes.contato || "N/A"}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block text-xs">Prazo de Entrega</span> 
                  <span>{fornecedorDetalhes.prazoEntrega ?? 0} dias</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block text-xs">Categoria</span> 
                  <span>{fornecedorDetalhes.categoria}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center justify-between">
                  <span>Listagem de Produtos</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {MOCK_PRODUTOS[fornecedorDetalhes.categoria]?.length || 0}
                  </span>
                </h3>
                <div className="border rounded-md overflow-hidden bg-background">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-muted-foreground border-b border-border">
                      <tr>
                        <th className="p-2.5 text-left font-medium text-xs">Produto</th>
                        <th className="p-2.5 text-right font-medium text-xs">Preço</th>
                        <th className="p-2.5 text-center font-medium text-xs">Unidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {(MOCK_PRODUTOS[fornecedorDetalhes.categoria] || []).map((prod, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="p-2.5 font-medium">{prod.nome}</td>
                          <td className="p-2.5 text-right font-medium text-primary">{formatCurrency(prod.preco)}</td>
                          <td className="p-2.5 text-center text-muted-foreground">{prod.unidade}</td>
                        </tr>
                      ))}
                      {(!MOCK_PRODUTOS[fornecedorDetalhes.categoria] || MOCK_PRODUTOS[fornecedorDetalhes.categoria].length === 0) && (
                        <tr>
                          <td colSpan={3} className="p-6 text-center text-muted-foreground text-xs">
                            Nenhum produto cadastrado para este fornecedor.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setFornecedorDetalhes(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
