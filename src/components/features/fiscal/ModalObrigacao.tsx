import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegistrarObrigacao, useEditarObrigacao, type ObrigacaoFiscal } from "@/hooks/useFiscalData";
import { CalendarDays, Pencil, Loader2 } from "lucide-react";

const obrigacaoSchema = z.object({
  tipo: z.string().min(1, "Obrigatório"),
  competencia: z.string().regex(/^\d{2}\/\d{4}$/, "Formato MM/AAAA"),
  data_vencimento: z.string().min(1, "Obrigatório"),
  valor: z.coerce.number().min(0.01, "Maior que zero"),
});

type FormValues = z.infer<typeof obrigacaoSchema>;

interface ModalObrigacaoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: ObrigacaoFiscal | null;
}

export function ModalObrigacao({ open, onOpenChange, editData }: ModalObrigacaoProps) {
  const registrarMutation = useRegistrarObrigacao();
  const editarMutation = useEditarObrigacao();
  const isEditing = !!editData;

  const form = useForm<FormValues>({
    resolver: zodResolver(obrigacaoSchema),
    defaultValues: {
      tipo: "DAS",
      competencia: "",
      data_vencimento: "",
      valor: 0,
    },
  });

  useEffect(() => {
    if (editData) {
      form.reset({
        tipo: editData.tipo,
        competencia: editData.competencia,
        data_vencimento: editData.data_vencimento,
        valor: editData.valor,
      });
    } else {
      form.reset({ tipo: "DAS", competencia: "", data_vencimento: "", valor: 0 });
    }
  }, [editData, open]);

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      editarMutation.mutate({ id: editData.id, ...data }, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        }
      });
    } else {
      registrarMutation.mutate(data, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <Pencil className="h-5 w-5 text-primary" /> : <CalendarDays className="h-5 w-5 text-primary" />}
            {isEditing ? "Editar Obrigação Fiscal" : "Nova Obrigação Fiscal"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Altere os dados da guia fiscal." : "Registre uma guia a pagar no mês (DAS, FGTS, etc)."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Guia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DAS">DAS (Simples)</SelectItem>
                        <SelectItem value="FGTS">FGTS</SelectItem>
                        <SelectItem value="INSS">INSS</SelectItem>
                        <SelectItem value="IRPJ">IRPJ</SelectItem>
                        <SelectItem value="CSLL">CSLL</SelectItem>
                        <SelectItem value="OUTROS">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="competencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competência</FormLabel>
                    <FormControl>
                      <Input placeholder="MM/AAAA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={registrarMutation.isPending || editarMutation.isPending}>
                {(registrarMutation.isPending || editarMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Salvar Alterações" : "Registrar Guia"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
