import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/erp/PageHeader";
import { KpiCard } from "@/components/erp/KpiCard";
import { ErpCard } from "@/components/erp/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientes } from "@/hooks/useClientes";
import {
  isValidDocument,
  maskDocument,
  normalizeDocument,
  type DocumentType,
} from "@/lib/documents/validation";
import { formatCurrency, cn } from "@/lib/utils";
import { maskPhone, isValidPhone, isValidEmail } from "@/lib/formatters/contact";
import { migrateLocalClientesToSupabase } from "@/lib/supabase/migration";
import { usePedidos } from "@/hooks/usePedidos";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/erp/StatusBadge";

const PAGE_SIZE = 8;

const CLIENTE_SEGMENTOS = ["Construtoras", "Residencial", "Arquitetos", "Comercial"] as const;

type ClienteSegmento = (typeof CLIENTE_SEGMENTOS)[number];

type ClienteFormState = {
  id: string | null;
  nome: string;
  tipoDocumento: DocumentType;
  documento: string;
  contato: string;
  telefone: string;
  email: string;
  endereco: string;
  numero_endereco: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  representante: string;
  referencia: string;
  segmento: ClienteSegmento;
  codigo_municipio: string;
  inscricao_estadual: string;
};

const initialFormState = (): ClienteFormState => ({
  id: null,
  nome: "",
  tipoDocumento: "cnpj",
  documento: "",
  contato: "",
  telefone: "",
  email: "",
  endereco: "",
  numero_endereco: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "BA",
  cep: "",
  representante: "",
  referencia: "",
  segmento: "Construtoras",
  codigo_municipio: "",
  inscricao_estadual: "",
});

const formatDate = (value: string | null): string => {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
};

export const Route = createFileRoute("/_app/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — ModulaAPP" },
      { name: "description", content: "Cadastro e gestão de relacionamento com clientes." },
    ],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  const {
    data: clientes = [],
    isLoading,
    createCliente,
    updateCliente,
    deleteCliente,
  } = useClientes();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [segmentoFiltro, setSegmentoFiltro] = useState<ClienteSegmento | "todos">("todos");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<ClienteFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [clienteHistorico, setClienteHistorico] = useState<any>(null);

  const { data: pedidos } = usePedidos();
  const { data: orcamentos } = useOrcamentos();

  const historicoPedidos = useMemo(() => {
    if (!clienteHistorico || !pedidos) return [];
    return pedidos.filter((p) => p.cliente_id === clienteHistorico.id);
  }, [clienteHistorico, pedidos]);

  const historicoOrcamentos = useMemo(() => {
    if (!clienteHistorico || !orcamentos) return [];
    return orcamentos.filter((o) => o.cliente_id === clienteHistorico.id);
  }, [clienteHistorico, orcamentos]);

  const handleViewHistory = (cliente: any) => {
    setClienteHistorico(cliente);
  };

  const filteredClientes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const queryDigits = normalizeDocument(query);
    return clientes.filter((item) => {
      const segmentMatch = segmentoFiltro === "todos" || item.segmento === segmentoFiltro;
      const searchMatch =
        query.length === 0 ||
        (item.nome && item.nome.toLowerCase().includes(query)) ||
        (queryDigits.length > 0 && item.documento && item.documento.includes(queryDigits));
      return segmentMatch && searchMatch;
    });
  }, [clientes, search, segmentoFiltro]);

  const pagedClientes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredClientes.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredClientes]);

  const pageCount = Math.max(1, Math.ceil(filteredClientes.length / PAGE_SIZE));

  const kpis = useMemo(() => {
    const bySegment = clientes.reduce<Record<ClienteSegmento, number>>(
      (acc, current) => ({
        ...acc,
        [current.segmento as ClienteSegmento]: (acc[current.segmento as ClienteSegmento] || 0) + 1,
      }),
      {
        Construtoras: 0,
        Residencial: 0,
        Arquitetos: 0,
        Comercial: 0,
      },
    );

    return {
      total: clientes.length,
      construtoras: bySegment.Construtoras,
      residencial: bySegment.Residencial,
      arquitetos: bySegment.Arquitetos,
    };
  }, [clientes]);

  const resetForm = () => {
    setForm(initialFormState());
    setFormErrors({});
    setIsFormOpen(false);
  };

  const handleEdit = (cliente: any) => {
    setFormErrors({});
    // O hook mapeia snake_case → camelCase, então usamos tipoDocumento (não tipo_documento)
    const tipoDoc = (cliente.tipoDocumento || "cnpj") as DocumentType;
    setForm({
      id: cliente.id,
      nome: cliente.nome,
      tipoDocumento: tipoDoc,
      documento: maskDocument(cliente.documento || "", tipoDoc),
      contato: cliente.contato || "",
      telefone: cliente.telefone || "",
      email: cliente.email || "",
      endereco: cliente.endereco || "",
      numero_endereco: cliente.numero_endereco || "",
      complemento: cliente.complemento || "",
      bairro: cliente.bairro || "",
      cidade: cliente.cidade || "",
      uf: cliente.uf || "BA",
      cep: cliente.cep || "",
      representante: cliente.representante || "",
      referencia: cliente.referencia || "",
      segmento: (cliente.segmento || "Residencial") as ClienteSegmento,
      codigo_municipio: cliente.codigo_municipio?.toString() || "",
      inscricao_estadual: cliente.inscricao_estadual || "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};

    if (!form.nome.trim()) errors.nome = "Nome é obrigatório";
    if (!form.contato.trim()) errors.contato = "Contato é obrigatório";
    if (!form.documento.trim()) errors.documento = "Documento é obrigatório";

    const normalizedDocument = normalizeDocument(form.documento);
    if (form.documento.trim() && !isValidDocument(normalizedDocument, form.tipoDocumento)) {
      errors.documento = form.tipoDocumento === "cpf" ? "CPF inválido." : "CNPJ inválido.";
    }

    if (form.telefone && !isValidPhone(form.telefone)) {
      errors.telefone = "Telefone inválido";
    }

    if (form.email && !isValidEmail(form.email)) {
      errors.email = "E-mail inválido";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Corrija os erros do formulário.");
      return;
    }

    setFormErrors({});

    const payload = {
      nome: form.nome.trim(),
      tipo_documento: form.tipoDocumento,
      documento: normalizedDocument,
      contato: form.contato.trim(),
      telefone: form.telefone.trim(),
      email: form.email.trim(),
      endereco: form.endereco.trim(),
      numero_endereco: form.numero_endereco.trim(),
      complemento: form.complemento.trim(),
      bairro: form.bairro.trim(),
      cidade: form.cidade.trim(),
      uf: form.uf.trim(),
      cep: form.cep.replace(/\D/g, ""),
      representante: form.representante.trim(),
      referencia: form.referencia.trim(),
      segmento: form.segmento,
      codigo_municipio: form.codigo_municipio ? Number(form.codigo_municipio) : null,
      inscricao_estadual: form.inscricao_estadual.trim(),
      ultimo_contato: new Date().toISOString(),
      volume_total: 0,
    };

    if (form.id) {
      await updateCliente({ id: form.id, ...payload });
    } else {
      await createCliente(payload);
    }

    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente remover este cliente?")) {
      await deleteCliente(id);
    }
  };

  const handleMigrate = async () => {
    const result = await migrateLocalClientesToSupabase(queryClient);
    if (result.success) {
      toast.success(result.message);
      // O hook useClientes deve invalidar e recarregar automaticamente se usarmos queryClient.invalidateQueries no migrate
      // Mas para garantir, podemos disparar um reload manual ou o invalidateQueries aqui se tivéssemos o queryClient
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle={`${kpis.total} clientes ativos`}
        actions={
          <div className="flex gap-2">
            {clientes.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                onClick={handleMigrate}
              >
                Importar dados locais
              </Button>
            )}
            <Button
              size="sm"
              className="text-xs"
              onClick={() => {
                setForm(initialFormState());
                setIsFormOpen(true);
              }}
            >
              <Plus className="mr-1 h-3 w-3" /> Novo cliente
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 mb-3.5">
        <KpiCard label="Total ativos" value={String(kpis.total)} />
        <KpiCard label="Construtoras" value={String(kpis.construtoras)} />
        <KpiCard label="Residencial" value={String(kpis.residencial)} />
        <KpiCard label="Arquitetos" value={String(kpis.arquitetos)} />
      </div>

      {isFormOpen ? (
        <ErpCard title={form.id ? "Editar cliente" : "Novo cliente"} className="mb-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Label
                className={cn(
                  "text-[10px]",
                  formErrors.nome ? "text-destructive" : "text-muted-foreground",
                )}
              >
                Nome / Razão social
              </Label>
              <Input
                className={cn("h-8 text-xs", formErrors.nome && "border-destructive")}
                value={form.nome}
                onChange={(event) => {
                  setForm((current) => ({ ...current, nome: event.target.value }));
                  if (formErrors.nome) setFormErrors((curr) => ({ ...curr, nome: "" }));
                }}
              />
              {formErrors.nome && (
                <span className="text-[10px] text-destructive">{formErrors.nome}</span>
              )}
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Tipo de documento</Label>
              <select
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                value={form.tipoDocumento}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    tipoDocumento: event.target.value as DocumentType,
                    documento: "",
                  }));
                  if (formErrors.documento) setFormErrors((curr) => ({ ...curr, documento: "" }));
                }}
              >
                <option value="cnpj">CNPJ</option>
                <option value="cpf">CPF</option>
              </select>
            </div>
            <div>
              <Label
                className={cn(
                  "text-[10px]",
                  formErrors.documento ? "text-destructive" : "text-muted-foreground",
                )}
              >
                Documento
              </Label>
              <Input
                className={cn("h-8 text-xs", formErrors.documento && "border-destructive")}
                value={form.documento}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    documento: maskDocument(event.target.value, current.tipoDocumento),
                  }));
                  if (formErrors.documento) setFormErrors((curr) => ({ ...curr, documento: "" }));
                }}
              />
              {formErrors.documento && (
                <span className="text-[10px] text-destructive">{formErrors.documento}</span>
              )}
            </div>
            <div>
              <Label
                className={cn(
                  "text-[10px]",
                  formErrors.contato ? "text-destructive" : "text-muted-foreground",
                )}
              >
                Pessoa de Contato
              </Label>
              <Input
                className={cn("h-8 text-xs", formErrors.contato && "border-destructive")}
                value={form.contato}
                onChange={(event) => {
                  setForm((current) => ({ ...current, contato: event.target.value }));
                  if (formErrors.contato) setFormErrors((curr) => ({ ...curr, contato: "" }));
                }}
              />
              {formErrors.contato && (
                <span className="text-[10px] text-destructive">{formErrors.contato}</span>
              )}
            </div>
            <div>
              <Label
                className={cn(
                  "text-[10px]",
                  formErrors.telefone ? "text-destructive" : "text-muted-foreground",
                )}
              >
                Telefone
              </Label>
              <Input
                className={cn("h-8 text-xs", formErrors.telefone && "border-destructive")}
                value={form.telefone}
                onChange={(event) => {
                  setForm((current) => ({ ...current, telefone: maskPhone(event.target.value) }));
                  if (formErrors.telefone) setFormErrors((curr) => ({ ...curr, telefone: "" }));
                }}
                maxLength={15}
              />
              {formErrors.telefone && (
                <span className="text-[10px] text-destructive">{formErrors.telefone}</span>
              )}
            </div>
            <div>
              <Label
                className={cn(
                  "text-[10px]",
                  formErrors.email ? "text-destructive" : "text-muted-foreground",
                )}
              >
                E-mail
              </Label>
              <Input
                type="email"
                className={cn("h-8 text-xs", formErrors.email && "border-destructive")}
                value={form.email}
                onChange={(event) => {
                  setForm((current) => ({ ...current, email: event.target.value }));
                  if (formErrors.email) setFormErrors((curr) => ({ ...curr, email: "" }));
                }}
              />
              {formErrors.email && (
                <span className="text-[10px] text-destructive">{formErrors.email}</span>
              )}
            </div>
            <div className="lg:col-span-2">
              <Label className="text-[10px] text-muted-foreground">Logradouro</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Rua / Avenida"
                value={form.endereco}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endereco: event.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Número</Label>
              <Input
                className="h-8 text-xs"
                value={form.numero_endereco}
                onChange={(event) =>
                  setForm((current) => ({ ...current, numero_endereco: event.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Complemento</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Sala, apto, galpão..."
                value={form.complemento}
                onChange={(event) =>
                  setForm((current) => ({ ...current, complemento: event.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Bairro</Label>
              <Input
                className="h-8 text-xs"
                value={form.bairro}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bairro: event.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Cidade</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Ex: Livramento de Nossa Senhora"
                value={form.cidade}
                onChange={(event) =>
                  setForm((current) => ({ ...current, cidade: event.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">UF</Label>
              <Input
                className="h-8 text-xs uppercase"
                maxLength={2}
                value={form.uf}
                onChange={(event) =>
                  setForm((current) => ({ ...current, uf: event.target.value.toUpperCase() }))
                }
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">CEP</Label>
              <Input
                className="h-8 text-xs"
                placeholder="00000-000"
                maxLength={9}
                value={form.cep}
                onChange={(event) =>
                  setForm((current) => ({ ...current, cep: event.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Código IBGE</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Ex: 2919504"
                maxLength={7}
                value={form.codigo_municipio}
                onChange={(event) =>
                  setForm((current) => ({ ...current, codigo_municipio: event.target.value.replace(/\D/g, "") }))
                }
              />
            </div>
            {form.tipoDocumento === "cnpj" && (
              <div>
                <Label className="text-[10px] text-muted-foreground">Inscrição Estadual</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="IE do cliente"
                  value={form.inscricao_estadual}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, inscricao_estadual: event.target.value }))
                  }
                />
              </div>
            )}
            <div>
              <Label className="text-[10px] text-muted-foreground">Representante</Label>
              <Input
                className="h-8 text-xs"
                value={form.representante}
                onChange={(event) =>
                  setForm((current) => ({ ...current, representante: event.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Referência</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Ponto de referência"
                value={form.referencia}
                onChange={(event) =>
                  setForm((current) => ({ ...current, referencia: event.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Segmento</Label>
              <select
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                value={form.segmento}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    segmento: event.target.value as ClienteSegmento,
                  }))
                }
              >
                {CLIENTE_SEGMENTOS.map((segmento) => (
                  <option key={segmento} value={segmento}>
                    {segmento}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="text-xs" onClick={handleSubmit}>
              Salvar cliente
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
              placeholder="Buscar por nome ou CPF/CNPJ"
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
            value={segmentoFiltro}
            onChange={(event) => {
              setSegmentoFiltro(event.target.value as ClienteSegmento | "todos");
              setCurrentPage(1);
            }}
          >
            <option value="todos">Todos os segmentos</option>
            {CLIENTE_SEGMENTOS.map((segmento) => (
              <option key={segmento} value={segmento}>
                {segmento}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                <th className="py-1.5">Nome / Razão</th>
                <th>CPF/CNPJ</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Segmento</th>
                <th>Último contato</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagedClientes.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40"
                >
                  <td className="py-1.5 font-medium">{c.nome}</td>
                  <td>{maskDocument(c.documento, c.tipoDocumento)}</td>
                  <td>{c.telefone || c.contato || "N/A"}</td>
                  <td>{c.email || "N/A"}</td>
                  <td>{c.segmento}</td>
                  <td>{formatDate(c.ultimoContato)}</td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 text-primary"
                        onClick={() => handleViewHistory(c)}
                      >
                        <Search className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => handleEdit(c)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(c.id)}
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
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            Exibindo {pagedClientes.length} de {filteredClientes.length} clientes
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

      {/* ── MODAL HISTÓRICO CLIENTE ────────────────────────────────────────────── */}
      <Dialog open={!!clienteHistorico} onOpenChange={(open) => !open && setClienteHistorico(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico: {clienteHistorico?.nome}</DialogTitle>
          </DialogHeader>

          {clienteHistorico && (
            <div className="space-y-6 mt-2">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-md border border-border/50">
                <div>
                  <span className="font-semibold text-muted-foreground block text-xs">
                    Documento
                  </span>
                  <span>
                    {maskDocument(clienteHistorico.documento, clienteHistorico.tipoDocumento)}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block text-xs">
                    Telefone / Contato
                  </span>
                  <span>{clienteHistorico.telefone || clienteHistorico.contato || "N/A"}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block text-xs">E-mail</span>
                  <span>{clienteHistorico.email || "N/A"}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block text-xs">
                    Segmento
                  </span>
                  <span>{clienteHistorico.segmento}</span>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center justify-between">
                    <span>Orçamentos</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {historicoOrcamentos.length}
                    </span>
                  </h3>
                  <div className="border rounded-md overflow-hidden bg-background">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground border-b border-border">
                        <tr>
                          <th className="p-2.5 text-left font-medium text-xs">Nº</th>
                          <th className="p-2.5 text-left font-medium text-xs">Data</th>
                          <th className="p-2.5 text-right font-medium text-xs">Valor</th>
                          <th className="p-2.5 text-center font-medium text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {historicoOrcamentos.map((orc, i) => (
                          <tr key={orc.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-2.5 font-medium">{orc.numero}</td>
                            <td className="p-2.5 text-xs">{formatDate(orc.created_at)}</td>
                            <td className="p-2.5 text-right font-medium text-primary">
                              {formatCurrency(orc.valor_total)}
                            </td>
                            <td className="p-2.5 text-center">
                              <StatusBadge
                                variant={
                                  orc.status === "Aprovado"
                                    ? "success"
                                    : orc.status === "Rejeitado"
                                      ? "danger"
                                      : "neutral"
                                }
                              >
                                {orc.status}
                              </StatusBadge>
                            </td>
                          </tr>
                        ))}
                        {historicoOrcamentos.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="p-6 text-center text-muted-foreground text-xs"
                            >
                              Nenhum orçamento encontrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center justify-between">
                    <span>Ordens de Serviço (OS)</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {historicoPedidos.length}
                    </span>
                  </h3>
                  <div className="border rounded-md overflow-hidden bg-background">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground border-b border-border">
                        <tr>
                          <th className="p-2.5 text-left font-medium text-xs">OS</th>
                          <th className="p-2.5 text-left font-medium text-xs">Emissão</th>
                          <th className="p-2.5 text-left font-medium text-xs">Previsão</th>
                          <th className="p-2.5 text-center font-medium text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {historicoPedidos.map((ped, i) => (
                          <tr key={ped.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-2.5 font-medium">{ped.numero}</td>
                            <td className="p-2.5 text-xs">{formatDate(ped.created_at)}</td>
                            <td className="p-2.5 text-xs">{formatDate(ped.data_previsao)}</td>
                            <td className="p-2.5 text-center">
                              <StatusBadge
                                variant={
                                  ped.status === "Concluido"
                                    ? "success"
                                    : ped.status === "Em Producao"
                                      ? "warning"
                                      : "neutral"
                                }
                              >
                                {ped.status}
                              </StatusBadge>
                            </td>
                          </tr>
                        ))}
                        {historicoPedidos.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="p-6 text-center text-muted-foreground text-xs"
                            >
                              Nenhuma OS encontrada.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setClienteHistorico(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
