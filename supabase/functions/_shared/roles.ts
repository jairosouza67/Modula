const VALID_ROLES = ["superadmin", "admin", "gestor", "vendedor", "tecnico", "financeiro"] as const;

export type UserRole = (typeof VALID_ROLES)[number];

export function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.includes(role as UserRole);
}
