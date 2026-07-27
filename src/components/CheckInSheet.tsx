import { useState } from "react";
import { X, Camera, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WORKOUT_TYPES } from "@/data/mockData";
import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { getXpPreview, getAttributeGainsPreview } from "@/services/gamificationEngine";
import LevelUpModal from "./features/LevelUpModal";

interface CheckInSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CheckInSheet = ({ open, onOpenChange }: CheckInSheetProps) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number, attributesGained: string } | null>(null);
  const { user } = useAuthStore();
  const selectedGroupId = useAppStore(state => state.selectedGroupId);
  const setSelectedGroupId = useAppStore(state => state.setSelectedGroupId);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!title || !type) return;
    if (!user) {
      toast.error("Você precisa estar logado para fazer check-in.");
      return;
    }

    // Anti-fraud validation
    const durationMin = duration ? parseInt(duration) : 0;
    if (durationMin > 300) {
      toast.error("Limite de 5h por treino excedido. Tente dividir seus treinos ou registrar menos tempo.");
      return;
    }
    if (durationMin < 5) {
      toast.error("O treino precisa ter pelo menos 5 minutos.");
      return;
    }

    setIsUploading(true);
    let imageUrl = null;

    try {
      if (photo) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(photo, options);

        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('checkins')
          .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('checkins')
          .getPublicUrl(uploadData.path);

        imageUrl = publicUrlData.publicUrl;
      }

      const payload = {
        p_title: title,
        p_type: type,
        p_duration_minutes: duration ? parseInt(duration) : null,
        p_image_url: imageUrl,
        p_group_id: selectedGroupId,
        p_intensity: intensity,
      };

      const { data, error } = await supabase.rpc('processar_checkin', payload);

      if (error) throw error;

      const result = (data ?? {}) as { xp_earned?: number; new_level?: number; old_level?: number; attributes_gained?: any };
      const xpEarned = result.xp_earned;
      const newLevel = result.new_level;
      const oldLevel = result.old_level;
      const attributesGained = result.attributes_gained;

      if (newLevel && oldLevel && newLevel > oldLevel) {
        setSubmitted(true);
        setXpEarned(xpEarned);
        setTimeout(() => {
          setLevelUpData({ newLevel, attributesGained });
        }, 800); // Wait a bit before showing the modal
      } else {
        setSubmitted(true);
        setTimeout(() => {
          handleClose();
        }, 3000);
      }

    } catch (error: any) {
      toast.error("Erro ao registrar check-in: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setTitle("");
    setType("");
    setDuration("");
    setIntensity(5);
    setPhoto(null);
    setPreviewUrl(null);
    setSelectedGroupId(null);
    setLevelUpData(null);
    onOpenChange(false);
  };

  const xpPreview = getXpPreview(duration ? parseInt(duration) : 30, intensity);
  const attributesPreview = getAttributeGainsPreview(type);

  return (
    <AnimatePresence>
      {levelUpData && (
        <LevelUpModal
          newLevel={levelUpData.newLevel}
          attributesGained={levelUpData.attributesGained}
          onClose={handleClose}
        />
      )}
      {open && !levelUpData && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-3xl max-w-lg mx-auto safe-bottom"
          >
            {submitted ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-8 text-center space-y-3"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-success/15 flex items-center justify-center">
                  <Zap size={32} className="text-success" />
                </div>
                <h3 className="font-heading font-bold text-lg text-card-foreground">Check-in registrado!</h3>
                {xpEarned ? <p className="text-sm text-muted-foreground">+{xpEarned} XP ganhos 🎉</p> : null}
              </motion.div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-lg text-card-foreground">Novo Check-in</h3>
                  <button onClick={handleClose} className="p-1 rounded-full hover:bg-muted">
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Título do treino *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Treino de peito destruidor!"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo de treino *</label>
                  <div className="flex flex-wrap gap-2">
                    {WORKOUT_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${type === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Duração (min)</label>
                  <input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    type="number"
                    placeholder="45"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Intensity */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-muted-foreground">Intensidade do Treino</label>
                    <span className="text-xs font-bold text-primary">{intensity}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Leve</span>
                    <span>Moderado</span>
                    <span>Pesado</span>
                  </div>
                </div>

                {/* Previews */}
                {(duration || type) && (
                  <div className="bg-background/50 rounded-xl p-3 border border-border/50 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground font-medium">Recompensa Estimada:</span>
                      <span className="text-sm font-bold text-primary flex items-center gap-1">
                        <Zap size={14} /> +{xpPreview} XP
                      </span>
                    </div>
                    {attributesPreview && (
                      <div className="text-[10px] text-end text-secondary">
                        {attributesPreview}
                      </div>
                    )}
                  </div>
                )}

                {/* Photo */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    id="photo-upload"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="w-full h-32 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground flex flex-col items-center justify-center gap-2 hover:border-primary/30 transition-colors cursor-pointer overflow-hidden relative"
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={24} />
                        <span>Adicionar foto do treino</span>
                      </>
                    )}
                  </label>
                  {previewUrl && (
                    <button
                      onClick={() => { setPhoto(null); setPreviewUrl(null); }}
                      className="text-xs text-destructive mt-2 w-full text-center hover:underline"
                    >
                      Remover foto
                    </button>
                  )}
                </div>

                {/* Submit */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={!title || !type || isUploading}
                  className="w-full py-3.5 rounded-xl bg-gradient-fire text-primary-foreground font-heading font-semibold text-base shadow-glow-primary disabled:opacity-40 disabled:shadow-none"
                >
                  {isUploading ? "Processando..." : "Publicar Check-in 🔥"}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CheckInSheet;
