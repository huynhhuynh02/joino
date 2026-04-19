'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

interface AuthResponse {
  user: { id: string; email: string; name: string; role: string; avatar: string | null };
  token: string;
}

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  const registerMutation = useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      api.post<AuthResponse>('/api/auth/register', { name, email, password }),
    onSuccess: ({ user, token }) => {
      document.cookie = `joino_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      setAuth(user, token);
      toast({ 
        title: t('auth.accountCreated'), 
        description: t('auth.welcomeToJoino', { name: user.name }) 
      });
      router.push('/dashboard');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast({
        variant: 'destructive',
        title: t('auth.registrationFailed'),
        description: error.response?.data?.message || t('common.updatedError'),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ variant: 'destructive', title: t('auth.passwordsDoNotMatch') });
      return;
    }
    registerMutation.mutate({ name: form.name, email: form.email, password: form.password });
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">Joino</span>
          </div>
          <p className="text-muted-foreground/60 text-sm">{t('auth.createAccount')}</p>
        </div>

        <div className="bg-card rounded-2xl shadow-2xl border border-border/50 p-8">
          <h1 className="text-xl font-semibold text-foreground mb-6">{t('auth.getStartedForFree')}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">{t('auth.fullName')}</Label>
              <Input
                id="name"
                placeholder="Alice Nguyen"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="mt-1.5 bg-background border-border text-foreground focus-visible:ring-primary h-11"
              />
            </div>
            <div>
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="alice@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="mt-1.5 bg-background border-border text-foreground focus-visible:ring-primary h-11"
              />
            </div>
            <div>
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
                className="mt-1.5 bg-background border-border text-foreground focus-visible:ring-primary h-11"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className="mt-1.5 bg-background border-border text-foreground focus-visible:ring-primary h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold transition-all active:scale-[0.98]"
              disabled={!mounted || registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {t('auth.createAccount')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground/60 mt-6">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
