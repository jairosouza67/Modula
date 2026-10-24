import { describe, it, expect } from "vitest";
import {
  getModuleFromPath,
  canAccessModule,
  canAccessPath,
  ROLE_PERMISSIONS,
  type AppModule,
} from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";

describe("Permissions — mapeamento de path para módulo", () => {
  it("mapeia cada path raiz para o módulo correspondente", () => {
    const pairs: Array<[string, AppModule]> = [
      ["/dashboard", "dashboard"],
      ["/orcamentos", "orcamentos"],
      ["/pedidos", "pedidos"],
      ["/producao", "producao"],
      ["/clientes", "clientes"],
      ["/fornecedores", "fornecedores"],
      ["/produtos", "produtos"],
      ["/compras", "compras"],
      ["/estoque", "estoque"],
      ["/instalacoes", "instalacoes"],
      ["/financeiro", "financeiro"],
      ["/fiscal", "fiscal"],
      ["/pagamentos", "pagamentos"],
      ["/rh", "rh"],
      ["/relatorios", "relatorios"],
      ["/config", "config"],
    ];

    for (const [path, module] of pairs) {
      expect(getModuleFromPath(path)).toBe(module);
    }
  });

  it("normaliza path com caixa mista", () => {
    expect(getModuleFromPath("/Dashboard")).toBe("dashboard");
    expect(getModuleFromPath("/ORCAMENTOS")).toBe("orcamentos");
  });

  it("resolve sub-rotas via startsWith", () => {
    expect(getModuleFromPath("/orcamentos/novo")).toBe("orcamentos");
    expect(getModuleFromPath("/financeiro/baixa")).toBe("financeiro");
    expect(getModuleFromPath("/rh/colaboradores/1")).toBe("rh");
  });

  it("retorna null para path desconhecido", () => {
    expect(getModuleFromPath("/rota-inexistente")).toBeNull();
    expect(getModuleFromPath("/")).toBeNull();
  });

  it("não confunde prefixo parcial de módulo com outro módulo", () => {
    // "/financeiroXYZ" não deve resolver como financeiro
    expect(getModuleFromPath("/financeiroXYZ")).toBeNull();
  });
});

describe("Permissions — matriz de acesso por papel", () => {
  it("superadmin e admin acessam todos os módulos", () => {
    const allModules = Object.values(ROLE_PERMISSIONS.superadmin);
    for (const module of allModules) {
      expect(canAccessModule("superadmin", module)).toBe(true);
      expect(canAccessModule("admin", module)).toBe(true);
    }
  });

  it("admin e superadmin compartilham exatamente a mesma lista", () => {
    expect(ROLE_PERMISSIONS.admin).toEqual(ROLE_PERMISSIONS.superadmin);
  });

  it("gestor acessa todos os módulos exceto config", () => {
    expect(canAccessModule("gestor", "config")).toBe(false);
    expect(canAccessModule("gestor", "dashboard")).toBe(true);
    expect(canAccessModule("gestor", "financeiro")).toBe(true);
    expect(ROLE_PERMISSIONS.gestor).toHaveLength(15);
  });

  it("vendedor tem acesso restrito", () => {
    const permitidos = ["dashboard", "orcamentos", "pedidos", "clientes", "produtos", "financeiro", "pagamentos"];
    for (const module of permitidos) {
      expect(canAccessModule("vendedor", module as AppModule)).toBe(true);
    }
    for (const module of ["compras", "estoque", "fiscal", "rh", "relatorios", "config", "producao"]) {
      expect(canAccessModule("vendedor", module as AppModule)).toBe(false);
    }
    expect(ROLE_PERMISSIONS.vendedor).toHaveLength(7);
  });

  it("tecnico acessa apenas operação", () => {
    const permitidos = ["dashboard", "pedidos", "producao", "estoque", "instalacoes"];
    for (const module of permitidos) {
      expect(canAccessModule("tecnico", module as AppModule)).toBe(true);
    }
    expect(canAccessModule("tecnico", "financeiro")).toBe(false);
    expect(canAccessModule("tecnico", "config")).toBe(false);
    expect(ROLE_PERMISSIONS.tecnico).toHaveLength(5);
  });

  it("financeiro não acessa operação nem config", () => {
    const permitidos = ["dashboard", "financeiro", "fiscal", "pagamentos", "relatorios", "fornecedores", "produtos"];
    for (const module of permitidos) {
      expect(canAccessModule("financeiro", module as AppModule)).toBe(true);
    }
    for (const module of ["producao", "instalacoes", "estoque", "rh", "compras", "config"]) {
      expect(canAccessModule("financeiro", module as AppModule)).toBe(false);
    }
  });

  it("nenhum papel além de admin/superadmin acessa config", () => {
    const roles: UserRole[] = ["gestor", "vendedor", "tecnico", "financeiro"];
    for (const role of roles) {
      expect(canAccessModule(role, "config")).toBe(false);
    }
  });
});

describe("Permissions — canAccessPath", () => {
  it("nega path de módulo não permitido para o papel", () => {
    expect(canAccessPath("vendedor", "/compras")).toBe(false);
    expect(canAccessPath("tecnico", "/financeiro")).toBe(false);
    expect(canAccessPath("financeiro", "/rh")).toBe(false);
  });

  it("libera path de módulo permitido", () => {
    expect(canAccessPath("vendedor", "/orcamentos")).toBe(true);
    expect(canAccessPath("tecnico", "/producao")).toBe(true);
    expect(canAccessPath("financeiro", "/fiscal")).toBe(true);
  });

  it("libera sub-rotas conforme o módulo raiz", () => {
    expect(canAccessPath("vendedor", "/orcamentos/editar/123")).toBe(true);
    expect(canAccessPath("vendedor", "/compras/pedidos/1")).toBe(false);
  });

  it("permite paths fora da matriz (fallback permissivo)", () => {
    expect(canAccessPath("vendedor", "/pagina-publica")).toBe(true);
    expect(canAccessPath("tecnico", "/")).toBe(true);
  });
});