import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format, startOfDay } from 'date-fns';
import { CalendarDays, Check, StickyNote, Pencil, Trash2, Save, X } from 'lucide-react';
import { useDailyNotes } from '@/hooks/useDailyNotes';
import { toast } from 'sonner';
import { DAILY_GOAL } from '@/lib/constants';

interface PushupLog {
  id: string;
  reps: number;
  logged_at: string;
  variation?: string | null;
}

interface CalendarViewProps {
  logs: PushupLog[];
}

export const CalendarView = ({ logs }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  
  const { getNoteForDate, getDatesWithNotes, saveNote, deleteNote, isSaving, isDeleting } = useDailyNotes();

  // Group logs by day for quick lookup
  const dailyData = useMemo(() => {
    const data: Map<string, { total: number; sets: PushupLog[] }> = new Map();
    
    logs.forEach(log => {
      const dayKey = format(startOfDay(new Date(log.logged_at)), 'yyyy-MM-dd');
      const existing = data.get(dayKey) || { total: 0, sets: [] };
      data.set(dayKey, {
        total: existing.total + log.reps,
        sets: [...existing.sets, log],
      });
    });
    
    return data;
  }, [logs]);

  // Get logs for selected date
  const selectedDayLogs = useMemo(() => {
    if (!selectedDate) return [];
    const dayKey = format(startOfDay(selectedDate), 'yyyy-MM-dd');
    return dailyData.get(dayKey)?.sets || [];
  }, [selectedDate, dailyData]);

  const selectedDayTotal = selectedDayLogs.reduce((sum, log) => sum + log.reps, 0);
  const hitGoal = selectedDayTotal >= DAILY_GOAL;

  // Get note for selected date
  const selectedDayNote = selectedDate ? getNoteForDate(selectedDate) : undefined;

  // Custom day content to show indicators
  const modifiers = useMemo(() => {
    const goalDays: Date[] = [];
    const activeDays: Date[] = [];
    const noteDays = getDatesWithNotes();
    
    dailyData.forEach((data, dateStr) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      if (data.total >= DAILY_GOAL) {
        goalDays.push(date);
      } else if (data.total > 0) {
        activeDays.push(date);
      }
    });
    
    return { goalDays, activeDays, noteDays };
  }, [dailyData, getDatesWithNotes]);

  const handleEditNote = () => {
    setNoteContent(selectedDayNote?.content || '');
    setIsEditingNote(true);
  };

  const handleSaveNote = async () => {
    if (!selectedDate || !noteContent.trim()) return;
    
    try {
      await saveNote({ date: selectedDate, content: noteContent.trim() });
      setIsEditingNote(false);
      toast.success('Note saved');
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedDate) return;
    
    try {
      await deleteNote(selectedDate);
      setIsEditingNote(false);
      setNoteContent('');
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingNote(false);
    setNoteContent('');
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            setSelectedDate(date);
            setIsEditingNote(false);
            setNoteContent('');
          }}
          className="rounded-md border mx-auto pointer-events-auto"
          modifiers={{
            goal: modifiers.goalDays,
            active: modifiers.activeDays,
            hasNote: modifiers.noteDays,
          }}
          modifiersClassNames={{
            goal: 'bg-primary/20 text-primary font-bold',
            active: 'bg-muted text-foreground',
            hasNote: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full',
          }}
        />

        {/* Selected day details */}
        {selectedDate && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">
                {format(selectedDate, 'EEEE, MMM d')}
              </h3>
              {selectedDayLogs.length > 0 && (
                <Badge variant={hitGoal ? 'default' : 'secondary'} className="gap-1">
                  {hitGoal ? <Check className="h-3 w-3" /> : null}
                  {selectedDayTotal} reps
                </Badge>
              )}
            </div>

            {selectedDayLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pushups logged</p>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {selectedDayLogs
                    .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
                    .map((log) => (
                      <div
                        key={log.id}
                        className="px-2 py-1 bg-muted rounded text-xs font-mono"
                      >
                        {log.reps}
                        {log.variation && (
                          <span className="text-primary ml-0.5 font-medium">
                            {log.variation.charAt(0).toLowerCase()}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedDayLogs.length} set{selectedDayLogs.length !== 1 ? 's' : ''} • 
                  {hitGoal ? ' Goal reached! 🎉' : ` ${Math.max(0, DAILY_GOAL - selectedDayTotal)} to goal`}
                </p>
              </div>
            )}

            {/* Note Section */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                  Note
                </div>
                {!isEditingNote && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={handleEditNote}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {selectedDayNote && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={handleDeleteNote}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {isEditingNote ? (
                <div className="space-y-2">
                  <Textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Add a note for this day..."
                    className="min-h-[80px] text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNote}
                      disabled={isSaving || !noteContent.trim()}
                      className="gap-1"
                    >
                      <Save className="h-3 w-3" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="gap-1"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : selectedDayNote ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedDayNote.content}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No note for this day
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
