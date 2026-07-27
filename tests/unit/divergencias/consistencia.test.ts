import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("T4.5 — consistência do seed", () => {
  it("seed contém valores finais da tabela de decisão", () => {
    const seed = readFileSync(resolve(process.cwd(), "supabase/seed_produtos.sql"), "utf-8");

    expect(seed).toContain("'EB4'");
    expect(seed).toContain("ROUND(700.00/1.46, 2)");
    expect(seed).toContain("'EC4'");
    expect(seed).toContain("ROUND(410.00/1.46, 2)");
    expect(seed).toContain("'VC4'");
    expect(seed).toContain("ROUND(265.00/1.46, 2)");
    expect(seed).toContain("'PBPV'");
    expect(seed).toContain("ROUND(780.00/1.46, 2)");
    expect(seed).toContain("'PBPI'");
    expect(seed).toContain("ROUND(760.00/1.46, 2)");
    expect(seed).toContain("'FPA'");
    expect(seed).toContain("ROUND(410.00/1.46, 2)");
  });
});

