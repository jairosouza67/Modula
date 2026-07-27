import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Package,
  TrendingDown,
  DollarSign,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  Pencil,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/erp/PageHeader";
import { KpiCard } from "@/components/erp/KpiCard";
import { ErpCard } from "@/components/erp/Card";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import {
  calcularStatusEstoque,
  calcularKpisEstoque,
  filtrarEstoque,
  aplicarMovimentacao,
  formatarMoeda,
  type EstoqueItem,
  type CategoriaEstoque,
  type MovimentacaoEstoque,
  type TipoMovimentacao,
} from "@/lib/inventory/estoque";
import type { StatusVariant } from "@/lib/mock/data";

import { useEstoque, useEstoqueMutations, useMovimentacoes } from "@/hooks/useEstoque";
import { useProdutos } from "@/hooks/useProdutos";

export const Route = createFileRoute("/_app/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque — Vidraçaria Ornamental" },
      { name: "description", content: "Controle de chapas, ferragens, perfis e consumíveis." },
    ],
  }),
  component: EstoquePage,
});

const STATUS_VARIANT: Record<string, StatusVariant> = {
  OK: "success",
  Atenção: "warning",
  Crítico: "danger",
};

const CATEGORIAS: CategoriaEstoque[] = ["Chapas", "Ferragens", "Perfis", "Consumíveis", "Outros"];

// ─── Modal movimentação ───────────────────────────────────────────────────

function ModalMovimentacao({
  item,
  onClose,
  onSalvar,
}: {
  item: EstoqueItem;
  onClose: () => void;
  onSalvar: (tipo: TipoMovimentacao, qtd: number, osRef: string, obs: string) => Promise<void>;
}) {
  const [tipo, setTipo] = useState<TipoMovimentacao>("Entrada");
  const [quantidade, setQuantidade] = useState("");
  const [osRef, setOsRef] = useState("");
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSalvar = async () => {
    const qtd = parseFloat(quantidade);
    if (!qtd || qtd <= 0) { setErro("Quantidade inválida."); return; }
    if (tipo === "Saída" && qtd > item.quantidade) {
      setErro(`Estoque insuficiente. Disponível: ${item.quantidade} ${item.unidade}.`);
      return;
    }
    setErro("");
    setLoading(true);
    try {
      await onSalvar(tipo, qtd, osRef, obs);
      onClose();
    } catch (e) {
      // toast error handled by hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card border border-border/80 rounded-xl p-5 w-80 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="modal-movimentacao"
      >
        {/* Glow effect for RPG feel */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
        
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground/90 uppercase">Nova Movimentação</h3>
            <p className="text-[10px] text-muted-foreground font-medium">{item.codigo} — {item.descricao}</p>
          </div>
          <button onClick={onClose} className="hover:rotate-90 transition-transform duration-200">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4 relative z-10">
          {/* Tipo */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Tipo</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["Entrada", "Saída", "Devolução", "Ajuste"] as TipoMovimentacao[]).map((t) => (
                <button
                  key={t}
                  id={`mov-tipo-${t}`}
                  onClick={() => setTipo(t)}
                  className={`py-2 text-[10px] font-bold rounded-md border transition-all duration-200 ${
                    tipo === t
                      ? t === "Entrada" ? "bg-success/20 border-success/50 text-success shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                        : t === "Saída" ? "bg-danger/20 border-danger/50 text-danger shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                        : t === "Devolução" ? "bg-info/20 border-info/50 text-info shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                        : "bg-warning/20 border-warning/50 text-warning shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                      : "border-border/40 text-muted-foreground hover:border-border/80"
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Quantidade */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              {tipo === "Ajuste" ? "Nova Quantidade" : "Quantidade"} ({item.unidade}) <span className="text-[9px] lowercase font-normal opacity-70">— em estoque: {item.quantidade}</span>
            </label>
            <input
              id="mov-quantidade"
              type="number"
              min="0.001"
              step="0.001"
              value={quantidade}
              onChange={(e) => { setQuantidade(e.target.value); setErro(""); }}
              className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              placeholder="0"
            />
          </div>

          {/* OS ref */}
          {tipo === "Saída" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="overflow-hidden"
            >
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">OS de Referência</label>
              <input
                id="mov-os-ref"
                type="text"
                value={osRef}
                onChange={(e) => setOsRef(e.target.value)}
                className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                placeholder="#0348"
              />
            </motion.div>
          )}

          {/* Obs */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Observação</label>
            <input
              id="mov-obs"
              type="text"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              placeholder="Motivo da movimentação..."
            />
          </div>

          {erro && (
            <motion.p
              initial={{ x: -4, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-[10px] text-danger font-bold flex items-center gap-1"
            >
              <AlertTriangle className="h-3 w-3" /> {erro}
            </motion.p>
          )}
        </div>

        <div className="flex gap-2.5 mt-6 relative z-10">
          <Button variant="outline" size="sm" className="flex-1 text-[10px] font-bold uppercase tracking-wider" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button size="sm" className="flex-1 text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-primary/20" id="mov-salvar" onClick={handleSalvar} disabled={loading}>
            {loading ? "Processando..." : "Confirmar"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Modal Novo Item ──────────────────────────────────────────────────────

function ModalNovoItem({
  onClose,
  onSalvar,
}: {
  onClose: () => void;
  onSalvar: (item: Omit<EstoqueItem, "id">) => Promise<void>;
}) {
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<CategoriaEstoque>("Chapas");
  const [unidade, setUnidade] = useState("m2");
  const [quantidade, setQuantidade] = useState("0");
  const [estoqueMinimo, setEstoqueMinimo] = useState("0");
  const [custoUnitario, setCustoUnitario] = useState("0");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const { data: produtos = [] } = useProdutos();

  const handleProdutoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selCodigo = e.target.value;
    setCodigo(selCodigo);
    
    if (selCodigo) {
      const prod = produtos.find(p => p.codigo === selCodigo);
      if (prod) {
        setDescricao(prod.descricao || "");
        if (prod.categoria && CATEGORIAS.includes(prod.categoria as any)) {
          setCategoria(prod.categoria as any);
        } else {
          setCategoria("Outros");
        }
        setUnidade(prod.unidade || "pç");
        setCustoUnitario((prod.valor_compra || 0).toString());
      }
    }
  };

  const handleSalvar = async () => {
    if (!codigo || !descricao) {
      setErro("Código e descrição são obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      await onSalvar({
        codigo,
        descricao,
        categoria,
        unidade,
        quantidade: parseFloat(quantidade) || 0,
        estoqueMinimo: parseFloat(estoqueMinimo) || 0,
        custoUnitario: parseFloat(custoUnitario) || 0,
      });
      onClose();
    } catch (e: any) {
      setErro(e.message || "Erro ao criar item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card border border-border/80 rounded-xl p-6 w-[440px] shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="modal-novo-item"
      >
        {/* Glow effect */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 blur-[80px] rounded-full" />

        <div className="flex justify-between items-center mb-5 relative z-10">
          <h3 className="text-sm font-bold uppercase tracking-tight text-foreground/90">Novo Item de Estoque</h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform duration-200">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Código</label>
              <select
                value={codigo}
                onChange={handleProdutoChange}
                className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none"
              >
                <option value="">Selecione um produto...</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.codigo}>{p.codigo} - {p.descricao}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaEstoque)}
                className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none"
              >
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              placeholder="Ex: Vidro Temperado 8mm Incolor"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Unidade</label>
              <input
                type="text"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                placeholder="m2, pç..."
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Qtd. Inicial</label>
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Mínimo</label>
              <input
                type="number"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
                className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Custo Unitário (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">R$</span>
              <input
                type="number"
                step="0.01"
                value={custoUnitario}
                onChange={(e) => setCustoUnitario(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>

          {erro && (
            <motion.p
              initial={{ x: -4, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-[10px] text-danger font-bold flex items-center gap-1"
            >
              <AlertTriangle className="h-3 w-3" /> {erro}
            </motion.p>
          )}
        </div>

        <div className="flex gap-3 mt-8 relative z-10">
          <Button variant="outline" size="sm" className="flex-1 text-[10px] font-bold uppercase tracking-wider" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button size="sm" className="flex-1 text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-primary/20" onClick={handleSalvar} disabled={loading}>
            {loading ? "Criando..." : "Criar Item"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Modal Editar Item ──────────────────────────────────────────────────────

function ModalEditarItem({
  item,
  onClose,
  onSalvar,
}: {
  item: EstoqueItem;
  onClose: () => void;
  onSalvar: (id: string, updates: Partial<EstoqueItem>) => Promise<void>;
}) {
  const [codigo, setCodigo] = useState(item.codigo);
  const [descricao, setDescricao] = useState(item.descricao);
  const [categoria, setCategoria] = useState<CategoriaEstoque>(item.categoria);
  const [unidade, setUnidade] = useState(item.unidade);
  const [estoqueMinimo, setEstoqueMinimo] = useState(item.estoqueMinimo.toString());
  const [custoUnitario, setCustoUnitario] = useState(item.custoUnitario.toString());
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleSalvar = async () => {
    if (!codigo || !descricao) {
      setErro("Código e descrição são obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      await onSalvar(item.id, {
        codigo,
        descricao,
        categoria,
        unidade,
        estoqueMinimo: parseFloat(estoqueMinimo) || 0,
        custoUnitario: parseFloat(custoUnitario) || 0,
      });
      onClose();
    } catch (e: any) {
      setErro(e.message || "Erro ao atualizar item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card border border-border/80 rounded-xl p-6 w-[440px] shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-info/10 blur-[80px] rounded-full" />

        <div className="flex justify-between items-center mb-5 relative z-10">
          <h3 className="text-sm font-bold uppercase tracking-tight text-foreground/90">Editar Item</h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform duration-200">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Código</label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-info/20 transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaEstoque)}
                className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-info/20 transition-all font-medium appearance-none"
              >
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-info/20 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Unidade</label>
              <input
                type="text"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-info/20 transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Mínimo</label>
              <input
                type="number"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
                className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-info/20 transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={custoUnitario}
                onChange={(e) => setCustoUnitario(e.target.value)}
                className="w-full px-3 py-2 text-[11px] rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-2 focus:ring-info/20 transition-all font-medium"
              />
            </div>
          </div>

          {erro && (
            <motion.p
              initial={{ x: -4, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-[10px] text-danger font-bold flex items-center gap-1"
            >
              <AlertTriangle className="h-3 w-3" /> {erro}
            </motion.p>
          )}
        </div>

        <div className="flex gap-3 mt-8 relative z-10">
          <Button variant="outline" size="sm" className="flex-1 text-[10px] font-bold uppercase tracking-wider" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button size="sm" className="flex-1 text-[10px] font-bold uppercase tracking-wider bg-info hover:bg-info/90 text-info-foreground shadow-lg shadow-info/20" onClick={handleSalvar} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Modal Excluir Item ───────────────────────────────────────────────────

function ModalExcluirItem({
  item,
  onClose,
  onConfirm,
}: {
  item: EstoqueItem;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(item.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card border border-border/80 rounded-xl p-6 w-80 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-danger/10 blur-3xl rounded-full" />
        
        <div className="text-center relative z-10">
          <div className="mx-auto w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-4">
            <Trash2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-tight text-foreground/90 mb-2">Excluir Item?</h3>
          <p className="text-[11px] text-muted-foreground mb-6">
            Tem certeza que deseja excluir <strong>{item.descricao}</strong> do estoque? Esta ação não pode ser desfeita.
          </p>
          
          <div className="flex gap-2.5">
            <Button variant="outline" size="sm" className="flex-1 text-[10px] font-bold uppercase tracking-wider" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button size="sm" variant="destructive" className="flex-1 text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-danger/20" onClick={handleConfirm} disabled={loading}>
              {loading ? "..." : "Excluir"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────

function EstoquePage() {
  const { data: itens = [], isLoading } = useEstoque();
  const { data: historico = [] } = useMovimentacoes();
  const { createMovimentacao, createItem, updateItem, deleteItem } = useEstoqueMutations();

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<CategoriaEstoque | "Todas">("Todas");
  const [apenasCriticos, setApenasCriticos] = useState(false);
  const [itemMovimentando, setItemMovimentando] = useState<EstoqueItem | null>(null);
  const [showNovoItem, setShowNovoItem] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  const [itemParaEditar, setItemParaEditar] = useState<EstoqueItem | null>(null);
  const [itemParaExcluir, setItemParaExcluir] = useState<EstoqueItem | null>(null);

  const kpis = useMemo(() => calcularKpisEstoque(itens), [itens]);

  const itensFiltrados = useMemo(
    () => filtrarEstoque(itens, { busca, categoria, apenasCriticos }),
    [itens, busca, categoria, apenasCriticos]
  );

  const registrarMovimentacao = async (tipo: TipoMovimentacao, qtd: number, osRef: string, obs: string) => {
    if (!itemMovimentando) return;

    await createMovimentacao({
      itemId: itemMovimentando.id,
      tipo,
      quantidade: qtd,
      osReferencia: osRef || undefined,
      observacao: obs || undefined,
    });
  };

  const handleCriarItem = async (item: Omit<EstoqueItem, "id">) => {
    await createItem(item);
  };

  const handleAtualizarItem = async (id: string, item: Partial<EstoqueItem>) => {
    await updateItem({ id, ...item });
  };

  const handleExcluirItem = async (id: string) => {
    await deleteItem(id);
    setItemParaExcluir(null);
  };

  const movHistoricoItem = (itemId: string) =>
    historico.filter((m) => m.itemId === itemId);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando estoque...</div>;
  }

  return (
    <>
      <PageHeader
        title="Estoque"
        subtitle={`${kpis.totalItens} itens · ${kpis.itensCriticos} crítico${kpis.itensCriticos !== 1 ? "s" : ""} · valor total ${formatarMoeda(kpis.valorTotal)}`}
        actions={
          <Button size="sm" className="text-xs" onClick={() => setShowNovoItem(true)}>
            <Plus className="mr-1 h-3 w-3" /> Novo Item
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 mb-3.5">
        <KpiCard
          label="Total de itens"
          value={String(kpis.totalItens)}
          hint={`${kpis.itensAtencao} em atenção`}
        />
        <KpiCard
          label="Valor em estoque"
          value={formatarMoeda(kpis.valorTotal)}
        />
        <KpiCard
          label="Itens críticos"
          value={String(kpis.itensCriticos)}
          hintTone={kpis.itensCriticos > 0 ? "danger" : "success"}
          hint={kpis.itensCriticos > 0 ? "Reposição urgente" : "Estoque OK"}
        />
        <KpiCard
          label="Custo médio/item"
          value={formatarMoeda(kpis.custoMedio)}
        />
      </div>

      {/* Alerta de críticos */}
      {kpis.itensCriticos > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-danger/8 border border-danger/30">
          <AlertTriangle className="h-4 w-4 text-danger flex-shrink-0" />
          <span className="text-[11px] text-danger font-medium">
            {kpis.itensCriticos} item{kpis.itensCriticos > 1 ? "s" : ""} com estoque crítico abaixo do mínimo —
            verifique e solicite reposição.
          </span>
        </div>
      )}

      {/* Filtros */}
      <ErpCard className="mb-3 p-2.5">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              id="estoque-busca"
              type="text"
              placeholder="Buscar código, descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-6 pr-3 py-1 text-[11px] rounded-md border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <select
            id="estoque-categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaEstoque | "Todas")}
            className="text-[11px] px-2 py-1 rounded-md border border-border/60 bg-background focus:outline-none"
          >
            <option value="Todas">Todas as categorias</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <button
            id="estoque-filtro-criticos"
            onClick={() => setApenasCriticos(!apenasCriticos)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
              apenasCriticos
                ? "bg-danger/10 border-danger/40 text-danger"
                : "border-border/60 text-muted-foreground hover:border-border"
            }`}
          >
            <Filter className="h-3 w-3" /> Críticos e Atenção
          </button>

          {(busca || categoria !== "Todas" || apenasCriticos) && (
            <button
              onClick={() => { setBusca(""); setCategoria("Todas"); setApenasCriticos(false); }}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
      </ErpCard>

      {/* Tabela */}
      <ErpCard>
        <div className="overflow-x-auto">
          <table className="w-full" id="estoque-tabela">
            <thead>
              <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                <th className="py-1.5 w-6"></th>
                <th>Código</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th className="text-right">Qtd.</th>
                <th className="text-right">Mínimo</th>
                <th className="text-right">Custo unit.</th>
                <th className="pl-4">Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {itensFiltrados.map((item) => {
                const statusCalc = calcularStatusEstoque(item.quantidade, item.estoqueMinimo);
                const isCritico = statusCalc === "Crítico";
                const isAtencao = statusCalc === "Atenção";
                const movItem = movHistoricoItem(item.id);
                const isExpanded = expandedRow === item.id;

                return (
                  <>
                    <tr
                      key={item.id}
                      className={`border-b border-border/40 last:border-0 text-[11px] hover:bg-muted/40 transition-colors ${
                        isCritico ? "bg-danger/3" : isAtencao ? "bg-warning/3" : ""
                      }`}
                    >
                      <td className="py-1.5">
                        <button
                          id={`expand-${item.codigo}`}
                          onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </td>
                      <td className="py-1.5 font-medium">
                        <span className="flex items-center gap-1">
                          {isCritico && <AlertTriangle className="h-3 w-3 text-danger" />}
                          {item.codigo}
                        </span>
                      </td>
                      <td className="max-w-[220px] truncate">{item.descricao}</td>
                      <td>{item.categoria}</td>
                      <td className={`text-right font-medium ${isCritico ? "text-danger" : isAtencao ? "text-warning" : ""}`}>
                        {item.quantidade} {item.unidade}
                      </td>
                      <td className="text-right text-muted-foreground">{item.estoqueMinimo}</td>
                      <td className="text-right">{formatarMoeda(item.custoUnitario)}</td>
                      <td className="pl-4">
                        <StatusBadge variant={STATUS_VARIANT[statusCalc]}>{statusCalc}</StatusBadge>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`editar-${item.codigo}`}
                            onClick={() => setItemParaEditar(item)}
                            className="p-1 text-muted-foreground hover:text-info transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            id={`excluir-${item.codigo}`}
                            onClick={() => setItemParaExcluir(item)}
                            className="p-1 text-muted-foreground hover:text-danger transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            id={`movimentar-${item.codigo}`}
                            onClick={() => setItemMovimentando(item)}
                            className="flex items-center gap-1 ml-2 px-2 py-0.5 text-[10px] rounded border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Package className="h-3 w-3" />
                            Mov.
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Linha expandida: histórico de movimentações */}
                    {isExpanded && (
                      <tr key={`${item.id}-hist`} className="bg-muted/30">
                        <td colSpan={10} className="px-4 py-2">
                          <div className="text-[10px] font-medium text-muted-foreground mb-1.5">
                            Histórico de movimentações
                          </div>
                          {movItem.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground italic">Nenhuma movimentação registrada.</p>
                          ) : (
                            <div className="space-y-1">
                              {movItem.map((m) => (
                                <div key={m.id} className="flex items-center gap-3 text-[10px]">
                                  {m.tipo === "Entrada" || m.tipo === "Devolução"
                                    ? <ArrowUpCircle className="h-3.5 w-3.5 text-success" />
                                    : m.tipo === "Ajuste" ? <RotateCcw className="h-3.5 w-3.5 text-warning" />
                                    : <ArrowDownCircle className="h-3.5 w-3.5 text-danger" />
                                  }
                                  <span className={m.tipo === "Entrada" || m.tipo === "Devolução" ? "text-success" : m.tipo === "Ajuste" ? "text-warning" : "text-danger"}>
                                    {m.tipo === "Entrada" || m.tipo === "Devolução" ? "+" : m.tipo === "Ajuste" ? "=" : "-"}{m.quantidade} {item.unidade}
                                  </span>
                                  <span className="text-muted-foreground">{m.tipo}</span>
                                  {m.osReferencia && (
                                    <span className="bg-muted px-1.5 py-0.5 rounded">{m.osReferencia}</span>
                                  )}
                                  {m.observacao && <span className="text-muted-foreground">{m.observacao}</span>}
                                  <span className="text-muted-foreground ml-auto">
                                    {new Date(m.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>

          {itensFiltrados.length === 0 && (
            <div className="text-center py-8 text-[11px] text-muted-foreground">
              Nenhum item encontrado com os filtros aplicados.
            </div>
          )}
        </div>

        {/* Legenda KPI rodapé */}
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            {itensFiltrados.length} iten{itensFiltrados.length !== 1 ? "s" : ""} exibido{itensFiltrados.length !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            Valor filtrado: {formatarMoeda(itensFiltrados.reduce((s, i) => s + i.quantidade * i.custoUnitario, 0))}
          </div>
          {kpis.itensCriticos > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-danger">
              <TrendingDown className="h-3.5 w-3.5" />
              {kpis.itensCriticos} crítico{kpis.itensCriticos > 1 ? "s" : ""} — solicitar reposição
            </div>
          )}
        </div>
      </ErpCard>

      {/* Modals with AnimatePresence */}
      <AnimatePresence>
        {itemMovimentando && (
          <ModalMovimentacao
            item={itemMovimentando}
            onClose={() => setItemMovimentando(null)}
            onSalvar={registrarMovimentacao}
          />
        )}

        {showNovoItem && (
          <ModalNovoItem
            onClose={() => setShowNovoItem(false)}
            onSalvar={handleCriarItem}
          />
        )}

        {itemParaEditar && (
          <ModalEditarItem
            item={itemParaEditar}
            onClose={() => setItemParaEditar(null)}
            onSalvar={handleAtualizarItem}
          />
        )}

        {itemParaExcluir && (
          <ModalExcluirItem
            item={itemParaExcluir}
            onClose={() => setItemParaExcluir(null)}
            onConfirm={handleExcluirItem}
          />
        )}
      </AnimatePresence>
    </>
  );
}
