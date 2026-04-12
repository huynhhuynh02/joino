import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col flex-1 items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300", className)}>
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 ring-8 ring-muted/50 border border-border/50">
        <Icon className="w-10 h-10 text-muted-foreground/40 stroke-[1.5]" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="shadow-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
