import { describe, expect, it } from "vitest";
import { listarCodigosProdutosOperacionais } from "@/lib/sales/resolverServico";

describe("T4.4 — BVF canônico", () => {
  it("usa BVF e não usa VBV", () => {
    const codigos = listarCodigosProdutosOperacionais();
    expect(codigos).toContain("BVF");
    expect(codigos).not.toContain("VBV");
  });
});

