import { useState, useEffect } from 'react';
import { signUp, signIn, signOut } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SignupFormProps {
  inviteCode?: string;
}

interface RegistrationStatus {
  enabled: boolean;
  mode: string;
  setupCompleted: boolean;
}

export function SignupForm({ inviteCode: initialInviteCode }: SignupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState(initialInviteCode || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check registration status on mount
  useEffect(() => {
    fetch('/api/auth/registration-status')
      .then((r) => r.json())
      .then((status: RegistrationStatus) => {
        setRegistrationStatus(status);
        setCheckingStatus(false);
      })
      .catch(() => setCheckingStatus(false));
  }, []);

  const hasInviteCode = inviteCode.trim().length > 0;

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

      // Create or join household
      const householdPayload: Record<string, string> = {};
      if (hasInviteCode) {
        householdPayload.inviteCode = inviteCode.trim();
      } else {
        householdPayload.householdName = householdName || `${name}'s Household`;
      }

      const householdResponse = await fetch('/api/auth/setup-household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(householdPayload),
      });

      if (!householdResponse.ok) {
        const data = await householdResponse.json().catch(() => ({}));
        console.error('Failed to setup household:', data);
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

  if (checkingStatus) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    );
  }

  // Registration disabled and no invite code
  if (
    registrationStatus?.setupCompleted &&
    !registrationStatus?.enabled &&
    !hasInviteCode
  ) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary">Registration Closed</h2>
          <p className="mt-2 text-sm text-text-muted">
            New registrations are currently disabled. If you have an invite code, enter it below.
          </p>
        </div>

        <div>
          <Label htmlFor="invite-code-gate">Invite Code</Label>
          <Input
            id="invite-code-gate"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="ABCD1234"
            className="mt-1 font-mono text-center tracking-[0.2em] uppercase"
            maxLength={8}
          />
        </div>

        {inviteCode.trim().length >= 8 && (
          <p className="text-xs text-success text-center">
            Invite code detected. You can now create an account.
          </p>
        )}

        <p className="text-center text-sm text-text-muted">
          Already have an account?{' '}
          <a href="/auth/login" className="text-primary-600 hover:text-primary-700">
            Sign in
          </a>
        </p>
      </div>
    );
  }

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

        {hasInviteCode ? (
          <div>
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="mt-1 font-mono tracking-[0.2em] uppercase"
              maxLength={8}
            />
            <p className="mt-1 text-xs text-text-muted">
              You'll join an existing household.{' '}
              <button
                type="button"
                className="text-primary-600 hover:underline"
                onClick={() => setInviteCode('')}
              >
                Create new household instead
              </button>
            </p>
          </div>
        ) : (
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
              Optional - create a household to share with family.{' '}
              <button
                type="button"
                className="text-primary-600 hover:underline"
                onClick={() => setInviteCode(' ')}
              >
                Have an invite code?
              </button>
            </p>
          </div>
        )}

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
          <p className="text-xs text-text-muted mt-1">Must be at least 8 characters</p>
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
