import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, AlertCircle, Check, Loader2 } from 'lucide-react';
import { parseHistoryText, ParseResult } from '@/lib/parseHistory';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export const ImportHistory = () => {
  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleParse = () => {
    const result = parseHistoryText(rawText);
    setParseResult(result);
    setStep('preview');
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.entries.length === 0) return;

    setIsImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create all log entries
      const entries = parseResult.entries.flatMap(entry =>
        entry.sets.map((reps, index) => ({
          user_id: user.id,
          reps,
          // Stagger timestamps slightly so they appear in order
          logged_at: new Date(entry.date.getTime() + index * 60000).toISOString(),
        }))
      );

      // Batch insert
      const { error } = await supabase
        .from('pushup_logs')
        .insert(entries);

      if (error) throw error;

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['pushup-logs'] });

      toast({
        title: 'Import complete!',
        description: `Added ${parseResult.totalSets} sets (${parseResult.totalReps.toLocaleString()} reps) across ${parseResult.entries.length} days.`,
      });

      // Reset and close
      setOpen(false);
      setRawText('');
      setParseResult(null);
      setStep('input');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: 'Could not import your history. Please try again.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setRawText('');
    setParseResult(null);
    setStep('input');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => o ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Upload className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Pushup History</DialogTitle>
          <DialogDescription>
            Paste your pushup notes below. Format: date followed by reps.
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4 flex-1">
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="font-medium">Example formats:</p>
              <p>10/1: 20, 20, 30, 30</p>
              <p>10/2 - 25, 25, 25, 25</p>
              <p>Oct 3: 30 30 20 20</p>
            </div>
            <Textarea
              placeholder="Paste your pushup history here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <Button
              onClick={handleParse}
              disabled={!rawText.trim()}
              className="w-full"
            >
              Preview Import
            </Button>
          </div>
        )}

        {step === 'preview' && parseResult && (
          <div className="space-y-4 flex-1 min-h-0 flex flex-col">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-lg font-bold text-primary">{parseResult.entries.length}</p>
                <p className="text-xs text-muted-foreground">Days</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-lg font-bold text-primary">{parseResult.totalSets}</p>
                <p className="text-xs text-muted-foreground">Sets</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-lg font-bold text-primary">{parseResult.totalReps.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Reps</p>
              </div>
            </div>

            {/* Warnings */}
            {parseResult.warnings.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                  <AlertCircle className="h-4 w-4" />
                  {parseResult.warnings.length} line(s) couldn't be parsed
                </div>
                <div className="text-xs text-muted-foreground max-h-16 overflow-y-auto">
                  {parseResult.warnings.slice(0, 3).map((w, i) => (
                    <p key={i} className="truncate">{w}</p>
                  ))}
                  {parseResult.warnings.length > 3 && (
                    <p>...and {parseResult.warnings.length - 3} more</p>
                  )}
                </div>
              </div>
            )}

            {/* Preview table */}
            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Date</TableHead>
                    <TableHead>Sets</TableHead>
                    <TableHead className="text-right w-16">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parseResult.entries.map((entry, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">
                        {format(entry.date, 'M/d')}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.sets.join(', ')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.total}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('input')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={parseResult.entries.length === 0 || isImporting}
                className="flex-1"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Import {parseResult.totalSets} Sets
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
