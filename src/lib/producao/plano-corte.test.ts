import { describe, it, expect } from "vitest";
import { binPacking2D, type Chapa, type Peca } from "./plano-corte";

describe("Sprint 8: Plano de Corte (Bin Packing 2D)", () => {
  it("deve alocar peças corretamente e calcular o aproveitamento", () => {
    const chapa: Chapa = { id: "C-01", largura: 3210, altura: 2000 };
    const pecas: Peca[] = [
      { id: "P-01", largura: 1000, altura: 1000 },
      { id: "P-02", largura: 1000, altura: 1000 },
      { id: "P-03", largura: 1000, altura: 1000 },
    ];

    const resultado = binPacking2D(chapa, pecas);

    expect(resultado.alocadas).toHaveLength(3);
    expect(resultado.restantes).toHaveLength(0);

    // As três peças devem caber na mesma prateleira, pois 3 * 1000 = 3000 <= 3210
    expect(resultado.alocadas[0].x).toBe(0);
    expect(resultado.alocadas[0].y).toBe(0);
    expect(resultado.alocadas[1].x).toBe(1000);
    expect(resultado.alocadas[1].y).toBe(0);
    expect(resultado.alocadas[2].x).toBe(2000);
    expect(resultado.alocadas[2].y).toBe(0);

    // Área peças = 3 * 1.000.000 = 3.000.000
    // Área chapa = 3210 * 2000 = 6.420.000
    // Aproveitamento = 3000000 / 6420000 = 46.7289%
    expect(resultado.aproveitamento).toBeCloseTo(46.73);
  });

  it("deve rejeitar peças que não cabem na chapa", () => {
    const chapa: Chapa = { id: "C-01", largura: 1000, altura: 1000 };
    const pecas: Peca[] = [
      { id: "P-01", largura: 500, altura: 500 },
      { id: "P-02", largura: 1200, altura: 500 }, // não cabe
      { id: "P-03", largura: 500, altura: 500 },
    ];

    const resultado = binPacking2D(chapa, pecas);

    expect(resultado.alocadas).toHaveLength(2);
    expect(resultado.restantes).toHaveLength(1);
    expect(resultado.restantes[0].id).toBe("P-02");
    
    // Área alocada = 250k + 250k = 500k. Chapa = 1M. Aprov = 50%
    expect(resultado.aproveitamento).toBe(50.00);
  });
});
