import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type BlockedUser = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  blocked_at: string;
};

export const useGroupBlocked = (groupId: string | undefined) => {
  return useQuery({
    queryKey: ['group-blocked', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data, error } = await supabase
        .from('group_blocked_users')
        .select('user_id, created_at')
        .eq('group_id', groupId);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = data.map(b => b.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(b => ({
        user_id: b.user_id,
        username: profileMap.get(b.user_id)?.username || 'Usuário',
        avatar_url: profileMap.get(b.user_id)?.avatar_url || null,
        blocked_at: b.created_at,
      })) as BlockedUser[];
    },
    enabled: !!groupId,
  });
};
