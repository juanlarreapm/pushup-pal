import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay } from 'date-fns';
import { CalendarDays, Check, X } from 'lucide-react';

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
  const hitGoal = selectedDayTotal >= 100;

  // Custom day content to show indicators
  const modifiers = useMemo(() => {
    const goalDays: Date[] = [];
    const activeDays: Date[] = [];
    
    dailyData.forEach((data, dateStr) => {
      // Parse date string parts to avoid timezone issues
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      
      if (data.total >= 100) {
        goalDays.push(date);
      } else if (data.total > 0) {
        activeDays.push(date);
      }
    });
    
    return { goalDays, activeDays };
  }, [dailyData]);

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
          onSelect={setSelectedDate}
          className="rounded-md border mx-auto pointer-events-auto"
          modifiers={{
            goal: modifiers.goalDays,
            active: modifiers.activeDays,
          }}
          modifiersClassNames={{
            goal: 'bg-primary/20 text-primary font-bold',
            active: 'bg-muted text-foreground',
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
                    .map((log, i) => (
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
                  {hitGoal ? ' Goal reached! 🎉' : ` ${Math.max(0, 100 - selectedDayTotal)} to goal`}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
