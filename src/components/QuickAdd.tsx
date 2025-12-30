import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddProps {
  onAdd: (reps: number, variation: string) => void;
  isLoading?: boolean;
}

const QUICK_VALUES = [10, 15, 20, 25];
const VARIATIONS = ['Standard', 'Weighted', 'Decline', 'Incline', 'Wide', 'Diamond'] as const;

export const QuickAdd = ({ onAdd, isLoading }: QuickAddProps) => {
  const [customReps, setCustomReps] = useState(20);
  const [selectedVariation, setSelectedVariation] = useState<string>('Standard');

  const handleQuickAdd = (reps: number) => {
    onAdd(reps, selectedVariation);
  };

  const handleCustomAdd = () => {
    if (customReps > 0) {
      onAdd(customReps, selectedVariation);
    }
  };

  const adjustCustom = (delta: number) => {
    setCustomReps(prev => Math.max(1, prev + delta));
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Log a Set</h3>
      
      {/* Variation selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {VARIATIONS.map(variation => (
          <Button
            key={variation}
            variant={selectedVariation === variation ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedVariation(variation)}
            className={cn(
              "text-xs transition-colors",
              selectedVariation === variation && "bg-primary text-primary-foreground"
            )}
          >
            {variation}
          </Button>
        ))}
      </div>

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
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => adjustCustom(-5)}
          disabled={customReps <= 5}
          className="h-14 w-14 text-lg"
        >
          <Minus className="h-5 w-5" />
        </Button>
        
        <Input
          type="number"
          value={customReps}
          onChange={(e) => setCustomReps(Math.max(1, parseInt(e.target.value) || 1))}
          className="text-center font-mono text-2xl h-14 flex-1 bg-secondary text-foreground min-w-0"
          min={1}
        />
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => adjustCustom(5)}
          className="h-14 w-14 text-lg"
        >
          <Plus className="h-5 w-5" />
        </Button>

        <Button
          onClick={handleCustomAdd}
          disabled={isLoading || customReps < 1}
          className={cn(
            "h-14 px-5 font-semibold text-base",
            "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Plus className="h-5 w-5 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
};
