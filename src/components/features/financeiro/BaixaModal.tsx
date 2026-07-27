import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePayTitulo, TituloFinanceiro } from "@/hooks/useFinanceData";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

const formSchema = z.object({
  valorPago: z.coerce.number().min(0.01, "Valor inválido"),
  dataPagamento: z.string().min(1, "Obrigatório"),
  contaId: z.string().min(1, "Obrigatório"),
});

type FormValues = z.infer<typeof formSchema>;

export function BaixaModal({
  isOpen,
  onClose,
  titulo
}: {
  isOpen: boolean;
  onClose: () => void;
  titulo: TituloFinanceiro | null;
}) {
  const { mutate, isPending } = usePayTitulo();
  
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  const { data: contas } = useQuery({
    queryKey: ["contas_bancarias"],
    queryFn: async () => {
      const res = await supabase.from("contas_bancarias").select("*").eq("empresa_id", empresaId).eq("ativo", true);
      return res.data || [];
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valorPago: titulo?.valor || 0,
      dataPagamento: new Date().toISOString().split("T")[0],
      contaId: "",
    },
  });

  // Atualiza o valor default se o titulo mudar
  React.useEffect(() => {
    if (titulo) {
      form.setValue("valorPago", titulo.valor);
    }
  }, [titulo, form]);

  const onSubmit = (data: FormValues) => {
    if (!titulo) return;
    
    mutate({
      id: titulo.id,
      ...data,
    }, {
      onSuccess: () => {
        form.reset();
        onClose();
      }
    });
  };

  if (!titulo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Realizar Baixa - {titulo.tipo === "RECEBER" ? "Recebimento" : "Pagamento"}</DialogTitle>
        </DialogHeader>
        <div className="mb-4 text-sm">
          <p><strong>Descrição:</strong> {titulo.descricao}</p>
          <p><strong>Valor Previsto:</strong> {formatCurrency(titulo.valor)}</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valorPago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Pago (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Pagamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta Bancária</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">Selecione...</option>
                      {contas?.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="mr-2">Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Processando..." : "Confirmar Baixa"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
