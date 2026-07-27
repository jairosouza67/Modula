import { describe, expect, it } from "vitest";
import { calcularLucro } from "@/lib/sales/calculoCusto";

describe("T3.2 — lucro", () => {
  it("lucro = venda - custo", () => {
    expect(calcularLucro(1000, 650)).toBe(350);
  });
});

