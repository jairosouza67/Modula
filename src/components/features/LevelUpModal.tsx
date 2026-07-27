import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Shield, Zap } from "lucide-react";

interface LevelUpModalProps {
    newLevel: number;
    attributesGained: string;
    onClose: () => void;
}

const LevelUpModal = ({ newLevel, attributesGained, onClose }: LevelUpModalProps) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.5, y: 50, rotateX: 20 }}
                    animate={{ scale: 1, y: 0, rotateX: 0 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200 }}
                    className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-card border border-primary/20 shadow-glow-primary text-center p-8 z-10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Background glow effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-fire opacity-10 blur-3xl -z-10" />

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
                        className="w-24 h-24 mx-auto bg-gradient-fire rounded-full flex items-center justify-center shadow-glow-primary mb-6"
                    >
                        <Trophy size={48} className="text-primary-foreground drop-shadow-md" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-2 mb-8"
                    >
                        <h2 className="text-secondary/80 font-bold uppercase tracking-widest text-sm">
                            Level Up!
                        </h2>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-5xl font-heading font-black text-foreground drop-shadow-lg">
                                Nível {newLevel}
                            </span>
                        </div>
                    </motion.div>

                    {attributesGained && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-background/50 rounded-2xl p-4 mb-8 border border-white/5"
                        >
                            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center justify-center gap-2">
                                <Star size={14} className="text-accent" />
                                Novos Atributos
                                <Star size={14} className="text-accent" />
                            </h3>
                            <p className="text-primary font-bold text-lg">{attributesGained}</p>
                        </motion.div>
                    )}

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        className="w-full py-4 rounded-xl bg-gradient-fire text-primary-foreground font-heading font-bold shadow-glow-primary"
                    >
                        Continuar Treinando
                    </motion.button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LevelUpModal;
