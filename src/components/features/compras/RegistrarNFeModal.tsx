import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { usePedidosCompra } from "@/hooks/compras/usePedidosCompra";
import { useRegistrarNFe } from "@/hooks/compras/useMutationsNFe";
import { formatCurrency } from "@/lib/utils";

const nfeSchema = z.object({
  chave_acesso: z.string().length(44, "Chave de acesso deve ter 44 dígitos"),
  valor_total: z.coerce.number().positive("Valor deve ser maior que zero"),
  fornecedor_nome: z.string().min(1, "Nome do fornecedor é obrigatório"),
  numero: z.string().min(1, "Número da NF é obrigatório"),
  serie: z.string().min(1, "Série é obrigatória"),
  data_emissao: z.string().min(10, "Data inválida"),
  pedido_compra_id: z.string().optional(),
});

type NFeFormData = z.infer<typeof nfeSchema>;

export function RegistrarNFeModal() {
  const [open, setOpen] = useState(false);
  const { data: pedidos } = usePedidosCompra();
  const { mutate: registrarNFe, isPending } = useRegistrarNFe();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<NFeFormData>({
    resolver: zodResolver(nfeSchema),
    defaultValues: {
      data_emissao: new Date().toISOString().split("T")[0],
      serie: "1",
    }
  });

  const onSubmit = (data: NFeFormData) => {
    registrarNFe(data, {
      onSuccess: () => {
        setOpen(false);
        reset();
      }
    });
  };

  // Extract info from Chave de Acesso (optional helper)
  const chaveAcesso = watch("chave_acesso");
  const handleChaveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    setValue("chave_acesso", val);
    
    // Auto-fill numero and data se tiver 44 dígitos (Simplificação)
    if (val.length === 44) {
      const mes = val.substring(4, 6);
      const ano = "20" + val.substring(2, 4);
      const num = val.substring(25, 34);
      setValue("numero", parseInt(num, 10).toString());
      setValue("data_emissao", `${ano}-${mes}-01`); // approximate
    }
  };

  const pedidosPendentes = pedidos?.filter(p => p.status !== 'recebido_total' && p.status !== 'cancelado') || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <PlusCircle className="h-4 w-4 mr-2" />
          Registrar NFe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar NFe de Entrada</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Chave de Acesso (44 dígitos)</Label>
            <Input 
              {...register("chave_acesso")} 
              maxLength={44}
              onChange={handleChaveChange}
              placeholder="00000000000000000000000000000000000000000000" 
            />
            {errors.chave_acesso && <span className="text-[10px] text-danger">{errors.chave_acesso.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número da NF</Label>
              <Input {...register("numero")} placeholder="Ex: 12345" />
              {errors.numero && <span className="text-[10px] text-danger">{errors.numero.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>Série</Label>
              <Input {...register("serie")} placeholder="Ex: 1" />
              {errors.serie && <span className="text-[10px] text-danger">{errors.serie.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fornecedor (Nome)</Label>
              <Input {...register("fornecedor_nome")} placeholder="Nome na NF" />
              {errors.fornecedor_nome && <span className="text-[10px] text-danger">{errors.fornecedor_nome.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>Valor Total (R$)</Label>
              <Input {...register("valor_total")} type="number" step="0.01" />
              {errors.valor_total && <span className="text-[10px] text-danger">{errors.valor_total.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Emissão</Label>
              <Input {...register("data_emissao")} type="date" />
              {errors.data_emissao && <span className="text-[10px] text-danger">{errors.data_emissao.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>Pedido de Compra (Vínculo)</Label>
              <Select onValueChange={(v) => setValue("pedido_compra_id", v === "none" ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (Opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vínculo</SelectItem>
                  {pedidosPendentes.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.numero} - {formatCurrency(p.valor_total)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Registrar e Processar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
