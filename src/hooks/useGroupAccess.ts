import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

export const useGroupAccess = (groupId: string | undefined) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const membershipQuery = useQuery({
    queryKey: ['group-membership', groupId, user?.id],
    queryFn: async () => {
      if (!groupId || !user) return { isMember: false, isOwner: false };

      // Check if owner
      const { data: group } = await supabase
        .from('groups_view')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (group?.owner_id === user.id) return { isMember: true, isOwner: true };

      // Check membership
      const { data: membership } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      return { isMember: !!membership, isOwner: false };
    },
    enabled: !!groupId && !!user,
  });

  const joinWithPassword = useMutation({
    mutationFn: async (password: string) => {
      if (!groupId || !user) throw new Error('Não autenticado');

      // Verify password
      const { data: group, error: gErr } = await supabase
        .from('groups')
        .select('id, password')
        .eq('id', groupId)
        .single();

      if (gErr) throw gErr;
      if (!group) throw new Error('Grupo não encontrado');
      if (group.password !== password) throw new Error('Senha incorreta');

      // Check if blocked
      const { data: blocked } = await supabase
        .from('group_blocked_users')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (blocked) throw new Error('Você está bloqueado deste grupo');

      // Join
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-membership', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      toast.success('Você entrou no grupo!');
    },
    onError: (err) => toast.error(err.message),
  });

  const joinWithLink = useMutation({
    mutationFn: async () => {
      if (!groupId || !user) throw new Error('Não autenticado');

      // Check if blocked
      const { data: blocked } = await supabase
        .from('group_blocked_users')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (blocked) throw new Error('Você está bloqueado deste grupo');

      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-membership', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      toast.success('Você entrou no grupo!');
    },
    onError: (err) => toast.error(err.message),
  });

  return {
    isMember: membershipQuery.data?.isMember ?? false,
    isOwner: membershipQuery.data?.isOwner ?? false,
    isCheckingAccess: membershipQuery.isLoading,
    joinWithPassword: (password: string) => joinWithPassword.mutate(password),
    joinWithLink: () => joinWithLink.mutate(),
    isJoining: joinWithPassword.isPending || joinWithLink.isPending,
  };
};
