'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { STATUS_CONFIG, PRIORITY_CONFIG, cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useTranslations } from 'next-intl';

export function CreateTaskModal() {
  const t = useTranslations();
  const { isCreateTaskOpen, closeCreateTask, createTaskProjectId, createTaskStatus } = useUIStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<string>('unassigned');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    if (isCreateTaskOpen) {
      setTitle('');
      setDescription('');
      setStatus(createTaskStatus || 'TODO');
      setPriority('MEDIUM');
      setAssigneeId('unassigned');
      setDueDate('');
      setStartDate('');
    }
  }, [isCreateTaskOpen, createTaskStatus]);

  // Fetch projects if not provided one
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Array<{ id: string; name: string }>>('/api/projects'),
    enabled: isCreateTaskOpen && !createTaskProjectId,
  });

  // Fetch users for assignment (assume project team or all members for now)
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<Array<{ id: string; name: string; avatar: string | null }>>('/api/users'),
    enabled: isCreateTaskOpen,
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (createTaskProjectId) {
      setSelectedProjectId(createTaskProjectId);
    } else if (projects?.length) {
      setSelectedProjectId(projects[0].id);
    }
  }, [createTaskProjectId, projects]);

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      api.post(`/api/tasks/project/${data.projectId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      toast({ title: t('tasks.createdSuccess') });
      closeCreateTask();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: t('common.updatedError'),
        description: err.response?.data?.message || t('tasks.failedCreate'),
      });
    },
  });

  const generateAI = useMutation({
    mutationFn: (prompt: string) => api.post('/api/ai/generate-task', { prompt }),
    onSuccess: (res: any) => {
      const data = res.data;
      if (data.title) setTitle(data.title);
      
      let desc = data.description || '';
      if (data.subtasks && data.subtasks.length > 0) {
        desc += `<br/><strong>${t('tasks.suggestedSubtasks')}</strong><ul>` + data.subtasks.map((s: string) => `<li>${s}</li>`).join('') + '</ul>';
      }
      if (desc) setDescription(desc);
      
      if (data.priority) setPriority(data.priority);
      toast({ title: t('tasks.aiGenerated') });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: t('tasks.aiGenerationFailed'),
        description: err.response?.data?.message || t('tasks.aiApiKeyHint'),
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedProjectId) return;

    createMutation.mutate({
      projectId: selectedProjectId,
      title,
      description: description || undefined,
      status,
      priority,
      assigneeId: assigneeId !== 'unassigned' ? assigneeId : null,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    });
  };

  return (
    <Dialog open={isCreateTaskOpen} onOpenChange={(open) => !open && closeCreateTask()}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] flex flex-col p-0 bg-background border-border shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 flex-shrink-0 bg-muted/20">
          <DialogTitle className="text-foreground">{t('tasks.createTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!createTaskProjectId && projects && (
            <div className="space-y-2">
              <Label>{t('common.project')}</Label>
              <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="bg-background border-border text-foreground hover:border-border/80 transition-colors">
                  <SelectValue placeholder={t('tasks.selectProject')} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2 relative">
            <Label htmlFor="title" className="flex items-center justify-between">
              {t('tasks.title')}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10 px-2 gap-1"
                onClick={() => {
                  if (!title.trim()) {
                    toast({ title: t('tasks.enterPromptFirst'), variant: 'destructive' });
                    return;
                  }
                  generateAI.mutate(title);
                }}
                disabled={generateAI.isPending}
              >
                {generateAI.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {t('tasks.magicAutofill')}
              </Button>
            </Label>
            <Input
              id="title"
              placeholder={t('tasks.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-background border-border text-foreground focus-visible:ring-primary transition-all pr-24"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('tasks.description')}</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder={t('tasks.descriptionPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('tasks.status')}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-background border-border text-foreground hover:border-border/80 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(STATUS_CONFIG).map(([key, { dotColor }]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', dotColor)} />
                        {t(`status.${key}`)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('tasks.priority')}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-background border-border text-foreground hover:border-border/80 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(PRIORITY_CONFIG).map(([key, { dotColor }]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', dotColor)} />
                        {t(`priority.${key}`)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('tasks.assignee')}</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="bg-background border-border text-foreground hover:border-border/80 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="unassigned" className="text-muted-foreground/60 italic">{t('tasks.unassigned')}</SelectItem>
                {users?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={u.avatar || ''} />
                        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-foreground/80">{u.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('tasks.startDate')}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background border-border text-foreground hover:border-border/80 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('tasks.dueDate')}</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-background border-border text-foreground hover:border-border/80 transition-colors"
              />
            </div>
          </div>

          </div>
          <DialogFooter className="px-6 py-4 border-t border-border/50 flex-shrink-0 bg-muted/30">
            <Button
              type="button"
              variant="outline"
              onClick={closeCreateTask}
              disabled={createMutation.isPending}
              className="border-border hover:bg-muted text-foreground transition-colors"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !title.trim() || !selectedProjectId}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('tasks.createButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
