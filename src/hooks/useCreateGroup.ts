import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

interface CreateGroupInput {
  name: string;
  description: string;
  type: 'public' | 'private';
  password?: string;
}

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: CreateGroupInput) => {
      if (!user) throw new Error('Usuário não autenticado');

      const insertData: any = {
        name: input.name,
        description: input.description,
        type: input.type,
        owner_id: user.id,
      };

      if (input.type === 'private' && input.password) {
        insertData.password = input.password;
      }

      const { data, error } = await supabase
        .from('groups')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Add owner as member
      await supabase
        .from('group_members')
        .insert({ group_id: data.id, user_id: user.id });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};
