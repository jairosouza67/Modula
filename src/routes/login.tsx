import { useEffect, useState } from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LockKeyhole, Mail, User, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/context";
import { isValidEmail } from "@/lib/formatters/contact";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/dashboard",
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: LoginPage,
});

const normalizeRedirectPath = (redirectPath: string): string => {
  try {
    const url = new URL(redirectPath, window.location.origin);
    if (url.origin === window.location.origin && redirectPath !== "/login") {
      return redirectPath;
    }
  } catch {
    // URL inválido
  }
  return "/dashboard";
};

interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

const validatePassword = (pw: string): PasswordValidationResult => {
  const errors: string[] = [];
  if (pw.length < 8) errors.push("mínimo 8 caracteres");
  if (!/[A-Z]/.test(pw)) errors.push("uma letra maiúscula");
  if (!/[a-z]/.test(pw)) errors.push("uma letra minúscula");
  if (!/[0-9]/.test(pw)) errors.push("um número");
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push("um caractere especial");
  return { valid: errors.length === 0, errors };
};

type AuthMode = "login" | "register" | "forgot";

function LoginPage() {
  const navigate = useNavigate();
  const { redirect, token } = Route.useSearch();
  const { session, status, provider, login, signUp, resetPassword } = useAuth();
  const hasInviteToken = Boolean(token);

  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const safeRedirectPath = normalizeRedirectPath(redirect);

  useEffect(() => {
    try {
      const last = localStorage.getItem("lastEmail");
      if (last) setEmail(last);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (hasInviteToken) {
      setMode("register");
    }
  }, [hasInviteToken]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-sm text-muted-foreground">Carregando autenticação...</div>
      </div>
    );
  }

  if (session) {
    return <Navigate to={safeRedirectPath} replace />;
  }

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPassword("");
    setConfirmPassword("");
    setName("");
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!isValidEmail(email)) {
      setErrorMessage("E-mail inválido.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      try {
        localStorage.setItem("lastEmail", email);
      } catch {
        /* noop */
      }
      await navigate({ to: safeRedirectPath });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha no login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Informe seu nome.");
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage("E-mail inválido.");
      return;
    }
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      setErrorMessage("A senha deve conter: " + passwordCheck.errors.join(", ") + ".");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("As senhas não conferem.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(email, password, name.trim(), undefined, token);
      try {
        localStorage.setItem("lastEmail", email);
      } catch {
        /* noop */
      }
      await navigate({ to: safeRedirectPath });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao criar conta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isValidEmail(email)) {
      setErrorMessage("E-mail inválido.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(email);
      try {
        localStorage.setItem("lastEmail", email);
      } catch {
        /* noop */
      }
      setSuccessMessage(
        "Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.",
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao solicitar recuperação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader>
          <CardTitle className="text-xl">
            {mode === "login" && "Entrar no ModulaAPP"}
            {mode === "register" && "Criar conta"}
            {mode === "forgot" && "Recuperar acesso"}
          </CardTitle>
          <CardDescription>
            {mode === "login" &&
              (provider === "mock" && import.meta.env.DEV
                ? "Use o perfil de desenvolvimento para iniciar (admin@dev.local / REDACTED)."
                : "Informe seu e-mail e senha cadastrados.")}
            {mode === "register" && "Preencha os dados abaixo para criar sua conta no sistema."}
            {mode === "forgot" &&
              "Informe seu e-mail para receber instruções de recuperação de senha."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "login" && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-8"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    placeholder="Email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-muted-foreground">
                  Senha
                </Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-8"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                    className="absolute right-2 top-2 p-1 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {errorMessage ? (
                <div className="rounded-md border border-danger/20 bg-danger-bg p-2 text-xs text-danger">
                  {errorMessage}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Entrando..."
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-xs">
                {hasInviteToken && (
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="text-primary hover:underline"
                  >
                    Criar conta
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-muted-foreground hover:text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          )}

          {mode === "register" && (
            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs text-muted-foreground">
                  Nome completo
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    className="pl-8"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Seu nome"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email-register" className="text-xs text-muted-foreground">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-register"
                    type="email"
                    className="pl-8"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password-register" className="text-xs text-muted-foreground">
                  Senha
                </Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password-register"
                    type={showPassword ? "text" : "password"}
                    className="pl-8"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                    className="absolute right-2 top-2 p-1 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">
                  Confirmar senha
                </Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    className="pl-8"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                  />
                </div>
              </div>

              {errorMessage ? (
                <div className="rounded-md border border-danger/20 bg-danger-bg p-2 text-xs text-danger">
                  {errorMessage}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Criando conta..."
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Criar conta
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => switchMode("login")}
                className="flex w-full items-center justify-center text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Já tenho conta
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <form className="space-y-4" onSubmit={handleForgot}>
              <div className="space-y-1.5">
                <Label htmlFor="email-forgot" className="text-xs text-muted-foreground">
                  E-mail cadastrado
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-forgot"
                    type="email"
                    className="pl-8"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {errorMessage ? (
                <div className="rounded-md border border-danger/20 bg-danger-bg p-2 text-xs text-danger">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-md border border-success/20 bg-success-bg p-2 text-xs text-success">
                  {successMessage}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar instruções"}
              </Button>

              <button
                type="button"
                onClick={() => switchMode("login")}
                className="flex w-full items-center justify-center text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Voltar ao login
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
