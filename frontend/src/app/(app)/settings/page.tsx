'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Settings, User, Building, ShieldAlert, KeyRound, Bell, Mail, Loader2, Save, UserPlus, Sun, Moon, Monitor, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useRef, useEffect } from 'react';
import { ChangePasswordModal } from '@/components/user/ChangePasswordModal';
import { useTheme } from 'next-themes';
import { useUIStore, AppTheme } from '@/stores/uiStore';
import { Check } from 'lucide-react';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { theme: appTheme, setTheme: setAppTheme } = useUIStore();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [activeTab, setActiveTab] = useState('profile');
  const [wsName, setWsName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [prefDaily, setPrefDaily] = useState(user?.dailySummary ?? true);
  const [prefMentions, setPrefMentions] = useState(user?.mentionsNotifications ?? true);
  const [prefAssignments, setPrefAssignments] = useState(user?.assignmentsNotifications ?? true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<Record<string, string>>('/api/settings'),
    enabled: user?.role === 'ADMIN',
  });

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  useEffect(() => {
    if (settings?.workspace_name) setWsName(settings.workspace_name);
  }, [settings]);

  useEffect(() => {
    if (user) {
      setPrefDaily(user.dailySummary);
      setPrefMentions(user.mentionsNotifications);
      setPrefAssignments(user.assignmentsNotifications);
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: (data: { name: string }) => api.put('/api/users/profile/update', data),
    onSuccess: (data: any) => {
      setUser(data);
      toast({ title: 'Profile updated successfully' });
    },
    onError: () => toast({ title: 'Failed to update profile', variant: 'destructive' })
  });

  const updateAvatar = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return api.upload('/api/users/profile/avatar', formData);
    },
    onSuccess: (data: any) => {
      setUser(data);
      toast({ title: 'Avatar updated successfully' });
    },
    onError: () => toast({ title: 'Failed to update avatar', variant: 'destructive' })
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Maximum size is 2MB', variant: 'destructive' });
        return;
      }
      updateAvatar.mutate(file);
    }
  };

  const updatePreferences = useMutation({
    mutationFn: (data: any) => api.put('/api/users/profile/update', data),
    onSuccess: (data: any) => {
      setUser(data);
      toast({ title: 'Email preferences updated' });
    },
    onError: () => toast({ title: 'Failed to update preferences', variant: 'destructive' })
  });

  const updateSettings = useMutation({
    mutationFn: (data: Record<string, string>) => api.put('/api/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'Workspace settings updated' });
    },
    onError: () => toast({ title: 'Failed to update settings', variant: 'destructive' })
  });

  const inviteMember = useMutation({
    mutationFn: (email: string) => api.post('/api/users/invite', { email }),
    onSuccess: () => {
      setInviteEmail('');
      toast({ title: 'Invitation sent successfully' });
    },
    onError: (err: any) => {
      toast({ 
        title: 'Failed to send invitation', 
        description: err.response?.data?.message || 'Check the email and try again.',
        variant: 'destructive' 
      });
    }
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateProfile.mutate({ name: name.trim() });
  };

  return (
    <div className="view-container">
        <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your personal profile and workspace preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col md:flex-row gap-8 w-full outline-none">
          <TabsList className="flex md:flex-col bg-transparent w-full md:w-64 h-auto p-0 gap-1 rounded-none border-b md:border-b-0 md:border-r border-border/50 pb-2 md:pb-0 md:pr-4 shrink-0 overflow-x-auto justify-start">
            <TabsTrigger 
              value="profile" 
              className={cn(
                "w-full justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-none"
              )}
            >
              <User className="w-4 h-4 mr-2" />
              Profile Settings
            </TabsTrigger>
            
            <TabsTrigger 
              value="notifications" 
              className={cn(
                "w-full justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-none"
              )}
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>

            <TabsTrigger 
              value="appearance" 
              className={cn(
                "w-full justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-none"
              )}
            >
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
            
            {user?.role === 'ADMIN' && (
              <TabsTrigger 
                value="workspace" 
                className={cn(
                  "w-full justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-none"
                )}
              >
                <Building className="w-4 h-4 mr-2" />
                Workspace (Admin)
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex-1 min-w-0">
            {/* ─── Profile Settings ─── */}
            <TabsContent value="profile" className="m-0 space-y-6 outline-none">
              <Card className="border-border/50 shadow-none bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                  <CardDescription className="text-muted-foreground">Update your display name and avatar.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 mb-6">
                     <Avatar className="w-20 h-20 shadow-none border border-border/40">
                      <AvatarImage src={user?.avatar || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                        {getInitials(user?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs font-medium border-border"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={updateAvatar.isPending}
                      >
                        {updateAvatar.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : null}
                        Upload new picture
                      </Button>
                      <p className="text-[10px] text-muted-foreground opacity-70">JPG, GIF or PNG. Max size of 2MB.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address <span className="text-xs text-muted-foreground font-normal ml-2">(Cannot be changed)</span></Label>
                      <Input id="email" value={user?.email || ''} readOnly className="bg-muted text-muted-foreground select-none cursor-not-allowed" />
                    </div>

                    <Button type="submit" disabled={updateProfile.isPending || name === user?.name}>
                      {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-none bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" /> Security
                  </CardTitle>
                  <CardDescription>Manage your password and security settings.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Password</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Change your password to keep your account secure.</p>
                    </div>
                    <ChangePasswordModal />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Notifications Settings ─── */}
            <TabsContent value="notifications" className="m-0 space-y-6 outline-none">
              <Card className="border-border/50 shadow-none bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Email Preferences</CardTitle>
                  <CardDescription>Choose what notifications you receive via email.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Daily Summary</Label>
                      <p className="text-xs text-muted-foreground/60">Receive a daily email digest of your pending tasks.</p>
                    </div>
                    <Switch 
                      checked={prefDaily} 
                      onCheckedChange={setPrefDaily} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Mentions & Comments</Label>
                      <p className="text-xs text-muted-foreground/60">Get notified when someone tags you or comments on your tasks.</p>
                    </div>
                    <Switch 
                      checked={prefMentions} 
                      onCheckedChange={setPrefMentions} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Task Assignments</Label>
                      <p className="text-xs text-muted-foreground">Receive an email instantly when a new task is assigned to you.</p>
                    </div>
                    <Switch 
                      checked={prefAssignments} 
                      onCheckedChange={setPrefAssignments} 
                    />
                  </div>
                  
                  <Button 
                    onClick={() => updatePreferences.mutate({
                      dailySummary: prefDaily,
                      mentionsNotifications: prefMentions,
                      assignmentsNotifications: prefAssignments,
                    })}
                    disabled={updatePreferences.isPending}
                    className="gap-2"
                  >
                    {updatePreferences.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* ─── Appearance Settings ─── */}
            <TabsContent value="appearance" className="m-0 space-y-6 outline-none">
              <Card className="border-border/50 shadow-none bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Appearance</CardTitle>
                  <CardDescription>Customize how Joino looks on your device.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'light', label: 'Light', icon: <Sun className="w-5 h-5" /> },
                      { id: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" /> },
                      { id: 'system', label: 'System', icon: <Monitor className="w-5 h-5" /> },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setTheme(item.id)}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                          theme === item.id 
                            ? "border-primary bg-primary/5 text-primary shadow-none" 
                            : "border-border/50 hover:border-border hover:bg-muted/30 text-muted-foreground"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          theme === item.id ? "bg-primary/10" : "bg-muted"
                        )}>
                          {item.icon}
                        </div>
                        <span className="font-semibold text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-none bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Color Template</CardTitle>
                  <CardDescription>Choose the primary brand color for your workspace.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                    {[
                      { id: 'default', color: 'bg-[#00A86B]', label: 'Wrike' },
                      { id: 'blue',    color: 'bg-[#3b82f6]', label: 'Ocean' },
                      { id: 'purple',  color: 'bg-[#8b5cf6]', label: 'Royal' },
                      { id: 'teal',    color: 'bg-[#0d9488]', label: 'Teal' },
                      { id: 'orange',  color: 'bg-[#f97316]', label: 'Sunset' },
                      { id: 'indigo',  color: 'bg-[#6366f1]', label: 'Indigo' },
                      { id: 'rose',    color: 'bg-[#f43f5e]', label: 'Rose' },
                      { id: 'teal-mint', color: 'bg-[#14b8a6]', label: 'Mint' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setAppTheme(t.id as AppTheme)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all",
                          appTheme === t.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-transparent hover:bg-muted/50"
                        )}
                      >
                        <div className={cn("w-full aspect-square rounded-lg shadow-sm flex items-center justify-center", t.color)}>
                          {appTheme === t.id && <Check className="w-5 h-5 text-white" />}
                        </div>
                        <span className="text-[10px] font-medium truncate w-full text-center">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Workspace Settings ─── */}
            {user?.role === 'ADMIN' && (
              <TabsContent value="workspace" className="m-0 space-y-6 outline-none">
                <Card className="border-border/50 shadow-none bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Workspace Configuration</CardTitle>
                    <CardDescription>Configure global settings for your organization.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-w-md">
                     <div className="space-y-2">
                      <Label htmlFor="wsName">Workspace Name</Label>
                      <Input 
                        id="wsName" 
                        value={wsName} 
                        onChange={e => setWsName(e.target.value)}
                        placeholder="e.g. Acme Corp" 
                      />
                    </div>
                    <Button 
                      onClick={() => updateSettings.mutate({ workspace_name: wsName })}
                      disabled={updateSettings.isPending || wsName === settings?.workspace_name}
                      className="gap-2"
                    >
                      {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Configuration
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-none bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="w-5 h-5 text-muted-foreground/60" /> Member Invitations
                    </CardTitle>
                    <CardDescription>Invite new members to join your workspace.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form 
                      onSubmit={(e) => { e.preventDefault(); if (inviteEmail) inviteMember.mutate(inviteEmail); }}
                      className="flex flex-col sm:flex-row items-center gap-3"
                    >
                      <Input 
                        type="email" 
                        placeholder="colleague@company.com" 
                        className="bg-card" 
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        required
                      />
                      <Button 
                        type="submit"
                        className="w-full sm:w-auto flex-shrink-0 gap-2"
                        disabled={inviteMember.isPending || !inviteEmail}
                      >
                        {inviteMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        Send Invite
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

          </div>
        </Tabs>
      </div>
    </div>
  );
}
