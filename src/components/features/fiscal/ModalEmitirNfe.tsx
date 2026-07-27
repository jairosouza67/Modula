import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useOSDisponiveisNfe, useEmitirNfe } from "@/hooks/useFiscalData";
import { FileCheck, Loader2, AlertCircle } from "lucide-react";

const FORMAS_PAGAMENTO = [
  { value: "dinheiro", label: "Dinheiro (01)" },
  { value: "pix", label: "PIX (17)" },
  { value: "cartao_debito", label: "Cartão de Débito (04)" },
  { value: "cartao_credito", label: "Cartão de Crédito (03)" },
  { value: "boleto", label: "Boleto (15)" },
  { value: "transferencia", label: "Transferência (03)" },
] as const;

const MODALIDADES_FRETE = [
  { value: "0", label: "0 — Por conta do emitente" },
  { value: "1", label: "1 — Por conta do destinatário" },
  { value: "2", label: "2 — Por conta de terceiros" },
  { value: "3", label: "3 — Próprio (remetente)" },
  { value: "4", label: "4 — Próprio (destinatário)" },
  { value: "9", label: "9 — Sem frete" },
] as const;

type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number]["value"];
type ModalidadeFrete = (typeof MODALIDADES_FRETE)[number]["value"];

const emitirNfeSchema = z.object({
  os_id: z.string().min(1, "Selecione uma Ordem de Serviço"),
  valor_manual: z.coerce.number().min(0, "Valor não pode ser negativo").optional(),
  impostos_manual: z.coerce.number().min(0, "Impostos não pode ser negativo").optional(),
  cliente_email: z.string().email("E-mail inválido").or(z.literal("")).optional(),
  descricao_itens: z.string().max(500, "Máximo de 500 caracteres").optional(),
  forma_pagamento: z.string().optional(),
  modalidade_frete: z.string().optional(),
});

type FormValues = z.infer<typeof emitirNfeSchema>;

interface ModalEmitirNfeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModalEmitirNfe({ open, onOpenChange }: ModalEmitirNfeProps) {
  const { data: ordensServico, isLoading: isLoadingOs } = useOSDisponiveisNfe();
  const emitirMutation = useEmitirNfe();

  const form = useForm<FormValues>({
    resolver: zodResolver(emitirNfeSchema),
    defaultValues: {
      os_id: "",
      valor_manual: undefined,
      impostos_manual: undefined,
      cliente_email: "",
      descricao_itens: "",
      forma_pagamento: "dinheiro",
      modalidade_frete: "9",
    },
  });

  const selectedOsId = form.watch("os_id");

  const selectedOs = useMemo(() => {
    return ordensServico?.find((os) => os.id === selectedOsId);
  }, [ordensServico, selectedOsId]);

  const valorTotal = useMemo(() => {
    if (!selectedOs) return 0;
    // Itens da OS vêm da calculadora vidraceira (OrcamentoItemV2):
    //   { valorTotal, precoUnitario, quantidade, m2, ... }
    // Também suporta itens de compras: { preco_unitario, quantidade }
    // E itens genéricos: { valor, quantidade }
    const items = Array.isArray(selectedOs.itens) ? selectedOs.itens : [];
    return items.reduce((acc: number, item: any) => {
      // 1. valorTotal direto da calculadora vidraceira
      if (typeof item.valorTotal === "number" && item.valorTotal > 0) {
        return acc + item.valorTotal;
      }
      // 2. precoUnitario * quantidade (calculadora)
      if (typeof item.precoUnitario === "number" && item.precoUnitario > 0) {
        return acc + item.precoUnitario * (item.quantidade || 1);
      }
      // 3. preco_unitario * quantidade (compras)
      if (typeof item.preco_unitario === "number" && item.preco_unitario > 0) {
        return acc + item.preco_unitario * (item.quantidade || 1);
      }
      // 4. valor * quantidade (OsItem genérico)
      if (typeof item.valor === "number" && item.valor > 0) {
        return acc + item.valor * (item.quantidade || 1);
      }
      return acc;
    }, 0);
  }, [selectedOs]);

  const valorImpostos = useMemo(() => {
    // Usa valor manual se preenchido, senão calcula Simples Nacional 6%
    const valorManualImpostos = form.watch("impostos_manual");
    if (typeof valorManualImpostos === "number" && valorManualImpostos > 0) {
      return valorManualImpostos;
    }
    const valorBase =
      form.watch("valor_manual") && form.watch("valor_manual")! > 0
        ? form.watch("valor_manual")!
        : valorTotal;
    return valorBase * 0.06;
  }, [valorTotal, form.watch("valor_manual"), form.watch("impostos_manual")]);

  const onSubmit = (data: FormValues) => {
    if (!selectedOs) return;

    const finalValor = data.valor_manual && data.valor_manual > 0 ? data.valor_manual : valorTotal;
    const finalImpostos =
      data.impostos_manual && data.impostos_manual > 0 ? data.impostos_manual : valorImpostos;

    emitirMutation.mutate(
      {
        os_id: data.os_id,
        cliente_nome: selectedOs.clientes?.nome || "Cliente Padrão",
        cliente_documento: selectedOs.clientes?.documento || "000.000.000-00",
        cliente_email: data.cliente_email || undefined,
        valor_total: finalValor,
        valor_impostos: finalImpostos,
        itens: selectedOs.itens || [],
        descricao_itens: data.descricao_itens || undefined,
        forma_pagamento: data.forma_pagamento || "dinheiro",
        modalidade_frete: data.modalidade_frete || "9",
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Emitir NF-e de Saída
          </DialogTitle>
          <DialogDescription>
            Selecione uma OS concluída para gerar a Nota Fiscal. O cálculo do Simples Nacional (6%)
            será aplicado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="os_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem de Serviço (Concluída / Em Instalação)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={isLoadingOs ? "Carregando..." : "Selecione uma OS"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!isLoadingOs && (!ordensServico || ordensServico.length === 0) && (
                        <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                          <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
                          <div>
                            <p className="font-medium text-foreground">
                              Nenhuma OS disponível para NF-e
                            </p>
                            <p className="mt-0.5">
                              Apenas OSs com status <strong>Concluído</strong> ou{" "}
                              <strong>Instalação</strong> aparecem aqui.
                            </p>
                            <p className="mt-0.5">
                              Vá em <strong>Pedidos/OS</strong> e atualize o status da OS.
                            </p>
                          </div>
                        </div>
                      )}
                      {ordensServico?.map((os) => (
                        <SelectItem key={os.id} value={os.id}>
                          OS #{os.numero} — {os.clientes?.nome || "S/ Cliente"} ({os.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedOs && (
              <div className="rounded-md bg-muted/50 p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">
                    {selectedOs.clientes?.nome || "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Itens na OS:</span>
                  <span className="font-medium">
                    {Array.isArray(selectedOs.itens) ? selectedOs.itens.length : 0} item(s)
                  </span>
                </div>

                {/* Campos editáveis de valor */}
                <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-3 mt-2">
                  <FormField
                    control={form.control}
                    name="valor_manual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Valor Total (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={valorTotal.toFixed(2)}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="impostos_manual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Impostos (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={valorImpostos.toFixed(2)}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Deixe em branco para usar os valores calculados automaticamente (Simples Nacional
                  6%).
                </p>

                {/* Forma de pagamento */}
                <FormField
                  control={form.control}
                  name="forma_pagamento"
                  render={({ field }) => (
                    <FormItem className="border-t border-border/50 pt-3">
                      <FormLabel className="text-xs">Forma de pagamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FORMAS_PAGAMENTO.map((fp) => (
                            <SelectItem key={fp.value} value={fp.value} className="text-xs">
                              {fp.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Modalidade de frete */}
                <FormField
                  control={form.control}
                  name="modalidade_frete"
                  render={({ field }) => (
                    <FormItem className="border-t border-border/50 pt-3">
                      <FormLabel className="text-xs">Modalidade de frete</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MODALIDADES_FRETE.map((mf) => (
                            <SelectItem key={mf.value} value={mf.value} className="text-xs">
                              {mf.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo de e-mail */}
                <FormField
                  control={form.control}
                  name="cliente_email"
                  render={({ field }) => (
                    <FormItem className="border-t border-border/50 pt-3">
                      <FormLabel className="text-xs">
                        E-mail do cliente (para envio da NF-e)
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="cliente@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao_itens"
                  render={({ field }) => (
                    <FormItem className="border-t border-border/50 pt-3">
                      <FormLabel className="text-xs">
                        Descrição dos itens na NF-e (opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Vidros temperados e instalação conforme OS"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground">
                        Se preenchido, substitui a descrição automática dos itens da OS no
                        PDF/Visualização.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {valorTotal === 0 &&
                  Array.isArray(selectedOs.itens) &&
                  selectedOs.itens.length > 0 && (
                    <p className="text-[10px] text-destructive mt-1">
                      ⚠️ Os itens existem mas nenhum valor foi encontrado. Você pode informar o
                      valor manualmente acima.
                    </p>
                  )}
                {valorTotal === 0 &&
                  (!selectedOs.itens ||
                    (Array.isArray(selectedOs.itens) && selectedOs.itens.length === 0)) && (
                    <p className="text-[10px] text-destructive mt-1">
                      ⚠️ Esta OS não possui itens. Informe o valor manualmente ou adicione itens no
                      orçamento.
                    </p>
                  )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={emitirMutation.isPending || !selectedOsId}>
                {emitirMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Emissão
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
