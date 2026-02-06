import { useState } from 'react';
import { signUp, signIn, signOut } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to create account');
        return;
      }

      // Create household for the new user
      const householdResponse = await fetch('/api/auth/setup-household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdName: householdName || `${name}'s Household` }),
      });

      if (!householdResponse.ok) {
        console.error('Failed to create household:', await householdResponse.text());
        // Continue anyway - user can set up household later
      }

      // Sign out and sign back in to refresh the session with the new householdId
      await signOut();
      await signIn.email({ email, password });

      // Redirect to dashboard on success
      window.location.href = '/';
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-text-primary">Create account</h2>
        <p className="mt-1 text-sm text-text-muted">Start tracking your finances</p>
      </div>

      {error && (
        <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            autoComplete="name"
            className="mt-1"
          />
        </div>

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
          <Label htmlFor="householdName">Household name</Label>
          <Input
            id="householdName"
            type="text"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            placeholder="My Household"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-text-muted">
            Optional - create a household to share with family
          </p>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            className="mt-1"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-text-muted">
        Already have an account?{' '}
        <a href="/auth/login" className="text-primary-600 hover:text-primary-700">
          Sign in
        </a>
      </p>
    </form>
  );
}
