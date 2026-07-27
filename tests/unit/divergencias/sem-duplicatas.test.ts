import { describe, expect, it } from "vitest";
import { listarCodigosProdutosOperacionais } from "@/lib/sales/resolverServico";

describe("T4.1 — sem duplicatas", () => {
  it("catálogo operacional não possui códigos duplicados", () => {
    const codigos = listarCodigosProdutosOperacionais();
    expect(new Set(codigos).size).toBe(codigos.length);
  });
});

