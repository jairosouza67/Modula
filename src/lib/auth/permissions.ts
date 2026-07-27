import type { UserRole } from "./types";

export type AppModule =
  | "dashboard"
  | "orcamentos"
  | "pedidos"
  | "producao"
  | "clientes"
  | "fornecedores"
  | "produtos"
  | "compras"
  | "estoque"
  | "instalacoes"
  | "financeiro"
  | "fiscal"
  | "pagamentos"
  | "rh"
  | "relatorios"
  | "config";

const PATH_TO_MODULE: Record<string, AppModule> = {
  "/dashboard": "dashboard",
  "/orcamentos": "orcamentos",
  "/pedidos": "pedidos",
  "/producao": "producao",
  "/clientes": "clientes",
  "/fornecedores": "fornecedores",
  "/produtos": "produtos",
  "/compras": "compras",
  "/estoque": "estoque",
  "/instalacoes": "instalacoes",
  "/financeiro": "financeiro",
  "/fiscal": "fiscal",
  "/pagamentos": "pagamentos",
  "/rh": "rh",
  "/relatorios": "relatorios",
  "/config": "config",
};

export const ROLE_PERMISSIONS: Record<UserRole, readonly AppModule[]> = {
  superadmin: Object.values(PATH_TO_MODULE),
  admin: Object.values(PATH_TO_MODULE),
  gestor: [
    "dashboard",
    "orcamentos",
    "pedidos",
    "producao",
    "clientes",
    "fornecedores",
    "produtos",
    "compras",
    "estoque",
    "instalacoes",
    "financeiro",
    "fiscal",
    "pagamentos",
    "rh",
    "relatorios",
  ],
  vendedor: ["dashboard", "orcamentos", "pedidos", "clientes", "produtos", "financeiro", "pagamentos"],
  tecnico: ["dashboard", "pedidos", "producao", "estoque", "instalacoes"],
  financeiro: ["dashboard", "financeiro", "fiscal", "pagamentos", "relatorios", "fornecedores", "produtos"],
};

export const getModuleFromPath = (pathname: string): AppModule | null => {
  const normalizedPath = pathname.toLowerCase();
  const exactMatch = PATH_TO_MODULE[normalizedPath];
  if (exactMatch) {
    return exactMatch;
  }

  for (const [path, module] of Object.entries(PATH_TO_MODULE)) {
    if (normalizedPath.startsWith(`${path}/`)) {
      return module;
    }
  }

  return null;
};

export const canAccessModule = (role: UserRole, module: AppModule): boolean =>
  ROLE_PERMISSIONS[role].includes(module);

export const canAccessPath = (role: UserRole, pathname: string): boolean => {
  const module = getModuleFromPath(pathname);
  if (!module) {
    return true;
  }
  return canAccessModule(role, module);
};
