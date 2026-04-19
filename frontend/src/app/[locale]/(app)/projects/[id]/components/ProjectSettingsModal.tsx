'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Tag, Plus, Trash2, Box, AlertTriangle, ListFilter, Users, UserPlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface ProjectSettingsModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
  '#f43f5e', '#64748b', '#78716c', '#000000'
];

export function ProjectSettingsModal({ projectId, open, onOpenChange }: ProjectSettingsModalProps) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const router = useRouter();
  
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);

  // Confirmation dialog states
  const [deleteProjectConfirmOpen, setDeleteProjectConfirmOpen] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState<{id: string, name: string} | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<{id: string, name: string} | null>(null);

  // New Custom Field State
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<string>('TEXT');
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState('');

  // Member Search State
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [memberRole, setMemberRole] = useState('MEMBER');

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get<any>(`/api/projects/${projectId}`),
    enabled: open,
  });

  const [projectName, setProjectName] = useState('');
  const [projectColor, setProjectColor] = useState('');

  // Sync state when project loads
  if (project && !projectName && !projectColor) {
    setProjectName(project.name);
    setProjectColor(project.color);
  }

  const { data: labels, isLoading: loadingLabels } = useQuery({
    queryKey: ['project-labels', projectId],
    queryFn: () => api.get<any[]>(`/api/labels/project/${projectId}`),
    enabled: open,
  });

  const { data: customFields, isLoading: loadingFields } = useQuery({
    queryKey: ['project-custom-fields', projectId],
    queryFn: () => api.get<any[]>(`/api/custom-fields/project/${projectId}`),
    enabled: open,
  });

  const { data: projectMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => api.get<any[]>(`/api/projects/${projectId}/members`),
    enabled: open,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['user-search', memberSearch],
    queryFn: () => api.get<any[]>(`/api/users/search?q=${memberSearch}`),
    enabled: memberSearch.length > 1,
  });

  const createLabel = useMutation({
    mutationFn: (data: { name: string; color: string }) => 
      api.post(`/api/labels/project/${projectId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-labels', projectId] });
      setNewLabelName('');
      toast({ title: t('projects.labelCreated') });
    },
    onError: () => toast({ title: t('common.updatedError'), variant: 'destructive' })
  });

  const deleteLabel = useMutation({
    mutationFn: (labelId: string) => api.delete(`/api/labels/${labelId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-labels', projectId] });
      toast({ title: t('projects.labelDeleted') });
    },
  });

  const createField = useMutation({
    mutationFn: (data: any) => api.post(`/api/custom-fields/project/${projectId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-custom-fields', projectId] });
      setNewFieldName('');
      setNewFieldType('TEXT');
      setNewFieldOptions([]);
      toast({ title: t('projects.fieldCreated') });
    },
    onError: () => toast({ title: t('common.updatedError'), variant: 'destructive' })
  });

  const deleteField = useMutation({
    mutationFn: (fieldId: string) => api.delete(`/api/custom-fields/${fieldId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-custom-fields', projectId] });
      toast({ title: t('projects.fieldDeleted') });
    },
  });

  const addMember = useMutation({
    mutationFn: (data: { userId: string; role: string }) => api.post(`/api/projects/${projectId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      setSelectedUser(null);
      setMemberSearch('');
      toast({ title: t('projects.memberAdded') });
    },
    onError: () => toast({ title: t('common.updatedError'), variant: 'destructive' })
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => api.delete(`/api/projects/${projectId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast({ title: t('projects.memberRemoved') });
    },
  });

  const handleCreateLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    createLabel.mutate({ name: newLabelName.trim(), color: newLabelColor });
  };

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;
    createField.mutate({
      name: newFieldName.trim(),
      type: newFieldType,
      options: newFieldType === 'DROPDOWN' ? newFieldOptions : undefined
    });
  };

  const addOption = () => {
    if (!optionInput.trim() || newFieldOptions.includes(optionInput.trim())) return;
    setNewFieldOptions([...newFieldOptions, optionInput.trim()]);
    setOptionInput('');
  };

  const removeOption = (idx: number) => {
    setNewFieldOptions(newFieldOptions.filter((_, i) => i !== idx));
  };

  const updateProject = useMutation({
    mutationFn: (data: { name?: string; color?: string }) => api.put(`/api/projects/${projectId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: t('projects.projectUpdated') });
    },
  });

  const deleteProject = useMutation({
    mutationFn: () => api.delete(`/api/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: t('projects.projectDeleted') });
      onOpenChange(false);
      router.push('/dashboard');
    },
  });

  const handleUpdateGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    updateProject.mutate({ name: projectName.trim(), color: projectColor });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[650px] flex flex-col p-0 bg-background border-border shadow-2xl overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-muted/20 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings className="w-5 h-5 text-muted-foreground" />
            {t('projects.projectSettings')}
          </DialogTitle>
          <DialogDescription className="sr-only">{t('projects.projectSettings')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-muted/30 px-6 h-auto p-0 shrink-0">
            <TabsTrigger 
              value="general" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none py-3 px-4 transition-all text-muted-foreground"
            >
              <Box className="w-4 h-4 mr-2" />
              {t('projects.general')}
            </TabsTrigger>
            <TabsTrigger 
              value="labels" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-4"
            >
              <Tag className="w-4 h-4 mr-2" />
              {t('projects.labels')}
            </TabsTrigger>
            <TabsTrigger 
              value="custom_fields" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-4"
            >
              <ListFilter className="w-4 h-4 mr-2" />
              {t('projects.customFields')}
            </TabsTrigger>
            <TabsTrigger 
              value="members" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-4"
            >
              <Users className="w-4 h-4 mr-2" />
              {t('common.team')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="flex-1 overflow-y-auto p-6 pb-20 m-0 outline-none data-[state=active]:block">
            {loadingProject ? (
              <div className="text-center py-4 text-xs text-muted-foreground">{t('projects.loading')}</div>
            ) : (
              <>
                <form onSubmit={handleUpdateGeneral} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground/80">{t('projects.projectName')}</Label>
                    <Input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="h-9 bg-background border-border text-foreground focus-visible:ring-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground/80">{t('projects.projectColor')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setProjectColor(c)}
                          className={cn(
                            "w-8 h-8 rounded-md hover:scale-110 transition-transform",
                            projectColor === c ? "ring-2 ring-offset-2 ring-offset-background ring-primary border-2 border-background" : "opacity-80 hover:opacity-100"
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <Button type="submit" disabled={!projectName.trim() || updateProject.isPending} className="w-full">
                    {updateProject.isPending ? t('common.saving') : t('common.saveChanges')}
                  </Button>
                </form>

                <div className="pt-6 border-t border-border space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> {t('projects.dangerZone')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('projects.deleteProjectDesc')}
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="w-full bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20"
                    onClick={() => {
                      setDeleteProjectConfirmOpen(true);
                    }}
                  >
                    {t('projects.deleteProject')}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="labels" className="flex-1 overflow-y-auto p-6 pb-20 m-0 outline-none data-[state=active]:block space-y-8">
            <div className="p-6 border-b border-border/50 bg-muted/20 shrink-0">
              <form onSubmit={handleCreateLabel} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground/80">{t('projects.createNewLabel')}</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="(e.g., Bug, Feature)"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="h-8 text-sm bg-background border-border text-foreground"
                      maxLength={30}
                    />
                    <Button type="submit" disabled={!newLabelName.trim() || createLabel.isPending} size="sm" className="h-8">
                      <Plus className="w-4 h-4 mr-1" /> {t('common.add')}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t('projects.projectColor')}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewLabelColor(c)}
                        className={cn(
                          "w-6 h-6 rounded-md hover:scale-110 transition-transform",
                          newLabelColor === c ? "ring-2 ring-offset-1 ring-offset-background ring-primary" : ""
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t('projects.existingLabels')}</h4>
              
              {loadingLabels ? (
                <div className="text-center py-4 text-xs text-muted-foreground">{t('projects.loading')}</div>
              ) : labels?.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border/50 rounded-lg bg-muted/5">
                  {t('projects.noLabels')}
                </div>
              ) : (
                <div className="space-y-2">
                  {labels?.map(l => (
                    <div key={l.id} className="flex items-center justify-between group p-2 hover:bg-muted rounded-md border border-transparent hover:border-border transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: l.color }} />
                        <span className="text-sm font-medium text-foreground/80">{l.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setLabelToDelete({ id: l.id, name: l.name });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="custom_fields" className="flex-1 overflow-y-auto p-6 pb-20 m-0 outline-none data-[state=active]:block space-y-8">
            <div className="p-6 border-b border-border/50 bg-muted/20 shrink-0">
              <form onSubmit={handleCreateField} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground/80">{t('projects.fieldName')}</Label>
                    <Input
                      placeholder="e.g., Progress %"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="h-8 text-sm bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground/80">{t('projects.type')}</Label>
                    <Select value={newFieldType} onValueChange={setNewFieldType}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['TEXT', 'NUMBER', 'DATE', 'DROPDOWN', 'CHECKBOX', 'URL'].map(type => (
                          <SelectItem key={type} value={type}>{t(`projects.fieldTypes.${type}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newFieldType === 'DROPDOWN' && (
                  <div className="space-y-2 bg-card p-3 rounded-lg border border-border">
                    <Label className="text-xs text-muted-foreground">{t('projects.dropdownOptions')}</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('projects.optionName')}
                        value={optionInput}
                        onChange={(e) => setOptionInput(e.target.value)}
                        className="h-7 text-[10px]"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                      />
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={addOption} type="button">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newFieldOptions.map((opt, i) => (
                        <span key={i} className="bg-muted text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 border border-border/50">
                          {opt}
                          <button type="button" onClick={() => removeOption(i)} className="hover:text-destructive"><Plus className="w-2 h-2 rotate-45" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={!newFieldName.trim() || createField.isPending} className="w-full h-8" size="sm">
                  {createField.isPending ? t('common.saving') : t('common.add')}
                </Button>
              </form>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t('projects.existingFields')}</h4>
              
              {loadingFields ? (
                <div className="text-center py-4 text-xs text-muted-foreground">{t('projects.loading')}</div>
              ) : customFields?.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                  {t('projects.noFields')}
                </div>
              ) : (
                <div className="space-y-2">
                  {customFields?.map(f => (
                    <div key={f.id} className="flex items-center justify-between group p-2 hover:bg-muted rounded-md border border-border/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-[10px] font-bold bg-muted text-muted-foreground px-1 rounded uppercase tracking-tighter">
                          {f.type.substring(0, 3)}
                        </div>
                        <span className="text-sm font-medium text-foreground/80">{f.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setFieldToDelete({ id: f.id, name: f.name });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="members" className="flex-1 overflow-y-auto p-6 pb-20 m-0 outline-none data-[state=active]:block space-y-8">
            <div className="p-6 border-b border-border/50 bg-muted/20 shrink-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground/80">{t('projects.addMemberToProject')}</Label>
                  <div className="relative">
                    {!selectedUser ? (
                      <>
                        <Input
                          placeholder={t('projects.searchWorkspaceMembers')}
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          className="h-9 text-sm pr-10"
                        />
                        {searchResults && searchResults.length > 0 && memberSearch.length > 1 && (
                          <div className="absolute top-10 w-full bg-card border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                            {searchResults.map(u => (
                              <button
                                key={u.id}
                                className="w-full flex items-center gap-2 p-2 hover:bg-muted transition-colors text-left border-b border-border last:border-0"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setMemberSearch('');
                                }}
                              >
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={u.avatar} />
                                  <AvatarFallback className="text-[10px]">{getInitials(u.name)}</AvatarFallback>
                                </Avatar>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-medium truncate text-foreground/80">{u.name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-primary/5 border border-primary/20 rounded-md">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={selectedUser.avatar} />
                            <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-bold text-foreground">{selectedUser.name}</p>
                            <p className="text-[10px] text-muted-foreground">{selectedUser.email}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-primary/10 rounded">
                          <X className="w-4 h-4 text-primary" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {selectedUser && (
                  <div className="flex gap-2">
                    <Select value={memberRole} onValueChange={setMemberRole}>
                      <SelectTrigger className="h-9 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANAGER">{t('common.roleManager')}</SelectItem>
                        <SelectItem value="MEMBER">{t('common.roleMember')}</SelectItem>
                        <SelectItem value="VIEWER">{t('projects.roleViewer')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      className="h-9" 
                      onClick={() => addMember.mutate({ userId: selectedUser.id, role: memberRole })}
                      disabled={addMember.isPending}
                    >
                      <UserPlus className="w-4 h-4 mr-1" /> {t('common.add')}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t('projects.projectMembers')}</h4>
              {loadingMembers ? (
                <div className="text-center py-4 text-xs text-muted-foreground">{t('projects.loading')}</div>
              ) : (
                <div className="space-y-2">
                  {projectMembers?.map(m => (
                    <div key={m.id} className="flex items-center justify-between group p-2 hover:bg-muted rounded-md border border-transparent hover:border-border transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={m.avatar} />
                          <AvatarFallback className="text-xs">{getInitials(m.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground leading-none">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">
                            {m.memberRole === 'OWNER' ? t('projects.roleOwner') : t(`common.role${m.memberRole.charAt(0).toUpperCase() + m.memberRole.slice(1).toLowerCase()}`)}
                          </p>
                        </div>
                      </div>
                      {m.memberRole !== 'OWNER' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeMember.mutate(m.id)}
                          disabled={removeMember.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    {/* Confirmation Dialogs */}
    <ConfirmDialog
      open={deleteProjectConfirmOpen}
      onOpenChange={setDeleteProjectConfirmOpen}
      title={t('projects.confirmDeleteProjectTitle')}
      description={t('projects.confirmDeleteProjectDesc')}
      confirmText={t('projects.deleteProject')}
      variant="destructive"
      isLoading={deleteProject.isPending}
      onConfirm={() => {
        deleteProject.mutate(undefined, {
          onSuccess: () => setDeleteProjectConfirmOpen(false)
        });
      }}
    />

    <ConfirmDialog
      open={!!labelToDelete}
      onOpenChange={(open) => { if (!open) setLabelToDelete(null); }}
      title={t('projects.confirmDeleteLabelTitle')}
      description={t('projects.confirmDeleteLabelDesc', { name: labelToDelete?.name })}
      confirmText={t('common.delete')}
      variant="destructive"
      isLoading={deleteLabel.isPending}
      onConfirm={() => {
        if (labelToDelete) {
          deleteLabel.mutate(labelToDelete.id, {
            onSuccess: () => setLabelToDelete(null)
          });
        }
      }}
    />

    <ConfirmDialog
      open={!!fieldToDelete}
      onOpenChange={(open) => { if (!open) setFieldToDelete(null); }}
      title={t('projects.confirmDeleteFieldTitle')}
      description={t('projects.confirmDeleteFieldDesc', { name: fieldToDelete?.name })}
      confirmText={t('common.delete')}
      variant="destructive"
      isLoading={deleteField.isPending}
      onConfirm={() => {
        if (fieldToDelete) {
          deleteField.mutate(fieldToDelete.id, {
            onSuccess: () => setFieldToDelete(null)
          });
        }
      }}
    />
    </>
  );
}
