'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn, STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SlidersHorizontal, X, ChevronDown, Check,
  User, Flag, Circle, Tag, Filter, Download
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { useTranslations } from 'next-intl';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TaskFilters {
  statuses: string[];
  priorities: string[];
  assigneeIds: string[];
  search: string;
}

export const DEFAULT_FILTERS: TaskFilters = {
  statuses: [],
  priorities: [],
  assigneeIds: [],
  search: '',
};

export type GroupByField = 'status' | 'priority' | 'assignee' | 'none';

// ─── Multi-select filter pill ─────────────────────────────────────────────────
function MultiSelectFilter<T extends string>({
  label,
  icon,
  options,
  selected,
  onChange,
  renderOption,
}: {
  label: string;
  icon: React.ReactNode;
  options: { value: T; label: string; extra?: React.ReactNode }[];
  selected: T[];
  onChange: (vals: T[]) => void;
  renderOption?: (o: { value: T; label: string }) => React.ReactNode;
}) {
  const t = useTranslations();
  const toggle = (val: T) => {
    onChange(
      selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val]
    );
  };

  const isActive = selected.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-xs font-medium transition-colors',
            isActive
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted transition-colors'
          )}
        >
          {icon}
          {label}
          {isActive && (
            <span className="ml-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold shadow-sm">
              {selected.length}
            </span>
          )}
          <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 p-1">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <DropdownMenuItem
              key={opt.value}
              className="text-xs cursor-pointer flex items-center justify-between gap-2"
              onClick={() => toggle(opt.value)}
            >
              <div className="flex items-center gap-2">
                {renderOption ? renderOption(opt) : <span>{opt.label}</span>}
              </div>
              {checked && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
            </DropdownMenuItem>
          );
        })}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs cursor-pointer text-muted-foreground/60 focus:text-destructive"
              onClick={() => onChange([])}
            >
              {t('common.clearFilter')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main Filter Bar ──────────────────────────────────────────────────────────
interface TaskFilterBarProps {
  projectId: string;
  filters: TaskFilters;
  onFiltersChange: (f: TaskFilters) => void;
  groupBy: GroupByField;
  onGroupByChange: (g: GroupByField) => void;
  totalCount?: number;
  filteredCount?: number;
  onExport?: () => void;
}

export function TaskFilterBar({
  projectId,
  filters,
  onFiltersChange,
  groupBy,
  onGroupByChange,
  totalCount,
  filteredCount,
  onExport,
}: TaskFilterBarProps) {
  const t = useTranslations();

  const GROUP_BY_OPTIONS: { value: GroupByField; label: string }[] = [
    { value: 'status',   label: t('common.status') },
    { value: 'priority', label: t('common.priority') },
    { value: 'assignee', label: t('common.assignee') },
    { value: 'none',     label: t('common.noGrouping') },
  ];

  // Fetch project members for assignee filter
  const { data: members } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => api.get<any[]>(`/api/projects/${projectId}/members`),
    staleTime: 60_000,
  });

  const activeFilterCount = filters.statuses.length + filters.priorities.length + filters.assigneeIds.length;
  const hasFilters = activeFilterCount > 0 || filters.search;

  const clearAll = () => onFiltersChange(DEFAULT_FILTERS);

  // ── Status options ──────────────────────────────────────────────────────────
  const statusOptions = Object.entries(STATUS_CONFIG).map(([key, val]) => ({
    value: key,
    label: t(`status.${key}`),
    dotColor: val.dotColor,
  }));

  // ── Priority options ────────────────────────────────────────────────────────
  const priorityOptions = Object.entries(PRIORITY_CONFIG).map(([key, val]) => ({
    value: key,
    label: t(`priority.${key}`),
  }));

  const PRIORITY_DOTS: Record<string, string> = {
    LOW: PRIORITY_CONFIG.LOW.dotColor,
    MEDIUM: PRIORITY_CONFIG.MEDIUM.dotColor,
    HIGH: PRIORITY_CONFIG.HIGH.dotColor,
    URGENT: PRIORITY_CONFIG.URGENT.dotColor,
  };

  // ── Assignee options ────────────────────────────────────────────────────────
  const assigneeOptions = (members || []).map((m: any) => ({
    value: m.id as string,
    label: m.name || t('projects.unassigned'),
    avatar: m.avatar,
  }));

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background flex-shrink-0 flex-wrap">
      {/* Filter icon */}
      <div className="flex items-center gap-1.5 text-muted-foreground/40">
        <Filter className="w-3.5 h-3.5" />
        <span className="text-[11px] font-medium text-muted-foreground">{t('filter.label')}</span>
      </div>

      {/* Status filter */}
      <MultiSelectFilter
        label={t('filter.status')}
        icon={<Circle className="w-3 h-3" />}
        options={statusOptions}
        selected={filters.statuses}
        onChange={(v) => onFiltersChange({ ...filters, statuses: v })}
        renderOption={(opt) => (
          <>
            <span className={cn('w-2 h-2 rounded-full', (STATUS_CONFIG as any)[opt.value]?.dotColor)} />
            <span>{opt.label}</span>
          </>
        )}
      />

      {/* Priority filter */}
      <MultiSelectFilter
        label={t('filter.priority')}
        icon={<Flag className="w-3 h-3" />}
        options={priorityOptions}
        selected={filters.priorities}
        onChange={(v) => onFiltersChange({ ...filters, priorities: v })}
        renderOption={(opt) => (
          <>
            <span className={cn('w-2 h-2 rounded-full', PRIORITY_DOTS[opt.value])} />
            <span>{opt.label}</span>
          </>
        )}
      />

      {/* Assignee filter */}
      {assigneeOptions.length > 0 && (
        <MultiSelectFilter
          label={t('filter.assignee')}
          icon={<User className="w-3 h-3" />}
          options={assigneeOptions}
          selected={filters.assigneeIds}
          onChange={(v) => onFiltersChange({ ...filters, assigneeIds: v })}
          renderOption={(opt) => (
            <div className="flex items-center gap-2">
              <Avatar className="w-4 h-4">
                <AvatarImage src={(opt as any).avatar || ''} />
                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                  {getInitials(opt.label)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{opt.label}</span>
            </div>
          )}
        />
      )}

      {/* Separator */}
      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Group By */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn(
            'flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-xs font-medium transition-colors',
            groupBy !== 'none'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground hover:border-border/80'
          )}>
            <SlidersHorizontal className="w-3 h-3" />
            {t('common.group')}: {GROUP_BY_OPTIONS.find(o => o.value === groupBy)?.label}
            <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40 p-1">
          {GROUP_BY_OPTIONS.map((o) => (
            <DropdownMenuItem
              key={o.value}
              className="text-xs cursor-pointer flex items-center justify-between"
              onClick={() => onGroupByChange(o.value)}
            >
              {o.label}
              {groupBy === o.value && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear all filters */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 h-7 px-2 rounded-md text-xs text-destructive hover:bg-destructive/10 transition-colors border border-destructive/20 active:scale-95"
        >
          <X className="w-3 h-3" /> {t('common.clear')}
        </button>
      )}

      {/* Export to CSV */}
      {onExport && (
        <button
          onClick={onExport}
          className="flex items-center gap-1 h-7 px-2 ml-1 rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors border border-border"
          title="Export tasks to CSV"
        >
          <Download className="w-3 h-3" /> {t('common.export')}
        </button>
      )}

      {/* Task count */}
      {totalCount !== undefined && (
        <span className="ml-auto text-[11px] text-muted-foreground/60">
          {filteredCount !== totalCount
            ? `${filteredCount} ${t('common.of')} ${totalCount} ${t('common.taskCount', { count: totalCount })}`
            : `${totalCount} ${t('common.taskCount', { count: totalCount })}`}
        </span>
      )}
    </div>
  );
}

// ─── Filter utility ───────────────────────────────────────────────────────────
export function applyFilters(tasks: any[], filters: TaskFilters): any[] {
  return tasks.filter((task) => {
    if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) return false;
    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) return false;
    if (filters.assigneeIds.length > 0 && !filters.assigneeIds.includes(task.assigneeId)) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!task.title.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}
