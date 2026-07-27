import { Link, Navigate, useRouterState } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canAccessPath } from "@/lib/auth/permissions";
import { ROLE_LABELS } from "@/lib/auth/types";
import { useAuth } from "@/lib/auth/context";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { status, session, logout } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-sm text-muted-foreground">Carregando sessão...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" search={{ redirect: pathname }} replace />;
  }

  if (!canAccessPath(session.user.role, pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg rounded-xl border border-border/60 bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center gap-2 text-danger">
            <ShieldAlert className="h-5 w-5" />
            <h1 className="text-sm font-semibold">Acesso negado</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu perfil atual é <strong>{ROLE_LABELS[session.user.role]}</strong> e não possui
            permissão para acessar esta rota.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/dashboard">Voltar ao dashboard</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await logout();
              }}
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
