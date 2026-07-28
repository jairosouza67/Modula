import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { montarModeloPdfOrcamento, renderHtmlOrcamentoProfissional } from "@/lib/sales/pdfOrcamento";

interface PreviewOrcamentoProps {
  open: boolean;
  onClose: () => void;
  orcamento: Parameters<typeof montarModeloPdfOrcamento>[0];
  tiposVidro: Parameters<typeof montarModeloPdfOrcamento>[1];
  processamentos: Parameters<typeof montarModeloPdfOrcamento>[2];
}

export function PreviewOrcamento({ open, onClose, orcamento, tiposVidro, processamentos }: PreviewOrcamentoProps) {
  const [logoBase64, setLogoBase64] = useState('');
  const [kitImagens, setKitImagens] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/images/logo-modula.png')
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(() => {});
  }, []);

  // Carrega imagens dos kits quando o preview abre
  useEffect(() => {
    if (!open) return;
    const modelo = montarModeloPdfOrcamento(orcamento, tiposVidro, processamentos);
    const pathsUnicos = [...new Set(
      modelo.itens.map((i) => i.imagemPath).filter((p): p is string => !!p)
    )];
    if (pathsUnicos.length === 0) return;

    Promise.all(
      pathsUnicos.map(async (path) => {
        try {
          const r = await fetch(path);
          if (!r.ok) return [path, ''] as const;
          const blob = await r.blob();
          const b64 = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result as string);
            reader.onerror = () => res('');
            reader.readAsDataURL(blob);
          });
          return [path, b64] as const;
        } catch {
          return [path, ''] as const;
        }
      })
    ).then((entries) => {
      setKitImagens(Object.fromEntries(entries));
    });
  }, [open, orcamento, tiposVidro, processamentos]);

  const modelo = montarModeloPdfOrcamento(orcamento, tiposVidro, processamentos);
  const html = renderHtmlOrcamentoProfissional(modelo, logoBase64, kitImagens);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Preview do Orçamento</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 px-6 pb-6">
          <iframe title="Preview do orçamento" srcDoc={html} className="w-full h-full rounded-md border" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
