'use client';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useUIStore } from '@/stores/uiStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  cn, formatDate, formatDateRelative, getInitials,
  STATUS_CONFIG, PRIORITY_CONFIG, isOverdue,
} from '@/lib/utils';
import {
  Calendar, User, Flag, CheckSquare, MessageSquare, Paperclip, Clock, X,
  Send, ChevronDown, Download, Trash2, Loader2 as Spinner, Loader2, Link2, Copy,
  MoreHorizontal, Edit2, Check, Plus, ChevronRight, ExternalLink, FolderOpen, Sparkles,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { TimeLogModal } from '@/components/tasks/TimeLogModal';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  assignee: { id: string; name: string; avatar: string | null; email: string } | null;
  creator: { id: string; name: string; avatar: string | null };
  project: { id: string; name: string; color: string };
  subtasks: Array<{ id: string; title: string; status: string }>;
  comments: Array<{
    id: string; content: string; createdAt: string; updatedAt: string;
    user: { id: string; name: string; avatar: string | null };
  }>;
  attachments: Array<{
    id: string; filename: string; originalName: string; url: string;
    size: number; createdAt: string; uploader: { id: string; name: string };
  }>;
  activities: Array<{
    id: string; action: string; details: Record<string, unknown>;
    createdAt: string; user: { id: string; name: string; avatar: string | null };
  }>;
  _count: { comments: number; attachments: number };
  estimatedHours: number | null;
  labels: Array<{ label: { id: string; name: string; color: string } }>;
  timeLogs: Array<{
    id: string; hours: number; note: string | null; loggedAt: string;
    user: { id: string; name: string; avatar: string | null };
  }>;
  customFieldValues: Array<{ fieldId: string; value: string }>;
}

// ─── Comment item with edit/delete ───────────────────────────────────────────
function CommentItem({
  comment, currentUserId, onDelete, onEdit,
}: {
  comment: TaskDetail['comments'][0];
  currentUserId: string | undefined;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(comment.content);
  const isOwn = currentUserId === comment.user.id;

  const commitEdit = () => {
    if (val.trim() && val !== comment.content) onEdit(comment.id, val.trim());
    setEditing(false);
  };

  return (
    <div className="flex gap-2.5 group/comment">
      <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
        <AvatarImage src={comment.user.avatar || ''} />
        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
          {getInitials(comment.user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground/90">{comment.user.name}</span>
            <span className="text-[10px] text-muted-foreground/60">{formatDateRelative(comment.createdAt)}</span>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-[10px] text-muted-foreground/40 italic">(edited)</span>
            )}
          </div>
          {isOwn && !editing && (
            <div className="flex items-center opacity-0 group-hover/comment:opacity-100 transition-opacity gap-1">
              <button
                className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                onClick={() => { setVal(comment.content); setEditing(true); }}
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                className="text-muted-foreground/60 hover:text-destructive transition-colors"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="mt-1">
            <Textarea
              value={val}
              onChange={(e) => setVal(e.target.value)}
              autoFocus
              rows={2}
              className="text-sm resize-none border-border focus-visible:ring-primary min-h-0 bg-background"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
                if (e.key === 'Escape') { setVal(comment.content); setEditing(false); }
              }}
            />
            <div className="flex gap-2 mt-1.5">
              <Button size="sm" className="h-6 text-xs bg-primary hover:bg-primary/90" onClick={commitEdit}>
                Save
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/80 mt-1 leading-relaxed whitespace-pre-wrap">
            {comment.content.split(/(?=@)/g).map((part, i) => {
               const match = part.match(/^(@[a-zA-Z0-9_]+)(.*)$/s);
               if (match) {
                 return (
                   <span key={i}>
                     <span className="font-semibold text-primary bg-primary/10 px-1 rounded inline-block">{match[1]}</span>
                     {match[2]}
                   </span>
                 );
               }
               return <span key={i}>{part}</span>;
            })}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Activity action labels ───────────────────────────────────────────────────
function activityLabel(action: string, details: Record<string, unknown>): string {
  switch (action) {
    case 'task_created': return 'created this task';
    case 'status_changed': return `changed status from "${details.from}" to "${details.to}"`;
    case 'comment_added': return 'added a comment';
    case 'assignment_changed': return 'changed the assignee';
    default: return action.replace(/_/g, ' ');
  }
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function TaskDetailPanel() {
  const { selectedTaskId, setSelectedTaskId } = useUIStore();
  const [comment, setComment] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'timelogs'>('comments');
  const [timeLogOpen, setTimeLogOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const currentUser = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', selectedTaskId],
    queryFn: () => api.get<TaskDetail>(`/api/tasks/${selectedTaskId}`),
    enabled: !!selectedTaskId,
  });

  // Fetch project members for inline assignee picker
  const { data: members } = useQuery({
    queryKey: ['project-members', task?.project?.id],
    queryFn: () => api.get<any[]>(`/api/projects/${task!.project.id}/members`),
    enabled: !!task?.project?.id,
    staleTime: 60_000,
  });

  // Fetch project labels
  const { data: projectLabels } = useQuery({
    queryKey: ['project-labels', task?.project?.id],
    queryFn: () => api.get<any>(`/api/labels/project/${task!.project.id}`),
    enabled: !!task?.project?.id,
    staleTime: 60_000,
  });

  // All projects (for move to project feature)
  const { data: allProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<any[]>('/api/projects'),
    staleTime: 60_000,
    enabled: !!selectedTaskId,
  });

  // Project custom fields
  const { data: projectCustomFields } = useQuery({
    queryKey: ['project-custom-fields', task?.project?.id],
    queryFn: () => api.get<any[]>(`/api/custom-fields/project/${task!.project.id}`),
    enabled: !!task?.project?.id,
    staleTime: 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['task', selectedTaskId] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const summarizeComments = useMutation({
    mutationFn: () => api.post(`/api/ai/summarize-task/${selectedTaskId}`),
    onSuccess: (res: any) => {
      setAiSummary(res.data);
      toast({ title: 'Summary generated ✨' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to summarize', description: err.response?.data?.message || 'Check AI settings', variant: 'destructive' });
    }
  });

  const updateTask = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put(`/api/tasks/${selectedTaskId}`, data),
    onSuccess: invalidate,
    onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
  });

  const addComment = useMutation({
    mutationFn: (content: string) =>
      api.post(`/api/comments/task/${selectedTaskId}`, { content }),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['task', selectedTaskId] });
    },
  });

  const editComment = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.put(`/api/comments/${id}`, { content }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', selectedTaskId] }),
  });

  const deleteComment = useMutation({
    mutationFn: (id: string) => api.delete(`/api/comments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', selectedTaskId] }),
  });

  const uploadAttachment = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.upload(`/api/attachments/task/${selectedTaskId}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', selectedTaskId] });
      toast({ title: 'File uploaded' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: () => toast({ title: 'Upload failed', variant: 'destructive' }),
  });

  const deleteAttachment = useMutation({
    mutationFn: (id: string) => api.delete(`/api/attachments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', selectedTaskId] }),
  });

  const duplicateTask = useMutation({
    mutationFn: async () => {
      return api.post(`/api/tasks/project/${task!.project.id}`, {
        title: `${task!.title} (Copy)`,
        description: task!.description,
        status: task!.status,
        priority: task!.priority,
        startDate: task!.startDate,
        dueDate: task!.dueDate,
        assigneeId: task!.assignee?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Task duplicated' });
    },
  });

  const deleteTask = useMutation({
    mutationFn: () => api.delete(`/api/tasks/${selectedTaskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTaskId(null);
      toast({ title: 'Task deleted' });
    },
  });

  const deleteTimeLog = useMutation({
    mutationFn: (logId: string) => api.delete(`/api/search/timelogs/${logId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', selectedTaskId] });
      toast({ title: 'Time log deleted' });
    },
  });

  const addLabel = useMutation({
    mutationFn: (labelId: string) => api.post(`/api/labels/task/${selectedTaskId}/assign/${labelId}`),
    onSuccess: invalidate,
  });

  const removeLabel = useMutation({
    mutationFn: (labelId: string) => api.delete(`/api/labels/task/${selectedTaskId}/assign/${labelId}`),
    onSuccess: invalidate,
  });

  const moveToProject = useMutation({
    mutationFn: (newProjectId: string) =>
      api.put(`/api/tasks/${selectedTaskId}`, { projectId: newProjectId }),
    onSuccess: (_, newProjectId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', selectedTaskId] });
      const project = allProjects?.find((p: any) => p.id === newProjectId);
      toast({ title: `Task moved to ${project?.name || 'project'}` });
    },
    onError: () => toast({ title: 'Failed to move task', variant: 'destructive' }),
  });

  const updateCustomFieldValue = useMutation({
    mutationFn: (data: { fieldId: string; value: any }) =>
      api.post(`/api/custom-fields/task/${selectedTaskId}/value`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', selectedTaskId] });
    },
    onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
  });

  const handleTitleSave = () => {
    if (title.trim() && title !== task?.title) updateTask.mutate({ title });
    setEditingTitle(false);
  };

  const handleDescSave = () => {
    if (desc !== (task?.description || '')) updateTask.mutate({ description: desc });
    setEditingDesc(false);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/projects/${task?.project.id}?taskId=${task?.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied!' });
  };

  return (
    <Sheet open={!!selectedTaskId} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
      <SheetContent side="right" className="w-[85vw] sm:max-w-xl md:max-w-2xl p-0 flex flex-col bg-background border-l border-border shadow-2xl">
        <SheetTitle className="sr-only text-foreground">Task Details</SheetTitle>
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : task ? (
          <>
            {/* ── Header ── */}
            <div className="px-5 pt-5 pb-3 border-b border-border/50 flex-shrink-0">
              <div className="flex items-start justify-between gap-2 mb-3">
                {/* Title */}
                {editingTitle ? (
                  <input
                    autoFocus
                    className="flex-1 text-base font-semibold text-foreground border-b-2 border-primary outline-none bg-transparent"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                  />
                ) : (
                  <h2
                    className="flex-1 text-base font-semibold text-foreground cursor-text hover:bg-muted/50 rounded px-1 -ml-1 transition-colors leading-snug"
                    onClick={() => { setTitle(task.title); setEditingTitle(true); }}
                  >
                    {task.title}
                  </h2>
                )}

                {/* Header actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={copyLink} title="Copy link"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 p-1">
                      <DropdownMenuItem className="text-xs cursor-pointer gap-2" onClick={copyLink}>
                        <Link2 className="w-3.5 h-3.5" /> Copy link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-xs cursor-pointer gap-2"
                        onClick={() => duplicateTask.mutate()}
                      >
                        <Copy className="w-3.5 h-3.5" /> Duplicate task
                      </DropdownMenuItem>

                      {/* Move to project */}
                      {allProjects && allProjects.filter((p: any) => p.id !== task.project.id).length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <p className="text-[10px] text-gray-400 font-semibold px-2 pt-1 pb-0.5 uppercase tracking-wide">Move to project</p>
                          {allProjects
                            .filter((p: any) => p.id !== task.project.id)
                            .map((p: any) => (
                              <DropdownMenuItem
                                key={p.id}
                                className="text-xs cursor-pointer gap-2"
                                onClick={() => moveToProject.mutate(p.id)}
                              >
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                                {p.name}
                              </DropdownMenuItem>
                            ))}
                        </>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-xs cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this task?')) {
                            deleteTask.mutate();
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => setSelectedTaskId(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Project breadcrumb & Labels */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: task.project.color }} />
                  <span className="truncate">{task.project.name}</span>
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  <span className="text-muted-foreground truncate">{task.title}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {task.labels?.map((Tl) => (
                    <Badge
                      key={Tl.label.id}
                      className="px-2 py-0.5 text-[10px] font-semibold border-none flex items-center gap-1 group/label"
                      style={{ backgroundColor: `${Tl.label.color}15`, color: Tl.label.color }}
                    >
                      {Tl.label.name}
                      <button
                        className="opacity-0 group-hover/label:opacity-100 hover:bg-black/10 rounded-full p-0.5 -mr-1 transition-all"
                        onClick={() => removeLabel.mutate(Tl.label.id)}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-5 px-2 text-[10px] border-dashed border-border/50 text-muted-foreground/60 hover:text-foreground transition-colors">
                        <Plus className="w-3 h-3 mr-1" /> Add label
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 p-1">
                      {(!projectLabels || projectLabels.length === 0) ? (
                        <div className="p-2 text-xs text-muted-foreground/60 text-center">No labels in project</div>
                      ) : (
                        projectLabels.map((l: any) => {
                          const assigned = task.labels?.some((tl) => tl.label.id === l.id);
                          return (
                            <DropdownMenuItem
                              key={l.id}
                              className="text-xs cursor-pointer gap-2 justify-between"
                              onClick={() => {
                                if (assigned) removeLabel.mutate(l.id);
                                else addLabel.mutate(l.id);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                                {l.name}
                              </div>
                              {assigned && <Check className="w-3.5 h-3.5 text-primary" />}
                            </DropdownMenuItem>
                          );
                        })
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* ── Scrollable Body with Drag & Drop ── */}
            <div 
              className={cn("flex-1 overflow-y-auto transition-colors relative", dragActive ? "bg-primary/5" : "")}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  if (file.size > 10 * 1024 * 1024) {
                    toast({ title: 'Max file size is 10MB', variant: 'destructive' }); return;
                  }
                  uploadAttachment.mutate(file);
                }
              }}
            >
              {dragActive && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary m-4 rounded-xl">
                  <div className="text-center">
                    <Paperclip className="w-10 h-10 text-primary mx-auto mb-2 animate-bounce" />
                    <p className="text-lg font-bold text-primary">Drop file to attach</p>
                  </div>
                </div>
              )}

              <div className="px-5 py-6 space-y-6">
                {/* Properties Grid */}
                <div className="grid grid-cols-1 gap-y-3.5">
                  {/* Status */}
                  <div className="flex items-center gap-3 group">
                    <span className="text-xs text-muted-foreground/60 w-24 flex-shrink-0 font-medium">Status</span>
                    <Select value={task.status} onValueChange={(v) => updateTask.mutate({ status: v })}>
                      <SelectTrigger className="h-7 text-xs w-36 border-border hover:border-border/80 bg-background text-foreground transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {Object.entries(STATUS_CONFIG).map(([key, { label, dotColor }]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-1.5">
                              <span className={cn('w-2 h-2 rounded-full', dotColor)} />
                              {label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground/60 w-24 flex-shrink-0 font-medium">Priority</span>
                    <Select value={task.priority} onValueChange={(v) => updateTask.mutate({ priority: v })}>
                      <SelectTrigger className="h-7 text-xs w-28 border-border hover:border-border/80 bg-background text-foreground transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {Object.entries(PRIORITY_CONFIG).map(([key, { label, dotColor }]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-1.5">
                              <span className={cn('w-2 h-2 rounded-full', dotColor)} />
                              {label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assignee */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground/60 w-24 flex-shrink-0 font-medium">Assignee</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1.5 h-7 px-2 rounded-md border border-border hover:border-border/80 transition-colors text-xs min-w-[7rem] bg-background">
                          {task.assignee ? (
                            <>
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={task.assignee.avatar || ''} />
                                <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                                  {getInitials(task.assignee.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate text-foreground/80">{task.assignee.name}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground/60 italic">Unassigned</span>
                          )}
                          <ChevronDown className="w-3 h-3 ml-auto text-muted-foreground/40" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44 p-1">
                        <DropdownMenuItem
                          className="text-xs cursor-pointer text-muted-foreground/60 italic"
                          onClick={() => updateTask.mutate({ assigneeId: null })}
                        >
                          Unassigned
                        </DropdownMenuItem>
                        {(members || []).map((m: any) => (
                          <DropdownMenuItem
                            key={m.id}
                            className="text-xs cursor-pointer flex items-center gap-2"
                            onClick={() => updateTask.mutate({ assigneeId: m.id })}
                          >
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={m.avatar || ''} />
                              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                {getInitials(m.name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-foreground/80">{m.name}</span>
                            {task.assignee?.id === m.id && (
                              <Check className="w-3.5 h-3.5 ml-auto text-primary" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Dates Row */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground/60 w-24 flex-shrink-0 font-medium">Start date</span>
                      <input
                        type="date"
                        defaultValue={task.startDate ? task.startDate.substring(0, 10) : ''}
                        onChange={(e) => updateTask.mutate({ startDate: e.target.value || null })}
                        className="h-7 border border-border rounded-md px-2 text-xs text-foreground/80 focus:outline-none focus:border-primary hover:border-border/80 transition-colors bg-background"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground/60 w-24 flex-shrink-0 font-medium">Due date</span>
                      <input
                        type="date"
                        defaultValue={task.dueDate ? task.dueDate.substring(0, 10) : ''}
                        onChange={(e) => updateTask.mutate({ dueDate: e.target.value || null })}
                        className={cn(
                          'h-7 border rounded-md px-2 text-xs focus:outline-none transition-colors bg-background',
                          task.dueDate && isOverdue(task.dueDate, task.status)
                            ? 'border-destructive/50 text-destructive hover:border-destructive'
                            : 'border-border text-foreground/80 hover:border-border/80 focus:border-primary'
                        )}
                      />
                    </div>
                  </div>

                  {/* Estimated */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground/60 w-24 flex-shrink-0 font-medium">Estimated</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        className="h-7 w-20 border border-border rounded-md px-2 text-xs text-foreground/80 focus:outline-none focus:border-primary hover:border-border/80 transition-colors bg-background"
                        placeholder="Hours"
                        defaultValue={task.estimatedHours || ''}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val !== task.estimatedHours) {
                            updateTask.mutate({ estimatedHours: val });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                      />
                      <span className="text-xs text-muted-foreground/60">hrs</span>
                    </div>
                  </div>

                  {/* Time Logged */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground/60 w-24 flex-shrink-0 font-medium">Time logged</span>
                    <div className="flex flex-1 items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground/80">
                          {task.timeLogs?.reduce((acc: number, l: any) => acc + l.hours, 0).toFixed(1) || '0.0'}
                        </span>
                        <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wide">hrs</span>
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        className="h-6 text-[10px] text-primary px-2 hover:bg-primary/10 transition-colors"
                        onClick={() => setTimeLogOpen(true)}
                      >
                        <Clock className="w-3 h-3 mr-1" /> Log Time
                      </Button>
                    </div>
                  </div>

                  {/* Created By */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground/60 w-24 flex-shrink-0 font-medium">Created by</span>
                    <div className="flex items-center gap-1.5">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={task.creator.avatar || ''} />
                        <AvatarFallback className="text-[9px] bg-muted">{getInitials(task.creator.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-foreground/80">{task.creator.name}</span>
                    </div>
                  </div>

                  {/* Custom Fields */}
                  {projectCustomFields && projectCustomFields.length > 0 && (
                    <div className="pt-4 mt-2 border-t border-border/50 space-y-2.5">
                      <p className="text-[10px] text-muted-foreground/40 font-semibold uppercase tracking-wide mb-1 px-1">Custom Fields</p>
                      {projectCustomFields.map((f: any) => {
                        const valueObj = task.customFieldValues?.find((v: any) => v.fieldId === f.id);
                        const currentVal = valueObj?.value || '';

                        return (
                          <div key={f.id} className="flex items-center gap-3 group px-1">
                            <span className="text-xs text-muted-foreground/60 w-24 flex-shrink-0 font-medium truncate" title={f.name}>
                              {f.name}
                            </span>
                            <div className="flex-1 min-w-0">
                              {f.type === 'CHECKBOX' ? (
                                <button
                                  type="button"
                                  className={cn(
                                    "w-8 h-4 rounded-full flex items-center px-0.5 cursor-pointer transition-colors outline-none",
                                    currentVal === 'true' ? "bg-primary" : "bg-muted"
                                  )}
                                  onClick={() => updateCustomFieldValue.mutate({ fieldId: f.id, value: currentVal === 'true' ? 'false' : 'true' })}
                                >
                                  <div className={cn("w-3 h-3 rounded-full bg-white transition-transform transform", currentVal === 'true' ? "translate-x-4" : "translate-x-0")} />
                                </button>
                              ) : f.type === 'DROPDOWN' ? (
                                <Select value={currentVal} onValueChange={(v) => updateCustomFieldValue.mutate({ fieldId: f.id, value: v })}>
                                  <SelectTrigger className="h-7 text-xs w-full max-w-[200px] border-border hover:border-border/80 bg-background text-foreground transition-colors">
                                    <SelectValue placeholder="No value" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card border-border">
                                    <SelectItem value="_null" className="text-muted-foreground/60 italic">No value</SelectItem>
                                    {(f.options as string[] || []).map((opt) => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <input
                                  type={f.type === 'NUMBER' ? 'number' : f.type === 'DATE' ? 'date' : 'text'}
                                  className="h-7 px-2 text-xs w-full max-w-[200px] border border-border rounded-md focus:ring-1 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors"
                                  defaultValue={currentVal}
                                  placeholder={f.type === 'URL' ? 'https://...' : ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== currentVal) {
                                      updateCustomFieldValue.mutate({ fieldId: f.id, value: e.target.value });
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') e.currentTarget.blur();
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Separator className="border-border/50" />

                {/* Description */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground/40 font-semibold uppercase tracking-wide">Description</p>
                    {!editingDesc && (
                      <button
                        onClick={() => { setDesc(task.description || ''); setEditingDesc(true); }}
                        className="text-[10px] text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingDesc ? (
                    <div className="space-y-2">
                      <RichTextEditor
                        value={desc}
                        onChange={setDesc}
                        placeholder="Add a description..."
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90" onClick={handleDescSave}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingDesc(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="cursor-text min-h-[4rem] rounded-md hover:bg-muted/30 px-2 -mx-2 py-2 transition-colors group"
                      onClick={() => { setDesc(task.description || ''); setEditingDesc(true); }}
                    >
                      {task.description ? (
                        <div
                          className="text-sm text-foreground/80 leading-relaxed prose-custom"
                          dangerouslySetInnerHTML={{ __html: task.description }}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground/60 italic group-hover:text-muted-foreground/80 transition-colors">Click to add a description...</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Subtasks */}
                {task.subtasks.length > 0 && (
                  <div className="space-y-4">
                    <Separator className="border-border/50" />
                    <div>
                      <p className="text-[11px] text-muted-foreground/40 mb-2 font-semibold uppercase tracking-wide">
                        Subtasks ({task.subtasks.filter(s => s.status === 'DONE').length}/{task.subtasks.length})
                      </p>
                      {/* Progress bar */}
                      <div className="h-1 bg-muted rounded-full mb-3">
                        <div
                          className="h-1 bg-primary rounded-full transition-all"
                          style={{ width: `${(task.subtasks.filter(s => s.status === 'DONE').length / task.subtasks.length) * 100}%` }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        {task.subtasks.map((sub) => {
                          const stConf = STATUS_CONFIG[sub.status as keyof typeof STATUS_CONFIG];
                          return (
                            <div
                              key={sub.id}
                              onClick={() => setSelectedTaskId(sub.id)}
                              className="flex items-center gap-2 text-sm text-foreground/80 hover:text-primary cursor-pointer group/sub py-0.5 px-1 -mx-1 rounded hover:bg-muted/50 transition-colors"
                            >
                              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', stConf?.dotColor || 'bg-muted')} />
                              <span className={cn('flex-1 group-hover/sub:underline truncate text-xs', sub.status === 'DONE' && 'line-through text-muted-foreground/40')}>
                                {sub.title}
                              </span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover/sub:opacity-100 transition-opacity" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <Separator className="border-border/50" />

                {/* Attachments */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground/40 font-semibold uppercase tracking-wide">
                      Attachments {task.attachments?.length > 0 && `(${task.attachments.length})`}
                    </p>
                    <div>
                      <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast({ title: 'Max file size is 10MB', variant: 'destructive' }); return;
                          }
                          uploadAttachment.mutate(file);
                        }
                      }} />
                      <Button
                        variant="ghost" size="sm"
                        className="h-6 text-xs text-primary bg-primary/10 hover:bg-primary/20 px-2.5 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadAttachment.isPending}
                      >
                        {uploadAttachment.isPending
                          ? <Spinner className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          : <Paperclip className="w-3.5 h-3.5 mr-1.5" />}
                        Attach
                      </Button>
                    </div>
                  </div>

                  {task.attachments?.length > 0 && (
                    <div className="space-y-2">
                      {task.attachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-muted/30 group/att hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold uppercase">
                              {att.originalName.split('.').pop()}
                            </div>
                            <div className="min-w-0">
                              <a href={att.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-foreground/90 hover:underline truncate block">
                                {att.originalName}
                              </a>
                              <p className="text-[10px] text-muted-foreground/60">
                                {(att.size / 1024).toFixed(1)} KB · {att.uploader.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover/att:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/60 hover:text-foreground" asChild>
                              <a href={att.url} download><Download className="h-3 w-3" /></a>
                            </Button>
                            {(currentUser?.id === att.uploader.id || currentUser?.role === 'ADMIN') && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => deleteAttachment.mutate(att.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator className="border-border/50" />

                {/* Tabs Section */}
                <div className="space-y-4">
                  <div className="flex gap-4 border-b border-border/50">
                    <button
                      className={cn(
                        'text-xs font-semibold pb-2 border-b-2 transition-colors flex items-center gap-1.5',
                        activeTab === 'comments'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground/60 hover:text-muted-foreground'
                      )}
                      onClick={() => setActiveTab('comments')}
                    >
                      <span>Comments {task.comments.length > 0 && `(${task.comments.length})`}</span>
                    </button>
                    <button
                      className={cn(
                        'text-xs font-semibold pb-2 border-b-2 transition-colors',
                        activeTab === 'activity'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground/60 hover:text-muted-foreground'
                      )}
                      onClick={() => setActiveTab('activity')}
                    >
                      Activity
                    </button>
                    <button
                      className={cn(
                        'text-xs font-semibold pb-2 border-b-2 transition-colors',
                        activeTab === 'timelogs'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground/60 hover:text-muted-foreground'
                      )}
                      onClick={() => setActiveTab('timelogs')}
                    >
                      Time Logs {task.timeLogs?.length > 0 && `(${task.timeLogs.length})`}
                    </button>
                  </div>

                  {activeTab === 'comments' && (
                    <div className="space-y-4">
                      {task.comments.length > 0 && (
                        <div className="flex justify-end mb-2">
                           <Button 
                             size="sm" 
                             variant="outline" 
                             className="h-7 text-[10px] gap-1.5 text-indigo-500 border-indigo-200 hover:bg-indigo-50"
                             onClick={() => summarizeComments.mutate()}
                             disabled={summarizeComments.isPending}
                           >
                             {summarizeComments.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                             Summarize with AI
                           </Button>
                        </div>
                      )}

                      {aiSummary && (
                        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4 rounded-xl text-sm text-foreground/80 mb-6">
                           <h4 className="flex items-center gap-2 font-bold text-indigo-600 mb-2">
                             <Sparkles className="w-4 h-4" /> AI Summary
                           </h4>
                           <div className="prose-custom whitespace-pre-wrap">{aiSummary}</div>
                        </div>
                      )}

                      {task.comments.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60 text-center py-8">No comments yet — be the first!</p>
                      ) : (
                        <div className="space-y-4">
                          {task.comments.map((c) => (
                            <CommentItem
                              key={c.id}
                              comment={c}
                              currentUserId={currentUser?.id}
                              onDelete={(id) => deleteComment.mutate(id)}
                              onEdit={(id, content) => editComment.mutate({ id, content })}
                            />
                          ))}
                        </div>
                      )}

                      {/* Add comment */}
                      <div className="flex gap-2.5 pt-2">
                        <Avatar className="w-7 h-7 flex-shrink-0">
                          <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                            {currentUser ? getInitials(currentUser.name) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 relative">
                          <Textarea
                            placeholder="Write a comment... (Type @ to mention)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[80px] text-sm resize-none border-border focus-visible:ring-primary rounded-lg bg-background text-foreground transition-colors"
                            rows={2}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (comment.trim()) addComment.mutate(comment);
                              }
                            }}
                          />
                          {comment.trim() && (
                            <div className="flex justify-end mt-2">
                              <Button
                                size="sm"
                                className="h-7 bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 transition-colors"
                                onClick={() => addComment.mutate(comment)}
                                disabled={addComment.isPending}
                              >
                                <Send className="w-3 h-3" /> Send
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="space-y-4">
                      {task.activities.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60 text-center py-8">No activity yet</p>
                      ) : (
                        <div className="space-y-4">
                          {task.activities.map((act) => (
                            <div key={act.id} className="flex gap-2.5">
                              <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
                                <AvatarImage src={act.user.avatar || ''} />
                                <AvatarFallback className="text-[9px] bg-muted text-muted-foreground/60">
                                  {getInitials(act.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs text-foreground/80 leading-relaxed">
                                  <span className="font-semibold text-foreground/90">{act.user.name}</span>{' '}
                                  {activityLabel(act.action, act.details)}
                                </p>
                                <p className="text-[10px] text-muted-foreground/40 mt-1">
                                  {formatDateRelative(act.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'timelogs' && (
                    <div className="space-y-4">
                      {(!task.timeLogs || task.timeLogs.length === 0) ? (
                        <div className="text-center py-8 text-xs text-muted-foreground/60 border border-dashed border-border rounded-lg">
                          No time logged yet. Click "Log Time" to start tracking.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {task.timeLogs.map((log: any) => (
                            <div key={log.id} className="flex gap-3 text-xs p-3 border border-border/50 rounded-lg shrink-0 group relative hover:border-border transition-colors bg-muted/20">
                              <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
                                <AvatarImage src={log.user?.avatar || ''} />
                                <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                                  {getInitials(log.user?.name || '')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-semibold text-foreground/90">{log.user?.name}</span>
                                  <span className="text-muted-foreground/40 text-[10px] whitespace-nowrap">
                                    {formatDate(log.loggedAt)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-blue-500/10 text-blue-500 border-none font-semibold">
                                    {log.hours} hrs
                                  </Badge>
                                </div>
                                {log.note && <p className="text-muted-foreground/80 leading-relaxed line-clamp-2">{log.note}</p>}
                              </div>
                              {(currentUser?.id === log.userId || currentUser?.role === 'ADMIN') && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                                  onClick={() => {
                                    if (confirm('Delete this time log?')) {
                                      deleteTimeLog.mutate(log.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
      {selectedTaskId && (
        <TimeLogModal
          taskId={selectedTaskId}
          open={timeLogOpen}
          onOpenChange={setTimeLogOpen}
        />
      )}
    </Sheet>
  );
}
