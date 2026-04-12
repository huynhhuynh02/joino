import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isBefore, startOfDay, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name: string) => {
  return name.substring(0, 2).toUpperCase();
};

export const formatDate = (date: string | Date | null) => {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatDateRelative = (dateStr: string) => {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
};

export const isOverdue = (dueDate: string | Date | null, status: string) => {
  if (!dueDate || status === 'DONE') return false;
  return isBefore(new Date(dueDate), startOfDay(new Date()));
};

export const STATUS_CONFIG = {
  TODO: { label: 'To Do', dotColor: 'bg-muted-foreground/40' },
  IN_PROGRESS: { label: 'In Progress', dotColor: 'bg-blue-500' },
  REVIEW: { label: 'In Review', dotColor: 'bg-amber-500' },
  DONE: { label: 'Completed', dotColor: 'bg-emerald-500' },
} as const;

export const PRIORITY_CONFIG = {
  LOW: { label: 'Low', className: 'bg-muted text-muted-foreground border-border/50', dotColor: 'bg-muted-foreground/40' },
  MEDIUM: { label: 'Medium', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', dotColor: 'bg-yellow-500' },
  HIGH: { label: 'High', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20', dotColor: 'bg-orange-500' },
  URGENT: { label: 'Urgent', className: 'bg-destructive/10 text-destructive border-destructive/20', dotColor: 'bg-destructive' },
} as const;
