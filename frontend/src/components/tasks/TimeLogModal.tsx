import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Clock } from 'lucide-react';

interface TimeLogModalProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimeLogModal({ taskId, open, onOpenChange }: TimeLogModalProps) {
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');
  const [loggedAt, setLoggedAt] = useState(new Date().toISOString().substring(0, 10));
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addTimeLog = useMutation({
    mutationFn: () => api.post(`/api/search/timelogs/task/${taskId}`, {
      hours: parseFloat(hours),
      note,
      loggedAt: new Date(loggedAt).toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast({ title: 'Time logged successfully' });
      setHours('');
      setNote('');
      onOpenChange(false);
    },
    onError: () => toast({ title: 'Failed to log time', variant: 'destructive' })
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hours || parseFloat(hours) <= 0) return;
    addTimeLog.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Clock className="w-5 h-5 text-primary" />
            Log Time
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/60">
            Record the time you spent working on this task.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Hours spent</label>
              <Input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                placeholder="2.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Date</label>
              <Input
                type="date"
                value={loggedAt}
                onChange={(e) => setLoggedAt(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Note (optional)</label>
            <Textarea
              placeholder="What did you work on?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="pt-2 border-t border-border/50 mt-4 -mx-6 px-6 bg-muted/20">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={!hours || addTimeLog.isPending}>
              {addTimeLog.isPending ? 'Saving...' : 'Save time log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
