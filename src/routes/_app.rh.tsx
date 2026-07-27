import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/erp/PageHeader";
import { KpiCard } from "@/components/erp/KpiCard";
import { isValidDocument, maskDocument, normalizeDocument } from "@/lib/documents/validation";
import { maskPhone, isValidPhone, isValidEmail, maskCurrency, parseCurrency } from "@/lib/formatters/contact";
import { ErpCard } from "@/components/erp/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useColaboradores, type ColaboradorInsert } from "@/hooks/useColaboradores";
import { calcularFolha, alertaFerias } from "@/lib/rh/rh";

export const Route = createFileRoute("/_app/rh")({
  head: () => ({
    meta: [
      { title: "RH / Equipe — Vidraçaria Ornamental" },
      { name: "description", content: "Cadastro de colaboradores, ponto, folha e férias." },
    ],
  }),
  component: RhPage,
});

type ColaboradorFormState = {
  id: string | null;
  nome: string;
  cpf: string;
  cargo: string;
  salario: string;
  status: "Ativo" | "Inativo" | "Afastado";
  dataAdmissao: string;
  dataLimiteFerias: string;
  telefone: string;
  email: string;
};

const initialFormState = (): ColaboradorFormState => ({
  id: null,
  nome: "",
  cpf: "",
  cargo: "",
  salario: "",
  status: "Ativo",
  dataAdmissao: new Date().toISOString().split("T")[0],
  dataLimiteFerias: "",
  telefone: "",
  email: "",
});

type FormErrors = {
  cpf?: string;
  telefone?: string;
  email?: string;
  salario?: string;
};

function RhPage() {
  const { 
    data: colaboradores = [], 
    isLoading, 
    createColaborador, 
    updateColaborador, 
    deleteColaborador 
  } = useColaboradores();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<ColaboradorFormState>(initialFormState());
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Calcular KPIs dinâmicos
  const kpis = useMemo(() => {
    const colaboradoresFormatados = colaboradores.map(c => ({
      id: c.id,
      nome: c.nome,
      cargo: c.cargo,
      salario: c.salario,
      status: c.status,
      dataAdmissao: c.dataAdmissao,
      dataLimiteFerias: c.dataLimiteFerias || undefined,
    }));

    const totalFolha = calcularFolha(colaboradoresFormatados);
    const alertasFerias = alertaFerias(colaboradoresFormatados);
    const totalAtivos = colaboradores.filter(c => c.status === "Ativo").length;
    const totalHorasExtras = colaboradores.reduce((sum, c) => sum + (c.horasExtrasMes || 0), 0);

    return {
      totalColaboradores: totalAtivos,
      totalFolha,
      feriasProximas: alertasFerias.length,
      horasExtras: totalHorasExtras,
    };
  }, [colaboradores]);

  const resetForm = () => {
    setForm(initialFormState());
    setFormErrors({});
    setIsFormOpen(false);
  };

  const handleEdit = (colaborador: any) => {
    setForm({
      id: colaborador.id,
      nome: colaborador.nome,
      cpf: colaborador.cpf ? maskDocument(colaborador.cpf, "cpf") : "",
      cargo: colaborador.cargo,
      salario: colaborador.salario ? maskCurrency(String(Math.round(colaborador.salario * 100))) : "",
      status: colaborador.status,
      dataAdmissao: colaborador.dataAdmissao,
      dataLimiteFerias: colaborador.dataLimiteFerias || "",
      telefone: colaborador.telefone ? maskPhone(colaborador.telefone) : "",
      email: colaborador.email || "",
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    // Validar CPF (opcional, mas se preenchido deve ser válido)
    if (form.cpf.trim()) {
      const normalizedCpf = normalizeDocument(form.cpf);
      if (!isValidDocument(normalizedCpf, "cpf")) {
        errors.cpf = "CPF inválido. Verifique os dígitos.";
        isValid = false;
      }
    }

    // Validar telefone (opcional, mas se preenchido deve ser válido)
    if (!isValidPhone(form.telefone)) {
      errors.telefone = "Telefone inválido. Use (00) 00000-0000.";
      isValid = false;
    }

    // Validar e-mail (opcional, mas se preenchido deve ser válido)
    if (!isValidEmail(form.email)) {
      errors.email = "E-mail inválido.";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.cargo.trim() || !form.dataAdmissao) {
      toast.error("Nome, cargo e data de admissão são obrigatórios.");
      return;
    }

    if (!validateForm()) {
      toast.error("Corrija os campos destacados antes de salvar.");
      return;
    }

    const salario = parseCurrency(form.salario);

    try {
      const normalizedCpf = form.cpf.trim() ? normalizeDocument(form.cpf) : null;
      const normalizedTelefone = form.telefone.trim() ? form.telefone.replace(/\D/g, "") : null;

      const dados = {
        nome: form.nome.trim(),
        cpf: normalizedCpf,
        cargo: form.cargo.trim(),
        salario,
        status: form.status,
        data_admissao: form.dataAdmissao,
        data_limite_ferias: form.dataLimiteFerias || null,
        horas_extras_mes: 0,
        telefone: normalizedTelefone,
        email: form.email.trim() || null,
      };

      if (form.id) {
        await updateColaborador({
          id: form.id,
          ...dados,
        });
      } else {
        await createColaborador(dados);
      }

      resetForm();
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja desativar este colaborador?")) {
      try {
        await deleteColaborador(id);
      } catch (error: any) {
        toast.error(`Erro ao desativar: ${error.message}`);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  return (
    <>
      <PageHeader
        title="RH / Equipe"
        subtitle={`${colaboradores.length} colaboradores · folha ${formatCurrency(kpis.totalFolha)} · ${kpis.feriasProximas} férias próximas`}
        actions={
          <Button size="sm" className="text-xs" onClick={() => setIsFormOpen(true)}>
            <UserPlus className="mr-1 h-3 w-3" /> Novo colaborador
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 mb-3.5">
        <KpiCard label="Colaboradores" value={String(kpis.totalColaboradores)} />
        <KpiCard label="Folha (mês)" value={formatCurrency(kpis.totalFolha)} />
        <KpiCard label="Férias próximas" value={String(kpis.feriasProximas)} hintTone="warning" hint="≤ 90 dias" />
        <KpiCard label="Horas extras" value={`${kpis.horasExtras}h`} hint="Mês corrente" />
      </div>

      <ErpCard>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                  <th className="py-1.5">Nome</th>
                  <th>Cargo</th>
                  <th>Admissão</th>
                  <th>Salário</th>
                  <th>Status</th>
                  <th>Próx. férias</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {colaboradores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground text-[11px]">
                      Nenhum colaborador cadastrado. Clique em "Novo colaborador" para começar.
                    </td>
                  </tr>
                ) : (
                  colaboradores.map((c) => (
                    <tr key={c.id} className="border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40">
                      <td className="py-1.5 font-medium">{c.nome}</td>
                      <td>{c.cargo}</td>
                      <td>{formatDate(c.dataAdmissao)}</td>
                      <td>{formatCurrency(c.salario)}</td>
                      <td>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                          c.status === "Ativo" ? "bg-green-100 text-green-800" :
                          c.status === "Afastado" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td>{formatDate(c.dataLimiteFerias || "")}</td>
                      <td className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEdit(c)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(c.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </ErpCard>

      {/* Formulário de Colaborador */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Editar Colaborador" : "Novo Colaborador"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label>Nome completo *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>

            <div>
              <Label>CPF</Label>
              <Input
                value={form.cpf}
                onChange={(e) => {
                  const masked = maskDocument(e.target.value, "cpf");
                  setForm({ ...form, cpf: masked });
                  if (formErrors.cpf) setFormErrors((prev) => ({ ...prev, cpf: undefined }));
                }}
                placeholder="000.000.000-00"
                maxLength={14}
                className={formErrors.cpf ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {formErrors.cpf && (
                <span className="text-[10px] text-destructive mt-0.5 block">{formErrors.cpf}</span>
              )}
            </div>

            <div>
              <Label>Cargo *</Label>
              <Input
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                placeholder="Ex: Instalador, Vendedor..."
              />
            </div>

            <div>
              <Label>Salário (R$)</Label>
              <Input
                value={form.salario}
                onChange={(e) => {
                  const masked = maskCurrency(e.target.value);
                  setForm({ ...form, salario: masked });
                }}
                placeholder="0,00"
                type="text"
                inputMode="numeric"
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value: any) => setForm({ ...form, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Afastado">Afastado</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data de Admissão *</Label>
              <Input
                type="date"
                value={form.dataAdmissao}
                onChange={(e) => setForm({ ...form, dataAdmissao: e.target.value })}
              />
            </div>

            <div>
              <Label>Limite de Férias</Label>
              <Input
                type="date"
                value={form.dataLimiteFerias}
                onChange={(e) => setForm({ ...form, dataLimiteFerias: e.target.value })}
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input
                value={form.telefone}
                onChange={(e) => {
                  const masked = maskPhone(e.target.value);
                  setForm({ ...form, telefone: masked });
                  if (formErrors.telefone) setFormErrors((prev) => ({ ...prev, telefone: undefined }));
                }}
                placeholder="(00) 00000-0000"
                maxLength={15}
                inputMode="tel"
                className={formErrors.telefone ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {formErrors.telefone && (
                <span className="text-[10px] text-destructive mt-0.5 block">{formErrors.telefone}</span>
              )}
            </div>

            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="email@exemplo.com"
                className={formErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {formErrors.email && (
                <span className="text-[10px] text-destructive mt-0.5 block">{formErrors.email}</span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {form.id ? "Salvar alterações" : "Adicionar colaborador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
