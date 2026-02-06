import { useState } from 'react';
import { signIn } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || 'Invalid email or password');
      } else {
        // Redirect to dashboard on success
        window.location.href = '/';
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-text-primary">Welcome back</h2>
        <p className="mt-1 text-sm text-text-muted">Sign in to your account</p>
      </div>

      {error && (
        <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="mt-1"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a
              href="/auth/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="mt-1"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-text-muted">
        Don't have an account?{' '}
        <a href="/auth/signup" className="text-primary-600 hover:text-primary-700">
          Sign up
        </a>
      </p>
    </form>
  );
}
