import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { userFriendlyError } from "@/lib/errors/sanitize";

describe("userFriendlyError — mensagens amigáveis", () => {
  beforeEach(() => {
    // Ambiente de teste representa produção: helpers devem retornar mensagem amigável,
    // a menos que o próprio teste stubbe DEV=true.
    vi.stubEnv("DEV", false);
    vi.stubEnv("PROD", true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retorna fallback genérico quando mensagem não casa", () => {
    const result = userFriendlyError("Operação", new Error("xyz"));
    expect(result).toBe("Operação: não foi possível completar a operação. Tente novamente mais tarde.");
  });

  it("mapeia erro de unicidade para mensagem de duplicação", () => {
    const cases = [
      "duplicate key value violates unique constraint",
      "Unique constraint failed on the field: email",
      "23505",
      "already exists",
    ];
    for (const msg of cases) {
      expect(userFriendlyError("Cadastrar", new Error(msg))).toBe(
        "Cadastrar: registro duplicado. Verifique se os dados já não estão cadastrados.",
      );
    }
  });

  it("mapeia erro de chave estrangeira para mensagem de uso", () => {
    const cases = [
      "violates foreign key constraint",
      "is still referenced by other rows",
      "23503",
    ];
    for (const msg of cases) {
      expect(userFriendlyError("Remover", new Error(msg))).toBe(
        "Remover: este registro está em uso e não pode ser removido ou alterado.",
      );
    }
  });

  it("mapeia erro de RLS/permission denied", () => {
    const cases = [
      "permission denied for table colaboradores",
      "new row violates row-level security policy",
      "42501",
    ];
    for (const msg of cases) {
      expect(userFriendlyError("Salvar", new Error(msg))).toBe(
        "Salvar: você não tem permissão para realizar esta ação.",
      );
    }
  });

  it("mapeia erros de sessão/jwt", () => {
    const cases = [
      "JWT expired",
      "token is expired",
      "invalid jwt token",
      "refresh_token_not_found",
      "session_not_found",
    ];
    for (const msg of cases) {
      expect(userFriendlyError("Atualizar", new Error(msg))).toBe(
        "Atualizar: sua sessão expirou. Faça login novamente.",
      );
    }
  });

  it("mapeia erros de rede", () => {
    const cases = ["network error", "failed to fetch", "fetch failed"];
    for (const msg of cases) {
      expect(userFriendlyError("Sincronizar", new Error(msg))).toBe(
        "Sincronizar: erro de conexão. Verifique sua internet e tente novamente.",
      );
    }
  });

  it("em modo DEV inclui a mensagem técnica na saída", () => {
    vi.stubEnv("DEV", true);
    const result = userFriendlyError("Contexto", new Error("detalhe técnico"));
    expect(result).toBe("Contexto: detalhe técnico");
  });

  it("em modo PROD retorna mensagem amigável mesmo para erros incomuns", () => {
    vi.stubEnv("DEV", false);
    const result = userFriendlyError("Contexto", new Error("detalhe técnico"));
    expect(result).toBe(
      "Contexto: não foi possível completar a operação. Tente novamente mais tarde.",
    );
  });

  it("aceita um erro que não seja Error (string/obj)", () => {
    const a = userFriendlyError("Ctx", "duplicate key" as any);
    const b = userFriendlyError("Ctx", { message: "23505" } as unknown as Error);
    expect(a).toMatch(/registro duplicado/);
    expect(b).toMatch(/registro duplicado/);
  });
});