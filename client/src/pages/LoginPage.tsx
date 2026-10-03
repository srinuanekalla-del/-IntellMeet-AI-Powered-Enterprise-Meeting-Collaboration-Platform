import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLogin } from '@/lib/authHooks';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      { onSuccess: () => navigate('/dashboard') }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">Welcome back</h1>
        <p className="mb-6 text-sm text-slate-500">Log in to IntellMeet</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {login.isError && (
            <p className="text-sm text-red-600">
              {(login.error as any)?.response?.data?.message || 'Login failed'}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          No account?{' '}
          <Link to="/signup" className="font-medium text-brand-600 hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
};
