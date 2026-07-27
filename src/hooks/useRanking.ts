import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { AVATAR_PHASES } from '@/data/mockData';

export const useRanking = () => {
  return useQuery({
    queryKey: ['ranking'],
    queryFn: async () => {
      // Query the global ranking view
      const { data, error } = await supabase
        .from('global_ranking_view')
        .select('*')
        .order('total_xp', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((row, index) => {
        const level = row.level || 1;
        let phaseIndex = Math.floor(level / 5);
        if (phaseIndex > 4) phaseIndex = 4;

        return {
          id: row.user_id,
          name: row.username || 'Guerreiro',
          avatar_url: row.avatar_url || null,
          xp: row.total_xp,
          level: row.level,
          phase: AVATAR_PHASES[phaseIndex].name,
          checkins: row.checkins_count,
          streak: 0,
          position: index + 1
        };
      });
    }
  });
};
