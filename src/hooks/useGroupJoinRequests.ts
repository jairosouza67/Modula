import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type JoinRequest = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  requested_at: string;
};

export const useGroupJoinRequests = (groupId: string | undefined) => {
  return useQuery({
    queryKey: ['group-requests', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data, error } = await supabase
        .from('group_join_requests')
        .select('user_id, created_at')
        .eq('group_id', groupId);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(r => ({
        user_id: r.user_id,
        username: profileMap.get(r.user_id)?.username || 'Usuário',
        avatar_url: profileMap.get(r.user_id)?.avatar_url || null,
        requested_at: r.created_at,
      })) as JoinRequest[];
    },
    enabled: !!groupId,
  });
};
