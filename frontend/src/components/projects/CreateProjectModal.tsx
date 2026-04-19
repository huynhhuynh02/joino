'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const COLORS = [
  '#00A86B', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#64748B', // Slate
];

export function CreateProjectModal() {
  const t = useTranslations();
  const { isCreateProjectOpen, closeCreateProject } = useUIStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; color: string }) =>
      api.post<{ id: string }>('/api/projects', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: t('projects.projectCreated') });
      closeCreateProject();
      setName('');
      setDescription('');
      setColor(COLORS[0]);
      router.push(`/projects/${data.id}`);
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Error', // Or use generic error key
        description: err.response?.data?.message || t('common.updatedError'),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name, description, color });
  };

  return (
    <Dialog open={isCreateProjectOpen} onOpenChange={(open) => !open && closeCreateProject()}>
      <DialogContent className="sm:max-w-[425px] bg-background border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t('projects.createNewProject')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('projects.projectName')}</Label>
            <Input
              id="name"
              placeholder="e.g. Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-background border-border text-foreground focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('projects.descriptionOptional')}</Label>
            <Input
              id="description"
              placeholder={t('projects.briefDescription')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background border-border text-foreground focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2 pt-2">
            <Label>{t('projects.projectColor')}</Label>
            <div className="flex gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-primary bg-background' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeCreateProject}
              disabled={createMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('projects.createButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
