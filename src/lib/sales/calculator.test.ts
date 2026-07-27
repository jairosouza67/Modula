import { describe, it, expect } from "vitest";
import {
  calcularArea,
  calcularItem,
  calcularTotalOrcamento,
  calcularAreaTotal,
  type OrcamentoItem,
} from "./calculator";

describe("Sales Calculator", () => {
  describe("calcularArea", () => {
    it("should calculate area correctly for standard dimensions", () => {
      // 1000mm x 1000mm x 1 = 1m2
      expect(calcularArea(1000, 1000, 1)).toBe(1);
    });

    it("should handle decimals correctly", () => {
      // 1200mm x 2100mm x 2 = 5.04m2
      expect(calcularArea(1200, 2100, 2)).toBe(5.04);
    });

    it("should handle multiple quantities", () => {
      // 500mm x 500mm x 4 = 1m2
      expect(calcularArea(500, 500, 4)).toBe(1);
    });
  });

  describe("calcularItem", () => {
    it("should calculate total for an item without processing cost", () => {
      const item: OrcamentoItem = {
        produtoCodigo: "VI8",
        largura: 1000,
        altura: 1000,
        quantidade: 2,
        processamentoCodigo: "",
      };
      
      const precoBaseRef = 150; // 150 per m2
      const custoProcRef = 0; // 0 per unit

      const calc = calcularItem(item, precoBaseRef, custoProcRef);

      expect(calc.area).toBe(2);
      expect(calc.precoBase).toBe(150);
      expect(calc.procTotal).toBe(0);
      expect(calc.total).toBe(300); // 2m2 * 150
    });

    it("should calculate total for an item with processing cost", () => {
      const item: OrcamentoItem = {
        produtoCodigo: "VI8",
        largura: 1200,
        altura: 2100,
        quantidade: 2,
        processamentoCodigo: "LP",
      };
      
      const precoBaseRef = 200; // 200 per m2
      const custoProcRef = 35; // 35 per unit

      const calc = calcularItem(item, precoBaseRef, custoProcRef);

      expect(calc.area).toBe(5.04);
      expect(calc.procTotal).toBe(70); // 35 * 2
      expect(calc.total).toBe(1078); // (5.04 * 200) + 70 = 1008 + 70
    });
  });

  describe("Totals", () => {
    it("should sum up total budget and total area correctly", () => {
      const itens = [
        { area: 2, precoBase: 150, procTotal: 0, total: 300 },
        { area: 5.04, precoBase: 200, procTotal: 70, total: 1078 },
      ];

      expect(calcularTotalOrcamento(itens)).toBe(1378);
      expect(calcularAreaTotal(itens)).toBe(7.04);
    });
  });
});
