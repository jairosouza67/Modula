import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Flame, Zap, Calendar, TrendingUp, Trophy, Camera, Heart, Activity } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { useProfile } from "@/hooks/useProfile";
import { useAttributes } from "@/hooks/useAttributes";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { AvatarRenderer } from "@/components/features/AvatarRenderer";
import { SeasonComparison } from "@/components/features/SeasonComparison";
import { GameCanvas } from "@/components/features/GameCanvas";
import { useQuery } from "@tanstack/react-query";

const ProfilePage = () => {
  const { data: userProfile, isLoading: profileLoading } = useProfile();
  const { data: attributes, isLoading: attrsLoading } = useAttributes();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 512,
        useWebWorker: true,
      });

      const filePath = `${user.id}/avatar.webp`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressed, { upsert: true, contentType: "image/webp" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Foto atualizada! 🔥");
    } catch (err: any) {
      toast.error("Erro ao enviar foto: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (profileLoading || attrsLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userProfile) {
    return <div className="p-8 text-center text-muted-foreground">Erro ao carregar perfil</div>;
  }

  const xpForNextLevel = userProfile.level >= 20 ? userProfile.xp :
    (userProfile.level >= 15 ? 10000 :
      (userProfile.level >= 10 ? 5000 :
        (userProfile.level >= 5 ? 2500 : 1000)));

  const xpProgress = Math.min((userProfile.xp / xpForNextLevel) * 100, 100);

  const radarData = attributes ? [
    { subject: 'Força', A: attributes.strength, fullMark: 100 },
    { subject: 'Velo', A: attributes.speed, fullMark: 100 },
    { subject: 'Resist', A: attributes.endurance, fullMark: 100 },
    { subject: 'Disc', A: attributes.discipline, fullMark: 100 },
  ] : [];

  // Fetch Season Data for comparison
  const { data: seasonStats } = useQuery({
    queryKey: ["user_season_stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("season_participants")
        .select("xp_earned")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });

  return (
    <div className="space-y-4 py-4 mb-20 md:mb-0">
      {/* Avatar Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-gradient-hero rounded-2xl overflow-hidden p-5 text-center"
      >
        <div className="relative z-10">
          {/* Avatar with upload */}
          <div className="relative w-40 h-40 mx-auto mb-3">
            {attributes ? (
              <AvatarRenderer
                level={attributes.level || 1}
                hp={attributes.hp || 100}
                maxHp={attributes.max_hp || 100}
                strength={attributes.strength || 10}
                speed={attributes.speed || 10}
                endurance={attributes.endurance || 10}
                discipline={attributes.discipline || 10}
                size={160}
                className="mx-auto"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-muted animate-pulse" />
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Camera size={14} className="text-primary-foreground" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <h2 className="font-heading font-bold text-xl text-primary-foreground">{userProfile.name}</h2>
          <p className="text-sm text-primary-foreground/70 mb-3">{userProfile.bio}</p>

          <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm rounded-full px-3 py-1.5 mb-3">
            <Flame size={14} className="text-primary" />
            <span className="text-xs font-semibold text-primary-foreground">
              Fase: {userProfile.phase?.name || "Iniciante"}
            </span>
            <span className="text-xs text-primary-foreground/60">•</span>
            <span className="text-xs font-semibold text-primary-foreground">
              Lv.{userProfile.level || 1}
            </span>
          </div>

          {/* XP Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-primary-foreground/70">
              <span>{userProfile.xp || 0} XP</span>
              <span>{xpForNextLevel} XP</span>
            </div>
            <div className="h-2.5 bg-primary-foreground/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-fire rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Arena FireFit 2D */}
      {attributes && (
        <div className="bg-card rounded-2xl overflow-hidden shadow-card border border-border/20">
          <div className="p-3 border-b border-border/20">
            <h3 className="font-heading font-bold text-sm flex items-center gap-2">
              <Flame size={16} className="text-primary" />
              Arena FireFit
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Explore zonas desbloqueadas pelos seus treinos.
            </p>
          </div>
          <GameCanvas
            avatarState={{
              level: userProfile.level || 1,
              attributes: {
                strength: attributes.strength || 10,
                speed: attributes.speed || 10,
                endurance: attributes.endurance || 10,
                discipline: attributes.discipline || 10,
              },
              streak: userProfile.streak || 0,
              hp: attributes.hp || 100,
              maxHp: attributes.max_hp || 100,
              stamina: attributes.stamina || 100,
            }}
            activeBoss={false}
            onZoneEnter={(zoneId) => {
              toast.info(`Você entrou na zona: ${zoneId}`);
            }}
          />
        </div>
      )}

      {/* HP & Stamina Bars */}
      {attributes && (
        <div className="space-y-3 bg-card p-4 rounded-xl shadow-card">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1 font-semibold text-destructive"><Heart size={12} fill="currentColor" /> HP</span>
              <span className="text-muted-foreground font-medium">{attributes.hp} / {attributes.max_hp}</span>
            </div>
            <div className="h-2.5 bg-destructive/10 rounded-full overflow-hidden border border-destructive/20">
              <motion.div
                className="h-full bg-gradient-to-r from-red-600 to-red-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((attributes.hp / attributes.max_hp) * 100, 100)}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1 font-semibold text-secondary"><Activity size={12} /> Energia</span>
              <span className="text-muted-foreground font-medium">{attributes.stamina} / 100</span>
            </div>
            <div className="h-2.5 bg-secondary/10 rounded-full overflow-hidden border border-secondary/20">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((attributes.stamina / 100) * 100, 100)}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Radar Chart */}
      {attributes && (
        <div className="bg-card p-4 rounded-xl shadow-card h-64 border border-border/50">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold text-center mb-1">Atributos RPG</h3>
          <ResponsiveContainer width="100%" height="85%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 10']} tick={false} axisLine={false} />
              <Radar name="Status" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Season Evolution */}
      {attributes && seasonStats && (
        <SeasonComparison
          currentStats={attributes}
          xpEarnedThisSeason={seasonStats.xp_earned || 0}
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Zap, label: "XP Total", value: userProfile.xp?.toLocaleString() || "0", color: "text-accent-foreground", bg: "bg-accent/15" },
          { icon: Calendar, label: "Check-ins", value: userProfile.totalCheckins || "0", color: "text-primary", bg: "bg-primary/10" },
          { icon: TrendingUp, label: "Sequência", value: `${userProfile.streak || 0} dias`, color: "text-success", bg: "bg-success/10" },
          { icon: Trophy, label: "Melhor", value: `${userProfile.bestStreak || 0} dias`, color: "text-secondary", bg: "bg-secondary/10" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="bg-card rounded-xl p-4 shadow-card"
          >
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
              <stat.icon size={16} className={stat.color} />
            </div>
            <p className="text-lg font-heading font-bold text-card-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Coins */}
      <div className="bg-card rounded-xl p-4 shadow-card flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Moedas</p>
          <p className="text-2xl font-heading font-bold text-gradient-gold">🪙 {userProfile.coins}</p>
        </div>
        <button className="text-xs font-semibold text-secondary bg-secondary/10 px-3 py-1.5 rounded-full">
          Loja (em breve)
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
