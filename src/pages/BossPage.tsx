import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Swords, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";

export default function BossPage() {
    const [boss, setBoss] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [contributors, setContributors] = useState<any[]>([]);
    const { user } = useAuthStore();
    const selectedGroupId = useAppStore(state => state.selectedGroupId);

    useEffect(() => {
        if (!selectedGroupId) {
            setLoading(false);
            return;
        }

        fetchBoss();
    }, [selectedGroupId]);

    const fetchBoss = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("weekly_bosses")
                .select("*")
                .eq("group_id", selectedGroupId)
                .eq("status", "active")
                .maybeSingle();

            if (error) throw error;
            setBoss(data);

            if (data) {
                // Fetch contributors
                const { data: contribs, error: contribsError } = await supabase
                    .from("boss_damage_log")
                    .select("user_id, damage, profiles(username, avatar_url)")
                    .eq("boss_id", data.id);

                if (contribsError) throw contribsError;

                // Aggregate damage by user
                const agg: Record<string, any> = {};
                contribs?.forEach((c: any) => {
                    if (!agg[c.user_id]) {
                        agg[c.user_id] = {
                            totalDamage: 0,
                            username: c.profiles?.username || "Guerreiro",
                            avatar_url: c.profiles?.avatar_url
                        };
                    }
                    agg[c.user_id].totalDamage += c.damage;
                });

                // Sort by damage
                const sortedContribs = Object.values(agg).sort((a, b) => b.totalDamage - a.totalDamage);
                setContributors(sortedContribs);
            }

        } catch (error: any) {
            toast.error("Erro ao carregar o Boss: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateDaysLeft = (endsAt: string) => {
        const end = new Date(endsAt);
        const now = new Date();
        const diffTime = Math.abs(end.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    if (!selectedGroupId) {
        return (
            <div className="p-8 text-center bg-card rounded-xl m-4 shadow-card">
                <Swords className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h2 className="text-xl font-heading font-bold text-card-foreground">Nenhum Grupo Selecionado</h2>
                <p className="text-muted-foreground mt-2">Você precisa estar em um grupo ou selecionar um grupo para participar das batalhas contra Bosses.</p>
            </div>
        );
    }

    if (!boss) {
        return (
            <div className="p-8 text-center bg-card rounded-xl m-4 shadow-card">
                <Swords className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h2 className="text-xl font-heading font-bold text-card-foreground">Nenhum Boss Ativo</h2>
                <p className="text-muted-foreground mt-2">O seu grupo atualmente não está lutando contra nenhum Boss. Aguarde o início da próxima semana!</p>
            </div>
        );
    }

    const hpPercentage = Math.max(0, Math.min((boss.current_hp / boss.hp) * 100, 100));

    return (
        <div className="space-y-4 py-4 px-2">
            {/* Boss Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-glow-primary relative"
            >
                <div className="absolute top-0 right-0 p-3 flex gap-2">
                    <div className="bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-semibold text-secondary border border-secondary/20">
                        <Clock size={12} />
                        {calculateDaysLeft(boss.ends_at)} dias restantes
                    </div>
                </div>

                <div className="p-6 text-center">
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="w-32 h-32 mx-auto bg-gradient-fire rounded-full mb-4 shadow-[0_0_40px_rgba(239,68,68,0.3)] flex items-center justify-center"
                    >
                        <Swords size={48} className="text-primary-foreground opacity-80" />
                    </motion.div>

                    <h2 className="text-2xl font-heading font-black text-card-foreground mb-1">{boss.name}</h2>
                    <p className="text-sm text-muted-foreground mb-6">Derrote o boss com o seu grupo antes que o tempo acabe!</p>

                    {/* HP Bar */}
                    <div className="space-y-2 mb-2">
                        <div className="flex justify-between items-center text-sm font-bold">
                            <span className="text-destructive tracking-widest uppercase">HP</span>
                            <span className="text-card-foreground">{boss.current_hp} / {boss.hp}</span>
                        </div>

                        <div className="h-4 bg-muted rounded-full overflow-hidden relative">
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: `${hpPercentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 to-red-400"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Contributors */}
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border/20">
                <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                    <TrendingUp className="text-primary" size={20} />
                    Maiores Contribuidores
                </h3>

                {contributors.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum dano causado ainda. Seja o primeiro a treinar!</p>
                ) : (
                    <div className="space-y-3">
                        {contributors.map((c, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-muted/50 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {c.avatar_url ? (
                                        <img src={c.avatar_url} alt={c.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-bold text-primary">{index + 1}</span>
                                    )}
                                </div>
                                <div className="flex-1 font-semibold text-sm">
                                    {c.username}
                                </div>
                                <div className="text-destructive font-bold text-sm">
                                    ⚔️ {c.totalDamage}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
