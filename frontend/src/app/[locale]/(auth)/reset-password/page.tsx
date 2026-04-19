'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Zap, Loader2, CheckCircle2, Lock } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/api/auth/reset-password', data),
    onSuccess: () => {
      // Success state handled in component
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to reset password. The link may be invalid or expired.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    mutation.mutate({ token, password });
  };

  if (!token) {
    return (
      <div className="text-center p-6 space-y-4">
        <p className="text-red-500 font-medium">Missing or invalid reset token.</p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/forgot-password">Request new link</Link>
        </Button>
      </div>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="text-center p-6 space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">Password reset!</h2>
        <p className="text-gray-500">Your password has been successfully updated. You can now login with your new password.</p>
        <Button asChild className="w-full mt-4 bg-primary hover:bg-primary-600 border-none shadow-md">
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="pl-10 bg-white border-gray-300 focus:border-primary focus:ring-primary"
            disabled={mutation.isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="pl-10 bg-white border-gray-300 focus:border-primary focus:ring-primary"
            disabled={mutation.isPending}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>
      )}

      <Button type="submit" className="w-full bg-primary hover:bg-primary-600 shadow-md h-11" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Update Password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="w-7 h-7 text-white" />
          </div>
        </div>

        <Card className="border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-center">Set new password</CardTitle>
            <CardDescription className="text-gray-500 text-center">
              Please enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
