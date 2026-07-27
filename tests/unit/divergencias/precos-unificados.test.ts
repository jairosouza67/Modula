import { describe, expect, it } from "vitest";
import { obterPrecoProdutoOperacional } from "@/lib/sales/resolverServico";

describe("T4.2 — preços unificados", () => {
  it("EB4, EC4 e VC4 usam os valores finais da planilha", () => {
    expect(obterPrecoProdutoOperacional("EB4").venda).toBe(700);
    expect(obterPrecoProdutoOperacional("EC4").venda).toBe(410);
    expect(obterPrecoProdutoOperacional("VC4").venda).toBe(265);
  });
});

