import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, X, FileText, Mail, MailCheck } from "lucide-react";
import type { NfeSaida } from "@/hooks/useFiscalData";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import { formatarChaveAcesso, imprimirNfe, normalizarItensNfe, type EmpresaData } from "@/lib/fiscal/pdfNfe";

interface ModalVerNfeProps {
  nfe: NfeSaida | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

function formatarDocumento(doc?: string) {
  if (!doc) return "—";
  const nums = doc.replace(/\D/g, "");
  if (nums.length === 11) return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (nums.length === 14) return nums.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return doc;
}

export function ModalVerNfe({ nfe, open, onOpenChange }: ModalVerNfeProps) {
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmpresa(null);
      return;
    }

    let cancelled = false;
    async function loadEmpresa() {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      const empresaId = getDefaultEmpresaId();
      const { data, error } = await supabase
        .from("empresas")
        .select("razao_social, nome_fantasia, cnpj, endereco, cidade, telefone")
        .eq("id", empresaId)
        .maybeSingle();

      if (!cancelled) {
        if (data && !error) {
          setEmpresa(data);
        } else {
          setEmpresa({
            razao_social: "—",
            nome_fantasia: "—",
            cnpj: "—",
            endereco: "—",
            cidade: "—",
          });
        }
        setLoading(false);
      }
    }

    loadEmpresa();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleImprimir = () => {
    if (!nfe || !empresa) return;
    imprimirNfe(nfe, empresa);
  };

  const itens = nfe ? normalizarItensNfe(nfe) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            Detalhes da NF-e
          </DialogTitle>
        </DialogHeader>

        {!nfe || loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Número</div>
                <div className="text-lg font-mono font-semibold">#{nfe.numero.padStart(9, "0")}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Série</div>
                <div className="font-medium">{nfe.serie}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Status</div>
                <Badge
                  variant={nfe.status === "EMITIDA" ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {nfe.status}
                </Badge>
              </div>
            </div>

            {/* Chave */}
            {nfe.chave_acesso && (
              <div className="rounded-md bg-muted/50 p-3">
                <div className="text-[10px] uppercase text-muted-foreground mb-1">Chave de Acesso</div>
                <div className="font-mono text-xs tracking-wide">{formatarChaveAcesso(nfe.chave_acesso)}</div>
              </div>
            )}

            {/* Datas e valores */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Data de Emissão</div>
                <div className="font-medium">{formatDate(nfe.criado_em)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Valor Total</div>
                <div className="font-semibold text-base">{formatCurrency(nfe.valor_total)}</div>
              </div>
            </div>

            {/* Emitente */}
            <div className="rounded-md border p-3 space-y-1 text-sm">
              <div className="text-[10px] uppercase text-muted-foreground mb-1">Emitente</div>
              <div className="font-medium">{empresa?.razao_social || empresa?.nome_fantasia || "—"}</div>
              <div className="text-muted-foreground text-xs">CNPJ: {formatarDocumento(empresa?.cnpj)}</div>
              <div className="text-muted-foreground text-xs">{empresa?.endereco || "—"}</div>
              <div className="text-muted-foreground text-xs">{empresa?.cidade || "—"}</div>
            </div>

            {/* Destinatário */}
            <div className="rounded-md border p-3 space-y-1 text-sm">
              <div className="text-[10px] uppercase text-muted-foreground mb-1">Destinatário / Tomador</div>
              <div className="font-medium">{nfe.cliente_nome || "—"}</div>
              <div className="text-muted-foreground text-xs">
                CPF/CNPJ: {formatarDocumento(nfe.cliente_documento)}
              </div>
              {nfe.cliente_email && (
                <div className="text-muted-foreground text-xs flex items-center gap-1">
                  {nfe.email_enviado ? (
                    <MailCheck className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Mail className="h-3 w-3" />
                  )}
                  {nfe.cliente_email}
                </div>
              )}
            </div>

            {/* Itens */}
            <div>
              <div className="text-[10px] uppercase text-muted-foreground mb-1">Itens / Serviços</div>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Descrição</th>
                      <th className="text-center p-2 font-medium">Qtd</th>
                      <th className="text-right p-2 font-medium">Vl. Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item, idx) => (
                      <tr key={idx} className="border-t border-border/50">
                        <td className="p-2">{item.descricao}</td>
                        <td className="p-2 text-center">{item.quantidade}</td>
                        <td className="p-2 text-right">{formatCurrency(item.valor_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totais */}
            <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor dos Produtos/Serviços:</span>
                <span className="font-medium">{formatCurrency(nfe.valor_total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impostos (Simples Nacional):</span>
                <span className="font-medium">{formatCurrency(nfe.valor_impostos || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-1 mt-1">
                <span className="font-semibold">Valor Total da Nota:</span>
                <span className="font-semibold">{formatCurrency(nfe.valor_total)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 mt-2 border-t border-border/50">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1.5" /> Fechar
          </Button>
          <Button size="sm" onClick={handleImprimir} disabled={!nfe || !empresa}>
            <Printer className="h-4 w-4 mr-1.5" /> Imprimir / Visualizar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
