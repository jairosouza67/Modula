import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';

export type CheckinFeedItem = {
  id: string;
  user_id: string;
  group_id: string | null;
  title: string;
  type: string;
  image_url: string | null;
  duration_minutes: number | null;
  distance_km: number | null;
  xp_earned: number;
  coins_earned: number;
  created_at: string;
  username: string;
  avatar_url: string | null;
  level: number;
  group_name: string | null;
  group_type: string | null;
  likes_count: number;
  comments_count: number;
  liked_by_me?: boolean; // We will fill this manually if we can't join directly
};

export const useFeed = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: feed, isLoading, error } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      // Get the basic feed
      const { data, error } = await supabase
        .from('checkins_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!user) return data as CheckinFeedItem[];

      // Get my likes to populate "liked_by_me"
      const { data: myLikes } = await supabase
        .from('likes')
        .select('checkin_id')
        .eq('user_id', user.id);

      const likedCheckinIds = new Set(myLikes?.map(l => l.checkin_id) || []);

      return (data as CheckinFeedItem[]).map(item => ({
        ...item,
        liked_by_me: likedCheckinIds.has(item.id)
      }));
    }
  });

  const toggleLike = useMutation({
    mutationFn: async ({ checkinId, isLiked }: { checkinId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Não autenticado');

      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('checkin_id', checkinId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({ checkin_id: checkinId, user_id: user.id });
        if (error) throw error;
      }
    },
    onMutate: async ({ checkinId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousFeed = queryClient.getQueryData<CheckinFeedItem[]>(['feed']);

      queryClient.setQueryData<CheckinFeedItem[]>(['feed'], (old) => {
        if (!old) return old;
        return old.map(item => {
          if (item.id === checkinId) {
            return {
              ...item,
              liked_by_me: !isLiked,
              likes_count: isLiked ? item.likes_count - 1 : item.likes_count + 1
            };
          }
          return item;
        });
      });

      return { previousFeed };
    },
    onError: (err, variables, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed'], context.previousFeed);
      }
      toast.error('Erro ao curtir: ' + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    }
  });

  const deleteCheckin = useMutation({
    mutationFn: async (checkinId: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('checkins')
        .delete()
        .eq('id', checkinId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Check-in removido!');
    },
    onError: (err) => toast.error('Erro ao remover: ' + err.message),
  });

  const editCheckin = useMutation({
    mutationFn: async ({ checkinId, title, type }: { checkinId: string; title: string; type: string }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('checkins')
        .update({ title, type })
        .eq('id', checkinId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Check-in atualizado!');
    },
    onError: (err) => toast.error('Erro ao editar: ' + err.message),
  });

  return {
    feed,
    isLoading,
    error,
    toggleLike: (checkinId: string, isLiked: boolean) => toggleLike.mutate({ checkinId, isLiked }),
    deleteCheckin: (checkinId: string) => deleteCheckin.mutate(checkinId),
    editCheckin: (checkinId: string, title: string, type: string) => editCheckin.mutate({ checkinId, title, type }),
  };
};
