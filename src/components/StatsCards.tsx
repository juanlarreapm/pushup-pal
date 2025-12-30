import { Trophy, Flame, Target, Dumbbell } from 'lucide-react';

interface StatsCardsProps {
  lifetimeTotal: number;
  records: {
    bestSet: number;
    longestStreak: number;
    mostInDay: number;
  };
}

export const StatsCards = ({ lifetimeTotal, records }: StatsCardsProps) => {
  const stats = [
    {
      label: 'Lifetime Total',
      value: lifetimeTotal.toLocaleString(),
      icon: Dumbbell,
      color: 'text-primary',
    },
    {
      label: 'Best Set',
      value: records.bestSet,
      icon: Trophy,
      color: 'text-yellow-500',
    },
    {
      label: 'Longest Streak',
      value: `${records.longestStreak} day${records.longestStreak !== 1 ? 's' : ''}`,
      icon: Flame,
      color: 'text-primary',
    },
    {
      label: 'Most in a Day',
      value: records.mostInDay,
      icon: Target,
      color: 'text-green-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <p className="font-mono text-2xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};
