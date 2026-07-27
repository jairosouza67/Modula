import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Medal, TrendingUp, Trophy, Flame } from "lucide-react";
import { useRanking } from "@/hooks/useRanking";
import { useAuthStore } from "@/store/useAuthStore";
import { AvatarPreview } from "@/components/features/AvatarPreview";

const medalStyles = [
  {
    bg: "from-yellow-400 via-yellow-300 to-amber-500",
    ring: "ring-yellow-400/50",
    glow: "shadow-[0_0_28px_-4px_hsl(45,95%,55%,0.5)]",
    badge: "bg-yellow-400 text-yellow-900",
    label: "🥇",
    size: "w-24 h-24",
  },
  {
    bg: "from-slate-300 via-gray-200 to-slate-400",
    ring: "ring-slate-300/50",
    glow: "shadow-[0_0_20px_-4px_hsl(220,10%,70%,0.4)]",
    badge: "bg-slate-300 text-slate-800",
    label: "🥈",
    size: "w-20 h-20",
  },
  {
    bg: "from-amber-600 via-orange-400 to-amber-700",
    ring: "ring-amber-500/50",
    glow: "shadow-[0_0_20px_-4px_hsl(30,80%,45%,0.4)]",
    badge: "bg-amber-600 text-amber-100",
    label: "🥉",
    size: "w-20 h-20",
  },
];

const RankingPage = () => {
  const [activeTab, setActiveTab] = useState<"global" | "semanal" | "temporada" | "grupo">("global");
  const { data: rankingData = [], isLoading } = useRanking();
  const { user } = useAuthStore();

  const top3 = rankingData.slice(0, 3);
  const rest = rankingData.slice(3);

  // Reorder for podium: 2nd, 1st, 3rd
  const podiumOrder = [1, 0, 2];

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Trophy size={24} className="text-accent" />
          <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight">
            Ranking dos Fortes
          </h1>
          <Trophy size={24} className="text-accent" />
        </div>
        <p className="text-xs text-muted-foreground">Os guerreiros mais dedicados</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2">
        {["global", "semanal", "temporada", "grupo"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab
              ? "bg-primary text-primary-foreground shadow-glow-primary"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : top3.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground bg-card rounded-2xl shadow-card">
          Ninguém rankeado ainda. Faça um check-in! 🔥
        </div>
      ) : (
        <div className="flex items-end justify-center gap-4 pt-6 pb-2 px-2">
          {podiumOrder.map((idx) => {
            const rankedUser = top3[idx];
            if (!rankedUser) return null;
            const style = medalStyles[idx];
            const isFirst = idx === 0;

            return (
              <motion.div
                key={rankedUser.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: idx * 0.15, type: "spring", stiffness: 200 }}
                className={`flex flex-col items-center ${isFirst ? "order-1 -mt-4" : idx === 1 ? "order-0" : "order-2"}`}
              >
                {/* Crown for #1 */}
                {isFirst && (
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Crown size={28} className="text-yellow-400 mb-1 drop-shadow-lg" />
                  </motion.div>
                )}

                {/* Avatar Medal */}
                <div className={`relative ${style.size} rounded-full bg-gradient-to-br ${style.bg} ring-4 ${style.ring} ${style.glow} flex items-center justify-center overflow-hidden`}>
                  <AvatarPreview userId={rankedUser.id} size={isFirst ? 80 : 64} />
                  {/* Position badge */}
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${style.badge} rounded-full w-7 h-7 flex items-center justify-center text-xs font-extrabold shadow-md border-2 border-background`}>
                    {idx + 1}
                  </div>
                </div>

                {/* Name */}
                <p className={`font-heading font-bold text-sm mt-3 text-center truncate max-w-[90px] ${rankedUser.id === user?.id ? "text-primary" : "text-card-foreground"}`}>
                  {rankedUser.name}
                </p>

                {/* XP */}
                <div className="flex items-center gap-1 mt-1">
                  <Flame size={12} className="text-primary" />
                  <span className="text-xs font-bold text-primary">
                    {rankedUser.xp.toLocaleString()} XP
                  </span>
                </div>

                {/* Podium bar */}
                <div
                  className={`mt-2 w-20 rounded-t-xl bg-gradient-to-br ${style.bg} opacity-20`}
                  style={{ height: isFirst ? 80 : idx === 1 ? 56 : 40 }}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Rest of ranking - Clean list */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((rankedUser, i) => (
            <motion.div
              key={rankedUser.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.04 }}
              className={`flex items-center gap-3 bg-card rounded-xl p-3 shadow-card hover:shadow-elevated transition-shadow duration-300 ${rankedUser.id === user?.id ? "ring-2 ring-primary/50 bg-primary/5" : ""}`}
            >
              {/* Position */}
              <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-heading font-extrabold text-muted-foreground">
                {i + 4}
              </span>

              {/* Avatar */}
              <AvatarPreview userId={rankedUser.id} size={40} className="border border-border/50" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-card-foreground truncate">
                  {rankedUser.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {rankedUser.phase} • {rankedUser.checkins} check-ins
                </p>
              </div>

              {/* XP */}
              <div className="text-right">
                <p className="text-sm font-heading font-bold text-primary">
                  {rankedUser.xp.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">XP</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RankingPage;
