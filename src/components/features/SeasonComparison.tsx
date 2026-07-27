import React from "react";
import { AvatarRenderer } from "./AvatarRenderer";
import { UserAttributes } from "@/hooks/useAttributes";
import { motion } from "framer-motion";
import { TrendingUp, ArrowRight } from "lucide-react";

interface SeasonComparisonProps {
    currentStats: UserAttributes;
    xpEarnedThisSeason: number;
}

export const SeasonComparison: React.FC<SeasonComparisonProps> = ({
    currentStats,
    xpEarnedThisSeason
}) => {
    // Logic to calculate roughly what the avatar looked like at start of season
    // For a real app, we'd store the stats at season start in season_participants
    // Here we approximate by subtracting XP earned

    const startingXp = Math.max(0, currentStats.total_xp - xpEarnedThisSeason);

    // Inverse level threshold calculation approx
    // XP req = 25 * (L^2) -> L = sqrt(XP / 25)
    const startingLevel = Math.max(1, Math.floor(Math.sqrt(startingXp / 25)));

    // Starting attributes approx (lower than current)
    const attrReduction = Math.min(10, Math.floor(xpEarnedThisSeason / 500));

    const startingStats = {
        ...currentStats,
        level: startingLevel,
        strength: Math.max(10, currentStats.strength - attrReduction),
        speed: Math.max(10, currentStats.speed - attrReduction),
        endurance: Math.max(10, currentStats.endurance - attrReduction),
        discipline: Math.max(10, currentStats.discipline - attrReduction),
        hp: currentStats.max_hp * 0.8, // assume they started slightly "fresher" or just at 80%
        maxHp: currentStats.max_hp - (currentStats.level - startingLevel) * 10
    };

    return (
        <div className="bg-card rounded-2xl p-4 shadow-card border border-primary/10 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-success/10 text-success">
                    <TrendingUp size={16} />
                </div>
                <h3 className="font-heading font-bold text-sm text-card-foreground">Evolução da Temporada</h3>
            </div>

            <div className="flex items-center justify-between gap-2 px-2">
                {/* BEFORE */}
                <div className="text-center space-y-2">
                    <div className="relative group grayscale opacity-60 scale-90 transition-all hover:opacity-100 hover:grayscale-0">
                        <AvatarRenderer
                            {...startingStats}
                            size={100}
                            className="mx-auto"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="bg-background/80 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter">Início</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-semibold text-muted-foreground">Lv.{startingLevel}</p>
                </div>

                <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-primary/40"
                >
                    <ArrowRight size={20} />
                </motion.div>

                {/* NOW */}
                <div className="text-center space-y-2">
                    <div className="relative">
                        <AvatarRenderer
                            level={currentStats.level}
                            hp={currentStats.hp}
                            maxHp={currentStats.max_hp}
                            strength={currentStats.strength}
                            speed={currentStats.speed}
                            endurance={currentStats.endurance}
                            discipline={currentStats.discipline}
                            size={120}
                            className="mx-auto drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="bg-primary/90 text-primary-foreground px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter">Agora</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-primary">Lv.{currentStats.level}</p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest px-2">
                    Ganhos Totais
                </div>
                <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-full">
                        +{xpEarnedThisSeason} XP
                    </span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                        +{currentStats.level - startingLevel} Níveis
                    </span>
                </div>
            </div>
        </div>
    );
};
