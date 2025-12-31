import { cn } from '@/lib/utils';
import { Home, BarChart3, Calendar } from 'lucide-react';

export type TabId = 'home' | 'stats' | 'calendar';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: 'home' as TabId, label: 'Home', icon: Home },
  { id: 'stats' as TabId, label: 'Stats', icon: BarChart3 },
  { id: 'calendar' as TabId, label: 'Calendar', icon: Calendar },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
