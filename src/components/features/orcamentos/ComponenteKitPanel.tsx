import { useState } from "react";
import { ChevronDown, ChevronUp, Package, AlertTriangle, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { OrcamentoComponente } from "@/lib/sales/types";

interface ComponenteKitProps {
  componentes: OrcamentoComponente[];
  estoqueDisponivel?: Record<string, number>; // codigoProduto → qtd
  onToggle: (index: number, incluido: boolean) => void;
  onRemoveComponente?: (index: number) => void;
  largura: number; // metros
  altura: number; // metros
  quantidade: number;
}

function calcularQtdComponente(
  c: OrcamentoComponente,
  largura: number,
  altura: number,
  quantidade: number
): number {
  if (c.tipoPreco === "M2") {
    return +(largura * altura * quantidade * c.quantidade).toFixed(4);
  }
  if (c.tipoPreco === "PC_ML") {
    return +(largura * c.quantidade * quantidade).toFixed(4);
  }
  return +(c.quantidade * quantidade).toFixed(4);
}

/**
 * Painel de componentes de um serviço composto (kit).
 * Permite ao usuário incluir/excluir subprodutos individualmente
 * e visualiza o estoque disponível de cada um.
 */
export function ComponenteKitPanel({
  componentes,
  estoqueDisponivel = {},
  onToggle,
  onRemoveComponente,
  largura,
  altura,
  quantidade,
}: ComponenteKitProps) {
  const [aberto, setAberto] = useState(true);

  const totalIncluidos = componentes.filter((c) => c.incluido).length;
  const temEstoqueBaixo = componentes.some((c) => {
    if (!c.incluido) return false;
    const estq = estoqueDisponivel[c.codigoProduto];
    if (estq === undefined) return false;
    const qtdNecessaria = calcularQtdComponente(c, largura, altura, quantidade);
    return estq < qtdNecessaria;
  });

  return (
    <div className="mt-2 rounded-lg border border-dashed border-border/70">
      {/* Header do painel */}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-xs font-medium">
            Materiais do kit
          </span>
          <Badge variant="secondary" className="h-4 text-[10px] px-1.5">
            {totalIncluidos}/{componentes.length} incluídos
          </Badge>
          {temEstoqueBaixo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Estoque insuficiente para um ou mais itens</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {aberto ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Lista de componentes */}
      {aberto && (
        <div className="border-t border-border/60 divide-y divide-border/40">
          {componentes.map((comp, idx) => {
            const qtdNecessaria = calcularQtdComponente(comp, largura, altura, quantidade);
            const estoqueQtd = estoqueDisponivel[comp.codigoProduto];
            const semEstoque = estoqueQtd !== undefined && estoqueQtd < qtdNecessaria;

            return (
              <div
                key={comp.codigoProduto}
                className={`flex items-center justify-between px-3 py-2 transition-colors ${
                  comp.incluido ? "bg-muted/20" : "bg-muted/5 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Switch
                    checked={comp.incluido}
                    onCheckedChange={(v) => onToggle(idx, v)}
                    className="scale-75 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{comp.descricao}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Cód: {comp.codigoProduto} ·{" "}
                      {comp.tipoPreco === "M2" ? "por m²" : comp.tipoPreco === "PC_ML" ? "por ml" : "por peça"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0 text-right">
                  <div>
                    <p className="text-[10px] font-medium text-foreground">
                      {qtdNecessaria.toFixed(2)}
                    </p>
                    {estoqueQtd !== undefined ? (
                      <p
                        className={`text-[9px] ${
                          semEstoque ? "text-amber-500" : "text-emerald-500"
                        }`}
                      >
                        Estq: {estoqueQtd.toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-[9px] text-muted-foreground">sem vínculo</p>
                    )}
                  </div>
                  {semEstoque && comp.incluido && (
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                  )}
                  {onRemoveComponente && (
                    <button
                      type="button"
                      onClick={() => onRemoveComponente(idx)}
                      title="Remover material do kit"
                      className="ml-1 flex h-5 w-5 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
