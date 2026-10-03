import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSignup } from '@/lib/authHooks';

export const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signup = useSignup();
  const navigate = useNavigate();

    const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    signup.mutate(
      { name, email, password },
      { onSuccess: () => navigate('/dashboard') }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">Create your account</h1>
        <p className="mb-6 text-sm text-slate-500">Get started with IntellMeet</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          {signup.isError && (
            <p className="text-sm text-red-600">
              {(signup.error as any)?.response?.data?.message || (signup.error as any)?.message || 'Signup failed'}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={signup.isPending}>
            {signup.isPending ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
};
