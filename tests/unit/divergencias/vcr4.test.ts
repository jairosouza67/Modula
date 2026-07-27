import { describe, expect, it } from "vitest";
import { resolverServico } from "@/lib/sales/resolverServico";

describe("T4.3 — VCR4", () => {
  it("mantém venda operacional de R$ 192/m²", () => {
    expect(resolverServico("VCR4").vlM2).toBe(192);
  });
});

