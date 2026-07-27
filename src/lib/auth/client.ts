import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDefaultEmpresaId } from "@/lib/supabase/company";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addStoredMockUser,
  clearStoredSession,
  getStoredMockUsers,
  getStoredSession,
  setStoredSession,
  updateStoredMockUserRole,
  type MockAuthUser,
} from "./storage";
import { recordLoginAttempt } from "./security";
import { USER_ROLES, type AuthSession, type AuthUser, type UserRole } from "./types";

export type AuthProviderType = "mock" | "supabase";

const AUTH_SESSION_HOURS = 8;

const hasSupabaseCredentials = (): boolean => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return Boolean(supabaseUrl?.trim()) && Boolean(supabaseAnonKey?.trim());
};

const toAuthProvider = (value: string | undefined): AuthProviderType => {
  const normalizedValue = value?.trim().toLowerCase();

  if (normalizedValue === "mock") {
    return "mock";
  }

  if (normalizedValue === "supabase") {
    return hasSupabaseCredentials() ? "supabase" : "mock";
  }

  return hasSupabaseCredentials() ? "supabase" : "mock";
};

const getAuthProvider = (): AuthProviderType => toAuthProvider(import.meta.env.VITE_AUTH_PROVIDER);

const isKnownRole = (value: unknown): value is UserRole => USER_ROLES.includes(value as UserRole);

const mapUserRole = (value: unknown): UserRole => {
  return isKnownRole(value) ? value : "vendedor";
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const validateInviteToken = async (
  token: string,
): Promise<{ email: string; role: string; empresa_id: string }> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL não configurada.");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/validar-convite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const data = await response.json().catch(() => ({ error: "Resposta inválida do servidor." }));

  if (!response.ok) {
    throw new Error(data.error || "Erro ao validar convite.");
  }

  return data as { email: string; role: string; empresa_id: string };
};

const resolveUserName = (email: string | null | undefined, rawName: unknown): string => {
  if (typeof rawName === "string" && rawName.trim().length > 0) {
    return rawName.trim();
  }

  if (email && email.includes("@")) {
    return email.split("@")[0];
  }

  return "Usuário";
};

const toPublicUser = (user: MockAuthUser): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const createMockSession = (user: MockAuthUser): AuthSession => {
  const expiresAt = new Date(Date.now() + AUTH_SESSION_HOURS * 60 * 60 * 1000).toISOString();
  return {
    user: toPublicUser(user),
    accessToken: crypto.randomUUID(),
    expiresAt,
  };
};

const getSupabaseProfile = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<{ name: string; role: UserRole; email: string } | null> => {
  const { data, error } = await supabase
    .from("perfis_usuario")
    .select("nome, role, email")
    .eq("empresa_id", getDefaultEmpresaId())
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    name: data.nome,
    role: mapUserRole(data.role),
    email: data.email,
  };
};

const ensureSupabaseProfile = async (
  supabase: SupabaseClient,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  empresaId?: string,
): Promise<void> => {
  const metadataRole = user.user_metadata?.role;
  const metadataName = user.user_metadata?.name;
  const email = user.email ?? "";
  const role = mapUserRole(metadataRole);

  const { error } = await supabase.from("perfis_usuario").upsert(
    {
      empresa_id: empresaId ?? getDefaultEmpresaId(),
      user_id: user.id,
      nome: resolveUserName(email, metadataName),
      email,
      role,
    },
    {
      onConflict: "empresa_id,user_id",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
};

const buildSessionFromSupabaseUser = async (
  supabase: SupabaseClient,
  session: {
    access_token: string;
    expires_at?: number;
    user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> };
  },
): Promise<AuthSession> => {
  const metadataRole = session.user.user_metadata?.role;
  const metadataName = session.user.user_metadata?.name;
  const email = session.user.email ?? "";
  const expiresAt = session.expires_at
    ? new Date(session.expires_at * 1000).toISOString()
    : new Date(Date.now() + AUTH_SESSION_HOURS * 60 * 60 * 1000).toISOString();

  // Tenta buscar perfil em paralelo; se falhar, usa metadata
  let name = typeof metadataName === "string" && metadataName.trim() ? metadataName.trim() : "";
  let role = mapUserRole(metadataRole);

  try {
    const profile = await getSupabaseProfile(supabase, session.user.id);
    if (profile) {
      name = profile.name || name;
      role = profile.role;
    }
  } catch {
    // Se falhar, usa metadata mesmo — não bloqueia o login
  }

  if (!name) {
    name = resolveUserName(email, metadataName);
  }

  return {
    accessToken: session.access_token,
    expiresAt,
    user: {
      id: session.user.id,
      email,
      name,
      role,
    },
  };
};

const isExpired = (session: AuthSession): boolean => {
  const expiresAtMs = new Date(session.expiresAt).getTime();
  if (!Number.isFinite(expiresAtMs)) {
    return true;
  }
  return Date.now() >= expiresAtMs;
};

export const authClient = {
  getProvider(): AuthProviderType {
    return getAuthProvider();
  },

  async login(email: string, password: string): Promise<AuthSession> {
    const rateLimit = recordLoginAttempt(normalizeEmail(email));
    if (!rateLimit.allowed) {
      throw new Error("Muitas tentativas. Aguarde 1 minuto.");
    }

    const provider = getAuthProvider();

    if (provider === "supabase") {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });
      if (error) {
        throw new Error(error.message);
      }
      if (!data.session || !data.user) {
        throw new Error("Sessão não retornada pelo Supabase.");
      }

      // Fire-and-forget: garante perfil sem bloquear o login
      void ensureSupabaseProfile(supabase, data.user).catch((err) => {
        console.error("[AUTH] Falha ao garantir perfil:", err?.message);
      });

      const session = await buildSessionFromSupabaseUser(supabase, {
        access_token: data.session.access_token,
        expires_at: data.session.expires_at,
        user: data.user,
      });
      setStoredSession(session);
      return session;
    }

    const users = getStoredMockUsers();
    const user = users.find((item) => item.email === normalizeEmail(email));

    if (!user || user.password !== password) {
      throw new Error("E-mail ou senha inválidos.");
    }

    const session = createMockSession(user);
    setStoredSession(session);
    return session;
  },

  async logout(): Promise<void> {
    const provider = getAuthProvider();
    if (provider === "supabase") {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    }
    clearStoredSession();
  },

  async restoreSession(): Promise<AuthSession | null> {
    const provider = getAuthProvider();

    if (provider === "supabase") {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw new Error(error.message);
      }
      if (!data.session) {
        return null;
      }

      // Fire-and-forget: garante perfil sem bloquear o carregamento
      void ensureSupabaseProfile(supabase, data.session.user).catch((err) => {
        console.error("[AUTH] Falha ao garantir perfil:", err?.message);
      });

      const session = await buildSessionFromSupabaseUser(supabase, {
        access_token: data.session.access_token,
        expires_at: data.session.expires_at,
        user: data.session.user,
      });

      if (isExpired(session)) {
        await this.logout();
        return null;
      }

      setStoredSession(session);
      return session;
    }

    const session = getStoredSession();
    if (!session) {
      return null;
    }

    if (isExpired(session)) {
      clearStoredSession();
      return null;
    }

    return session;
  },

  async listUsers(): Promise<AuthUser[]> {
    const provider = getAuthProvider();
    if (provider === "supabase") {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("perfis_usuario")
        .select("user_id, nome, email, role")
        .eq("empresa_id", getDefaultEmpresaId())
        .order("nome", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        const session = await this.restoreSession();
        return session ? [session.user] : [];
      }

      return data.map((item) => ({
        id: item.user_id,
        name: item.nome,
        email: item.email,
        role: mapUserRole(item.role),
      }));
    }

    return getStoredMockUsers().map(toPublicUser);
  },

  async updateUserRole(userId: string, role: UserRole): Promise<AuthUser[]> {
    const provider = getAuthProvider();
    if (provider === "supabase") {
      const supabase = getSupabaseBrowserClient();
      const { data: targetUser, error: fetchError } = await supabase
        .from("perfis_usuario")
        .select("email")
        .eq("empresa_id", getDefaultEmpresaId())
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const { data, error } = await supabase
        .from("perfis_usuario")
        .update({ role })
        .eq("empresa_id", getDefaultEmpresaId())
        .eq("user_id", userId)
        .select("user_id");

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        throw new Error("Perfil do usuário não encontrado para atualização.");
      }

      return this.listUsers();
    }

    const allUsers = getStoredMockUsers();
    const targetMockUser = allUsers.find((u) => u.id === userId);

    const updatedUsers = updateStoredMockUserRole(userId, role).map(toPublicUser);
    const currentSession = getStoredSession();

    if (currentSession && currentSession.user.id === userId) {
      setStoredSession({
        ...currentSession,
        user: {
          ...currentSession.user,
          role,
        },
      });
    }

    return updatedUsers;
  },

  async signUp(
    email: string,
    password: string,
    name: string,
    role: UserRole = "vendedor",
    token?: string,
  ): Promise<AuthSession> {
    const provider = getAuthProvider();
    const normalizedEmail = normalizeEmail(email);

    if (provider === "supabase") {
      const supabase = getSupabaseBrowserClient();

      let inviteRole = role;
      let inviteEmpresaId: string | null = null;

      if (token) {
        const invite = await validateInviteToken(token);

        if (normalizeEmail(invite.email) !== normalizedEmail) {
          throw new Error("E-mail do convite não corresponde.");
        }

        inviteRole = mapUserRole(invite.role);
        inviteEmpresaId = invite.empresa_id;
      } else {
        throw new Error("É necessário um convite para criar conta.");
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name,
            role: inviteRole,
          },
        },
      });
      if (error) {
        throw new Error(error.message);
      }
      if (!data.session) {
        throw new Error("Sessão não retornada após cadastro.");
      }
      if (!data.user) {
        throw new Error("Erro ao recuperar dados do usuário após cadastro.");
      }

      // Fire-and-forget: garante perfil sem bloquear o cadastro
      void ensureSupabaseProfile(supabase, data.user, inviteEmpresaId ?? undefined).catch((err) => {
        console.error("[AUTH] Falha ao garantir perfil:", err?.message);
      });

      // Marca convite como utilizado (fire-and-forget)
      if (token) {
        void supabase
          .from("convites")
          .update({ usado_em: new Date().toISOString() })
          .eq("token", token);
      }

      const session = await buildSessionFromSupabaseUser(supabase, {
        access_token: data.session.access_token,
        expires_at: data.session.expires_at,
        user: data.user,
      });
      setStoredSession(session);
      return session;
    }

    const users = getStoredMockUsers();
    if (users.some((u) => u.email === normalizedEmail)) {
      throw new Error("E-mail já cadastrado.");
    }

    const finalRole = role;

    const newUser: MockAuthUser = {
      id: crypto.randomUUID(),
      name: name.trim() || resolveUserName(normalizedEmail, undefined),
      email: normalizedEmail,
      role: finalRole,
      password,
    };

    addStoredMockUser(newUser);

    const session = createMockSession(newUser);
    setStoredSession(session);
    return session;
  },

  async resetPassword(email: string): Promise<void> {
    const provider = getAuthProvider();
    const normalizedEmail = normalizeEmail(email);

    if (provider === "supabase") {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        throw new Error(error.message);
      }
      return;
    }

    const users = getStoredMockUsers();
    const user = users.find((u) => u.email === normalizedEmail);
    if (!user) {
      throw new Error("E-mail não encontrado.");
    }
  },
};
