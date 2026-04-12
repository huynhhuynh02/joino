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
import { Loader2, LogIn, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginResponse {
  user: { id: string; email: string; name: string; role: string; avatar: string | null };
  token: string;
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { toast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });

  const loginMutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post<LoginResponse>('/api/auth/login', data),
    onSuccess: ({ user, token }) => {
      // Set cookie for middleware
      document.cookie = `joino_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      setAuth(user, token);
      router.push('/dashboard');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.response?.data?.message || 'Invalid email or password',
      });
    },
  });

  const handleGoogleLogin = () => {
    // Use Google's GSI (Google Sign-In) in production
    // For now, show info about setting up Google Client ID
    toast({
      title: 'Google OAuth',
      description: 'Please set your GOOGLE_CLIENT_ID in .env to enable Google login',
    });
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <span className="text-2xl font-bold text-primary-foreground">J</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Joino</span>
          </div>
          <p className="text-muted-foreground/60 text-sm">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-2xl border border-border/50 p-8">
          <h1 className="text-xl font-semibold text-foreground mb-6">Welcome back</h1>

          {/* Google OAuth Button */}
          <Button
            variant="outline"
            className="w-full mb-4 h-11 gap-2 font-medium"
            onClick={handleGoogleLogin}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground/60">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate(form);
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="mt-1.5 bg-background border-border text-foreground focus-visible:ring-primary h-11"
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" size="sm" className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="mt-1.5 bg-background border-border text-foreground focus-visible:ring-primary h-11"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold transition-all active:scale-[0.98]"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              Sign in
            </Button>
          </form>

          {/* Dev login hint */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-100">
              <p className="text-xs text-primary-700 font-medium mb-1">Dev credentials:</p>
              <p className="text-xs text-primary-600">admin@joino.local / password123</p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground/60 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-bold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
