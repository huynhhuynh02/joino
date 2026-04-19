'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { ShortcutsHelpModal } from '@/components/layout/ShortcutsHelpModal';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { useUIStore } from '@/stores/uiStore';
import { useEffect, useState } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const openCreateTask = useUIStore((s) => s.openCreateTask);
  const theme = useUIStore((s) => s.theme);
  const [showHelp, setShowHelp] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Initialize Organization Context
  const { currentOrganizationId, setCurrentOrganizationId, isAuthenticated } = require('@/stores/authStore').useAuthStore();
  const { api } = require('@/lib/api');
  
  useEffect(() => {
    if (isAuthenticated && !currentOrganizationId) {
      api.get('/api/organizations').then((orgs: any[]) => {
        if (orgs.length > 0) {
          setCurrentOrganizationId(orgs[0].id);
          // Reload to cleanly apply the new context across queries
          window.location.reload();
        }
      }).catch(console.error);
    }
  }, [isAuthenticated, currentOrganizationId, setCurrentOrganizationId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing inside input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        if (!((e.metaKey || e.ctrlKey) && e.key === 'k')) {
          return;
        }
      }
      
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openCreateTask();
      } else if (e.key === '?') {
        e.preventDefault();
        setShowHelp(true);
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openCreateTask]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopBar onSearch={() => setShowSearch(true)} />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </main>
      </div>
      <TaskDetailPanel />
      <CreateProjectModal />
      <CreateTaskModal />
      <ShortcutsHelpModal open={showHelp} onOpenChange={setShowHelp} />
      <GlobalSearch open={showSearch} onOpenChange={setShowSearch} />
    </div>
  );
}
