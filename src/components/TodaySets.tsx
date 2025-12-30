import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface PushupLog {
  id: string;
  reps: number;
  logged_at: string;
}

interface TodaySetsProps {
  logs: PushupLog[];
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export const TodaySets = ({ logs, onDelete, isDeleting }: TodaySetsProps) => {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Today's Sets</h3>
        <p className="text-muted-foreground text-center py-8">
          No sets logged yet today. Start pushing!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Today's Sets</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {logs.map((log, index) => (
          <div
            key={log.id}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-6">#{logs.length - index}</span>
              <span className="font-mono text-lg font-semibold">{log.reps}</span>
              <span className="text-sm text-muted-foreground">reps</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {format(new Date(log.logged_at), 'h:mm a')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(log.id)}
                disabled={isDeleting}
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
