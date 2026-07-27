import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

export interface UserAttributes {
  user_id: string;
  strength: number;
  speed: number;
  endurance: number;
  discipline: number;
  stamina: number;
  hp: number;
  max_hp: number;
  level: number;
  total_xp: number;
  coins: number;
}

export const useAttributes = (propUserId?: string) => {
  const { user } = useAuthStore();
  const targetId = propUserId || user?.id;

  return useQuery({
    queryKey: ["user_attributes", targetId],
    queryFn: async (): Promise<UserAttributes | null> => {
      if (!targetId) return null;

      const { data, error } = await supabase
        .from("user_stats")
        .select("user_id, strength, speed, endurance, discipline, stamina, hp, max_hp, level, total_xp, coins")
        .eq("user_id", targetId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No user stats found
          return null;
        }
        throw error;
      }

      return data as UserAttributes;
    },
    enabled: !!targetId,
  });
};
