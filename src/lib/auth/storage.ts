import type { AuthSession, AuthUser, UserRole } from "./types";
import { readJson, writeJson, isBrowser } from "@/lib/utils/localStorage";

const AUTH_SESSION_KEY = "modulaapp:auth:session";
const AUTH_USERS_KEY = "modulaapp:auth:users";

export interface MockAuthUser extends AuthUser {
  password: string;
}

const DEFAULT_MOCK_USERS: MockAuthUser[] = import.meta.env.DEV
  ? [
      {
        id: "usr_superadmin",
        name: "Admin Dev",
        email: "REDACTED@dev.local",
        role: "superadmin",
        password: "REDACTED",
      },
      {
        id: "usr_admin",
        name: "Marcos Gestor",
        email: "admin@dev.local",
        role: "admin",
        password: "REDACTED",
      },
      {
        id: "usr_gestor",
        name: "Ana Souza",
        email: "gestor@dev.local",
        role: "gestor",
        password: "REDACTED",
      },
      {
        id: "usr_vendedor",
        name: "Marina Costa",
        email: "vendedor@dev.local",
        role: "vendedor",
        password: "REDACTED",
      },
      {
        id: "usr_tecnico",
        name: "Lucas Martins",
        email: "tecnico@dev.local",
        role: "tecnico",
        password: "REDACTED",
      },
      {
        id: "usr_financeiro",
        name: "Carlos Nunes",
        email: "financeiro@dev.local",
        role: "financeiro",
        password: "REDACTED",
      },
    ]
  : [];

export const getStoredSession = (): AuthSession | null => readJson<AuthSession>(AUTH_SESSION_KEY);

export const setStoredSession = (session: AuthSession): void => {
  writeJson(AUTH_SESSION_KEY, session);
};

export const clearStoredSession = (): void => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(AUTH_SESSION_KEY);
};

export const getStoredMockUsers = (): MockAuthUser[] => {
  if (!import.meta.env.DEV) {
    return [];
  }
  const storedUsers = readJson<MockAuthUser[]>(AUTH_USERS_KEY);
  if (storedUsers) {
    return storedUsers;
  }
  if (isBrowser()) {
    writeJson(AUTH_USERS_KEY, DEFAULT_MOCK_USERS);
  }
  return DEFAULT_MOCK_USERS;
};

export const saveStoredMockUsers = (users: MockAuthUser[]): void => {
  if (!import.meta.env.DEV) {
    return;
  }
  writeJson(AUTH_USERS_KEY, users);
};

export const updateStoredMockUserRole = (userId: string, role: UserRole): MockAuthUser[] => {
  if (!import.meta.env.DEV) {
    return [];
  }
  const users = getStoredMockUsers().map((user) =>
    user.id === userId
      ? {
          ...user,
          role,
        }
      : user,
  );
  saveStoredMockUsers(users);
  return users;
};

export const addStoredMockUser = (user: MockAuthUser): void => {
  if (!import.meta.env.DEV) {
    return;
  }
  const users = getStoredMockUsers();
  users.push(user);
  saveStoredMockUsers(users);
};
