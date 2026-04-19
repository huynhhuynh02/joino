'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Bell, Check, MailOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateRelative } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  project?: { id: string; name: string; color: string } | null;
}

export default function InboxPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/api/notifications'),
    refetchInterval: 30000,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.put('/api/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => api.put(`/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const filteredNotifications = notifications?.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const groupedNotifications = Object.entries(
    (filteredNotifications || []).reduce((acc: Record<string, { project: any; items: Notification[] }>, n) => {
      const pid = n.project?.id || 'other';
      if (!acc[pid]) {
        acc[pid] = { project: n.project, items: [] };
      }
      acc[pid].items.push(n);
      return acc;
    }, {})
  ).sort((a, b) => {
    if (a[0] === 'other') return 1;
    if (b[0] === 'other') return -1;
    return a[1].project.name.localeCompare(b[1].project.name);
  });

  return (
    <div className="view-container pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            {t('inbox.title')}
            {unreadCount > 0 && (
              <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold" variant="outline">
                {t('inbox.newCount', { count: unreadCount })}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground/80 mt-1 text-sm">
            {t('inbox.description')}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={() => markAllRead.mutate()} variant="outline" size="sm" className="gap-2 shrink-0">
            <Check className="w-4 h-4" />
            {t('inbox.markAllRead')}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex bg-muted/50 p-1 rounded-md border border-border">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${filter === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('inbox.all')}
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${filter === 'unread' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('inbox.unread')}
          </button>
        </div>
      </div>

      <div className="space-y-6 min-h-[400px]">
        {isLoading ? (
          <div className="bg-card rounded-xl border border-border/50 p-6 space-y-4">
             {[1, 2, 3].map(i => (
               <div key={i} className="flex gap-4">
                 <Skeleton className="w-10 h-10 rounded-full" />
                 <div className="space-y-2 flex-1">
                   <Skeleton className="h-4 w-1/4" />
                   <Skeleton className="h-3 w-1/2" />
                 </div>
               </div>
             ))}
          </div>
        ) : groupedNotifications.length === 0 ? (
          <div className="bg-card rounded-xl border border-border/50 flex flex-col items-center justify-center h-80 text-muted-foreground/40">
            <MailOpen className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-muted-foreground">{t('inbox.allCaughtUp')}</p>
            <p className="text-sm">{t('inbox.noNotifications')}</p>
          </div>
        ) : (
          groupedNotifications.map(([projectId, group]) => (
            <div key={projectId} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
              <div className="bg-muted/30 px-4 py-3 border-b border-border/50 flex items-center gap-2">
                {group.project ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: group.project.color }} />
                    <h3 className="font-semibold text-foreground/90 text-sm">{group.project.name}</h3>
                  </>
                ) : (
                  <h3 className="font-semibold text-foreground/90 text-sm px-1.5">{t('inbox.workspace')}</h3>
                )}
                <Badge variant="secondary" className="ml-auto text-[10px] font-bold bg-muted/50 text-muted-foreground/60 border-none h-5">
                  {group.items.length}
                </Badge>
              </div>
              <div className="divide-y divide-border/50">
                {group.items.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`p-4 flex gap-4 transition-colors hover:bg-muted/50 cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}
                    onClick={() => !notif.read && markAsRead.mutate(notif.id)}
                  >
                    <div className="mt-1">
                      <div className={`w-2 h-2 rounded-full ${!notif.read ? 'bg-primary ring-4 ring-primary/10' : 'bg-transparent'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className={`text-sm ${!notif.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap">
                          {formatDateRelative(notif.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 leading-snug ${!notif.read ? 'text-foreground/80' : 'text-muted-foreground/80'}`}>
                        {notif.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
