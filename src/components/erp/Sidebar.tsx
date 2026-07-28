import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { AppWindow, ChevronDown, LogOut, Menu } from "lucide-react";
import { navGroups } from "@/lib/mock/data";
import { canAccessPath } from "@/lib/auth/permissions";
import { ROLE_LABELS } from "@/lib/auth/types";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    name
  ];
  if (!Cmp) return null;
  return <Cmp className={className} />;
}

function CollapsibleGroup({
  label,
  pathname,
  onNavigate,
  items,
}: {
  label: string;
  pathname: string;
  onNavigate?: () => void;
  items: { to: string; label: string; icon: string }[];
}) {
  const hasActiveItem = items.some((it) => pathname === it.to);
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 pt-2 pb-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground transition-colors"
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
      </button>
      {open && (
        <div>
          {items.map((it) => {
            const active = pathname === it.to;
            return (
              <Link
                key={it.to}
                to={it.to}
                onClick={onNavigate}
                className={cn(
                  "flex w-full items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground border-r-2 border-transparent hover:bg-background hover:text-foreground",
                  active && "bg-background text-foreground font-medium border-r-primary",
                )}
              >
                <Icon name={it.icon} className="h-3.5 w-3.5" />
                <span>{it.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        session ? canAccessPath(session.user.role, item.to) : false,
      ),
    }))
    .filter((group) => group.items.length > 0);

  const initials = session?.user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-center px-2 py-2 border-b border-border/60">
        <img src="/images/logo-modula.png" alt="ModulaAPP" className="w-full h-auto" />
      </div>
      <nav className="flex-1 overflow-y-auto py-1.5">
        {visibleNavGroups.map((group) => (
          <CollapsibleGroup key={group.label} label={group.label} pathname={pathname} onNavigate={onNavigate} items={group.items} />
        ))}
      </nav>
      <div className="border-t border-border/60 p-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-success-bg text-[10px] font-medium text-success">
            {initials || "US"}
          </div>
          <div>
            <div className="text-[11px] font-medium leading-none">{session?.user.name || "Usuário"}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {session ? ROLE_LABELS[session.user.role] : "Sem sessão"}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-[11px]"
          onClick={async () => {
            await logout();
            await navigate({ to: "/login", search: { redirect: "/dashboard" } });
            onNavigate?.();
          }}
        >
          <LogOut className="mr-1 h-3.5 w-3.5" />
          Sair
        </Button>
      </div>
    </div>
  );
}

export function ErpSidebar() {
  return (
    <aside className="hidden md:flex w-[210px] shrink-0 flex-col border-r border-border/60 bg-muted/40">
      <SidebarContent />
    </aside>
  );
}

export function ErpMobileTopbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/95 backdrop-blur px-3 py-2">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[240px] bg-background border-r border-border">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Navegue pelos módulos do sistema.
          </SheetDescription>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <img src="/images/logo-modula.png" alt="ModulaAPP" className="h-9 w-auto" />
      </div>
    </header>
  );
}
