'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Users, Mail, Shield, Plus, ShieldAlert, Ban, Search } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { InviteMemberModal } from '@/components/user/InviteMemberModal';
import { useTranslations } from 'next-intl';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  isActive: boolean;
  _count?: {
    tasks: number;
  };
}

export function TeamTab() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const currentUser = useAuthStore(s => s.user);
  
  const [search, setSearch] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const usersQuery = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/api/users'),
  });
  const { data: users, isLoading, isError } = usersQuery;

  const { data: workload } = useQuery({
    queryKey: ['reports-workload'],
    queryFn: () => api.get<any[]>('/api/reports/workload')
  });

  const deactivateUser = useMutation({
    mutationFn: (id: string) => api.put(`/api/users/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: t('common.updatedSuccess') });
    },
    onError: () => toast({ title: t('common.updatedError'), variant: 'destructive' })
  });

  const reactivateUser = useMutation({
    mutationFn: (id: string) => api.put(`/api/users/${id}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: t('common.updatedSuccess') });
    },
    onError: () => toast({ title: t('common.updatedError'), variant: 'destructive' })
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string, role: string }) => api.put(`/api/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: t('common.updatedSuccess') });
    },
    onError: () => toast({ title: t('common.updatedError'), variant: 'destructive' })
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
  }, [users, search]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return t('common.roleAdmin');
      case 'MANAGER': return t('common.roleManager');
      default: return t('common.roleMember');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            {t('common.teamDirectory')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('common.teamDirectoryDesc')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder={t('common.searchMembers')} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-[250px] bg-card text-sm border-border"
            />
          </div>
          {currentUser?.role === 'ADMIN' && (
            <Button className="h-9 text-sm gap-1" onClick={() => setInviteModalOpen(true)}>
              <Plus className="w-4 h-4" /> {t('common.inviteMember')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {isError ? (
          <div className="col-span-full py-8">
            <ErrorState onRetry={() => usersQuery.refetch()} />
          </div>
        ) : isLoading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-card rounded-xl border border-border p-6 flex flex-col items-center text-center space-y-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="space-y-2 w-full flex flex-col items-center">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="text-lg font-medium text-foreground">{t('common.noMembersFound')}</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className={`bg-card rounded-xl border border-border p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow group relative ${!user.isActive ? 'opacity-50 grayscale' : ''}`}>
              
              {!user.isActive && (
                <div className="absolute top-3 left-3">
                  <Badge variant="destructive" className="text-[10px]">{t('common.inactive')}</Badge>
                </div>
              )}

              {user.role === 'ADMIN' && (
                <div className="absolute top-3 right-3 text-orange-500" title={t('common.workspaceAdmin')}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
              )}

              <Avatar className="w-20 h-20 mb-4 ring-4 ring-muted group-hover:ring-primary/10 transition-all">
                <AvatarImage src={user.avatar || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-foreground line-clamp-1 w-full">{user.name} {currentUser?.id === user.id && <span className="text-primary text-xs">{t('common.you')}</span>}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1 w-full flex items-center justify-center gap-1.5">
                {user.role === 'ADMIN' ? <Shield className="w-3.5 h-3.5" /> : null}
                {getRoleLabel(user.role)}
              </p>
              
              {/* Workload Stats */}
              <div className="w-full flex items-center justify-between mt-3 mb-1 px-2 bg-muted/30 rounded-lg py-2 border border-border/50">
                {(() => {
                  const uw = workload?.find((w: any) => w.user.id === user.id) || { todo: 0, inProgress: 0, review: 0, done: 0 };
                  return (
                    <>
                      <div className="flex flex-col items-center flex-1" title={t('status.TODO')}>
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 mb-1" />
                        <span className="text-xs font-bold text-foreground/80">{uw.todo}</span>
                      </div>
                      <div className="flex flex-col items-center flex-1 border-l border-border" title={t('status.IN_PROGRESS')}>
                        <div className="w-2 h-2 rounded-full bg-blue-500 mb-1" />
                        <span className="text-xs font-bold text-foreground/80">{uw.inProgress}</span>
                      </div>
                      <div className="flex flex-col items-center flex-1 border-l border-border" title={t('status.REVIEW')}>
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mb-1" />
                        <span className="text-xs font-bold text-foreground/80">{uw.review}</span>
                      </div>
                      <div className="flex flex-col items-center flex-1 border-l border-border" title={t('status.DONE')}>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mb-1" />
                        <span className="text-xs font-bold text-foreground/80">{uw.done}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="mt-4 pt-4 border-t border-border/50 w-full flex justify-center gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 text-xs flex-1 h-8" asChild>
                  <a href={`mailto:${user.email}`}>
                    <Mail className="w-3.5 h-3.5" /> {t('common.email')}
                  </a>
                </Button>
                
                {currentUser?.role === 'ADMIN' && currentUser.id !== user.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:bg-muted flex-1">
                        {t('common.manage')}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {!user.isActive ? (
                        <DropdownMenuItem className="text-xs text-emerald-500 focus:text-emerald-600 focus:bg-emerald-500/10 cursor-pointer" onClick={() => reactivateUser.mutate(user.id)}>
                          <Shield className="w-3.5 h-3.5 mr-2" /> {t('common.reactivate')}
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('common.changeRole')}</div>
                          <DropdownMenuItem className="text-xs cursor-pointer" onClick={() => changeRole.mutate({ id: user.id, role: 'ADMIN' })}>
                            <ShieldAlert className="w-3.5 h-3.5 mr-2" /> {t('common.makeAdmin')}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs cursor-pointer" onClick={() => changeRole.mutate({ id: user.id, role: 'MANAGER' })}>
                            <Users className="w-3.5 h-3.5 mr-2" /> {t('common.makeManager')}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs cursor-pointer" onClick={() => changeRole.mutate({ id: user.id, role: 'MEMBER' })}>
                            <Users className="w-3.5 h-3.5 mr-2" /> {t('common.makeMember')}
                          </DropdownMenuItem>
                          
                          <div className="h-px bg-border my-1" />
                          
                          <DropdownMenuItem className="text-xs text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer" onClick={() => {
                            if(confirm(t('common.confirmDeactivate', { name: user.name }))) {
                              deactivateUser.mutate(user.id);
                            }
                          }}>
                            <Ban className="w-3.5 h-3.5 mr-2" /> {t('common.deactivate')}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <InviteMemberModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
    </div>
  );
}
