import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema/audit-log';

/**
 * Log a household activity event. Fire-and-forget — never throws.
 */
export async function logActivity(
  householdId: string,
  userId: string,
  action: string,
  opts?: {
    targetType?: string;
    targetId?: string;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      householdId,
      userId,
      action,
      targetType: opts?.targetType ?? null,
      targetId: opts?.targetId ?? null,
      details: opts?.details ? JSON.stringify(opts.details) : null,
    });
  } catch (err) {
    console.error('[audit] Failed to log activity:', err);
  }
}
