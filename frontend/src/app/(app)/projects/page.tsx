'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { Plus, Folder, Users, LayoutGrid, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useRouter } from 'next/navigation';
import { formatDateRelative, cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  _count?: { tasks: number };
  members: Array<{
    user: { id: string; name: string; avatar: string | null };
  }>;
}

export default function ProjectsPage() {
  const router = useRouter();
  const openCreateProject = useUIStore((s) => s.openCreateProject);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/api/projects'),
  });
  const { data: projects, isLoading, isError } = projectsQuery;

  if (isError) {
    return (
      <div className="view-container flex items-center justify-center min-h-[400px]">
        <ErrorState onRetry={() => projectsQuery.refetch()} />
      </div>
    );
  }

  return (
    <div className="view-container">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-primary" />
            Projects
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your teams and current active initiatives.
          </p>
        </div>
        <Button onClick={openCreateProject} className="gap-2 bg-primary hover:bg-primary/90 text-white border-none shadow-md">
          <Plus className="w-4 h-4" />
          Create Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 space-y-4 h-[200px]">
              <div className="flex gap-3">
                <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              <Skeleton className="h-[1px] w-full" />
              <div className="flex justify-between items-center">
                <div className="flex -space-x-1">
                  {[1,2,3].map(j => <Skeleton key={j} className="w-6 h-6 rounded-full border-2 border-card" />)}
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))
        ) : !projects?.length ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center bg-card rounded-xl border border-border border-dashed">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Folder className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No projects yet</h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-center mb-6">
              Create your first project to start organizing tasks, inviting team members, and tracking progress.
            </p>
            <Button onClick={openCreateProject} variant="outline">
              Create Project
            </Button>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="bg-card rounded-xl border border-border p-5 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: project.color }}
                >
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {project.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center -space-x-2">
                  {project.members?.slice(0, 4).map((member) => (
                    <Avatar key={member.user.id} className="w-6 h-6 border-2 border-card">
                      <AvatarImage src={member.user.avatar || ''} />
                      <AvatarFallback className="text-[8px] bg-primary text-white">
                        {member.user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {project.members && project.members.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                      +{project.members.length - 4}
                    </div>
                  )}
                  {(!project.members || project.members.length === 0) && (
                    <span className="text-xs text-muted-foreground/60 italic">No members</span>
                  )}
                </div>

                <div className="flex text-xs text-muted-foreground/70 gap-3">
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5" />
                    {project._count?.tasks || 0}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
