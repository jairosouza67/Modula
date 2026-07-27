import { describe, expect, it } from "vitest";
import { calcularLucro } from "@/lib/sales/calculoCusto";

describe("T3.5 — PP2V8 negativo aceito", () => {
  it("permite lucro negativo", () => {
    const lucro = calcularLucro(720, 768.4);
    expect(lucro).toBe(-48.4);
  });
});

