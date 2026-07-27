import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AvatarRendererProps {
    level: number;
    hp: number;
    maxHp: number;
    strength: number;
    speed: number;
    endurance: number;
    discipline: number;
    animationState?: "idle" | "levelup" | "attacking" | "damaged";
    className?: string;
    size?: number;
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
    level,
    hp,
    maxHp,
    strength,
    speed,
    endurance,
    discipline,
    animationState = "idle",
    className = "",
    size = 300,
}) => {
    // --- Derived Visual State ---

    // 1. Stage (1-5 base on level)
    const stage = level >= 20 ? 5 : level >= 15 ? 4 : level >= 10 ? 3 : level >= 5 ? 2 : 1;

    // 2. Health Percentage for Expression & Color tone
    const hpPercent = maxHp > 0 ? hp / maxHp : 0;
    const isTired = hpPercent < 0.4;
    const isCritical = hpPercent < 0.2;

    // 3. Aura Color & Effect based on Level & Discipline
    const getAuraColor = () => {
        if (stage === 1) return { color: "#9ca3af", glow: "0px 0px 10px rgba(156,163,175,0.2)" }; // Gray
        if (stage === 2) return { color: "#3b82f6", glow: "0px 0px 15px rgba(59,130,246,0.4)" }; // Blue
        if (stage === 3) return { color: "#8b5cf6", glow: "0px 0px 20px rgba(139,92,246,0.6)" }; // Purple
        if (stage === 4) return { color: "#f59e0b", glow: "0px 0px 30px rgba(245,158,11,0.8)" }; // Orange/Gold
        return { color: "#ef4444", glow: "0px 0px 40px rgba(239,68,68,1)" }; // Red/Fire
    };
    const aura = getAuraColor();

    // 4. Muscle definition (opacity based on STR and endurance)
    // Max muscle base starts showing heavily at STR 50+
    const muscleOpacity = Math.min(1, (strength + endurance) / 100);

    // 5. Speed effect (trailing lines or wind)
    const showSpeedLines = speed > 30;

    return (
        <div
            className={`relative flex items-center justify-center shrink-0 ${className}`}
            style={{ width: size, height: size, minWidth: size, minHeight: size }}
        >
            {/* Background Aura */}
            <motion.div
                className="absolute w-full h-full rounded-full"
                animate={{
                    scale: [1, 1.05 + discipline / 100, 1],
                    opacity: [0.3, 0.4 + discipline / 200, 0.3],
                }}
                transition={{
                    repeat: Infinity,
                    duration: Math.max(1.5, 4 - discipline / 20), // higher discipline = faster aura pulse
                    ease: "easeInOut",
                }}
                style={{
                    background: `radial-gradient(circle, ${aura.color} 0%, transparent 70%)`,
                    filter: "blur(20px)",
                }}
            />

            {/* Speed Lines (if high speed) */}
            {showSpeedLines && (
                <motion.svg
                    className="absolute w-full h-full text-white/20"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    viewBox="0 0 100 100"
                >
                    <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 20" fill="none" />
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 30" fill="none" />
                </motion.svg>
            )}

            {/* Main Avatar SVG Container */}
            <motion.div
                className="relative z-10 w-3/4 h-3/4"
                animate={
                    animationState === "damaged"
                        ? { x: [-5, 5, -5, 5, 0], filter: "brightness(0.5) hue-rotate(-30deg)" }
                        : animationState === "levelup"
                            ? { y: [0, -20, 0], scale: [1, 1.1, 1], filter: "brightness(1.5)" }
                            : { y: [0, -5, 0] } // idle floating
                }
                transition={
                    animationState === "damaged"
                        ? { duration: 0.3 }
                        : animationState === "levelup"
                            ? { duration: 1 }
                            : { repeat: Infinity, duration: 4, ease: "easeInOut" }
                }
            >
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                    {/* Defs for gradients */}
                    <defs>
                        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={isCritical ? "#4b5563" : isTired ? "#9ca3af" : "#f3f4f6"} />
                            <stop offset="100%" stopColor={isCritical ? "#1f2937" : isTired ? "#4b5563" : "#9ca3af"} />
                        </linearGradient>

                        <linearGradient id="primaryColor" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={aura.color} />
                            <stop offset="100%" stopColor="#000000" />
                        </linearGradient>
                    </defs>

                    {/* LAYER 1: Base Body */}
                    {stage === 1 && (
                        // Skinny shape
                        <path d="M70,180 C70,120 85,100 85,70 C85,50 115,50 115,70 C115,100 130,120 130,180 Z" fill="url(#bodyGrad)" />
                    )}
                    {stage >= 2 && stage < 4 && (
                        // Athletic shape
                        <path d="M60,180 C60,110 80,90 85,70 C85,50 115,50 115,70 C120,90 140,110 140,180 Z" fill="url(#bodyGrad)" />
                    )}
                    {stage >= 4 && (
                        // Muscular shape (V-taper)
                        <path d="M40,180 C60,110 75,85 85,70 C85,50 115,50 115,70 C125,85 140,110 160,180 Z" fill="url(#bodyGrad)" />
                    )}

                    {/* LAYER 2: Head/Helmet/Hair (Level specific) */}
                    {stage >= 2 && (
                        <path d="M85,70 C85,40 115,40 115,70" fill={aura.color} opacity="0.8" />
                    )}
                    {stage >= 4 && (
                        <path d="M80,65 L100,30 L120,65 Z" fill={aura.color} />
                    )}

                    {/* LAYER 3: Body Details (Muscle definition opacity based on STR) */}
                    <g opacity={muscleOpacity} fill="none" stroke="#1f2937" strokeWidth="2">
                        {stage >= 2 && (
                            <>
                                {/* Chest/Abs outline */}
                                <path d="M85,100 C100,110 115,100 115,100" />
                                <path d="M100,105 L100,150" />
                                {stage >= 3 && (
                                    <>
                                        <path d="M90,120 L110,120" />
                                        <path d="M90,135 L110,135" />
                                    </>
                                )}
                            </>
                        )}
                        {stage >= 4 && (
                            <>
                                {/* Shoulders / Pecs detail */}
                                <path d="M60,100 C75,90 85,95 85,95" />
                                <path d="M140,100 C125,90 115,95 115,95" />
                            </>
                        )}
                    </g>

                    {/* LAYER 4: Equipment / Details based on attributes */}
                    {speed > 50 && (
                        // Speed boots/anklets indicator
                        <path d="M65,170 L75,180 M125,180 L135,170" stroke="#fbbf24" strokeWidth="3" />
                    )}
                    {endurance > 50 && (
                        // Glowing core/heart
                        <circle cx="100" cy="100" r="5" fill="#10b981" filter="drop-shadow(0 0 5px #10b981)" />
                    )}

                    {/* LAYER 5: Face/Expression */}
                    <g transform="translate(100, 60)">
                        {isCritical ? (
                            // Dead/KO face
                            <g stroke="#1f2937" strokeWidth="2">
                                <path d="M-8,-2 L-2,2 M-8,2 L-2,-2" />
                                <path d="M2,-2 L8,2 M2,2 L8,-2" />
                                <path d="M-5,10 C0,5 5,10 5,10" fill="none" />
                            </g>
                        ) : isTired ? (
                            // Tired face
                            <g>
                                <line x1="-8" y1="0" x2="-2" y2="0" stroke="#1f2937" strokeWidth="2" />
                                <line x1="2" y1="0" x2="8" y2="0" stroke="#1f2937" strokeWidth="2" />
                                <path d="M-5,10 C0,8 5,10 5,10" fill="none" stroke="#1f2937" strokeWidth="2" />
                                {/* Sweat drop */}
                                <path d="M 12 0 C 12 -2 10 -5 10 -5 C 10 -5 8 -2 8 0 C 8 2 12 2 12 0 Z" fill="#60a5fa" />
                            </g>
                        ) : (
                            // Confident/Fierce face
                            <g>
                                <path d="M-10,-2 L-3,2" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
                                <path d="M10,-2 L3,2" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
                                {/* Glowing Eyes based on aura if stage >= 3 */}
                                <circle cx="-5" cy="4" r="2" fill={stage >= 3 ? aura.color : "#1f2937"} />
                                <circle cx="5" cy="4" r="2" fill={stage >= 3 ? aura.color : "#1f2937"} />
                                {/* Smirk */}
                                <path d="M-4,12 C0,13 4,11 6,9" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
                            </g>
                        )}
                    </g>

                </svg>
            </motion.div>
        </div>
    );
};
