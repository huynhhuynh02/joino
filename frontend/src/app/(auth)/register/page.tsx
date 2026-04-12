'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthResponse {
  user: { id: string; email: string; name: string; role: string; avatar: string | null };
  token: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const registerMutation = useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      api.post<AuthResponse>('/api/auth/register', { name, email, password }),
    onSuccess: ({ user, token }) => {
      document.cookie = `joino_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      setAuth(user, token);
      toast({ title: 'Account created!', description: `Welcome to Joino, ${user.name}!` });
      router.push('/dashboard');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.response?.data?.message || 'Failed to create account',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
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
          <p className="text-muted-foreground/60 text-sm">Create your account</p>
        </div>

        <div className="bg-card rounded-2xl shadow-2xl border border-border/50 p-8">
          <h1 className="text-xl font-semibold text-foreground mb-6">Get started for free</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Alice Nguyen"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="mt-1.5 bg-background border-border text-foreground focus-visible:ring-primary"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="alice@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="mt-1.5 bg-background border-border text-foreground focus-visible:ring-primary"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
                className="mt-1.5 bg-background border-border text-foreground focus-visible:ring-primary"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className="mt-1.5 bg-background border-border text-foreground focus-visible:ring-primary"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold transition-all active:scale-[0.98]"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground/60 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
