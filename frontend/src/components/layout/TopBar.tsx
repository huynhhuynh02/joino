'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useToast } from '@/hooks/use-toast';
import { Bell, Search, Plus, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/layout/Sidebar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials, formatDateRelative } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { SettingsModal } from '@/components/user/SettingsModal';
import { GlobalSearch } from '@/components/layout/GlobalSearch';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface TopBarProps {
  onSearch?: () => void;
}

export function TopBar({ onSearch }: TopBarProps) {
  const user = useAuthStore((s) => s.user);
  const openCreateProject = useUIStore((s) => s.openCreateProject);
  const queryClient = useQueryClient();

  const { data: notifData } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/api/notifications'),
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const prevIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (notifData) {
      const currentIds = new Set(notifData.map(n => n.id));
      if (prevIdsRef.current.size > 0) {
        const newUnread = notifData.filter(n => !n.read && !prevIdsRef.current.has(n.id));
        if (newUnread.length > 0) {
          toast({
            title: `New Notification${newUnread.length > 1 ? 's' : ''}`,
            description: newUnread[0].title + (newUnread.length > 1 ? ` and ${newUnread.length - 1} more` : ''),
          });
        }
      }
      prevIdsRef.current = currentIds;
    }
  }, [notifData, toast]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const unreadCount = notifData?.filter((n) => !n.read).length ?? 0;

  const markAllRead = useMutation({
    mutationFn: () => api.put('/api/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <header className="h-14 bg-card border-b border-border flex items-center gap-3 px-4 flex-shrink-0 relative z-10 w-full min-w-0">
      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex-shrink-0">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="w-5 h-5 text-muted-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px] border-none">
             <Sidebar isMobile />
          </SheetContent>
        </Sheet>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md relative hidden sm:block">
        <div 
          className="relative group cursor-text"
          onClick={() => onSearch ? onSearch() : setSearchOpen(true)}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <div className="pl-9 pr-3 bg-muted/50 border border-border hover:border-primary/20 transition-colors h-9 text-sm rounded-md flex items-center justify-between text-muted-foreground w-full">
            <span>Search tasks, projects...</span>
            <div className="flex gap-1 text-[10px] font-semibold opacity-60">
              <span className="bg-muted border border-border/50 px-1.5 py-0.5 rounded">Cmd</span>
              <span className="bg-muted border border-border/50 px-1.5 py-0.5 rounded">K</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Quick add */}
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 gap-1.5 border-none shadow-sm"
          onClick={openCreateProject}
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </Button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="w-4 h-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground border-none shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary h-7"
                  onClick={() => markAllRead.mutate()}
                >
                  Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {!notifData?.length ? (
                <p className="text-sm text-muted-foreground/40 text-center py-8">
                  No notifications
                </p>
              ) : (
                notifData.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-muted cursor-pointer transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      )}
                      <div className={!n.read ? '' : 'ml-3.5'}>
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-xs text-muted-foreground opacity-70 mt-1">
                          {formatDateRelative(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Avatar & Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                <AvatarImage src={user.avatar || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-2">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => setSettingsOpen(true)}>
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive cursor-pointer text-sm" onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
