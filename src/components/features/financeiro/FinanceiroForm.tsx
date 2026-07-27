import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateTitulo } from "@/hooks/useFinanceData";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  descricao: z.string().min(3, "Descrição muito curta"),
  valor: z.coerce.number().min(0.01, "Valor inválido"),
  vencimento: z.string().min(1, "Obrigatório"),
  categoria_id: z.string().min(1, "Obrigatório"),
  cliente_id: z.string().optional(),
  fornecedor_id: z.string().optional(),
  ordem_servico_id: z.string().optional(),
  parcela: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function FinanceiroForm({
  isOpen,
  onClose,
  tipo
}: {
  isOpen: boolean;
  onClose: () => void;
  tipo: "RECEBER" | "PAGAR";
}) {
  const { mutate, isPending } = useCreateTitulo();
  
  // Fetch lists for select (Clientes, Fornecedores, OS, Categorias)
  const supabase = getSupabaseBrowserClient();
  const empresaId = getDefaultEmpresaId();

  const { data: categorias } = useQuery({
    queryKey: ["categorias", tipo],
    queryFn: async () => {
      const res = await supabase.from("categorias_financeiras").select("*").eq("empresa_id", empresaId).eq("tipo", tipo === "RECEBER" ? "RECEITA" : "DESPESA");
      return res.data || [];
    }
  });

  const { data: parceiros } = useQuery({
    queryKey: ["parceiros", tipo],
    queryFn: async () => {
      if (tipo === "RECEBER") {
        const res = await supabase.from("clientes").select("id, nome").eq("empresa_id", empresaId);
        return res.data || [];
      } else {
        const res = await supabase.from("fornecedores").select("id, nome").eq("empresa_id", empresaId);
        return res.data || [];
      }
    }
  });

  const { data: ordens } = useQuery({
    queryKey: ["ordens_receber"],
    enabled: tipo === "RECEBER",
    queryFn: async () => {
      const res = await supabase.from("ordens_servico").select("id, numero").eq("empresa_id", empresaId);
      return res.data || [];
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      valor: 0,
      vencimento: new Date().toISOString().split("T")[0],
      categoria_id: "",
      cliente_id: "",
      fornecedor_id: "",
      ordem_servico_id: "",
      parcela: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    mutate({
      ...data,
      tipo,
      cliente_id: data.cliente_id || undefined,
      fornecedor_id: data.fornecedor_id || undefined,
      ordem_servico_id: data.ordem_servico_id || undefined,
      parcela: data.parcela || undefined,
    }, {
      onSuccess: () => {
        form.reset();
        onClose();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tipo === "RECEBER" ? "Nova Receita" : "Nova Despesa"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Pagamento OS 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento</FormLabel>
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
              name="categoria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">Selecione...</option>
                      {categorias?.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={tipo === "RECEBER" ? "cliente_id" : "fornecedor_id"}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tipo === "RECEBER" ? "Cliente" : "Fornecedor"} (Opcional)</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">Selecione...</option>
                      {parceiros?.map((p) => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tipo === "RECEBER" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ordem_servico_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem de Serviço (Opcional)</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Nenhuma</option>
                          {ordens?.map((o) => (
                            <option key={o.id} value={o.id}>{o.numero}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parcela"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcela (Ex: 1/3)</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="mr-2">Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar Lançamento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
