'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

export function ShortcutsHelpModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const shortcuts = [
    { keys: ['N'], desc: 'Create new task' },
    { keys: ['⌘', 'K'], desc: 'Global search' },
    { keys: ['?'], desc: 'Show this help dialog' },
    { keys: ['Esc'], desc: 'Close modals/panels' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-background border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Keyboard className="w-5 h-5 text-muted-foreground" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {shortcuts.map((sc, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">{sc.desc}</span>
              <div className="flex items-center gap-1">
                {sc.keys.map((k, j) => (
                  <kbd key={j} className="px-2 py-1 bg-muted border border-border/50 rounded text-[10px] font-bold text-foreground/80 font-mono shadow-sm">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
