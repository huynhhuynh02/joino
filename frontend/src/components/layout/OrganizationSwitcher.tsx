'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ChevronsUpDown, Check, PlusCircle } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from 'next-intl';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
}

export function OrganizationSwitcher() {
  const t = useTranslations();
  const { currentOrganizationId, setCurrentOrganizationId } = useAuthStore();

  const { data: orgs, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get<Organization[]>('/api/organizations'),
  });

  const activeOrg = orgs?.find((o) => o.id === currentOrganizationId);

  const handleSwitch = (id: string) => {
    if (id !== currentOrganizationId) {
      setCurrentOrganizationId(id);
      window.location.reload(); // Reload to refresh all project contexts
    }
  };

  if (isLoading) {
    return <div className="h-10 w-full animate-pulse bg-white/5 rounded-md mt-4" />;
  }

  if (!orgs || orgs.length === 0) return null;

  return (
    <div className="px-3 pt-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors group">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded flex-shrink-0 bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-[10px] font-bold">
                {activeOrg?.logo ? (
                  <img src={activeOrg.logo} alt={activeOrg.name} className="w-full h-full object-cover rounded" />
                ) : (
                  getInitials(activeOrg?.name || 'Workspace')
                )}
              </div>
              <span className="text-sm font-medium text-white truncate text-left">
                {activeOrg?.name || t('common.selectWorkspace')}
              </span>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-[240px] bg-[#1c1c1c] border-white/10">
          <DropdownMenuLabel className="text-xs text-gray-400 uppercase tracking-wider">
            {t('common.workspaces')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />
          
          <div className="max-h-[300px] overflow-y-auto">
            {orgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitch(org.id)}
                className="flex items-center gap-2 cursor-pointer focus:bg-white/10"
              >
                <div className="flex-1 flex items-center gap-2 overflow-hidden">
                  <div className="w-6 h-6 rounded flex-shrink-0 bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                    {org.logo ? (
                      <img src={org.logo} alt={org.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      getInitials(org.name)
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-white truncate">{org.name}</span>
                    <span className="text-[10px] text-gray-400 capitalize">
                      {org.role === 'OWNER' ? 'OWNER' : t(`common.role${org.role.charAt(0).toUpperCase() + org.role.slice(1).toLowerCase()}`)}
                    </span>
                  </div>
                </div>
                {org.id === currentOrganizationId && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem 
            className="flex items-center gap-2 cursor-pointer focus:bg-white/10 text-gray-300"
            onClick={() => {
              // Future: Open Create Org modal
            }}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="text-sm">{t('common.createWorkspace')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
