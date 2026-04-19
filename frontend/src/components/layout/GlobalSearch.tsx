'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { cn, STATUS_CONFIG } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Folder, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface SearchResult {
  tasks: any[];
  projects: any[];
  total: number;
}

export function GlobalSearch({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const t = useTranslations();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const router = useRouter();
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId);
  
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Load recent searches
    try {
      const saved = localStorage.getItem('pjmbro-recent-searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch(e) {}
  }, []);

  const addRecentSearch = (q: string) => {
    if (!q.trim()) return;
    const newRecents = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(newRecents);
    localStorage.setItem('pjmbro-recent-searches', JSON.stringify(newRecents));
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setSelectedIndex(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setDebouncedQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  const { data, isLoading } = useQuery<SearchResult>({
    queryKey: ['search', debouncedQuery],
    queryFn: () => api.get<SearchResult>(`/api/search?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: debouncedQuery.length > 0,
  });

  // Flatten items for keyboard navigation
  const flatItems = useMemo(() => {
    const items: Array<{ type: 'project' | 'task'; ref: any }> = [];
    if (data?.projects) {
      data.projects.forEach(p => items.push({ type: 'project', ref: p }));
    }
    if (data?.tasks) {
      data.tasks.forEach(t => items.push({ type: 'task', ref: t }));
    }
    return items;
  }, [data]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, flatItems.length);
  }, [flatItems]);

  const goProject = (id: string, q?: string) => {
    if(q) addRecentSearch(q);
    router.push(`/projects/${id}`);
    onOpenChange(false);
  };

  const goTask = (projectId: string, taskId: string, q?: string) => {
    if(q) addRecentSearch(q);
    if (!window.location.pathname.includes(`/projects/${projectId}`)) {
      router.push(`/projects/${projectId}`);
    }
    setTimeout(() => {
      setSelectedTaskId(taskId);
    }, 100);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flatItems.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatItems[selectedIndex];
      if (item) {
        if (item.type === 'project') goProject(item.ref.id, debouncedQuery);
        if (item.type === 'task') goTask(item.ref.project.id, item.ref.id, debouncedQuery);
      }
    }
  };

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 overflow-hidden bg-background shadow-2xl rounded-xl border border-border/50">
        <div className="flex items-center px-4 py-3 border-b border-border/50 bg-muted/20">
          <Search className="w-5 h-5 text-muted-foreground/60 mr-3 shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent border-0 shadow-none outline-none focus-visible:ring-0 text-base px-0 text-foreground"
            autoFocus
          />
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/30 ml-2" />}
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto" ref={listRef}>
          {debouncedQuery.length === 0 ? (
            <div className="py-2">
              {recentSearches.length > 0 ? (
                <div className="mb-2">
                  <div className="px-5 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider flex justify-between">
                    {t('search.recent')}
                    <button 
                      onClick={() => { setRecentSearches([]); localStorage.removeItem('pjmbro-recent-searches'); }}
                      className="text-muted-foreground/60 hover:text-destructive lowercase text-[10px]"
                    >
                      {t('search.clearAll')}
                    </button>
                  </div>
                  {recentSearches.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => setQuery(s)}
                        className={cn(
                          "flex items-center gap-3 px-5 py-2 hover:bg-muted/30 cursor-pointer group transition-colors text-sm text-foreground/80"
                        )}
                    >
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {s}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-8 text-center text-muted-foreground/60 text-sm">
                   <Search className="w-10 h-10 mx-auto text-muted-foreground/20 mb-2 opacity-50" />
                  {t('search.typeToSearch')}
                </div>
              )}
            </div>
          ) : isLoading ? (
            <div className="px-6 py-12 text-center text-muted-foreground/60 text-sm flex flex-col items-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
              {t('search.searching')}
            </div>
          ) : data?.total === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground text-sm">
               {t('search.noResults', { query: debouncedQuery })}
            </div>
          ) : (
            <div className="py-2">
              {/* Projects */}
              {data?.projects && data.projects.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                    {t('search.projects')}
                  </div>
                  {data.projects.map((p) => {
                    const absIdx = flatItems.findIndex(i => i.type === 'project' && i.ref.id === p.id);
                    return (
                      <div
                        key={p.id}
                        ref={(el) => { itemRefs.current[absIdx] = el; }}
                        onClick={() => goProject(p.id, debouncedQuery)}
                         className={cn(
                          "flex items-center gap-3 px-4 py-2 cursor-pointer group transition-colors border-l-2",
                          selectedIndex === absIdx ? "bg-muted/50 border-primary" : "border-transparent hover:bg-muted/30 hover:border-border"
                        )}
                      >
                        <div
                          className="w-8 h-8 rounded shrink-0 flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {p.name}
                          </p>
                           <p className="text-xs text-muted-foreground flex items-center">
                            {p._count.tasks} {t('common.taskCount', { count: p._count.tasks })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Tasks */}
              {data?.tasks && data.tasks.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                    {t('search.tasks')}
                  </div>
                  {data.tasks.map((t) => {
                    const stConf = STATUS_CONFIG[t.status as keyof typeof STATUS_CONFIG];
                    const absIdx = flatItems.findIndex(i => i.type === 'task' && i.ref.id === t.id);
                    return (
                      <div
                        key={t.id}
                        ref={(el) => { itemRefs.current[absIdx] = el; }}
                        onClick={() => goTask(t.project.id, t.id, debouncedQuery)}
                         className={cn(
                          "flex items-start gap-3 px-4 py-2.5 cursor-pointer group transition-colors border-l-2 text-foreground",
                          selectedIndex === absIdx ? "bg-primary/5 border-primary" : "border-transparent hover:bg-muted/30 hover:border-border"
                        )}
                      >
                        <span className={cn('w-2.5 h-2.5 rounded-full mt-1 shrink-0', stConf?.dotColor)} />
                        
                        <div className="flex-1 min-w-0">
                           <p className={cn('text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors', t.status === 'DONE' && 'line-through text-muted-foreground/60')}>
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                             <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded truncate max-w-[120px] flex items-center gap-1 border border-border/50">
                              <Folder className="w-2.5 h-2.5" />
                              {t.project.name}
                            </span>
                            {t.assignee && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Avatar className="w-3.5 h-3.5">
                                  <AvatarImage src={t.assignee.avatar || ''} />
                                   <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">{getInitials(t.assignee.name)}</AvatarFallback>
                                </Avatar>
                                {t.assignee.name.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        
        {debouncedQuery.length > 0 && flatItems.length > 0 && (
           <div className="px-4 py-2 border-t border-border/50 bg-muted/20 text-[10px] text-muted-foreground/60 flex items-center justify-between">
            <div>
              <span className="font-semibold text-muted-foreground/80">↑↓</span> {t('search.navigate')}
            </div>
            <div>
              <span className="font-semibold text-muted-foreground/80">Enter</span> {t('search.select')}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
