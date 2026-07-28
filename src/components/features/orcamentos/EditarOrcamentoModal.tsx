import { useState, useMemo, useEffect, useCallback, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Calculator, Loader2, Layers } from "lucide-react";
import { useClientes } from "@/hooks/useClientes";
import { useOrcamentoMutations } from "@/hooks/useOrcamentos";
import { useProdutosOrcamento } from "@/hooks/useProdutosOrcamento";
import {
  type OrcamentoItem,
  type OrcamentoItemLegacy,
  calcularItem,
  calcularAreaTotal,
  calcularTotalOrcamento,
  isLegacyItem,
} from "@/lib/sales/calculator";
import type { OrcamentoItemUnificado, OrcamentoComponente } from "@/lib/sales/types";
import {
  listarServicosDisponiveis,
  resolverServico,
  resolverServicoComComponentes,
  obterComponentesServico,
} from "@/lib/sales/resolverServico";
import {
  calcularValorTotalLinha,
} from "@/lib/sales/calculadoraModula";
import { ComponenteKitPanel } from "./ComponenteKitPanel";
import { useEstoque } from "@/hooks/useEstoque";

interface OrcamentoRow {
  id: string;
  numero: string | null;
  descricao: string | null;
  cliente_id: string | null;
  itens: unknown;
  area_total: number | null;
  valor_total: number | null;
  status: string;
  data_validade: string | null;
  cliente?: { nome: string } | null;
}

interface Props {
  orcamento: OrcamentoRow;
  open: boolean;
  onClose: () => void;
}

// ─── Itens de Vidro Avulso (modo legado) ──────────────────────────────────────

interface ItemVidroCardProps {
  item: OrcamentoItem;
  index: number;
  tiposVidro: { codigo: string; label: string }[];
  processamentos: { codigo: string; label: string; custo: number }[];
  calculo: { area: number; total: number };
  total: number;
  podeRemover: boolean;
  onChange: (changes: Partial<OrcamentoItem>) => void;
  onRemove: () => void;
}

function ItemVidroCard({
  item,
  tiposVidro,
  processamentos,
  calculo,
  podeRemover,
  onChange,
  onRemove,
}: ItemVidroCardProps) {
  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="grid gap-3 p-3 rounded-lg border border-border/60 bg-muted/30">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6 items-end">
        <div className="lg:col-span-2">
          <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">
            Tipo de Vidro
          </Label>
          <select
            className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary"
            value={item.produtoCodigo}
            onChange={(e) => onChange({ produtoCodigo: e.target.value })}
          >
            <option value="">Selecione o tipo de vidro</option>
            {tiposVidro.map((t) => (
              <option key={t.codigo} value={t.codigo}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">
            Larg (mm)
          </Label>
          <Input
            type="number"
            value={item.largura}
            onChange={(e) => onChange({ largura: Number(e.target.value) })}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">
            Alt (mm)
          </Label>
          <Input
            type="number"
            value={item.altura}
            onChange={(e) => onChange({ altura: Number(e.target.value) })}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">Qtd</Label>
          <Input
            type="number"
            value={item.quantidade}
            onChange={(e) => onChange({ quantidade: Number(e.target.value) })}
            className="h-8 text-xs"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          {podeRemover && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6 items-end">
        <div className="lg:col-span-2">
          <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">
            Processamento
          </Label>
          <select
            className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary"
            value={item.processamentoCodigo}
            onChange={(e) => onChange({ processamentoCodigo: e.target.value })}
          >
            {processamentos.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-4 flex justify-end items-center gap-4 text-[11px]">
          <span className="text-muted-foreground">
            Área: <b className="text-foreground">{calculo.area.toFixed(2)} m²</b>
          </span>
          <span className="text-muted-foreground">
            Subtotal: <b className="text-primary">{fmt(calculo.total)}</b>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Item de Serviço Composto (kit) ───────────────────────────────────────────

interface ItemKitCardProps {
  item: OrcamentoItemUnificado;
  index: number;
  servicos: { codigo: string; nome: string; categoria: string }[];
  calculo: { m2: number; valorTotal: number };
  estoqueDisponivel?: Record<string, number>;
  podeRemover: boolean;
  onChange: (changes: Partial<OrcamentoItemUnificado>) => void;
  onToggleComponente: (compIdx: number, incluido: boolean) => void;
  onRemoveComponente: (compIdx: number) => void;
  onRemove: () => void;
}

function ItemKitCard({
  item,
  servicos,
  calculo,
  estoqueDisponivel = {},
  podeRemover,
  onChange,
  onToggleComponente,
  onRemoveComponente,
  onRemove,
}: ItemKitCardProps) {
  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const categorias = useMemo(() => {
    const map = new Map<string, typeof servicos>();
    for (const s of servicos) {
      if (!map.has(s.categoria)) map.set(s.categoria, []);
      map.get(s.categoria)!.push(s);
    }
    return map;
  }, [servicos]);

  const LABELS_CATEGORIA: Record<string, string> = {
    porta_pivotante: "Portas Pivotantes",
    porta_correr: "Portas de Correr",
    box: "Box de Banheiro",
    janela: "Janelas",
    espelho: "Espelhos",
    fachada: "Fachadas",
    painel: "Painéis",
  };

  return (
    <div className="grid gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6 items-end">
        <div className="lg:col-span-3">
          <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">
            Serviço / Kit
          </Label>
          <select
            className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary"
            value={item.codigoServico}
            onChange={(e) => {
              const codigo = e.target.value;
              const servicoSel = servicos.find((s) => s.codigo === codigo);
              const comps = obterComponentesServico(codigo).map((c) => ({
                ...c,
                incluido: true,
              })) as OrcamentoComponente[];
              onChange({
                codigoServico: codigo,
                nomeServico: servicoSel?.nome ?? codigo,
                componentes: comps,
              });
            }}
          >
            {Array.from(categorias.entries()).map(([cat, lista]) => (
              <optgroup key={cat} label={LABELS_CATEGORIA[cat] ?? cat}>
                {lista.map((s) => (
                  <option key={s.codigo} value={s.codigo}>
                    {s.nome}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">
            Largura (m)
          </Label>
          <Input
            type="number"
            step="0.01"
            value={item.largura}
            onChange={(e) => onChange({ largura: Number(e.target.value) })}
            className="h-8 text-xs"
          />
        </div>

        <div>
          <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">
            Altura (m)
          </Label>
          <Input
            type="number"
            step="0.01"
            value={item.altura}
            onChange={(e) => onChange({ altura: Number(e.target.value) })}
            className="h-8 text-xs"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-[10px] uppercase text-muted-foreground">Qtd</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={item.quantidade}
              onChange={(e) => onChange({ quantidade: Number(e.target.value) })}
              className="h-8 text-xs"
            />
            {podeRemover && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-4 text-[11px]">
        <span className="text-muted-foreground">
          Área: <b className="text-foreground">{calculo.m2.toFixed(2)} m²</b>
        </span>
        <span className="text-muted-foreground">
          Subtotal: <b className="text-primary">{fmt(calculo.valorTotal)}</b>
        </span>
      </div>

      {item.componentes.length > 0 && (
        <ComponenteKitPanel
          componentes={item.componentes}
          estoqueDisponivel={estoqueDisponivel}
          largura={item.largura}
          altura={item.altura}
          quantidade={item.quantidade}
          onToggle={onToggleComponente}
          onRemoveComponente={onRemoveComponente}
        />
      )}
    </div>
  );
}

// ─── Migração de Itens Legados ────────────────────────────────────────────────

function migrateItens(
  rawItens: unknown,
  tiposVidro: { codigo: string }[],
  processamentos: { codigo: string }[]
): OrcamentoItem[] {
  if (!Array.isArray(rawItens) || rawItens.length === 0) {
    return [{ produtoCodigo: "", largura: 1000, altura: 1000, quantidade: 1, processamentoCodigo: "" }];
  }

  return rawItens.map((item: unknown) => {
    if (isLegacyItem(item)) {
      const legacy = item as OrcamentoItemLegacy;
      return {
        produtoCodigo: tiposVidro[legacy.tipoIdx]?.codigo || "",
        largura: legacy.largura,
        altura: legacy.altura,
        quantidade: legacy.quantidade,
        processamentoCodigo: processamentos[legacy.procIdx]?.codigo || "",
      };
    }
    const newItem = item as Partial<OrcamentoItem>;
    return {
      produtoCodigo: newItem.produtoCodigo || "",
      largura: newItem.largura || 1000,
      altura: newItem.altura || 1000,
      quantidade: newItem.quantidade || 1,
      processamentoCodigo: newItem.processamentoCodigo || "",
    };
  });
}

// ─── Modal Principal ───────────────────────────────────────────────────────────

export function EditarOrcamentoModal({ orcamento, open, onClose }: Props) {
  const { data: clientes = [] } = useClientes();
  const { updateOrcamento, isUpdating } = useOrcamentoMutations();
  const { tiposVidro, processamentos, isLoading: loadingProdutos } = useProdutosOrcamento();
  const { data: estoqueItens = [] } = useEstoque();

  const estoqueMapa = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of estoqueItens) {
      if (item.codigo) {
        map[item.codigo] = item.quantidade;
      }
    }
    return map;
  }, [estoqueItens]);

  const [clienteId, setClienteId] = useState(orcamento.cliente_id ?? "");
  const [descricao, setDescricao] = useState(orcamento.descricao ?? "");
  const [produtoSelecionado, setProdutoSelecionado] = useState("");

  const [itensVidro, setItensVidro] = useState<OrcamentoItem[]>([]);
  const [itensKit, setItensKit] = useState<OrcamentoItemUnificado[]>([]);

  const servicosDisponiveis = useMemo(() => listarServicosDisponiveis(), []);

  // Inicializar itens quando dados do Supabase e orçamento estiverem disponíveis
  useEffect(() => {
    if (tiposVidro.length === 0) return;
    setClienteId(orcamento.cliente_id ?? "");
    setDescricao(orcamento.descricao ?? "");

    const raw = Array.isArray(orcamento.itens) ? orcamento.itens : [];

    const rawKits = raw.filter((item: any) => item && typeof item === "object" && !!item.codigoServico);
    const rawVidros = raw.filter((item: any) => !item || typeof item !== "object" || !item.codigoServico);

    const parsedKits = rawKits.map((item: any) => ({
      codigoServico: item.codigoServico,
      nomeServico: item.nomeServico || item.codigoServico,
      largura: item.largura ?? 1,
      altura: item.altura ?? 2.1,
      quantidade: item.quantidade ?? 1,
      adicional: item.adicional ?? 0,
      componentes: Array.isArray(item.componentes) ? item.componentes : [],
    })) as OrcamentoItemUnificado[];

    const parsedVidros = migrateItens(rawVidros, tiposVidro, processamentos);

    setItensVidro(parsedVidros);
    setItensKit(parsedKits);
  }, [orcamento.id, tiposVidro.length, open]);

  // Itens vidro com defaults
  const itensVidroComDefault = useMemo(() => {
    if (tiposVidro.length === 0) return itensVidro;
    return itensVidro.map((item) => ({
      ...item,
      produtoCodigo: item.produtoCodigo || tiposVidro[0]?.codigo || "",
    }));
  }, [itensVidro, tiposVidro]);

  // Cálculos de vidro avulso
  const calculosVidro = useMemo(() => {
    return itensVidroComDefault.map((item) => {
      const produto = tiposVidro.find((t) => t.codigo === item.produtoCodigo);
      const proc = processamentos.find((p) => p.codigo === item.processamentoCodigo);
      return calcularItem(item, produto?.preco ?? 0, proc?.custo ?? 0);
    });
  }, [itensVidroComDefault, tiposVidro, processamentos]);

  // Cálculos de kits
  const calculosKit = useMemo(() => {
    return itensKit.map((item) => {
      try {
        const servico = resolverServicoComComponentes(item.codigoServico, item.componentes);
        return calcularValorTotalLinha(
          {
            codigoServico: item.codigoServico,
            largura: item.largura,
            altura: item.altura,
            quantidade: item.quantidade,
            adicional: item.adicional,
          },
          servico
        );
      } catch {
        return { m2: 0, valorTotal: 0 };
      }
    });
  }, [itensKit]);

  const areaTotal = useMemo(() => {
    const areaVidro = calcularAreaTotal(calculosVidro);
    const areaKit = calculosKit.reduce((acc, c) => acc + (c.m2 ?? 0), 0);
    return areaVidro + areaKit;
  }, [calculosVidro, calculosKit]);

  const valorTotal = useMemo(() => {
    const totalVidro = calcularTotalOrcamento(calculosVidro);
    const totalKit = calculosKit.reduce((sum, c) => sum + (c.valorTotal ?? 0), 0);
    return totalVidro + totalKit;
  }, [calculosVidro, calculosKit]);

  // ── Handlers Vidro ──
  const removeItemVidro = (index: number) => {
    setItensVidro(itensVidro.filter((_, i) => i !== index));
  };

  const updateItemVidro = (index: number, changes: Partial<OrcamentoItem>) =>
    setItensVidro(itensVidro.map((item, i) => (i === index ? { ...item, ...changes } : item)));

  // ── Handlers Kit ──
  const removeItemKit = (index: number) =>
    setItensKit(itensKit.filter((_, i) => i !== index));

  const updateItemKit = (index: number, changes: Partial<OrcamentoItemUnificado>) =>
    setItensKit(itensKit.map((item, i) => (i === index ? { ...item, ...changes } : item)));

  const toggleComponenteKit = (kitIdx: number, compIdx: number, incluido: boolean) => {
    setItensKit((prev) =>
      prev.map((kit, i) => {
        if (i !== kitIdx) return kit;
        const comps = kit.componentes.map((c, j) =>
          j === compIdx ? { ...c, incluido } : c
        );
        return { ...kit, componentes: comps };
      })
    );
  };

  const removeComponenteKit = (kitIdx: number, compIdx: number) => {
    setItensKit((prev) =>
      prev.map((kit, i) => {
        if (i !== kitIdx) return kit;
        const comps = kit.componentes.filter((_, j) => j !== compIdx);
        return { ...kit, componentes: comps };
      })
    );
  };

  // Handler para adicionar produto selecionado no dropdown
  const handleAdicionarProduto = () => {
    if (!produtoSelecionado) return;

    if (produtoSelecionado.startsWith("vidro:")) {
      const codigoVidro = produtoSelecionado.replace("vidro:", "");
      setItensVidro((prev) => [
        ...prev,
        {
          produtoCodigo: codigoVidro,
          largura: 1000,
          altura: 1000,
          quantidade: 1,
          processamentoCodigo: processamentos[0]?.codigo || "",
        },
      ]);
    } else {
      const codigoKit = produtoSelecionado.replace("kit:", "");
      const servicoSel = servicosDisponiveis.find((s) => s.codigo === codigoKit);
      const comps = obterComponentesServico(codigoKit).map((c) => ({
        ...c,
        incluido: true,
      })) as OrcamentoComponente[];

      setItensKit((prev) => [
        ...prev,
        {
          codigoServico: codigoKit,
          nomeServico: servicoSel?.nome ?? codigoKit,
          largura: 1,
          altura: 2.1,
          quantidade: 1,
          adicional: 0,
          componentes: comps,
        },
      ]);
    }

    setProdutoSelecionado("");
  };

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Unificar itens: vidro avulso + kits (ambos no mesmo array JSONB)
    const itensUnificados = [
      ...itensVidroComDefault.map((item) => ({
        ...item,
        componentes: [],
      })),
      ...itensKit,
    ];

    await updateOrcamento({
      id: orcamento.id,
      cliente_id: clienteId || null,
      descricao,
      itens: itensUnificados as any,
      area_total: areaTotal,
      valor_total: valorTotal,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[660px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Editar Orçamento {orcamento.numero}
          </DialogTitle>
        </DialogHeader>

        {loadingProdutos ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Carregando catálogo de produtos...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-cliente">Cliente</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger id="edit-cliente">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-descricao">Descrição / Projeto</Label>
                <Input
                  id="edit-descricao"
                  placeholder="Ex: Box Suíte Master"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Seletor de produtos unificado */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select value={produtoSelecionado} onValueChange={setProdutoSelecionado}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Selecione um produto para adicionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const categorias = new Map<string, typeof servicosDisponiveis>();
                        for (const s of servicosDisponiveis) {
                          if (!categorias.has(s.categoria)) categorias.set(s.categoria, []);
                          categorias.get(s.categoria)!.push(s);
                        }
                        const LABELS_CATEGORIA: Record<string, string> = {
                          porta_pivotante: "Portas Pivotantes",
                          porta_correr: "Portas de Correr",
                          box: "Box de Banheiro",
                          janela: "Janelas",
                          espelho: "Espelhos",
                          fachada: "Fachadas",
                          painel: "Painéis",
                        };
                        const items: ReactNode[] = [];
                        for (const [cat, lista] of categorias.entries()) {
                          items.push(
                            <SelectItem key={`header-${cat}`} value={`__header_${cat}`} disabled className="text-[10px] font-bold uppercase text-muted-foreground pointer-events-none">
                              {LABELS_CATEGORIA[cat] ?? cat}
                            </SelectItem>
                          );
                          for (const s of lista) {
                            items.push(
                              <SelectItem key={s.codigo} value={`kit:${s.codigo}`}>
                                <span className="flex items-center gap-1">
                                  <Layers className="h-3 w-3 text-primary" />
                                  {s.nome}
                                </span>
                              </SelectItem>
                            );
                          }
                        }
                        return items;
                      })()}
                      <SelectItem value="__header_vidros" disabled className="text-[10px] font-bold uppercase text-muted-foreground pointer-events-none">
                        ── Vidros Avulsos ──
                      </SelectItem>
                      {tiposVidro.map((t) => (
                        <SelectItem key={t.codigo} value={`vidro:${t.codigo}`}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleAdicionarProduto}
                  disabled={!produtoSelecionado}
                  className="h-9 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" /> Adicionar
                </Button>
              </div>

              {/* Lista de itens adicionados */}
              {itensKit.length === 0 && itensVidro.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <Layers className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Nenhum item adicionado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecione um produto no dropdown acima e clique em "Adicionar".
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {itensKit.map((item, i) => (
                    <ItemKitCard
                      key={`kit-${i}`}
                      item={item}
                      index={i}
                      servicos={servicosDisponiveis}
                      calculo={calculosKit[i] ?? { m2: 0, valorTotal: 0 }}
                      estoqueDisponivel={estoqueMapa}
                      podeRemover={true}
                      onChange={(changes) => updateItemKit(i, changes)}
                      onToggleComponente={(compIdx, incluido) =>
                        toggleComponenteKit(i, compIdx, incluido)
                      }
                      onRemoveComponente={(compIdx) => removeComponenteKit(i, compIdx)}
                      onRemove={() => removeItemKit(i)}
                    />
                  ))}
                  {itensVidroComDefault.map((item, i) => (
                    <ItemVidroCard
                      key={`vidro-${i}`}
                      item={item}
                      index={i}
                      tiposVidro={tiposVidro}
                      processamentos={processamentos}
                      calculo={calculosVidro[i] ?? { area: 0, total: 0 }}
                      total={calculosVidro[i]?.total ?? 0}
                      podeRemover={true}
                      onChange={(changes) => updateItemVidro(i, changes)}
                      onRemove={() => removeItemVidro(i)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Resumo */}
            <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Resumo do Orçamento
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Área total:{" "}
                    <b>{areaTotal.toFixed(2)} m²</b>
                  </p>
                  {itensKit.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Kits: <b>{itensKit.length}</b> · Vidros avulsos:{" "}
                      <b>{itensVidro.filter((i) => i.produtoCodigo).length}</b>
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Valor Total
                  </p>
                  <p className="text-2xl font-bold text-primary">{fmt(valorTotal)}</p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  isUpdating ||
                  !descricao ||
                  (itensVidro.length === 0 && itensKit.length === 0)
                }
              >
                {isUpdating ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
