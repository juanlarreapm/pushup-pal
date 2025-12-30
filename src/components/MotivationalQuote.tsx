import { useState } from 'react';
import { getDailyQuote, getRandomQuote } from '@/lib/quotes';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MotivationalQuote = () => {
  const [quote, setQuote] = useState(getDailyQuote());

  const refreshQuote = () => {
    setQuote(getRandomQuote());
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 relative group">
      <Button
        variant="ghost"
        size="icon"
        onClick={refreshQuote}
        className="absolute top-4 right-4 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
      
      <p className="text-foreground italic leading-relaxed">
        "{quote.quote}"
      </p>
      <p className="text-sm text-muted-foreground mt-3">
        — {quote.author}
      </p>
    </div>
  );
};
