import { createFileRoute } from "@tanstack/react-router";
import { Scissors, Plus, Trash2, RotateCw } from "lucide-react";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { KpiCard } from "@/components/erp/KpiCard";
import { ErpCard } from "@/components/erp/Card";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { filaProcessamento, tiposProcessamento } from "@/lib/mock/data";
import {
  binPacking2D,
  type Peca,
  type Chapa,
  type ResultadoPlanoCorte,
} from "@/lib/producao/plano-corte";

export const Route = createFileRoute("/_app/producao")({
  head: () => ({
    meta: [
      { title: "Produção — Vidraçaria Ornamental" },
      { name: "description", content: "Plano de corte, processamento e controle de qualidade." },
    ],
  }),
  component: ProducaoPage,
});

// Cores por OS para o diagrama SVG
const CORES_OS: Record<string, string> = {
  "#0348": "#185FA5",
  "#0347": "#2E8B57",
  "#0346": "#D4A017",
  "#0344": "#8B5CF6",
  "#0345": "#DC2626",
  "#0342": "#EA580C",
  "#0339": "#0891B2",
};

const COR_PADRAO = "#185FA5";

// Dimensões padrão da chapa (mm)
const CHAPA_DEFAULT: Chapa = { id: "C-01", largura: 3000, altura: 2100 };

// Peças iniciais baseadas na fila de processamento
const pecasIniciais: Peca[] = [
  { id: "P1", largura: 1200, altura: 2100, osId: "#0348", rotacionavel: true },
  { id: "P2", largura: 800, altura: 1900, osId: "#0346", rotacionavel: true },
  { id: "P3", largura: 600, altura: 2000, osId: "#0344", rotacionavel: true },
  { id: "P4", largura: 400, altura: 1800, osId: "#0345", rotacionavel: true },
];

interface PecaForm {
  id: string;
  largura: string;
  altura: string;
  osId: string;
  rotacionavel: boolean;
}

function ProducaoPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPlanoCorte | null>(null);
  const [chapaLargura, setChapaLargura] = useState(String(CHAPA_DEFAULT.largura));
  const [chapaAltura, setChapaAltura] = useState(String(CHAPA_DEFAULT.altura));
  const [pecasForm, setPecasForm] = useState<PecaForm[]>([
    { id: "P1", largura: "1200", altura: "2100", osId: "#0348", rotacionavel: true },
    { id: "P2", largura: "800", altura: "1900", osId: "#0346", rotacionavel: true },
    { id: "P3", largura: "600", altura: "2000", osId: "#0344", rotacionavel: true },
    { id: "P4", largura: "400", altura: "1800", osId: "#0345", rotacionavel: true },
  ]);

  // Gera o plano de corte ao abrir o diálogo com as peças iniciais
  const resultadoInicial = useMemo(() => {
    return binPacking2D(CHAPA_DEFAULT, pecasIniciais);
  }, []);

  const resultadoAtivo = resultado ?? resultadoInicial;

  function handleGerarPlano() {
    const largura = parseInt(chapaLargura, 10);
    const altura = parseInt(chapaAltura, 10);
    if (!largura || !altura || largura <= 0 || altura <= 0) return;

    const chapa: Chapa = { id: "C-01", largura, altura };
    const pecas: Peca[] = pecasForm
      .filter((p) => parseInt(p.largura, 10) > 0 && parseInt(p.altura, 10) > 0)
      .map((p, i) => ({
        id: p.id || `P${i + 1}`,
        largura: parseInt(p.largura, 10),
        altura: parseInt(p.altura, 10),
        osId: p.osId || undefined,
        rotacionavel: p.rotacionavel,
      }));

    const res = binPacking2D(chapa, pecas);
    setResultado(res);
    setDialogOpen(false);
  }

  function addPeca() {
    setPecasForm((prev) => [
      ...prev,
      { id: `P${prev.length + 1}`, largura: "", altura: "", osId: "", rotacionavel: true },
    ]);
  }

  function removePeca(idx: number) {
    setPecasForm((prev) => prev.filter((_, i) => i !== idx));
  }

  function updatePeca(idx: number, field: keyof PecaForm, value: string | boolean) {
    setPecasForm((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  }

  // Cálculos para KPIs e métricas
  const chapaAtiva = resultadoAtivo.chapa;
  const areaChapa = chapaAtiva.largura * chapaAtiva.altura;
  const areaUtilizada = resultadoAtivo.alocadas.reduce(
    (acc, a) => acc + a.peca.largura * a.peca.altura,
    0
  );
  const areaSobraM2 = ((areaChapa - areaUtilizada) / 1_000_000).toFixed(2);
  const aproveitamentoStr = resultadoAtivo.aproveitamento.toFixed(1);

  // Gap visual entre peças no SVG (mm)
  const GAP = 10;

  return (
    <>
      <PageHeader
        title="Produção"
        subtitle="Plano de corte · Processamento · Controle de qualidade"
        actions={
          <Button size="sm" className="text-xs" onClick={() => setDialogOpen(true)}>
            <Scissors className="mr-1 h-3 w-3" /> Gerar plano de corte
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 mb-3.5">
        <KpiCard label="Fila de produção" value={`${resultadoAtivo.alocadas.length + resultadoAtivo.restantes.length} peças`} hint={`${resultadoAtivo.restantes.length} não alocada(s)`} />
        <KpiCard label="Chapas em uso" value="1" hint={`${chapaAtiva.largura}×${chapaAtiva.altura}mm`} />
        <KpiCard
          label="Aproveitamento"
          value={`${aproveitamentoStr}%`}
          hint={parseFloat(aproveitamentoStr) >= 85 ? "Meta ≥ 85%" : "Abaixo da meta"}
          hintTone={parseFloat(aproveitamentoStr) >= 85 ? "success" : "warning"}
        />
        <KpiCard
          label="Quebras / retrabalho"
          value={resultadoAtivo.restantes.length > 0 ? `${resultadoAtivo.restantes.length} sobra(s)` : "0%"}
          hint={resultadoAtivo.restantes.length > 0 ? "Peças não couberam" : "Sem perdas"}
          hintTone={resultadoAtivo.restantes.length > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2 mb-3.5">
        <ErpCard title={`Plano de corte — Chapa ${chapaAtiva.largura}×${chapaAtiva.altura}mm`}>
          <svg
            viewBox={`0 0 ${chapaAtiva.largura} ${chapaAtiva.altura}`}
            className="w-full h-auto rounded border border-border bg-muted/30"
          >
            {/* Fundo da chapa */}
            <rect x="0" y="0" width={chapaAtiva.largura} height={chapaAtiva.altura} fill="hsl(var(--muted))" />

            {/* Peças alocadas */}
            {resultadoAtivo.alocadas.map((a) => {
              const cor = (a.peca.osId && CORES_OS[a.peca.osId]) || COR_PADRAO;
              const w = a.rotacionada ? a.peca.altura : a.peca.largura;
              const h = a.rotacionada ? a.peca.largura : a.peca.altura;
              const labelRot = a.rotacionada ? " ↻" : "";
              return (
                <g key={`${a.peca.id}-${a.x}-${a.y}`}>
                  <rect
                    x={a.x + GAP / 2}
                    y={a.y + GAP / 2}
                    width={w - GAP}
                    height={h - GAP}
                    fill={cor}
                    fillOpacity="0.18"
                    stroke={cor}
                    strokeWidth="8"
                    rx="4"
                  />
                  <text
                    x={a.x + w / 2}
                    y={a.y + h / 2 - 30}
                    fill={cor}
                    fontSize="100"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontWeight="600"
                  >
                    {a.peca.id}{labelRot}
                  </text>
                  <text
                    x={a.x + w / 2}
                    y={a.y + h / 2 + 80}
                    fill={cor}
                    fontSize="70"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity="0.7"
                  >
                    {a.peca.largura}×{a.peca.altura}
                  </text>
                  {a.peca.osId && (
                    <text
                      x={a.x + w / 2}
                      y={a.y + h / 2 + 160}
                      fill={cor}
                      fontSize="60"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      opacity="0.5"
                    >
                      OS {a.peca.osId}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Sobra destacada */}
            {resultadoAtivo.restantes.length > 0 && (
              <text
                x={chapaAtiva.largura / 2}
                y={chapaAtiva.altura - 60}
                fill="hsl(var(--destructive))"
                fontSize="80"
                textAnchor="middle"
                dominantBaseline="middle"
                opacity="0.6"
              >
                {resultadoAtivo.restantes.length} peça(s) não alocada(s)
              </text>
            )}
          </svg>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
            <div><div className="text-muted-foreground text-[10px]">Aproveitamento</div><div className="font-medium">{aproveitamentoStr}%</div></div>
            <div><div className="text-muted-foreground text-[10px]">Sobra</div><div className="font-medium">{areaSobraM2} m²</div></div>
            <div><div className="text-muted-foreground text-[10px]">Peças</div><div className="font-medium">{resultadoAtivo.alocadas.length} / {resultadoAtivo.alocadas.length + resultadoAtivo.restantes.length}</div></div>
          </div>
        </ErpCard>

        <ErpCard title="Fila de processamento — Hoje">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 text-left text-[10px] font-medium text-muted-foreground">
                <th className="py-1.5">#</th>
                <th>Peça</th>
                <th>OS</th>
                <th>Tipo</th>
                <th>Resp.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filaProcessamento.map((f) => (
                <tr key={f.ordem} className="border-b border-border/40 last:border-0 text-[11px]">
                  <td className="py-1.5">{f.ordem}</td>
                  <td>{f.peca}</td>
                  <td>{f.os}</td>
                  <td>{f.tipo}</td>
                  <td>{f.responsavel}</td>
                  <td><StatusBadge variant={f.variant}>{f.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ErpCard>
      </div>

      <ErpCard title="Catálogo de processamentos">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {tiposProcessamento.map((t) => (
            <div key={t.titulo} className="rounded-md border border-border/60 p-2.5">
              <div className="text-xs font-medium">{t.titulo}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</div>
            </div>
          ))}
        </div>
      </ErpCard>

      {/* Diálogo de geração de plano de corte */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar plano de corte</DialogTitle>
            <DialogDescription>
              Configure a chapa e as peças para otimizar o corte. O algoritmo Shelf First-Fit distribui as peças para maximizar o aproveitamento.
            </DialogDescription>
          </DialogHeader>

          {/* Dimensões da chapa */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Dimensões da chapa (mm)</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="chapa-largura">Largura</Label>
                <Input
                  id="chapa-largura"
                  type="number"
                  value={chapaLargura}
                  onChange={(e) => setChapaLargura(e.target.value)}
                  placeholder="3000"
                  min="1"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="chapa-altura">Altura</Label>
                <Input
                  id="chapa-altura"
                  type="number"
                  value={chapaAltura}
                  onChange={(e) => setChapaAltura(e.target.value)}
                  placeholder="2100"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Lista de peças */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Peças para corte</div>
              <Button variant="outline" size="sm" onClick={addPeca} className="h-7 text-xs">
                <Plus className="mr-1 h-3 w-3" /> Adicionar peça
              </Button>
            </div>

            <div className="space-y-2">
              {pecasForm.map((p, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Largura (mm)</Label>
                    <Input
                      type="number"
                      value={p.largura}
                      onChange={(e) => updatePeca(idx, "largura", e.target.value)}
                      placeholder="600"
                      min="1"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Altura (mm)</Label>
                    <Input
                      type="number"
                      value={p.altura}
                      onChange={(e) => updatePeca(idx, "altura", e.target.value)}
                      placeholder="2000"
                      min="1"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">OS</Label>
                    <Input
                      value={p.osId}
                      onChange={(e) => updatePeca(idx, "osId", e.target.value)}
                      placeholder="#0348"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 pb-1">
                    <Checkbox
                      id={`rot-${idx}`}
                      checked={p.rotacionavel}
                      onCheckedChange={(checked) => updatePeca(idx, "rotacionavel", !!checked)}
                    />
                    <Label htmlFor={`rot-${idx}`} className="text-[10px] cursor-pointer">
                      <RotateCw className="h-3 w-3" />
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removePeca(idx)}
                    disabled={pecasForm.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGerarPlano}>
              <Scissors className="mr-1 h-3.5 w-3.5" /> Gerar plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
