import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export const useMyGroups = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['my-groups', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get group IDs where user is a member
      const { data: memberships, error: memErr } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memErr) throw memErr;

      // Also get groups owned by user
      const { data: ownedGroups, error: ownErr } = await supabase
        .from('groups_view')
        .select('id')
        .eq('owner_id', user.id);

      if (ownErr) throw ownErr;

      const memberIds = memberships?.map(m => m.group_id) || [];
      const ownedIds = ownedGroups?.map(g => g.id) || [];
      const allIds = [...new Set([...memberIds, ...ownedIds])];
      if (allIds.length === 0) return [];

      const { data, error } = await supabase
        .from('groups_view')
        .select('*')
        .in('id', allIds)
        .order('member_count', { ascending: false });

      if (error) throw error;

      return (data || []).map((group: any) => ({
        id: group.id,
        name: group.name,
        description: group.description || '',
        memberCount: group.member_count || 0,
        photoUrl: group.photo_url || '',
        type: group.group_type || 'public',
      }));
    },
    enabled: !!user,
  });
};
