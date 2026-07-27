import { Home, Users, Trophy, User, Plus, Moon, Sun, LogOut } from "lucide-react";
import tabLogo from "@/assets/tab.png";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfile } from "@/hooks/useProfile";
import { AvatarPreview } from "@/components/features/AvatarPreview";

const tabs = [
  { path: "/", icon: Home, label: "Feed" },
  { path: "/groups", icon: Users, label: "Grupos" },
  { path: "/ranking", icon: Trophy, label: "Ranking" },
  { path: "/profile", icon: User, label: "Perfil" },
];

const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const setCheckinOpen = useAppStore((state) => state.setCheckinOpen);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { data: profile } = useProfile();

  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const coins = profile?.coins || 0;
  const streak = profile?.streak || 0;
  // XP needed for next level
  let nextLevelXp = level * 300;
  if (nextLevelXp < 300) nextLevelXp = 300;
  const xpInLevel = xp % nextLevelXp;
  const xpProgress = Math.min((xpInLevel / nextLevelXp) * 100, 100);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearAuth();
  };

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-gradient-sidebar sticky top-0 h-screen overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-20 left-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl -translate-x-1/2" />

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 h-20 relative z-10">
        <img src={tabLogo} alt="FireFit logo" className="w-9 h-9 rounded-xl object-cover" />
        <span className="text-xl font-heading font-bold text-sidebar-accent-foreground tracking-tight">
          Fire<span className="text-gradient-fire">Fit</span>
        </span>
      </div>

      {/* User Profile Mini */}
      <div className="mx-4 mb-4 p-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border relative z-10">
        <div className="flex items-center gap-3">
          <AvatarPreview size={40} className="ring-2 ring-primary/30" />
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-sm text-sidebar-accent-foreground truncate">{profile?.name || "Você"}</p>
            <p className="text-[11px] text-sidebar-foreground">Nível {level} · {xp.toLocaleString()} XP</p>
          </div>
        </div>
        <div className="mt-2.5 h-1.5 bg-sidebar-border rounded-full overflow-hidden">
          <div className="h-full bg-gradient-fire rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }} />
        </div>
        <p className="text-[10px] text-sidebar-foreground mt-1">{xpInLevel.toLocaleString()} / {nextLevelXp.toLocaleString()} XP para Nível {level + 1}</p>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1 relative z-10">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group"
            >
              {isActive && (
                <motion.div
                  layoutId="activeSidebar"
                  className="absolute inset-0 rounded-xl bg-primary/15 border border-primary/20"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                className={`relative z-10 transition-colors ${isActive ? "text-primary" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"}`}
              />
              <span
                className={`relative z-10 transition-colors ${isActive ? "text-primary font-semibold" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"}`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeDot"
                  className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Check-in CTA */}
      <div className="px-4 mb-3 relative z-10">
        <button
          onClick={() => setCheckinOpen(true)}
          className="w-full py-2.5 rounded-xl bg-gradient-fire text-primary-foreground font-heading font-semibold text-sm flex items-center justify-center gap-2 shadow-glow-primary hover:brightness-110 transition-all"
        >
          <Plus size={18} />
          Check-in
        </button>
      </div>

      {/* Footer stats */}
      <div className="px-4 py-4 border-t border-sidebar-border relative z-10">
        <div className="flex items-center justify-between text-[11px] text-sidebar-foreground">
          <span className="flex items-center gap-1.5">
            🔥 <span className="font-medium text-sidebar-accent-foreground">{streak} dias</span> de sequência
          </span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              🪙 <span className="font-medium text-accent">{coins}</span>
            </span>
            <button onClick={toggle} className="p-1.5 rounded-full hover:bg-sidebar-accent transition-colors">
              {isDark ? <Sun size={14} className="text-accent" /> : <Moon size={14} className="text-sidebar-foreground" />}
            </button>
            <button onClick={handleLogout} className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors" title="Sair">
              <LogOut size={14} className="text-sidebar-foreground hover:text-destructive" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
