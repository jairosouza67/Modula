import { describe, it, expect } from "vitest";
import {
  canAccessModule,
  canAccessPath,
  getModuleFromPath,
  ROLE_PERMISSIONS,
} from "./permissions";
import type { UserRole } from "./types";

// ─── NMAP-02: Bloqueio de rotas por perfil (navegação com mapa de permissões) ─

describe("NMAP-02: ROLE_PERMISSIONS — matriz de acesso por perfil", () => {
  it("superadmin acessa todos os módulos", () => {
    const modules = ROLE_PERMISSIONS["superadmin"];
    expect(modules).toContain("dashboard");
    expect(modules).toContain("financeiro");
    expect(modules).toContain("config");
    expect(modules).toContain("fiscal");
    expect(modules).toContain("rh");
    expect(modules.length).toBeGreaterThanOrEqual(14);
  });

  it("admin acessa todos os módulos", () => {
    const modules = ROLE_PERMISSIONS["admin"];
    expect(modules).toContain("dashboard");
    expect(modules).toContain("financeiro");
    expect(modules).toContain("config");
    expect(modules).toContain("fiscal");
    expect(modules).toContain("rh");
    expect(modules.length).toBeGreaterThanOrEqual(14);
  });

  it("vendedor não acessa config, fiscal, estoque, rh", () => {
    const modules = ROLE_PERMISSIONS["vendedor"];
    expect(modules).not.toContain("config");
    expect(modules).not.toContain("fiscal");
    expect(modules).not.toContain("estoque");
    expect(modules).not.toContain("rh");
  });

  it("tecnico não acessa financeiro, fiscal, config, clientes", () => {
    const modules = ROLE_PERMISSIONS["tecnico"];
    expect(modules).not.toContain("financeiro");
    expect(modules).not.toContain("fiscal");
    expect(modules).not.toContain("config");
    expect(modules).not.toContain("clientes");
  });

  it("financeiro não acessa pedidos, producao, estoque, clientes", () => {
    const modules = ROLE_PERMISSIONS["financeiro"];
    expect(modules).not.toContain("pedidos");
    expect(modules).not.toContain("producao");
    expect(modules).not.toContain("estoque");
    expect(modules).not.toContain("clientes");
  });

  it("gestor acessa tudo exceto config", () => {
    const modules = ROLE_PERMISSIONS["gestor"];
    expect(modules).not.toContain("config");
    expect(modules).toContain("dashboard");
    expect(modules).toContain("rh");
    expect(modules).toContain("fiscal");
  });
});

describe("NMAP-02: canAccessModule — verificação por módulo e role", () => {
  const cases: Array<[UserRole, string, boolean]> = [
    ["superadmin", "config", true],
    ["superadmin", "fiscal", true],
    ["superadmin", "rh", true],
    ["admin", "config", true],
    ["admin", "fiscal", true],
    ["vendedor", "config", false],
    ["vendedor", "orcamentos", true],
    ["tecnico", "estoque", true],
    ["tecnico", "financeiro", false],
    ["financeiro", "financeiro", true],
    ["financeiro", "pedidos", false],
    ["gestor", "dashboard", true],
    ["gestor", "config", false],
  ];

  for (const [role, module, expected] of cases) {
    it(`${role} ${expected ? "pode" : "não pode"} acessar ${module}`, () => {
      expect(canAccessModule(role, module as never)).toBe(expected);
    });
  }
});

describe("NMAP-02: getModuleFromPath — resolução de rota para módulo", () => {
  it("resolve /dashboard para dashboard", () => {
    expect(getModuleFromPath("/dashboard")).toBe("dashboard");
  });

  it("resolve sub-rota /pedidos/123 para pedidos", () => {
    expect(getModuleFromPath("/pedidos/123")).toBe("pedidos");
  });

  it("retorna null para rota desconhecida", () => {
    expect(getModuleFromPath("/pagina-inexistente")).toBeNull();
  });

  it("é case-insensitive", () => {
    expect(getModuleFromPath("/DASHBOARD")).toBe("dashboard");
  });
});

describe("NMAP-02: canAccessPath — verificação por path completo", () => {
  it("admin pode acessar /config", () => {
    expect(canAccessPath("admin", "/config")).toBe(true);
  });

  it("vendedor não pode acessar /config", () => {
    expect(canAccessPath("vendedor", "/config")).toBe(false);
  });

  it("rota desconhecida libera acesso (fallback permissivo)", () => {
    expect(canAccessPath("vendedor", "/alguma-rota-externa")).toBe(true);
  });

  it("tecnico pode acessar /estoque", () => {
    expect(canAccessPath("tecnico", "/estoque")).toBe(true);
  });

  it("financeiro não pode acessar /estoque", () => {
    expect(canAccessPath("financeiro", "/estoque")).toBe(false);
  });
});

// ─── NMAP-03: Bloqueio de OS por estoque crítico ─────────────────────────────

import { calcularStatusEstoque } from "../inventory/estoque";


describe("NMAP-03: bloqueio de OS por estoque crítico", () => {
  /**
   * A regra de negócio: uma OS não deve ser iniciada (movida para "Em Producao")
   * se algum material vinculado está com status "Crítico".
   * Aqui testamos a função de status que seria chamada na validação.
   */

  it("item com qtd=0 gera status Crítico (bloqueia OS)", () => {
    expect(calcularStatusEstoque(0, 5)).toBe("Crítico");
  });

  it("item com qtd < mínimo gera status Crítico (bloqueia OS)", () => {
    expect(calcularStatusEstoque(2, 10)).toBe("Crítico");
  });

  it("item com qtd === mínimo gera status Atenção (aviso, não bloqueia)", () => {
    expect(calcularStatusEstoque(5, 5)).toBe("Atenção");
  });

  it("item com qtd acima do mínimo gera status OK (libera OS)", () => {
    expect(calcularStatusEstoque(20, 5)).toBe("OK");
  });

  it("lógica de bloqueio: OS deve ser bloqueada se QUALQUER item for Crítico", () => {
    // Simula a verificação que o sistema faria antes de mover OS para Em Producao
    const materiais = [
      { quantidade: 10, estoqueMinimo: 5 }, // OK
      { quantidade: 2, estoqueMinimo: 8 },  // Crítico
      { quantidade: 6, estoqueMinimo: 5 },  // Atenção
    ];

    const temMaterialCritico = materiais.some(
      (m) => calcularStatusEstoque(m.quantidade, m.estoqueMinimo) === "Crítico",
    );

    expect(temMaterialCritico).toBe(true);
  });

  it("OS pode iniciar quando todos os materiais têm status OK ou Atenção", () => {
    const materiais = [
      { quantidade: 10, estoqueMinimo: 5 }, // OK
      { quantidade: 5, estoqueMinimo: 5 },  // Atenção
    ];

    const temMaterialCritico = materiais.some(
      (m) => calcularStatusEstoque(m.quantidade, m.estoqueMinimo) === "Crítico",
    );

    expect(temMaterialCritico).toBe(false);
  });
});
