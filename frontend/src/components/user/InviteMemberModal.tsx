'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberModal({ open, onOpenChange }: InviteMemberModalProps) {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; name: string; role: string }) => 
      api.post('/api/users/invite', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: t('common.invitationSent') });
      onOpenChange(false);
      setEmail('');
      setRole('MEMBER');
    },
    onError: (error: any) => {
      toast({ 
        title: t('common.failedInvite'), 
        description: error.response?.data?.message || t('common.somethingWrong'),
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMutation.mutate({ name: email.split('@')[0], email, role });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background border-border shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('common.inviteMember')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 mt-2">
            <div className="grid gap-2">
              <Label htmlFor="email">{t('settings.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                className="bg-background border-border text-foreground focus-visible:ring-primary"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">{t('common.role')}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-background border-border text-foreground hover:border-border/80 transition-colors">
                  <SelectValue placeholder={t('common.selectRole')} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="MEMBER">{t('common.roleMemberStandard')}</SelectItem>
                  <SelectItem value="MANAGER">{t('common.roleManagerStandard')}</SelectItem>
                  <SelectItem value="ADMIN">{t('common.roleAdminStandard')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={inviteMutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.sendInvitation')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
