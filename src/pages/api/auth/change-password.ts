import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { authAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, isAuthError } from '@/lib/auth/api-auth';
import { json, error } from '@/lib/api/response';
import { hashPassword, verifyPassword } from 'better-auth/crypto';

/**
 * POST /api/auth/change-password
 * Change the current user's password.
 * Verifies current password before updating.
 */
export const POST: APIRoute = async (context) => {
  const auth = await requireAuth(context, { requireHousehold: false });
  if (isAuthError(auth)) return auth;

  const body = await context.request.json().catch(() => ({}));
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return error('Current password and new password are required.', 400);
  }

  if (newPassword.length < 8) {
    return error('New password must be at least 8 characters.', 400);
  }

  if (currentPassword === newPassword) {
    return error('New password must be different from current password.', 400);
  }

  // Get the credential account
  const [account] = await db
    .select()
    .from(authAccounts)
    .where(
      and(
        eq(authAccounts.userId, auth.userId),
        eq(authAccounts.providerId, 'credential')
      )
    )
    .limit(1);

  if (!account || !account.password) {
    return error('No password-based authentication found for this account.', 400);
  }

  // Verify current password using Better Auth's scrypt-based hashing
  const isValid = await verifyPassword({
    hash: account.password,
    password: currentPassword,
  });

  if (!isValid) {
    return error('Current password is incorrect.', 401);
  }

  // Hash and update using the same algorithm
  const hashed = await hashPassword(newPassword);
  await db
    .update(authAccounts)
    .set({ password: hashed, updatedAt: new Date() })
    .where(eq(authAccounts.id, account.id));

  return json({ success: true, message: 'Password changed successfully.' });
};
