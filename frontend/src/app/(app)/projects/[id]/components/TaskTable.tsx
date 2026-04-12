'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  formatDate,
  getInitials,
  isOverdue,
  cn,
} from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Plus,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Copy,
  GripVertical,
  MessageSquare,
  Paperclip,
  Calendar,
  User,
  Flag,
  CheckCircle2,
  Circle,
  Clock,
  EyeOff,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
type SortField = 'title' | 'status' | 'priority' | 'assignee' | 'dueDate' | 'startDate' | 'createdAt';
type SortDir = 'asc' | 'desc';

interface ColumnDef {
  key: string;
  label: string;
  width: number;
  visible: boolean;
  icon: React.ReactNode;
  sortable: boolean;
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: 'title',     label: 'Task Name',   width: 360, visible: true,  icon: <CheckCircle2 className="w-3.5 h-3.5" />, sortable: true  },
  { key: 'status',    label: 'Status',      width: 140, visible: true,  icon: <Circle className="w-3.5 h-3.5" />,       sortable: true  },
  { key: 'priority',  label: 'Priority',    width: 120, visible: true,  icon: <Flag className="w-3.5 h-3.5" />,         sortable: true  },
  { key: 'assignee',  label: 'Assignee',    width: 160, visible: true,  icon: <User className="w-3.5 h-3.5" />,         sortable: true  },
  { key: 'startDate', label: 'Start Date',  width: 130, visible: true,  icon: <Calendar className="w-3.5 h-3.5" />,     sortable: true  },
  { key: 'dueDate',   label: 'Due Date',    width: 130, visible: true,  icon: <Calendar className="w-3.5 h-3.5" />,     sortable: true  },
  { key: 'comments',  label: 'Comments',    width: 100, visible: true,  icon: <MessageSquare className="w-3.5 h-3.5" />,sortable: false },
  { key: 'updated',   label: 'Last Updated',width: 140, visible: false, icon: <Clock className="w-3.5 h-3.5" />,        sortable: true  },
];

// ────────────────────────────────────────────────
// Status Picker Cell
// ────────────────────────────────────────────────
function StatusCell({ task, onUpdate }: { task: any; onUpdate: (id: string, data: any) => void }) {
  const conf = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];

  const handleClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={handleClick}>
        <button className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors group w-full text-left">
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', conf?.dotColor)} />
          <span className="text-xs text-foreground/80 truncate">{conf?.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40 p-1">
        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
          <DropdownMenuItem
            key={key}
            className="text-xs cursor-pointer flex items-center gap-2"
            onClick={() => onUpdate(task.id, { status: key })}
          >
            <span className={cn('w-2 h-2 rounded-full', val.dotColor)} />
            {val.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ────────────────────────────────────────────────
// Priority Picker Cell
// ────────────────────────────────────────────────
function PriorityCell({ task, onUpdate }: { task: any; onUpdate: (id: string, data: any) => void }) {
  const conf = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];

  const handleClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={handleClick}>
        <button className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors w-full text-left">
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', conf?.dotColor)} />
          <span className="text-xs text-foreground/80 truncate">{conf?.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36 p-1">
        {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
          <DropdownMenuItem
            key={key}
            className="text-xs cursor-pointer flex items-center gap-2"
            onClick={() => onUpdate(task.id, { priority: key })}
          >
            <span className={cn('w-2 h-2 rounded-full', val.dotColor)} />
            {val.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ────────────────────────────────────────────────
// Inline Editable Title Cell
// ────────────────────────────────────────────────
function TitleCell({
  task,
  onUpdate,
  onOpen,
  selected,
  onSelect,
}: {
  task: any;
  onUpdate: (id: string, data: any) => void;
  onOpen: () => void;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setVal(task.title); }, [task.title]);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 50);
  };

  const commit = () => {
    setEditing(false);
    const trimmed = val.trim();
    if (trimmed && trimmed !== task.title) {
      onUpdate(task.id, { title: trimmed });
    } else {
      setVal(task.title);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') { setVal(task.title); setEditing(false); }
  };

  return (
    <div className="flex items-center gap-2 w-full group/title">
      {/* Checkbox */}
      <div className="opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          className="w-3.5 h-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>

      {/* Subtask indicator */}
      {task.subtasks?.length > 0 && (
        <span className="text-[10px] text-muted-foreground/60 bg-muted rounded px-1 flex-shrink-0">
          {task.subtasks.length}
        </span>
      )}

      {/* Title */}
      {editing ? (
        <input
          ref={inputRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-sm font-medium text-foreground bg-card border border-primary/50 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary/30 min-w-0"
          autoFocus
        />
      ) : (
        <span
          className="flex-1 text-sm font-medium text-foreground group-hover/title:text-primary transition-colors truncate cursor-pointer min-w-0"
          onDoubleClick={startEdit}
          onClick={onOpen}
        >
          {task.title}
          {task.status === 'DONE' && <span className="ml-1 line-through text-muted-foreground/40"></span>}
        </span>
      )}

      {/* Meta badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover/title:opacity-100 transition-opacity ml-auto">
        {task._count?.comments > 0 && (
          <span className="flex items-center text-[10px] text-muted-foreground/60 gap-0.5">
            <MessageSquare className="w-3 h-3" /> {task._count.comments}
          </span>
        )}
        {task._count?.attachments > 0 && (
          <span className="flex items-center text-[10px] text-muted-foreground/60 gap-0.5">
            <Paperclip className="w-3 h-3" /> {task._count.attachments}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="text-muted-foreground/40 hover:text-primary transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Sort Icon
// ────────────────────────────────────────────────
function SortIcon({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: SortDir }) {
  if (field !== sortField) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-primary" />
    : <ChevronDown className="w-3.5 h-3.5 text-primary" />;
}

// ────────────────────────────────────────────────
// Main TaskTable Component
// ────────────────────────────────────────────────
export function TaskTable({ tasks, projectId }: { tasks: any[]; projectId: string }) {
  const queryClient = useQueryClient();
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId);
  const openCreateTask = useUIStore((s) => s.openCreateTask);

  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLUMNS);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // ── Update mutation ──────────────────────────
  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/api/tasks/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
    onError: () => toast({ title: 'Failed to update task', variant: 'destructive' }),
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.delete(`/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast({ title: 'Task deleted' });
    },
  });

  const handleUpdate = useCallback((id: string, data: any) => {
    updateTask.mutate({ id, data });
  }, [updateTask]);

  // ── Sort logic ───────────────────────────────
  const toggleSort = (field: SortField) => {
    if (!DEFAULT_COLUMNS.find(c => c.key === field)?.sortable) return;
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedTasks = [...(tasks || [])].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === 'assignee') {
      aVal = a.assignee?.name ?? '';
      bVal = b.assignee?.name ?? '';
    }
    if (sortField === 'status') {
      const order = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
      aVal = order.indexOf(a.status);
      bVal = order.indexOf(b.status);
    }
    if (sortField === 'priority') {
      const order = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      aVal = order.indexOf(a.priority);
      bVal = order.indexOf(b.priority);
    }
    if (sortField === 'dueDate' || sortField === 'startDate') {
      aVal = aVal ? new Date(aVal).getTime() : Infinity;
      bVal = bVal ? new Date(bVal).getTime() : Infinity;
    }
    if (sortField === 'createdAt') {
      aVal = new Date(a.createdAt).getTime();
      bVal = new Date(b.createdAt).getTime();
    }

    if (aVal === bVal) return 0;
    const cmp = aVal < bVal ? -1 : 1;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // ── Selection logic ──────────────────────────
  const allSelected = sortedTasks.length > 0 && sortedTasks.every(t => selectedIds.has(t.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(sortedTasks.map(t => t.id)) : new Set());
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  // ── Bulk actions ─────────────────────────────
  const bulkUpdateStatus = (status: string) => {
    selectedIds.forEach(id => updateTask.mutate({ id, data: { status } }));
    setSelectedIds(new Set());
  };

  const bulkDelete = () => {
    selectedIds.forEach(id => deleteTask.mutate(id));
    setSelectedIds(new Set());
  };

  // ── Column visibility ────────────────────────
  const toggleColumn = (key: string) => {
    setColumns(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  };

  const visibleColumns = columns.filter(c => c.visible);

  // ── Empty state ──────────────────────────────
  if (!tasks?.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl opacity-40">📊</span>
        </div>
        <h3 className="text-sm font-semibold text-foreground">No tasks yet</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Add tasks to track your work in a spreadsheet-style view.
        </p>
        <Button
          size="sm"
          className="mt-4 bg-primary hover:bg-primary-dark text-xs h-8"
          onClick={() => openCreateTask(projectId)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full flex flex-col bg-background overflow-hidden">

        {/* Bulk Action Bar */}
        {someSelected && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-primary/10 flex-shrink-0 animate-in slide-in-from-top-1 duration-150">
            <span className="text-xs font-semibold text-primary">
              {selectedIds.size} selected
            </span>
            <div className="w-px h-4 bg-primary/20 mx-1" />

            {/* Bulk Status */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs border-primary/20 text-primary hover:bg-primary/10">
                  Set Status <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40 p-1">
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <DropdownMenuItem key={key} className="text-xs cursor-pointer flex items-center gap-2" onClick={() => bulkUpdateStatus(key)}>
                    <span className={cn('w-2 h-2 rounded-full', val.dotColor)} /> {val.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bulk Delete */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
              onClick={bulkDelete}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>

            <button className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelectedIds(new Set())}>
              Clear
            </button>
          </div>
        )}

        {/* Column Visibility Toggle */}
        <div className="flex items-center justify-end px-4 py-1.5 border-b border-border flex-shrink-0 bg-secondary/20">
          <DropdownMenu open={showColumnPicker} onOpenChange={setShowColumnPicker}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground hover:text-foreground gap-1">
                <Eye className="w-3 h-3" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1">
              {columns.map((col) => (
                <DropdownMenuItem
                  key={col.key}
                  className="text-xs cursor-pointer flex items-center gap-2 justify-between"
                  onClick={() => toggleColumn(col.key)}
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {col.icon} {col.label}
                  </div>
                  {col.visible
                    ? <Eye className="w-3.5 h-3.5 text-primary" />
                    : <EyeOff className="w-3.5 h-3.5 text-muted-foreground/30" />
                  }
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse min-w-max">
            {/* Header */}
            <thead className="bg-secondary/30 sticky top-0 z-10 shadow-[0_1px_0_0_hsl(var(--border))]">
              <tr>
                {/* Select All */}
                <th className="w-10 px-3 py-2.5 text-left border-r border-border">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    className="w-3.5 h-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </th>

                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width, minWidth: col.width }}
                    className={cn(
                      'px-3 py-2.5 text-left border-r border-border last:border-r-0',
                      col.sortable && 'cursor-pointer select-none group',
                    )}
                    onClick={() => col.sortable && toggleSort(col.key as SortField)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground/40">{col.icon}</span>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {col.label}
                      </span>
                      {col.sortable && (
                        <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                      )}
                    </div>
                  </th>
                ))}

                {/* Actions column */}
                <th className="w-10 px-2 py-2.5 sticky right-0 bg-secondary/30" />
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-border/50">
              {sortedTasks.map((task, idx) => {
                const overdue = isOverdue(task.dueDate, task.status);
                const isSelected = selectedIds.has(task.id);
                const isDone = task.status === 'DONE';

                return (
                  <tr
                    key={task.id}
                    className={cn(
                      'group/row hover:bg-primary/5 transition-colors cursor-pointer border-b border-border/50',
                      isSelected && 'bg-primary/5',
                      isDone && 'opacity-60',
                    )}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    {/* Checkbox */}
                    <td className="w-10 px-3 py-2 border-r border-border" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(c) => toggleOne(task.id, !!c)}
                        className="w-3.5 h-3.5 opacity-0 group-hover/row:opacity-100 data-[state=checked]:opacity-100 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-opacity"
                      />
                    </td>

                    {/* Dynamic cells */}
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        style={{ width: col.width, minWidth: col.width, maxWidth: col.width }}
                        className="px-2 py-1.5 border-r border-border last:border-r-0 overflow-hidden"
                      >
                        {col.key === 'title' && (
                          <TitleCell
                            task={task}
                            onUpdate={handleUpdate}
                            onOpen={() => setSelectedTaskId(task.id)}
                            selected={isSelected}
                            onSelect={(c) => toggleOne(task.id, !!c)}
                          />
                        )}

                        {col.key === 'status' && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <StatusCell task={task} onUpdate={handleUpdate} />
                          </div>
                        )}

                        {col.key === 'priority' && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <PriorityCell task={task} onUpdate={handleUpdate} />
                          </div>
                        )}

                        {col.key === 'assignee' && (
                          <div className="flex items-center gap-2 px-2">
                            {task.assignee ? (
                              <>
                                <Avatar className="w-5 h-5 flex-shrink-0">
                                  <AvatarImage src={task.assignee.avatar || ''} />
                                  <AvatarFallback className="text-[9px] bg-primary/15 text-primary">
                                    {getInitials(task.assignee.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-foreground/80 truncate">{task.assignee.name.split(' ')[0]}</span>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground/60 italic">Unassigned</span>
                            )}
                          </div>
                        )}

                        {col.key === 'startDate' && (
                          <span className="text-xs text-muted-foreground px-2">
                            {task.startDate ? formatDate(task.startDate) : <span className="text-muted-foreground/30">—</span>}
                          </span>
                        )}

                        {col.key === 'dueDate' && (
                          <span className={cn(
                            'text-xs font-medium px-2',
                            overdue ? 'text-destructive' : task.dueDate ? 'text-muted-foreground' : 'text-muted-foreground/30'
                          )}>
                            {task.dueDate ? (
                              <span className="flex items-center gap-1">
                                {overdue && <Clock className="w-3 h-3" />}
                                {formatDate(task.dueDate)}
                              </span>
                            ) : <span className="px-2 text-muted-foreground/30">—</span>}
                          </span>
                        )}

                        {col.key === 'comments' && (
                          <div className="flex items-center gap-2 px-2 text-muted-foreground/40">
                            {task._count?.comments > 0 && (
                              <span className="flex items-center gap-1 text-xs">
                                <MessageSquare className="w-3 h-3" />
                                {task._count.comments}
                              </span>
                            )}
                            {task._count?.attachments > 0 && (
                              <span className="flex items-center gap-1 text-xs">
                                <Paperclip className="w-3 h-3" />
                                {task._count.attachments}
                              </span>
                            )}
                          </div>
                        )}

                        {col.key === 'updated' && (
                          <span className="text-xs text-muted-foreground/60 px-2">
                            {task.updatedAt ? format(new Date(task.updatedAt), 'MMM d') : '—'}
                          </span>
                        )}
                      </td>
                    ))}

                    {/* Row action menu */}
                    <td
                      className="w-10 px-2 py-1.5 sticky right-0 bg-background group-hover/row:bg-primary/5 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 p-1">
                            <DropdownMenuItem
                              className="text-xs cursor-pointer gap-2"
                              onClick={() => setSelectedTaskId(task.id)}
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open detail
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                              <DropdownMenuItem
                                key={key}
                                className="text-xs cursor-pointer gap-2"
                                onClick={() => handleUpdate(task.id, { status: key })}
                              >
                                <span className={cn('w-2 h-2 rounded-full', val.dotColor)} />
                                Mark as {val.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              className="text-xs cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => deleteTask.mutate(task.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Add Row Footer */}
          <div
            className="flex items-center gap-2 px-3 py-2 border-t border-dashed border-border hover:bg-muted/30 cursor-pointer group/add transition-colors"
            onClick={() => openCreateTask(projectId)}
          >
            <Plus className="w-3.5 h-3.5 text-muted-foreground/30 group-hover/add:text-primary transition-colors" />
            <span className="text-xs text-muted-foreground group-hover/add:text-primary transition-colors">
              Add task
            </span>
          </div>

          {/* Row count footer */}
          <div className="px-4 py-2 text-[11px] text-muted-foreground/60 border-t border-border">
            {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
            {someSelected && ` · ${selectedIds.size} selected`}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
