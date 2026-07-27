import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

export const useGroupAdmin = (groupId: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const invalidateGroup = () => {
    queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
    queryClient.invalidateQueries({ queryKey: ['group-checkins', groupId] });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
  };

  const updateGroup = useMutation({
    mutationFn: async ({ name, description, type, password }: { name: string; description: string; type: string; password?: string }) => {
      if (!groupId || !user) throw new Error('Não autenticado');
      const updateData: any = { name, description, type };
      // For private groups, set or clear password
      if (type === 'private') {
        updateData.password = password || null;
      } else {
        updateData.password = null;
      }
      const { error } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', groupId)
        .eq('owner_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroup();
      toast.success('Grupo atualizado!');
    },
    onError: (err) => toast.error('Erro ao atualizar: ' + err.message),
  });

  const deleteGroup = useMutation({
    mutationFn: async () => {
      if (!groupId || !user) throw new Error('Não autenticado');
      // Delete members first, then group
      await supabase.from('group_members').delete().eq('group_id', groupId);
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)
        .eq('owner_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Grupo excluído!');
    },
    onError: (err) => toast.error('Erro ao excluir: ' + err.message),
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      if (!groupId || !user) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroup();
      toast.success('Membro removido!');
    },
    onError: (err) => toast.error('Erro ao remover membro: ' + err.message),
  });

  const removeCheckin = useMutation({
    mutationFn: async (checkinId: string) => {
      if (!groupId || !user) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('checkins')
        .delete()
        .eq('id', checkinId)
        .eq('group_id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroup();
      toast.success('Post removido do grupo!');
    },
    onError: (err) => toast.error('Erro ao remover post: ' + err.message),
  });

  const blockUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!groupId || !user) throw new Error('Não autenticado');
      // Remove from members first
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
      // Insert into blocked list
      const { error } = await supabase
        .from('group_blocked_users')
        .insert({ group_id: groupId, user_id: userId, blocked_by: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroup();
      queryClient.invalidateQueries({ queryKey: ['group-blocked', groupId] });
      toast.success('Usuário bloqueado do grupo!');
    },
    onError: (err) => toast.error('Erro ao bloquear: ' + err.message),
  });

  const unblockUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!groupId) throw new Error('Sem grupo');
      const { error } = await supabase
        .from('group_blocked_users')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-blocked', groupId] });
      toast.success('Usuário desbloqueado!');
    },
    onError: (err) => toast.error('Erro ao desbloquear: ' + err.message),
  });

  const approveJoinRequest = useMutation({
    mutationFn: async (requesterId: string) => {
      if (!groupId) throw new Error('Sem grupo');
      // Add to members
      await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: requesterId });
      // Remove request
      const { error } = await supabase
        .from('group_join_requests')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', requesterId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGroup();
      queryClient.invalidateQueries({ queryKey: ['group-requests', groupId] });
      toast.success('Solicitação aprovada!');
    },
    onError: (err) => toast.error('Erro: ' + err.message),
  });

  const rejectJoinRequest = useMutation({
    mutationFn: async (requesterId: string) => {
      if (!groupId) throw new Error('Sem grupo');
      const { error } = await supabase
        .from('group_join_requests')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', requesterId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-requests', groupId] });
      toast.success('Solicitação rejeitada.');
    },
    onError: (err) => toast.error('Erro: ' + err.message),
  });

  return {
    updateGroup: (data: { name: string; description: string; type: string; password?: string }) => updateGroup.mutate(data),
    deleteGroup: () => deleteGroup.mutate(),
    removeMember: (userId: string) => removeMember.mutate(userId),
    removeCheckin: (checkinId: string) => removeCheckin.mutate(checkinId),
    blockUser: (userId: string) => blockUser.mutate(userId),
    unblockUser: (userId: string) => unblockUser.mutate(userId),
    approveJoinRequest: (userId: string) => approveJoinRequest.mutate(userId),
    rejectJoinRequest: (userId: string) => rejectJoinRequest.mutate(userId),
    isUpdating: updateGroup.isPending,
    isDeleting: deleteGroup.isPending,
  };
};
