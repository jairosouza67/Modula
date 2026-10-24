import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const AUTH_SESSION_KEY = "modulaapp:auth:session";
const AUTH_USERS_KEY = "modulaapp:auth:users";

describe("auth/storage — sessão persistida", () => {
  let mod: any;
  let store: Record<string, string>;

  beforeEach(async () => {
    vi.resetModules();
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
    mod = await import("@/lib/auth/storage");
  });

  afterEach(() => {
    delete (globalThis as any).window;
  });

  const session = {
    user: {
      id: "usr-1",
      name: "Ana Souza",
      email: "ana@modula.com",
      role: "gestor" as const,
    },
    accessToken: "token-abc",
    expiresAt: "2026-12-31T23:59:59.000Z",
  };

  it("grava e lê a sessão com round-trip", () => {
    mod.setStoredSession(session);
    const result = mod.getStoredSession();
    expect(result).toEqual(session);
    expect(result.user.role).toBe("gestor");
  });

  it("retorna null quando não há sessão armazenada", () => {
    expect(mod.getStoredSession()).toBeNull();
  });

  it("remove a sessão do storage", () => {
    mod.setStoredSession(session);
    mod.clearStoredSession();
    expect(mod.getStoredSession()).toBeNull();
    expect(store[AUTH_SESSION_KEY]).toBeUndefined();
  });

  it("apaga chave corrompida e retorna null em vez de lançar", () => {
    store[AUTH_SESSION_KEY] = "{isto-nao-e-json";
    expect(mod.getStoredSession()).toBeNull();
    expect(store[AUTH_SESSION_KEY]).toBeUndefined();
  });
});

describe("auth/storage — usuários mock (somente DEV)", () => {
  let mod: any;
  let store: Record<string, string>;

  beforeEach(async () => {
    vi.resetModules();
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
    mod = await import("@/lib/auth/storage");
  });

  afterEach(() => {
    delete (globalThis as any).window;
  });

  it("retorna lista de usuários padrão em desenvolvimento", () => {
    const users = mod.getStoredMockUsers();
    expect(Array.isArray(users)).toBe(true);
  });

  it("persiste a lista de usuários e relê do storage", () => {
    const custom = [
      { id: "u1", name: "Teste", email: "t@t.com", role: "vendedor", password: "x" },
    ];
    mod.saveStoredMockUsers(custom);
    expect(mod.getStoredMockUsers()).toEqual(custom);
  });

  it("atualiza o papel de um usuário específico sem alterar os demais", () => {
    const base = [
      { id: "u1", name: "A", email: "a@a.com", role: "vendedor", password: "x" },
      { id: "u2", name: "B", email: "b@b.com", role: "tecnico", password: "x" },
    ];
    mod.saveStoredMockUsers(base);

    const updated = mod.updateStoredMockUserRole("u1", "admin");
    expect(updated).toHaveLength(2);
    expect(updated.find((u: any) => u.id === "u1").role).toBe("admin");
    expect(updated.find((u: any) => u.id === "u2").role).toBe("tecnico");
  });

  it("updateStoredMockUserRole não quebra quando userId não existe", () => {
    const base = [
      { id: "u1", name: "A", email: "a@a.com", role: "vendedor", password: "x" },
    ];
    mod.saveStoredMockUsers(base);

    const result = mod.updateStoredMockUserRole("inexistente", "admin");
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("vendedor");
  });

  it("adiciona novo usuário à lista persistida", () => {
    mod.saveStoredMockUsers([]);
    mod.addStoredMockUser({
      id: "novo",
      name: "Novo",
      email: "novo@modula.com",
      role: "gestor",
      password: "123",
    });

    const users = mod.getStoredMockUsers();
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe("novo");
  });

  it("addStoredMockUser preserva os usuários já existentes", () => {
    mod.saveStoredMockUsers([
      { id: "a", name: "A", email: "a@a.com", role: "tecnico", password: "x" },
    ]);
    mod.addStoredMockUser({
      id: "b",
      name: "B",
      email: "b@b.com",
      role: "vendedor",
      password: "x",
    });

    const users = mod.getStoredMockUsers();
    expect(users).toHaveLength(2);
    expect(users.map((u: any) => u.id)).toEqual(["a", "b"]);
  });
});