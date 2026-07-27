export const USER_ROLES = ["superadmin", "admin", "gestor", "vendedor", "tecnico", "financeiro"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Super Admin",
  admin: "Administrador",
  gestor: "Gestor",
  vendedor: "Vendedor",
  tecnico: "Técnico",
  financeiro: "Financeiro",
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: string;
}

