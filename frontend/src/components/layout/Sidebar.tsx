'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter, Link } from '@/i18n/routing';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn, getInitials } from '@/lib/utils';
import {
  LayoutDashboard, CheckSquare, Bell, FolderKanban,
  Settings, Zap, Plus, ChevronRight, LogOut,
  ChevronDown, BarChart3, Search, X,
} from 'lucide-react';
import {
  Tooltip,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { OrganizationSwitcher } from './OrganizationSwitcher';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface SidebarProps {
  isMobile?: boolean;
}

export function Sidebar({ isMobile }: SidebarProps = {}) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const openCreateProject = useUIStore((s) => s.openCreateProject);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { label: t('common.dashboard'), icon: LayoutDashboard, href: '/dashboard' },
    { label: t('common.myTasks'), icon: CheckSquare, href: '/my-tasks' },
    { label: t('common.inbox'), icon: Bell, href: '/inbox' },
    { label: t('common.reports'), icon: BarChart3, href: '/reports' },
  ];

  const bottomNav = [
    { label: t('common.settings'), icon: Settings, href: '/settings' },
  ];

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/api/projects'),
  });

  const handleLogout = () => {
    document.cookie = 'joino_token=; path=/; max-age=0';
    logout();
    window.location.href = '/login';
  };

  const filteredProjects = projects?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn("sidebar", isMobile ? "flex md:hidden w-full" : "hidden md:flex")}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/10">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Joino</span>
        </div>

        {/* Workspace Switcher */}
        <OrganizationSwitcher />

        {/* Search Bar */}
        <div className="px-3 pt-4 pb-2">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-white transition-colors" />
            <input 
              type="text"
              placeholder={t('common.search') + "..."}
              className="w-full bg-white/5 border border-white/5 rounded-md pl-8 pr-8 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:bg-white/10 transition-all shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-3 h-3 text-gray-400 hover:text-white" />
              </button>
            )}
            {!searchQuery && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground/40 tracking-tighter border border-border/20 rounded px-1 group-focus-within:hidden">
                CMD K
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {/* Main Nav */}
          {navItems.map(({ label, icon: Icon, href }) => (
            <Link
              key={href}
              href={href as any}
              className={cn(
                'sidebar-item',
                pathname === href && 'active'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}

          {/* Projects Section */}
          <div className="pt-4 pb-1">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="sidebar-item w-full justify-between text-xs uppercase tracking-wider"
            >
              <span className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4" />
                {t('common.projects')}
              </span>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', !projectsExpanded && '-rotate-90')} />
            </button>

            {projectsExpanded && (
              <div className="ml-2 mt-1 space-y-0.5">
                <Link
                  href="/projects"
                  className={cn(
                    'sidebar-item text-xs',
                    pathname === '/projects' && 'active'
                  )}
                >
                  <FolderKanban className="w-3 h-3" />
                  <span>{t('sidebar.favorites')}</span>
                </Link>
                {filteredProjects?.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}` as any}
                    className={cn(
                      'sidebar-item text-xs animate-in fade-in slide-in-from-left-2 duration-200',
                      pathname.startsWith(`/projects/${project.id}`) && 'active'
                    )}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                  </Link>
                ))}
                {searchQuery && filteredProjects?.length === 0 && (
                  <div className="px-3 py-4 text-center">
                    <p className="text-[10px] text-muted-foreground/40 italic">{t('sidebar.noMatchingProjects')}</p>
                  </div>
                )}
                <button
                  onClick={openCreateProject}
                  className="sidebar-item w-full text-xs text-muted-foreground/60 hover:text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('sidebar.createProject')}
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Nav */}
        <div className="px-2 pb-2 space-y-0.5 border-t border-white/10 pt-2">
          {bottomNav.map(({ label, icon: Icon, href }) => (
            <Link
              key={href}
              href={href as any}
              className={cn('sidebar-item', pathname === href && 'active')}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="sidebar-item w-full mt-1">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user.avatar || ''} />
                    <AvatarFallback className="bg-primary text-white text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-left truncate text-sm">{user.name}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-52">
                <div className="px-3 py-2">
                  <p className="font-medium text-sm text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground/60 truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    {t('common.settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('common.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
