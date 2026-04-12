'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Zap, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const acceptMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/users/accept-invite', data),
    onSuccess: () => {
      // Show success state
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to accept invitation. The link may have expired.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('No invitation token found in URL.');
      return;
    }
    setError(null);
    acceptMutation.mutate({ token, name, password });
  };

  if (!token) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500 font-medium">Invalid or missing invitation link.</p>
        <Button asChild className="mt-4"><Link href="/login">Go to Login</Link></Button>
      </div>
    );
  }

  if (acceptMutation.isSuccess) {
    return (
      <div className="text-center p-6 space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">Account Ready!</h2>
        <p className="text-gray-500">Your account has been setup successfully. You can now login to the workspace.</p>
        <Button asChild className="w-full mt-4 bg-primary hover:bg-primary-600"><Link href="/login">Go to Login</Link></Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="Jane Doe" 
          required 
          disabled={acceptMutation.isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Create Password</Label>
        <Input 
          id="password" 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          placeholder="Enter a strong password" 
          required 
          minLength={6}
          disabled={acceptMutation.isPending}
        />
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}

      <Button type="submit" className="w-full bg-primary hover:bg-primary-600" disabled={acceptMutation.isPending}>
        {acceptMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Join Workspace
      </Button>
    </form>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="w-7 h-7 text-white" />
          </div>
        </div>
        
        <Card className="border-gray-200 shadow-xl shadow-gray-200/50">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Accept Invitation</CardTitle>
            <CardDescription className="text-gray-500">
              Welcome! Please set up your profile to join the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
              <AcceptInviteForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
