import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { dashboardLayouts } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { json, unauthorized, error, created } from '@/lib/api/response';

export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId || !session?.user?.id) {
    return unauthorized('Please log in and join a household');
  }

  const [layout] = await db
    .select()
    .from(dashboardLayouts)
    .where(
      and(
        eq(dashboardLayouts.userId, session.user.id),
        eq(dashboardLayouts.householdId, session.user.householdId)
      )
    )
    .limit(1);

  if (!layout) {
    return json({ layouts: null });
  }

  try {
    const parsed = JSON.parse(layout.layout);
    if (!parsed || Array.isArray(parsed)) {
      return json({ layouts: null, version: 1 });
    }
    if (parsed.layouts) {
      return json({
        layouts: parsed.layouts ?? null,
        version: typeof parsed.version === 'number' ? parsed.version : 1,
      });
    }
    return json({ layouts: parsed, version: 1 });
  } catch {
    return json({ layouts: null, version: 1 });
  }
};

export const PUT: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId || !session?.user?.id) {
    return unauthorized('Please log in and join a household');
  }

  const body = await context.request.json();
  const layouts = body?.layouts;
  const version = typeof body?.version === 'number' ? body.version : 1;
  if (!layouts || typeof layouts !== 'object') {
    return error('Invalid layout payload', 400);
  }

  const payload = {
    householdId: session.user.householdId,
    userId: session.user.id,
    layout: JSON.stringify({ version, layouts }),
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select()
    .from(dashboardLayouts)
    .where(
      and(
        eq(dashboardLayouts.userId, session.user.id),
        eq(dashboardLayouts.householdId, session.user.householdId)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(dashboardLayouts)
      .set(payload)
      .where(eq(dashboardLayouts.id, existing.id));
    return json({ ok: true });
  }

  await db.insert(dashboardLayouts).values(payload);
  return created({ ok: true });
};
