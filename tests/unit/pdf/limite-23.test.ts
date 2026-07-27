import { describe, expect, it } from "vitest";
import { MAX_ITENS_PDF, limitarItensPdf } from "@/lib/sales/pdfOrcamento";

describe("T5.2 — limite de itens", () => {
  it("limita a 23 itens por orçamento", () => {
    const itens = Array.from({ length: 30 }, (_, i) => i + 1);
    const limitado = limitarItensPdf(itens);

    expect(MAX_ITENS_PDF).toBe(23);
    expect(limitado).toHaveLength(23);
  });
});

