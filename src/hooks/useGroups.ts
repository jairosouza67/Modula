import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups_view')
        .select('*')
        .order('member_count', { ascending: false });

      if (error) throw error;

      return (data || []).map((group: any) => ({
        id: group.id,
        name: group.name,
        description: group.description || '',
        memberCount: group.member_count || 0,
        photoUrl: group.photo_url || '',
        type: group.group_type || 'public'
      }));
    }
  });
};
