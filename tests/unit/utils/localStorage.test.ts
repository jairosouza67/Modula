import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readJson, writeJson, isBrowser } from "@/lib/utils/localStorage";

describe("isBrowser", () => {
  it("retorna true em ambiente com window", () => {
    (globalThis as any).window = { localStorage: {} };
    expect(isBrowser()).toBe(true);
    delete (globalThis as any).window;
  });

  it("retorna false em ambiente sem window", () => {
    expect(isBrowser()).toBe(false);
  });
});

describe("readJson / writeJson", () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    (globalThis as any).window = {
      localStorage: {
        getItem: vi.fn((k: string) => store[k] ?? null),
        setItem: vi.fn((k: string, v: string) => {
          store[k] = v;
        }),
        removeItem: vi.fn((k: string) => {
          delete store[k];
        }),
      },
    };
  });

  afterEach(() => {
    delete (globalThis as any).window;
  });

  it("writeJson serializa e readJson desserializa (round-trip)", () => {
    const data = { id: 1, name: "Modula", tags: ["erp", "vidro"] };
    writeJson("chave", data);
    expect(readJson<typeof data>("chave")).toEqual(data);
  });

  it("readJson retorna null para chave inexistente", () => {
    expect(readJson<any>("nao-existe")).toBeNull();
  });

  it("readJson retorna null e remove a chave em caso de JSON inválido", () => {
    store["lixo"] = "{isto nao é json";
    expect(readJson<any>("lixo")).toBeNull();
    expect(store["lixo"]).toBeUndefined();
  });

  it("writeJson sobrescreve valor anterior", () => {
    writeJson("k", { v: 1 });
    writeJson("k", { v: 2 });
    expect(readJson<any>("k")).toEqual({ v: 2 });
  });

  it("suporta primitivos no writeJson", () => {
    writeJson("num", 42);
    expect(readJson<any>("num")).toBe(42);
  });
});