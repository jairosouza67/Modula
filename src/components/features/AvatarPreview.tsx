import React from "react";
import { useAttributes } from "@/hooks/useAttributes";
import { AvatarRenderer } from "./AvatarRenderer";

interface AvatarPreviewProps {
    userId?: string;
    size?: number;
    className?: string;
}

export const AvatarPreview: React.FC<AvatarPreviewProps> = ({
    userId,
    size = 40,
    className = ""
}) => {
    // If no userId is passed, it uses the currently authenticated user
    const { data: stats, isLoading } = useAttributes(userId);

    if (isLoading) {
        return (
            <div
                className={`bg-muted animate-pulse rounded-full ${className}`}
                style={{ width: size, height: size }}
            />
        );
    }

    // Fallback if no stats
    const safeStats = stats || {
        level: 1,
        hp: 100,
        max_hp: 100,
        strength: 10,
        speed: 10,
        endurance: 10,
        discipline: 10
    };

    return (
        <div 
            className={`rounded-full overflow-hidden bg-background/50 border border-border/50 flex items-center justify-center shrink-0 ${className}`} 
            style={{ width: size, height: size, minWidth: size, minHeight: size }}
        >
            <AvatarRenderer
                level={safeStats.level}
                hp={safeStats.hp}
                maxHp={safeStats.max_hp}
                strength={safeStats.strength}
                speed={safeStats.speed}
                endurance={safeStats.endurance}
                discipline={safeStats.discipline}
                size={size}
                className=""
            />
        </div>
    );
};
