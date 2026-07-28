import { describe, expect, it } from "vitest";
import { calcularValorTotalLinha } from "@/lib/sales/calculadoraModula";
import { resolverServico } from "@/lib/sales/resolverServico";

const VALORES_ESPERADOS: Record<string, number> = {
  PPI8: 480,
  PPV8: 620,
  PP2V8: 720,
  PPI10: 600,
  PCI2: 565,
  PCV2: 665,
  PCI4: 625,
  PCV4: 725,
  PCEI: 655,
  PCEV: 755,
  JI8: 465,
  JV8: 565,
  PGV: 605,
  PGI: 555,
  BI: 465,
  BV: 525,
  JT: 85,
  PBPV: 780,
  PBPI: 760,
  FPA: 410,
  FPV: 530,
  FV: 520,
  VFI: 385,
  VFV: 380,
  VC4: 265,
  VC6: 290,
  VCR4: 192,
};

describe("T6.1 — valores de venda dos 27 serviços", () => {
  it("bate com a tabela da planilha para L=1, A=1, Q=1", () => {
    for (const [codigo, esperado] of Object.entries(VALORES_ESPERADOS)) {
      const calculo = calcularValorTotalLinha(
        { codigoServico: codigo, largura: 1, altura: 1, quantidade: 1, adicional: 0 },
        resolverServico(codigo),
      );
      expect(calculo.valorTotal).toBeCloseTo(esperado, 2);
    }
  });
});

