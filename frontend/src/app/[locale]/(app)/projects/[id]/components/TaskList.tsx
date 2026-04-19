'use client';

import React, { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import {
  STATUS_CONFIG, PRIORITY_CONFIG, formatDate, getInitials, isOverdue, cn,
} from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare, Paperclip, Plus, ChevronRight, ChevronDown as ChevronDownIcon,
  Check, ClipboardList
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { GroupByField } from '@/components/tasks/TaskFilterBar';
import { groupTasks } from '@/lib/tasks';
import { EmptyState } from '@/components/ui/empty-state';
import { useTranslations } from 'next-intl';

// ─── Inline editable cell wrappers ───────────────────────────────────────────
function InlineStatusPicker({ task, onUpdate }: { task: any; onUpdate: (id: string, d: any) => void }) {
  const t = useTranslations();
  const conf = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-muted transition-colors text-left w-full"
        >
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', conf?.dotColor)} />
          <span className="text-xs text-foreground/80 truncate">{t(`status.${task.status}`)}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40 p-1" onClick={(e) => e.stopPropagation()}>
        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
          <DropdownMenuItem
            key={key}
            className="text-xs cursor-pointer flex items-center gap-2"
            onClick={() => onUpdate(task.id, { status: key })}
          >
            <span className={cn('w-2 h-2 rounded-full', val.dotColor)} />
            {t(`status.${key}`)}
            {task.status === key && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InlinePriorityPicker({ task, onUpdate }: { task: any; onUpdate: (id: string, d: any) => void }) {
  const t = useTranslations();
  const conf = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-muted transition-colors text-left w-full"
        >
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', conf?.dotColor)} />
          <span className="text-xs text-foreground/80 truncate">{t(`priority.${task.priority}`)}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36 p-1" onClick={(e) => e.stopPropagation()}>
        {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
          <DropdownMenuItem
            key={key}
            className="text-xs cursor-pointer flex items-center gap-2"
            onClick={() => onUpdate(task.id, { priority: key })}
          >
            <span className={cn('w-2 h-2 rounded-full', val.dotColor)} />
            {t(`priority.${key}`)}
            {task.priority === key && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InlineAssigneePicker({
  task, projectId, onUpdate,
}: { task: any; projectId: string; onUpdate: (id: string, d: any) => void }) {
  const t = useTranslations();
  const { data: members } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => api.get<any[]>(`/api/projects/${projectId}/members`),
    staleTime: 60_000,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-muted transition-colors text-left w-full"
        >
          {task.assignee ? (
            <>
              <Avatar className="w-5 h-5 flex-shrink-0">
                <AvatarImage src={task.assignee.avatar || ''} />
                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                  {getInitials(task.assignee.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-foreground/80 truncate">{task.assignee.name.split(' ')[0]}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground/60 italic">{t('projects.unassigned')}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 p-1" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          className="text-xs cursor-pointer text-muted-foreground/60 italic"
          onClick={() => onUpdate(task.id, { assigneeId: null })}
        >
          {t('projects.unassigned')}
        </DropdownMenuItem>
        {(members || []).map((m: any) => (
          <DropdownMenuItem
            key={m.id}
            className="text-xs cursor-pointer flex items-center gap-2"
            onClick={() => onUpdate(task.id, { assigneeId: m.id })}
          >
            <Avatar className="w-5 h-5 flex-shrink-0">
              <AvatarImage src={m.avatar || ''} />
              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                {getInitials(m.name || '')}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{m.name}</span>
            {task.assigneeId === m.id && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Single task row ──────────────────────────────────────────────────────────
function TaskRow({
  task,
  projectId,
  depth = 0,
  onUpdate,
  onOpen,
  selectedIds,
  onSelect,
  customFields,
  onUpdateCustomField,
}: {
  task: any;
  projectId: string;
  depth?: number;
  onUpdate: (id: string, data: any) => void;
  onOpen: (id: string) => void;
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  customFields?: any[];
  onUpdateCustomField?: (taskId: string, fieldId: string, value: any) => void;
}) {
  const t = useTranslations();
  const openCreateTask = useUIStore((s) => s.openCreateTask);
  const [expanded, setExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const overdue = isOverdue(task.dueDate, task.status);
  const isSelected = selectedIds.has(task.id);
  const isDone = task.status === 'DONE';

  useEffect(() => { setTitleVal(task.title); }, [task.title]);

  const commitTitle = () => {
    setEditingTitle(false);
    const trimmed = titleVal.trim();
    if (trimmed && trimmed !== task.title) onUpdate(task.id, { title: trimmed });
    else setTitleVal(task.title);
  };

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  return (
    <>
      <tr
        className={cn(
          'group/row border-b border-border/50 hover:bg-primary/5 transition-colors',
          isSelected && 'bg-primary/5',
        )}
      >
        {/* Checkbox */}
        <td className="w-8 pl-2 pr-1 py-1.5" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(c) => onSelect(task.id, !!c)}
            className="w-3.5 h-3.5 opacity-0 group-hover/row:opacity-100 data-[state=checked]:opacity-100 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-opacity"
          />
        </td>

        {/* Title column */}
        <td
          className="py-1.5 pr-3 cursor-pointer"
          style={{ paddingLeft: depth * 20 + 8 }}
          onClick={() => onOpen(task.id)}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Expand subtasks */}
            {hasSubtasks ? (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
                className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground/60 hover:text-foreground"
              >
                {expanded ? <ChevronDownIcon className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-4 flex-shrink-0" />
            )}

            {/* Subtask count badge */}
            {hasSubtasks && (
              <span className="text-[10px] text-muted-foreground/60 bg-muted rounded px-1 flex-shrink-0">
                {task.subtasks.length}
              </span>
            )}

            {/* Title */}
            {editingTitle ? (
              <input
                ref={inputRef}
                autoFocus
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setTitleVal(task.title); setEditingTitle(false); } }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 text-sm font-medium text-foreground border border-primary/40 rounded px-1.5 py-0 outline-none focus:ring-1 focus:ring-primary/20 bg-card min-w-0"
              />
            ) : (
              <span
                className={cn(
                  'flex-1 text-sm font-medium truncate min-w-0 group-hover/row:text-primary transition-colors',
                  isDone ? 'line-through text-muted-foreground/40' : 'text-foreground',
                )}
                onDoubleClick={(e) => { e.stopPropagation(); setEditingTitle(true); setTimeout(() => inputRef.current?.select(), 30); }}
              >
                {task.title}
              </span>
            )}

            {/* Meta — visible on hover */}
            <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
              {task._count?.comments > 0 && (
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                  <MessageSquare className="w-3 h-3" /> {task._count.comments}
                </span>
              )}
              {task._count?.attachments > 0 && (
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                  <Paperclip className="w-3 h-3" />
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); openCreateTask(projectId, task.status); }}
                className="text-muted-foreground/40 hover:text-primary transition-colors"
                title={t('tasks.add')}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </td>

        {/* Status */}
        <td className="w-[140px] py-1" onClick={(e) => e.stopPropagation()}>
          <InlineStatusPicker task={task} onUpdate={onUpdate} />
        </td>

        {/* Priority */}
        <td className="w-[120px] py-1" onClick={(e) => e.stopPropagation()}>
          <InlinePriorityPicker task={task} onUpdate={onUpdate} />
        </td>

        {/* Assignee */}
        <td className="w-[160px] py-1" onClick={(e) => e.stopPropagation()}>
          <InlineAssigneePicker task={task} projectId={projectId} onUpdate={onUpdate} />
        </td>
        {/* Due Date */}
        <td className="w-[130px] py-1.5 px-2">
          <span className={cn(
            'text-xs font-medium',
            overdue ? 'text-destructive' : task.dueDate ? 'text-muted-foreground' : 'text-muted-foreground/30'
          )}>
            {task.dueDate ? formatDate(task.dueDate) : '—'}
          </span>
        </td>

        {/* Custom Field Values */}
        {(customFields || []).map((f: any) => {
          const valueObj = task.customFieldValues?.find((v: any) => v.fieldId === f.id);
          const val = valueObj?.value || '';
          
          return (
            <td key={f.id} className="min-w-[120px] py-1.5 px-2 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {f.type === 'CHECKBOX' ? (
                <Checkbox
                  checked={val === 'true'}
                  onCheckedChange={(c) => onUpdateCustomField?.(task.id, f.id, c ? 'true' : 'false')}
                  className="w-3.5 h-3.5"
                />
              ) : f.type === 'DROPDOWN' ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-xs text-foreground/80 truncate w-full text-left hover:bg-muted rounded px-1 transition-colors">
                      {val || <span className="text-muted-foreground/30 italic">—</span>}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40 p-1">
                    {(f.options as string[] || []).map((opt) => (
                      <DropdownMenuItem 
                        key={opt} 
                        className="text-xs cursor-pointer" 
                        onClick={() => onUpdateCustomField?.(task.id, f.id, opt)}
                      >
                        {opt}
                        {val === opt && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <input
                  type={f.type === 'NUMBER' ? 'number' : f.type === 'DATE' ? 'date' : 'text'}
                  defaultValue={val}
                  onBlur={(e) => {
                    if (e.target.value !== val) {
                      onUpdateCustomField?.(task.id, f.id, e.target.value);
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className="w-full bg-transparent border-none text-xs text-foreground/80 focus:ring-1 focus:ring-primary/30 rounded px-1 -ml-1 transition-all placeholder:text-muted-foreground/30"
                  placeholder="—"
                />
              )}
            </td>
          );
        })}
      </tr>

      {/* Subtask rows */}
      {hasSubtasks && expanded && task.subtasks.map((sub: any) => (
        <TaskRow
          key={sub.id}
          task={sub}
          projectId={projectId}
          depth={depth + 1}
          onUpdate={onUpdate}
          onOpen={onOpen}
          selectedIds={selectedIds}
          onSelect={onSelect}
          customFields={customFields}
          onUpdateCustomField={onUpdateCustomField}
        />
      ))}
    </>
  );
}

// ─── Group header row ─────────────────────────────────────────────────────────
function GroupHeader({
  label, dotColor, count, projectId, status, collapsed, onToggle, customFieldCount,
}: {
  label: string;
  dotColor?: string;
  count: number;
  projectId: string;
  status?: string;
  collapsed: boolean;
  onToggle: () => void;
  customFieldCount?: number;
}) {
  const t = useTranslations();
  const openCreateTask = useUIStore((s) => s.openCreateTask);

  return (
    <tr className="bg-muted/40 border-b border-border group/group">
      <td colSpan={6 + (customFieldCount || 0)} className="py-2 px-3">
        <div className="flex items-center gap-2">
          <button onClick={onToggle} className="text-muted-foreground/60 hover:text-foreground transition-colors">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
          {dotColor && <span className={cn('w-2.5 h-2.5 rounded-full', dotColor)} />}
          <span className="text-xs font-semibold text-foreground/80">{label}</span>
          <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground h-4 px-1.5 border-none">
            {count}
          </Badge>

          {/* Add task in group */}
          <button
            onClick={() => openCreateTask(projectId, status)}
            className="ml-2 opacity-0 group-hover/group:opacity-100 flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-primary transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> {t('common.add')}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main TaskList component ──────────────────────────────────────────────────
export function TaskList({
  tasks,
  projectId,
  groupBy = 'status',
}: {
  tasks: any[];
  projectId: string;
  groupBy?: GroupByField;
}) {
  const t = useTranslations();
  const queryCacheKey = ['project-custom-fields', projectId];
  const { data: customFields } = useQuery({
    queryKey: queryCacheKey,
    queryFn: () => api.get<any[]>(`/api/custom-fields/project/${projectId}`),
    staleTime: 60_000,
  });

  const queryClient = useQueryClient();
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId);
  const openCreateTask = useUIStore((s) => s.openCreateTask);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/api/tasks/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
    onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
  });

  const handleUpdate = useCallback((id: string, data: any) => {
    updateTask.mutate({ id, data });
  }, [updateTask]);

  const updateCustomFieldMutation = useMutation({
    mutationFn: ({ taskId, fieldId, value }: { taskId: string; fieldId: string; value: any }) =>
      api.post(`/api/custom-fields/task/${taskId}/value`, { fieldId, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
    onError: () => toast({ title: 'Failed to update field', variant: 'destructive' }),
  });

  const handleUpdateCustomField = useCallback((taskId: string, fieldId: string, value: any) => {
    updateCustomFieldMutation.mutate({ taskId, fieldId, value });
  }, [updateCustomFieldMutation]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => { const n = new Set(prev); checked ? n.add(id) : n.delete(id); return n; });
  };

  const groups = groupTasks(tasks, groupBy, t);
  const allSelected = tasks.length > 0 && tasks.every((t) => selectedIds.has(t.id));
  const someSelected = selectedIds.size > 0;

  // Bulk update
  const bulkUpdateStatus = (status: string) => {
    selectedIds.forEach((id) => updateTask.mutate({ id, data: { status } }));
    setSelectedIds(new Set());
  };

  if (!tasks?.length) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={t('common.noTasksSearch')}
        description={t('projects.noProjectsDesc')}
        actionLabel={t('tasks.add')}
        onAction={() => openCreateTask(projectId)}
        className="h-full bg-background"
      />
    );
  }

  return (
    <div className="h-full overflow-auto bg-background">
      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-primary/10 sticky top-0 z-20 animate-in slide-in-from-top-1">
          <span className="text-xs font-semibold text-primary">{selectedIds.size} {t('common.taskCount', { count: selectedIds.size })}</span>
          <div className="w-px h-4 bg-primary/20" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs border-primary/20 text-primary">
                {t('common.status')} <ChevronDownIcon className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-1 w-40">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <DropdownMenuItem key={k} className="text-xs cursor-pointer gap-2" onClick={() => bulkUpdateStatus(k)}>
                  <span className={cn('w-2 h-2 rounded-full', v.dotColor)} /> {t(`status.${k}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelectedIds(new Set())}>
            {t('common.clear')}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto min-h-0">
      <table className="w-full border-collapse table-fixed">
        {/* Column headers */}
        <thead className="sticky top-0 z-10 bg-background/95 shadow-[0_1px_0_0_hsl(var(--border))]">
          <tr>
            <th className="w-8 pl-2 pr-1 py-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(c) => setSelectedIds(c ? new Set(tasks.map((t) => t.id)) : new Set())}
                className="w-3.5 h-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </th>
            <th className="w-auto text-left py-2 pl-3 pr-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {t('tasks.title')}
            </th>
            <th className="w-[120px] text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {t('tasks.status')}
            </th>
            <th className="w-[100px] text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {t('tasks.priority')}
            </th>
            <th className="w-[140px] text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {t('tasks.assignee')}
            </th>
            <th className="w-[110px] text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {t('tasks.dueDate')}
            </th>
            {(customFields || []).map((f: any) => (
              <th key={f.id} className="w-[120px] text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide truncate" title={f.name}>
                {f.name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {groups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.key);
            return (
              <Fragment key={group.key}>
                {/* Group header (skip if only one group with key='all') */}
                {!(groups.length === 1 && group.key === 'all') && (
                  <GroupHeader
                    key={`gh-${group.key}`}
                    label={group.label}
                    dotColor={group.dotColor}
                    count={group.tasks.length}
                    projectId={projectId}
                    status={group.key !== 'all' && group.key !== 'unassigned' ? group.key : undefined}
                    collapsed={isCollapsed}
                    onToggle={() => toggleGroup(group.key)}
                  />
                )}

                {/* Task rows */}
                {!isCollapsed && group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    projectId={projectId}
                    onUpdate={handleUpdate}
                    onOpen={setSelectedTaskId}
                    selectedIds={selectedIds}
                    onSelect={toggleSelect}
                  />
                ))}

                {/* Add task row at bottom of group */}
                {!isCollapsed && (
                  <tr key={`add-${group.key}`} className="group/add border-b border-dashed border-border/50">
                    <td colSpan={6 + (customFields?.length || 0)} className="py-1.5 pl-12">
                      <button
                        onClick={() => openCreateTask(projectId, group.key !== 'all' ? group.key : undefined)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-primary transition-colors"
                      >
                        <Plus className="w-3 h-3" /> {t('tasks.add')}
                      </button>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Footer count */}
      <div className="px-4 py-2 text-[11px] text-muted-foreground/60 border-t border-border/50">
        {tasks.length} {t('common.taskCount', { count: tasks.length })}
        {someSelected && ` · ${selectedIds.size} ${t('common.taskCount', { count: selectedIds.size })}`}
      </div>
      </div>
    </div>
  );
}
