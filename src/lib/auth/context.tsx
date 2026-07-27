import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { authClient, type AuthProviderType } from "./client";
import type { AuthSession, AuthUser, UserRole } from "./types";

interface AuthContextValue {
  status: "loading" | "ready";
  provider: AuthProviderType;
  session: AuthSession | null;
  users: AuthUser[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role?: UserRole,
    token?: string,
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_INIT_TIMEOUT_MS = 6_000;

const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);

  const loadUsers = useCallback(async () => {
    try {
      const availableUsers = await withTimeout(
        authClient.listUsers(),
        AUTH_INIT_TIMEOUT_MS,
        [] as AuthUser[],
      );
      setUsers(availableUsers);
    } catch (error) {
      console.error("Falha ao carregar usuários", error);
      setUsers([]);
    }
  }, []);

  const loadAuthState = useCallback(async () => {
    try {
      const restoredSession = await withTimeout(
        authClient.restoreSession(),
        AUTH_INIT_TIMEOUT_MS,
        null,
      );
      setSession(restoredSession);
    } catch (error) {
      console.error("Falha ao carregar sessão", error);
      setSession(null);
    } finally {
      setStatus("ready");
    }
  }, []);

  useEffect(() => {
    void loadAuthState();
  }, [loadAuthState]);

  useEffect(() => {
    if (status !== "ready") return;
    void loadUsers();
  }, [status, loadUsers]);

  const login = useCallback(async (email: string, password: string) => {
    const nextSession = await authClient.login(email, password);
    const availableUsers = await authClient.listUsers();
    setSession(nextSession);
    setUsers(availableUsers);
  }, []);

  const logout = useCallback(async () => {
    await authClient.logout();
    setSession(null);
    setUsers([]);
  }, []);

  const refreshUsers = useCallback(async () => {
    const availableUsers = await authClient.listUsers();
    setUsers(availableUsers);
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: UserRole) => {
    const updatedUsers = await authClient.updateUserRole(userId, role);
    setUsers(updatedUsers);
    setSession((current) =>
      current && current.user.id === userId
        ? {
            ...current,
            user: {
              ...current.user,
              role,
            },
          }
        : current,
    );
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string, role?: UserRole, token?: string) => {
      const nextSession = await authClient.signUp(email, password, name, role, token);
      const availableUsers = await authClient.listUsers();
      setSession(nextSession);
      setUsers(availableUsers);
    },
    [],
  );

  const resetPassword = useCallback(async (email: string) => {
    await authClient.resetPassword(email);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      provider: authClient.getProvider(),
      session,
      users,
      login,
      logout,
      refreshUsers,
      updateUserRole,
      signUp,
      resetPassword,
    }),
    [status, session, users, login, logout, refreshUsers, updateUserRole, signUp, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }
  return context;
};
