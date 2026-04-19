import { STATUS_CONFIG, PRIORITY_CONFIG } from './utils';

export type GroupByField = 'status' | 'priority' | 'assignee' | 'none';

export function groupTasks(
  tasks: any[],
  groupBy: GroupByField,
  t: (key: string) => string
): Array<{ key: string; label: string; dotColor?: string; tasks: any[] }> {
  if (groupBy === 'none') {
    return [{ key: 'all', label: t('common.allTasks'), tasks }];
  }

  if (groupBy === 'status') {
    return Object.entries(STATUS_CONFIG).map(([key, { dotColor }]) => ({
      key,
      label: t(`status.${key}`),
      dotColor,
      tasks: tasks.filter((t) => t.status === key),
    }));
  }

  if (groupBy === 'priority') {
    const PRIORITY_DOTS: Record<string, string> = {
      URGENT: PRIORITY_CONFIG.URGENT.dotColor,
      HIGH: PRIORITY_CONFIG.HIGH.dotColor,
      MEDIUM: PRIORITY_CONFIG.MEDIUM.dotColor,
      LOW: PRIORITY_CONFIG.LOW.dotColor,
    };
    return Object.entries(PRIORITY_CONFIG)
      .reverse()
      .map(([key]) => ({
        key,
        label: t(`priority.${key}`),
        dotColor: PRIORITY_DOTS[key],
        tasks: tasks.filter((t) => t.priority === key),
      }));
  }

  if (groupBy === 'assignee') {
    const groups: Record<string, { label: string; tasks: any[] }> = { 
      unassigned: { label: t('projects.unassigned'), tasks: [] } 
    };
    tasks.forEach((task) => {
      if (!task.assignee) {
        groups['unassigned'].tasks.push(task);
      } else {
        if (!groups[task.assigneeId]) {
          groups[task.assigneeId] = { label: task.assignee.name, tasks: [] };
        }
        groups[task.assigneeId].tasks.push(task);
      }
    });
    return Object.entries(groups).map(([key, { label, tasks }]) => ({ key, label, tasks }));
  }

  return [{ key: 'all', label: t('common.allTasks'), tasks }];
}
