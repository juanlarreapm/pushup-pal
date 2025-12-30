import { cn } from '@/lib/utils';

interface VariationStat {
  variation: string;
  totalReps: number;
  bestSet: number;
  setCount: number;
}

interface VariationStatsProps {
  stats: VariationStat[];
}

const variationColors: Record<string, string> = {
  Standard: 'bg-muted',
  Weighted: 'bg-amber-500',
  Decline: 'bg-red-500',
  Incline: 'bg-blue-500',
  Wide: 'bg-green-500',
  Diamond: 'bg-purple-500',
};

export const VariationStats = ({ stats }: VariationStatsProps) => {
  if (stats.length === 0) {
    return null;
  }

  const totalReps = stats.reduce((sum, s) => sum + s.totalReps, 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-4">By Variation</h3>
      
      {/* Bar visualization */}
      <div className="h-3 rounded-full overflow-hidden flex mb-4">
        {stats.map((stat) => (
          <div
            key={stat.variation}
            className={cn(
              "h-full transition-all",
              variationColors[stat.variation] || 'bg-muted'
            )}
            style={{ width: `${(stat.totalReps / totalReps) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend and details */}
      <div className="space-y-2">
        {stats.map((stat) => (
          <div key={stat.variation} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className={cn(
                  "w-3 h-3 rounded-full",
                  variationColors[stat.variation] || 'bg-muted'
                )} 
              />
              <span className="text-foreground">{stat.variation}</span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="font-mono">{stat.totalReps.toLocaleString()}</span>
              <span className="text-xs">({stat.setCount} sets)</span>
              <span className="text-xs">best: {stat.bestSet}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
