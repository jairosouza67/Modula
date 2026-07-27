/**
 * Mapeamento de código de serviço/kit → caminho da imagem em /public/images/
 * Categorias de kits agrupam serviços que compartilham a mesma foto de referência.
 */
export const KIT_IMAGE_MAP: Record<string, string> = {
  // Porta Pivotante
  PPI8:  "/images/ppi8_ppv8_pp2v8_ppi10_-_porta_pivotante.jpeg",
  PPV8:  "/images/ppi8_ppv8_pp2v8_ppi10_-_porta_pivotante.jpeg",
  PP2V8: "/images/ppi8_ppv8_pp2v8_ppi10_-_porta_pivotante.jpeg",
  PPI10: "/images/ppi8_ppv8_pp2v8_ppi10_-_porta_pivotante.jpeg",

  // Porta de Correr Interna
  PCI2:  "/images/pci2_pcv2_pci4_pcv4_-_porta_de_correr_interna.png",
  PCV2:  "/images/pci2_pcv2_pci4_pcv4_-_porta_de_correr_interna.png",
  PCI4:  "/images/pci2_pcv2_pci4_pcv4_-_porta_de_correr_interna.png",
  PCV4:  "/images/pci2_pcv2_pci4_pcv4_-_porta_de_correr_interna.png",

  // Porta de Correr Externa
  PCEI:  "/images/pcei_pcev_-_porta_de_correr_externa.png",
  PCEV:  "/images/pcei_pcev_-_porta_de_correr_externa.png",

  // Janela de Vidro
  JI8:   "/images/ji8_jv8_-_janela_de_vidro.png",
  JV8:   "/images/ji8_jv8_-_janela_de_vidro.png",

  // Pivotante / Basculante
  PGI:   "/images/pgi_pgv_-_pivotantebasculante.png",
  PGV:   "/images/pgi_pgv_-_pivotantebasculante.png",
  PBPI:  "/images/pgi_pgv_-_pivotantebasculante.png",
  PBPV:  "/images/pgi_pgv_-_pivotantebasculante.png",

  // Box para Banheiro
  BI:    "/images/bi_bv_-_box_para_banheiro.png",
  BV:    "/images/bi_bv_-_box_para_banheiro.png",

  // Espelho Bisotado
  EB4:   "/images/eb4_-_espelho_bisotado.png",

  // Espelho Comum
  EC4:   "/images/ec4_-_espelho_comum.png",

  // Fecha Pia Acrílico
  FPA:   "/images/fpa_-_fecha_pia_acrilico.jpeg",

  // Fecha Pia Vidro
  FPV:   "/images/fpv_-_fecha_pia_vidro.png",

  // Fechamento em Vidro
  FV:    "/images/fv_-_fechamento_em_vidro.jpeg",

  // Vidro Fixo / Bandeira
  VFI:   "/images/vfi_vfv_-_vidro_fixo_e_bandeira.png",
  VFV:   "/images/vfi_vfv_-_vidro_fixo_e_bandeira.png",

  // Jateamento
  JT:    "/images/jateamento.png",
};

/**
 * Retorna o caminho da imagem para o código do kit, ou null se não houver imagem.
 */
export function obterImagemKit(codigoServico: string): string | null {
  return KIT_IMAGE_MAP[codigoServico] ?? null;
}

/**
 * Carrega uma imagem como base64 para embutir no PDF.
 * Retorna string vazia em caso de falha.
 */
export async function carregarImagemBase64(caminho: string): Promise<string> {
  try {
    const response = await fetch(caminho);
    if (!response.ok) return "";
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}
