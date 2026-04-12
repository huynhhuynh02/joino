'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Zap, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (email: string) => api.post('/api/auth/forgot-password', { email }),
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    mutation.mutate(email);
  };

  if (mutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-gray-200 shadow-xl text-center p-8 space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="text-gray-500">
            If an account exists for <strong>{email}</strong>, we've sent instructions to reset your password.
          </p>
          <Button asChild variant="outline" className="w-full mt-4">
            <Link href="/login">Return to Login</Link>
          </Button>
        </Card>
      </div>
    );
  }

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
            <CardTitle className="text-2xl font-bold tracking-tight">Forgot password?</CardTitle>
            <CardDescription className="text-gray-500">
              No worries, we'll send you reset instructions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={mutation.isPending}
                  className="bg-white border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>
              )}

              <Button type="submit" className="w-full bg-primary hover:bg-primary-600 shadow-md" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Send Reset Link
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-100 bg-gray-50/50 rounded-b-xl py-4">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-primary flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
