import { Moon, Sun, LogOut } from "lucide-react";
import tabLogo from "@/assets/tab.png";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { AvatarPreview } from "./features/AvatarPreview";

const AppHeader = () => {
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearAuth();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between h-14 max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5">
          <img src={tabLogo} alt="FireFit logo" className="w-7 h-7 rounded-lg object-cover" />
          <span className="text-lg font-heading font-bold text-foreground">
            Fire<span className="text-primary">Fit</span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <AvatarPreview size={32} className="border border-primary/20" />
          <button onClick={toggle} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            {isDark ? <Sun size={20} className="text-accent" /> : <Moon size={20} className="text-muted-foreground" />}
          </button>
          <button onClick={handleLogout} className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors" title="Sair">
            <LogOut size={20} className="text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
