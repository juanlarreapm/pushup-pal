import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddProps {
  onAdd: (reps: number) => void;
  isLoading?: boolean;
}

const QUICK_VALUES = [10, 15, 20, 25];

export const QuickAdd = ({ onAdd, isLoading }: QuickAddProps) => {
  const [customReps, setCustomReps] = useState(20);

  const handleQuickAdd = (reps: number) => {
    onAdd(reps);
  };

  const handleCustomAdd = () => {
    if (customReps > 0) {
      onAdd(customReps);
    }
  };

  const adjustCustom = (delta: number) => {
    setCustomReps(prev => Math.max(1, prev + delta));
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Log a Set</h3>
      
      {/* Quick add buttons */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {QUICK_VALUES.map(value => (
          <Button
            key={value}
            variant="secondary"
            size="lg"
            onClick={() => handleQuickAdd(value)}
            disabled={isLoading}
            className="font-mono text-lg h-14 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {value}
          </Button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => adjustCustom(-5)}
          disabled={customReps <= 5}
          className="h-12 w-12"
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <Input
          type="number"
          value={customReps}
          onChange={(e) => setCustomReps(Math.max(1, parseInt(e.target.value) || 1))}
          className="text-center font-mono text-xl h-12 flex-1"
          min={1}
        />
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => adjustCustom(5)}
          className="h-12 w-12"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleCustomAdd}
          disabled={isLoading || customReps < 1}
          className={cn(
            "h-12 px-6 font-semibold",
            "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
    </div>
  );
};
