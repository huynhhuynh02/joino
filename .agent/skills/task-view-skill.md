# Skill: Task View Implementation (List/Board/Gantt/Table)

## Purpose
Pattern để implement các chế độ xem task trong ProjectFlow.

## View Switcher Pattern

### URL Structure
```
/projects/[id]          → List view (default)
/projects/[id]/board    → Board/Kanban view
/projects/[id]/gantt    → Gantt chart view
/projects/[id]/table    → Table/Spreadsheet view
```

### View Switcher Component
```tsx
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { List, Columns, BarChart2, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VIEWS = [
  { label: 'List', icon: List, path: '' },
  { label: 'Board', icon: Columns, path: '/board' },
  { label: 'Gantt', icon: BarChart2, path: '/gantt' },
  { label: 'Table', icon: Table2, path: '/table' },
];

export function ViewSwitcher({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const baseUrl = `/projects/${projectId}`;

  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      {VIEWS.map(({ label, icon: Icon, path }) => {
        const href = `${baseUrl}${path}`;
        const isActive = path === '' 
          ? pathname === baseUrl 
          : pathname === href;
        
        return (
          <Button
            key={label}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => router.push(href)}
            className={isActive 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
            }
          >
            <Icon className="h-4 w-4 mr-1.5" />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
```

---

## 1. List View Pattern

```tsx
'use client';
// Groups tasks by status, allows inline editing

import { TaskRow } from './TaskRow';
import { CreateTaskInline } from './CreateTaskInline';

const STATUS_GROUPS = [
  { status: 'TODO', label: 'To Do', color: '#94A3B8' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: '#3B82F6' },
  { status: 'REVIEW', label: 'Review', color: '#F59E0B' },
  { status: 'DONE', label: 'Done', color: '#10B981' },
] as const;

export function TaskListView({ projectId }: { projectId: string }) {
  const { data: tasks } = useTasks(projectId);

  return (
    <div className="space-y-4">
      {STATUS_GROUPS.map(({ status, label, color }) => {
        const groupTasks = tasks?.filter(t => t.status === status) ?? [];
        
        return (
          <div key={status} className="rounded-lg border bg-white overflow-hidden">
            {/* Group Header */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="font-medium text-sm text-gray-700">{label}</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {groupTasks.length}
              </Badge>
            </div>
            
            {/* Tasks */}
            <div className="divide-y divide-gray-50">
              {groupTasks.map(task => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
            
            {/* Inline Create */}
            <CreateTaskInline projectId={projectId} status={status} />
          </div>
        );
      })}
    </div>
  );
}
```

---

## 2. Board/Kanban View Pattern

```tsx
'use client';
// Uses @dnd-kit for drag and drop

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { useUpdateTask } from '@/hooks/useTasks';

export function TaskBoardView({ projectId }: { projectId: string }) {
  const { data: tasks } = useTasks(projectId);
  const updateTask = useUpdateTask();

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    await updateTask.mutateAsync({
      id: taskId,
      data: { status: newStatus },
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {STATUS_GROUPS.map(({ status, label, color }) => (
          <KanbanColumn
            key={status}
            id={status}
            label={label}
            color={color}
            tasks={tasks?.filter(t => t.status === status) ?? []}
          />
        ))}
      </div>
    </DndContext>
  );
}
```

---

## 3. Table View Pattern

```tsx
'use client';
// Spreadsheet-like, inline editing, sortable columns

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

export function TaskTableView({ projectId }: { projectId: string }) {
  const { data: tasks } = useTasks(projectId);

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-8"><Checkbox /></TableHead>
            <TableHead className="min-w-[300px]">Title</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks?.map(task => (
            <TaskTableRow key={task.id} task={task} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

## 4. Gantt View Pattern

```tsx
'use client';
// Left: task list, Right: timeline bars
// Use date-fns for date calculations

export function TaskGanttView({ projectId }: { projectId: string }) {
  const { data: tasks } = useTasks(projectId);
  const [viewRange, setViewRange] = useState<'week' | 'month' | 'quarter'>('month');
  
  // Calculate date range for header
  const { startDate, endDate, columns } = useDateColumns(viewRange);

  return (
    <div className="flex h-full overflow-hidden rounded-lg border bg-white">
      {/* Left panel - Task list */}
      <div className="w-[300px] flex-shrink-0 border-r overflow-y-auto">
        <div className="h-10 border-b bg-gray-50 px-4 flex items-center">
          <span className="text-sm font-medium text-gray-600">Task name</span>
        </div>
        {tasks?.map(task => (
          <GanttTaskRow key={task.id} task={task} />
        ))}
      </div>
      
      {/* Right panel - Timeline */}
      <div className="flex-1 overflow-auto">
        {/* Date header */}
        <GanttDateHeader columns={columns} />
        {/* Task bars */}
        {tasks?.map(task => (
          <GanttBar key={task.id} task={task} startDate={startDate} columns={columns} />
        ))}
      </div>
    </div>
  );
}
```

---

## Task Detail Panel Pattern (Slide-out)

```tsx
// Used across ALL views — triggered by clicking any task

import { Sheet, SheetContent } from '@/components/ui/sheet';

export function TaskDetailPanel() {
  const { selectedTaskId, setSelectedTaskId } = useUIStore();
  const { data: task } = useTask(selectedTaskId);

  return (
    <Sheet 
      open={!!selectedTaskId} 
      onOpenChange={(open) => !open && setSelectedTaskId(null)}
    >
      <SheetContent className="w-[520px] sm:max-w-[520px] p-0 overflow-auto">
        {task && <TaskDetailContent task={task} />}
      </SheetContent>
    </Sheet>
  );
}
```

## Filter Bar Pattern

```tsx
// Reusable across all views
export function FilterBar({ projectId }: { projectId: string }) {
  const [filters, setFilters] = useTaskFilters();
  const { data: members } = useProjectMembers(projectId);
  
  return (
    <div className="flex items-center gap-2 py-3 px-4 border-b bg-white">
      <FilterButton label="Assignee" options={members} value={filters.assignee} ... />
      <FilterButton label="Priority" options={PRIORITIES} value={filters.priority} ... />
      <FilterButton label="Status" options={STATUSES} value={filters.status} ... />
      {/* Date range picker */}
      {/* Clear filters button */}
    </div>
  );
}
```
