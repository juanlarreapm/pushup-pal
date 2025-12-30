import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

interface DailyNote {
  id: string;
  user_id: string;
  note_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useDailyNotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['daily-notes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('note_date', { ascending: false });
      
      if (error) throw error;
      return data as DailyNote[];
    },
    enabled: !!user,
  });

  const saveNoteMutation = useMutation({
    mutationFn: async ({ date, content }: { date: Date; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const noteDate = format(date, 'yyyy-MM-dd');
      
      // Try to upsert
      const { data, error } = await supabase
        .from('daily_notes')
        .upsert(
          { 
            user_id: user.id, 
            note_date: noteDate, 
            content,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,note_date' }
        )
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-notes'] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (date: Date) => {
      if (!user) throw new Error('Not authenticated');
      
      const noteDate = format(date, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('daily_notes')
        .delete()
        .eq('user_id', user.id)
        .eq('note_date', noteDate);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-notes'] });
    },
  });

  const getNoteForDate = (date: Date): DailyNote | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return notes.find(note => note.note_date === dateStr);
  };

  const getDatesWithNotes = (): Date[] => {
    return notes.map(note => {
      const [year, month, day] = note.note_date.split('-').map(Number);
      return new Date(year, month - 1, day);
    });
  };

  return {
    notes,
    isLoading,
    saveNote: saveNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    isSaving: saveNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
    getNoteForDate,
    getDatesWithNotes,
  };
};
