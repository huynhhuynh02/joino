import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTheme = 'default' | 'blue' | 'purple' | 'orange' | 'indigo' | 'rose' | 'teal';

interface UIState {
  // Theme management
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;

  // Task detail panel
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;

  // Create task modal
  isCreateTaskOpen: boolean;
  createTaskProjectId: string | null;
  createTaskStatus: string | null;
  openCreateTask: (projectId?: string, status?: string) => void;
  closeCreateTask: () => void;

  // Create project modal
  isCreateProjectOpen: boolean;
  openCreateProject: () => void;
  closeCreateProject: () => void;

  // Mobile sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  // Notification panel
  isNotificationOpen: boolean;
  toggleNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'default',
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          if (theme === 'default') {
            document.documentElement.removeAttribute('data-theme');
          } else {
            document.documentElement.setAttribute('data-theme', theme);
          }
        }
      },

      selectedTaskId: null,
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),

      isCreateTaskOpen: false,
      createTaskProjectId: null,
      createTaskStatus: null,
      openCreateTask: (projectId = '', status = 'TODO') =>
        set({ isCreateTaskOpen: true, createTaskProjectId: projectId || null, createTaskStatus: status }),
      closeCreateTask: () =>
        set({ isCreateTaskOpen: false, createTaskProjectId: null, createTaskStatus: null }),

      isCreateProjectOpen: false,
      openCreateProject: () => set({ isCreateProjectOpen: true }),
      closeCreateProject: () => set({ isCreateProjectOpen: false }),

      isSidebarOpen: true,
      toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

      isNotificationOpen: false,
      toggleNotifications: () => set((s) => ({ isNotificationOpen: !s.isNotificationOpen })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
