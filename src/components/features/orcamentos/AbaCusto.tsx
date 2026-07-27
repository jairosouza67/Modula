import { ErpCard } from "@/components/erp/Card";
import type { CalculoResultado } from "@/lib/sales/types";
import { calcularCustoReal, calcularLucro, calcularTotaisCusto, type CustoItem } from "@/lib/sales/calculoCusto";
import { resolverServico } from "@/lib/sales/resolverServico";

interface AbaCustoProps {
  itensCalculados: CalculoResultado[];
}

const fmt = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function AbaCusto({ itensCalculados }: AbaCustoProps) {
  const itensCusto: CustoItem[] = itensCalculados.map((item) => {
    const servico = resolverServico(item.codigoServico);
    return {
      codigoServico: item.codigoServico,
      largura: item.largura,
      altura: item.altura,
      quantidade: item.quantidade,
      valorVenda: item.valorTotal,
      custoM2: servico.custoM2,
      pcFxCusto: servico.pcFxCusto,
      pcMlCusto: servico.pcMlCusto,
    };
  });

  const totais = calcularTotaisCusto(itensCusto);

  return (
    <ErpCard title="Análise de Custo (interno)">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border/60 text-left text-[10px] uppercase text-muted-foreground">
              <th className="py-2">Código</th>
              <th>Qtd</th>
              <th>M²</th>
              <th>Larg</th>
              <th>Alt</th>
              <th>VL Total</th>
              <th>Custo</th>
              <th>Lucro</th>
            </tr>
          </thead>
          <tbody>
            {itensCusto.map((item) => {
              const custoReal = calcularCustoReal(item);
              const lucro = calcularLucro(item.valorVenda, custoReal);
              const m2 = item.largura * item.altura * item.quantidade;

              return (
                <tr key={`${item.codigoServico}-${item.largura}-${item.altura}-${item.quantidade}`} className="border-b border-border/40">
                  <td className="py-2 font-medium">{item.codigoServico}</td>
                  <td>{item.quantidade}</td>
                  <td>{m2.toFixed(2)}</td>
                  <td>{item.largura.toFixed(2)}</td>
                  <td>{item.altura.toFixed(2)}</td>
                  <td>{fmt(item.valorVenda)}</td>
                  <td>{fmt(custoReal)}</td>
                  <td className={lucro >= 0 ? "text-emerald-600" : "text-destructive"}>{fmt(lucro)}</td>
                </tr>
              );
            })}
            {itensCusto.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-center text-muted-foreground">
                  Nenhum item para análise.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-5 text-xs">
        <div className="rounded-md border p-2">
          <p className="text-muted-foreground">Total Bruto Vendido</p>
          <p className="font-medium">{fmt(totais.totalBruto)}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-muted-foreground">Custo Total</p>
          <p className="font-medium">{fmt(totais.custoTotal)}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-muted-foreground">Lucro Total</p>
          <p className="font-medium">{fmt(totais.lucroTotal)}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-muted-foreground">VALOR COM 17% DE DESCONTO</p>
          <p className="font-medium">{fmt(totais.valorComDesconto)}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-muted-foreground">Lucro após Desconto</p>
          <p className="font-medium">{fmt(totais.lucroAposDesconto)}</p>
        </div>
      </div>
    </ErpCard>
  );
}
