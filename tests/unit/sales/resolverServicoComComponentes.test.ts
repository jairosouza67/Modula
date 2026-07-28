import { describe, expect, it } from "vitest";
import { resolverServicoComComponentes, resolverServico } from "@/lib/sales/resolverServico";
import { calcularValorTotalLinha } from "@/lib/sales/calculadoraModula";
import type { OrcamentoComponente } from "@/lib/sales/types";

describe("resolverServicoComComponentes", () => {
  it("deve retornar o preco normal se todos os componentes estiverem inclusos", () => {
    const original = resolverServico("PPI8");
    const componentes: OrcamentoComponente[] = [
      { codigoProduto: "VI8", quantidade: 1, tipoPreco: "M2", descricao: "Vidro Incolor 8mm", incluido: true },
      { codigoProduto: "PX40", quantidade: 1, tipoPreco: "PC_FX", descricao: "Pivô 40kg", incluido: true },
      { codigoProduto: "KPP", quantidade: 1, tipoPreco: "PC_FX", descricao: "Kit Pivô Premium", incluido: true },
      { codigoProduto: "FX", quantidade: 1, tipoPreco: "PC_FX", descricao: "Fecho", incluido: true },
    ];
    const resolvido = resolverServicoComComponentes("PPI8", componentes);
    expect(resolvido).toEqual(original);
  });

  it("deve deduzir o preco do componente desmarcado e recalcular corretamente", () => {
    // Para PPI8:
    // vlM2 original: 360 (venda de VI8 = 360)
    // pcFx original: 120 (override, soma padrão de PX40 (50) + KPP (80) + FX (40) = 170)
    // Se desmarcarmos FX (PC_FX, venda 40), pcFx deve ser 120 - 40 = 80.
    const componentes: OrcamentoComponente[] = [
      { codigoProduto: "VI8", quantidade: 1, tipoPreco: "M2", descricao: "Vidro Incolor 8mm", incluido: true },
      { codigoProduto: "PX40", quantidade: 1, tipoPreco: "PC_FX", descricao: "Pivô 40kg", incluido: true },
      { codigoProduto: "KPP", quantidade: 1, tipoPreco: "PC_FX", descricao: "Kit Pivô Premium", incluido: true },
      { codigoProduto: "FX", quantidade: 1, tipoPreco: "PC_FX", descricao: "Fecho", incluido: false },
    ];

    const resolvido = resolverServicoComComponentes("PPI8", componentes);
    expect(resolvido.vlM2).toBe(360);
    expect(resolvido.pcFx).toBe(80); // 120 - 40
    expect(resolvido.pcMl).toBe(0);

    const calculo = calcularValorTotalLinha(
      { codigoServico: "PPI8", largura: 1, altura: 2.1, quantidade: 1, adicional: 0 },
      resolvido
    );
    // valorTotal = (largura * altura * quantidade * vlM2) + (quantidade * pcFx) + (largura * quantidade * pcMl) + adicional
    // = (1 * 2.1 * 1 * 360) + (1 * 80) + (1 * 1 * 0) + 0 = 756 + 80 = 836.
    expect(calculo.valorTotal).toBe(836);
  });

  it("deve zerar vlM2 se todos os componentes M2 forem desmarcados", () => {
    const componentes: OrcamentoComponente[] = [
      { codigoProduto: "VI8", quantidade: 1, tipoPreco: "M2", descricao: "Vidro Incolor 8mm", incluido: false },
      { codigoProduto: "PX40", quantidade: 1, tipoPreco: "PC_FX", descricao: "Pivô 40kg", incluido: true },
      { codigoProduto: "KPP", quantidade: 1, tipoPreco: "PC_FX", descricao: "Kit Pivô Premium", incluido: true },
      { codigoProduto: "FX", quantidade: 1, tipoPreco: "PC_FX", descricao: "Fecho", incluido: true },
    ];

    const resolvido = resolverServicoComComponentes("PPI8", componentes);
    expect(resolvido.vlM2).toBe(0);
    expect(resolvido.custoM2).toBe(0);
    expect(resolvido.pcFx).toBe(120);
  });
});
