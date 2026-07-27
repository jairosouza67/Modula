import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, CalendarDays, Award, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { SeasonComparison } from "@/components/features/SeasonComparison";
import { useAttributes } from "@/hooks/useAttributes";

export default function SeasonPage() {
    const { data: attributes } = useAttributes();
    const [season, setSeason] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [currentUserData, setCurrentUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        fetchSeason();
    }, []);

    const fetchSeason = async () => {
        try {
            setLoading(true);
            // Fetch active season
            const { data: sData, error: sError } = await supabase
                .from("seasons")
                .select("*")
                .eq("status", "active")
                .maybeSingle();

            if (sError) throw sError;
            setSeason(sData);

            if (sData) {
                // Fetch participants for this season
                const { data: pData, error: pError } = await supabase
                    .from("season_participants")
                    .select("xp_earned, bio_score, medals, user_id, profiles(username, avatar_url)")
                    .eq("season_id", sData.id)
                    .order("xp_earned", { ascending: false });

                if (pError) throw pError;

                setParticipants(pData || []);

                if (user) {
                    const myData = pData?.find(p => p.user_id === user.id);
                    setCurrentUserData(myData);
                }
            }
        } catch (error: any) {
            toast.error("Erro ao carregar a Temporada: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinSeason = async () => {
        if (!user || !season) return;
        try {
            const { error } = await supabase
                .from("season_participants")
                .insert({
                    season_id: season.id,
                    user_id: user.id,
                });

            if (error) throw error;
            toast.success("Você entrou na Temporada!");
            fetchSeason(); // refresh
        } catch (error: any) {
            toast.error("Erro ao entrar na Temporada: " + error.message);
        }
    };

    const calculateDaysLeft = (endsAt: string) => {
        const end = new Date(endsAt);
        const now = new Date();
        const diffTime = Math.abs(end.getTime() - now.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    if (!season) {
        return (
            <div className="p-8 text-center bg-card rounded-xl m-4 shadow-card">
                <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h2 className="text-xl font-heading font-bold text-card-foreground">Nenhuma Temporada Ativa</h2>
                <p className="text-muted-foreground mt-2">Aguarde o início da próxima temporada de 30 dias para competir e ganhar medalhas exclusivas!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 py-4 px-2 pb-24">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-primary/20 to-secondary/10 border border-primary/20 rounded-2xl p-5 shadow-glow-primary relative overflow-hidden"
            >
                <div className="absolute -right-4 -top-4 text-primary/10">
                    <Trophy size={100} />
                </div>

                <div className="relative z-10 flex flex-col items-start gap-4">
                    <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Temporada Ativa
                    </div>

                    <div>
                        <h1 className="text-2xl font-heading font-black text-card-foreground">{season.name}</h1>
                        <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                            <CalendarDays size={14} /> Faltam {calculateDaysLeft(season.ends_at)} dias
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Current User Stats or Join CTA */}
            <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
                {!currentUserData ? (
                    <div className="text-center space-y-3">
                        <h3 className="font-heading font-bold">Você não está participando!</h3>
                        <p className="text-sm text-muted-foreground">Junte-se à temporada para registrar seu progresso e ganhar medalhas.</p>
                        <button
                            onClick={handleJoinSeason}
                            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-glow-primary hover:brightness-110 transition-all"
                        >
                            Entrar na Temporada
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Seu Progresso</h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-muted p-3 rounded-xl flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                    <Star size={16} />
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">XP da Temporada</div>
                                    <div className="font-bold text-card-foreground">{currentUserData.xp_earned} XP</div>
                                </div>
                            </div>
                            <div className="bg-muted p-3 rounded-xl flex items-center gap-3">
                                <div className="p-2 bg-secondary/20 rounded-lg text-secondary">
                                    <Award size={16} />
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Bio Score</div>
                                    <div className="font-bold text-card-foreground">{currentUserData.bio_score} pts</div>
                                </div>
                            </div>
                        </div>

                        {/* Medals */}
                        <div>
                            <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Medalhas</h4>
                            {currentUserData.medals.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">Nenhuma medalha conquistada ainda.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {currentUserData.medals.map((medal: any, idx: number) => (
                                        <div key={idx} className="bg-background border border-border px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                                            <Award size={12} className="text-primary" /> {medal.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Visual Evolution */}
                        {attributes && (
                            <div className="pt-2">
                                <SeasonComparison
                                    currentStats={attributes}
                                    xpEarnedThisSeason={currentUserData.xp_earned || 0}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Ranking List */}
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
                <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                    <Trophy className="text-primary" size={20} />
                    Ranking da Temporada
                </h3>

                {participants.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum participante ainda.</p>
                ) : (
                    <div className="space-y-3">
                        {participants.map((p, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-muted/50 transition-colors">
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden font-bold ${index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                                    index === 1 ? "bg-gray-400/20 text-gray-400" :
                                        index === 2 ? "bg-amber-700/20 text-amber-700" :
                                            "bg-muted text-muted-foreground"
                                    }`}>
                                    {p.profiles.avatar_url ? (
                                        <img src={p.profiles.avatar_url} alt={p.profiles.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs">{index + 1}</span>
                                    )}
                                </div>
                                <div className="flex-1 font-semibold text-sm truncate">
                                    {p.profiles.username}
                                </div>
                                <div className="text-right">
                                    <div className="text-primary font-bold text-sm">{p.xp_earned} XP</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
