import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChartData {
  date: string;
  fullDate: string;
  total: number;
  goal: number;
}

interface ProgressChartProps {
  weeklyData: ChartData[];
  monthlyData: ChartData[];
}

export const ProgressChart = ({ weeklyData, monthlyData }: ProgressChartProps) => {
  const [view, setView] = useState<'week' | 'month'>('week');
  const data = view === 'week' ? weeklyData : monthlyData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm text-muted-foreground">{item.fullDate}</p>
          <p className="font-mono font-semibold">
            {payload[0].value} <span className="text-muted-foreground">pushups</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm text-muted-foreground uppercase tracking-wider">Progress</h3>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('week')}
            className={cn(
              "h-7 px-3 text-xs",
              view === 'week' && "bg-background shadow-sm"
            )}
          >
            Week
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('month')}
            className={cn(
              "h-7 px-3 text-xs",
              view === 'month' && "bg-background shadow-sm"
            )}
          >
            Month
          </Button>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              interval={view === 'month' ? 4 : 0}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
            <ReferenceLine 
              y={100} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
            <Bar 
              dataKey="total" 
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={view === 'week' ? 40 : 12}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-2">
        Dashed line = daily goal (100)
      </p>
    </div>
  );
};
