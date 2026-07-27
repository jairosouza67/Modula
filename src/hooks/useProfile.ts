import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { AVATAR_PHASES } from '@/data/mockData';

export const useProfile = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não logado");

      // Buscar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      // Buscar status do usuário
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;
      
      // Buscar avatar stage
      const { data: avatarData, error: avatarError } = await supabase
        .from('avatars')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (avatarError && avatarError.code !== 'PGRST116') throw avatarError;

      const level = statsData?.level || 1;
      const totalXp = statsData?.total_xp || 0;
      const coins = statsData?.coins || 0;
      const totalCheckins = statsData?.checkins_count || 0;
      const stage = avatarData?.stage || 1;

      // Calcular qual o XP atual na fase X.
      // Fase 1: 0-1000
      // Fase 2: 1000-2500
      // Fase 3: 2500-5000
      // Fase 4: 5000-10000
      // Fase 5: 10000+
      let phaseIndex = stage - 1;
      if (phaseIndex < 0) phaseIndex = 0;
      if (phaseIndex > 4) phaseIndex = 4;
      
      const phase = AVATAR_PHASES[phaseIndex];

      let nextLevelXp = 1000;
      if (level >= 5) nextLevelXp = 2500;
      if (level >= 10) nextLevelXp = 5000;
      if (level >= 15) nextLevelXp = 10000;
      if (level >= 20) nextLevelXp = 999999;

      return {
        name: profileData?.username || user.user_metadata?.name || 'Guerreiro',
        bio: 'Evoluindo todo dia 💪',
        level,
        xp: totalXp,
        phase,
        coins,
        streak: 0, 
        bestStreak: 0,
        totalCheckins,
        avatar_url: profileData?.avatar_url || null,
        stage
      };
    },
    enabled: !!user,
  });
};
