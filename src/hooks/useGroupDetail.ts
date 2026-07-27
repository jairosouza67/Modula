import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export type GroupDetail = {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  photo_url: string;
  group_type: string;
  created_at: string;
  member_count: number;
};

export type GroupMember = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  joined_at: string;
};

export const useGroupDetail = (groupId: string | undefined) => {
  const { user } = useAuthStore();

  const groupQuery = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      if (!groupId) throw new Error('No group id');
      const { data, error } = await supabase
        .from('groups_view')
        .select('*')
        .eq('id', groupId)
        .single();
      if (error) throw error;
      return data as GroupDetail;
    },
    enabled: !!groupId,
  });

  const membersQuery = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      if (!groupId) throw new Error('No group id');
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id, joined_at')
        .eq('group_id', groupId);
      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Fetch profiles for members
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(m => ({
        user_id: m.user_id,
        username: profileMap.get(m.user_id)?.username || 'Usuário',
        avatar_url: profileMap.get(m.user_id)?.avatar_url || null,
        joined_at: m.joined_at,
      })) as GroupMember[];
    },
    enabled: !!groupId,
  });

  const checkinsQuery = useQuery({
    queryKey: ['group-checkins', groupId],
    queryFn: async () => {
      if (!groupId) throw new Error('No group id');
      const { data, error } = await supabase
        .from('checkins_feed')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
  });

  const isOwner = groupQuery.data?.owner_id === user?.id;

  return {
    group: groupQuery.data,
    members: membersQuery.data || [],
    checkins: checkinsQuery.data || [],
    isOwner,
    isLoading: groupQuery.isLoading,
    refetchMembers: membersQuery.refetch,
    refetchCheckins: checkinsQuery.refetch,
    refetchGroup: groupQuery.refetch,
  };
};
