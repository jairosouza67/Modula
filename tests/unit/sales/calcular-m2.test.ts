import { describe, expect, it } from "vitest";
import { calcularM2 } from "@/lib/sales/calculadoraModula";

describe("T2.1 — calcularM2", () => {
  it("calcula m² = L × A × Q", () => {
    expect(calcularM2(1, 2.1, 1)).toBe(2.1);
    expect(calcularM2(1.2, 2, 2)).toBe(4.8);
  });
});

