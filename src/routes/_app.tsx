import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { ErpSidebar, ErpMobileTopbar } from "@/components/erp/Sidebar";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <PrivateRoute>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <ErpSidebar />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <ErpMobileTopbar />
          <div className="p-3 sm:p-5">
            <Outlet />
          </div>
        </main>
        <Toaster />
      </div>
    </PrivateRoute>
  );
}
