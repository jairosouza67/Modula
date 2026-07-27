import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import { useAuthStore } from "./store/useAuthStore";
import AppLayout from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";
import RankingPage from "./pages/RankingPage";
import GroupsPage from "./pages/GroupsPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import GroupJoinPage from "./pages/GroupJoinPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import BodyMetricsPage from "./pages/BodyMetricsPage";
import BossPage from "./pages/BossPage";
import SeasonPage from "./pages/SeasonPage";

const queryClient = new QueryClient();

const AppContent = () => {
  const { setSession, setIsLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setIsLoading]);

  return (
    <Routes>
      <Route path="/index" element={<Navigate to="/" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/join/:groupId" element={<GroupJoinPage />} />
          <Route path="/groups/:groupId" element={<GroupDetailPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/metrics" element={<BodyMetricsPage />} />
          <Route path="/boss" element={<BossPage />} />
          <Route path="/season" element={<SeasonPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
