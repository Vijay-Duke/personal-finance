# Phase 8: Polish & PWA Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the personal finance app into a production-ready PWA with mobile responsiveness, offline support, notifications, data export, and comprehensive polish.

**Architecture:** Use Tailwind CSS responsive utilities for mobile adaptation. Implement PWA with VitePWA plugin for manifest and service worker generation. Use Workbox for offline caching strategies. Build notification system with database-backed persistence. Create reusable responsive components (tables, modals, forms).

**Tech Stack:** Astro, React, Tailwind CSS, VitePWA, Workbox, Drizzle ORM, SQLite, shadcn/ui

---

## Prerequisites

- Phases 1-3 complete (foundation, core assets, extended assets)
- Phase 6 complete (AI integration)
- Node.js with npm

---

## Task 1: Mobile Responsive Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/layouts/AppLayout.astro`

**Step 1: Add mobile state and hamburger button to Sidebar**

Modify `src/components/layout/Sidebar.tsx`:
- Add `isMobileMenuOpen` state
- Add hamburger menu button visible only on mobile (<768px)
- Add close button inside sidebar for mobile
- Use `fixed inset-0 z-50` positioning on mobile when open
- Add overlay backdrop on mobile

```typescript
// Add to imports
import { Menu, X } from 'lucide-react';

// Add state
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

// Add hamburger button (visible only on mobile)
<button
  className="md:hidden fixed top-4 left-4 z-50 p-2 bg-background rounded-lg shadow-lg"
  onClick={() => setIsMobileMenuOpen(true)}
>
  <Menu className="w-6 h-6" />
</button>

// Modify sidebar container for mobile responsiveness
<div className={`
  fixed md:static inset-y-0 left-0 z-40 w-60 bg-sidebar transform transition-transform duration-300
  ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
`}>
  {/* Close button for mobile */}
  <button
    className="md:hidden absolute top-4 right-4 p-2"
    onClick={() => setIsMobileMenuOpen(false)}
  >
    <X className="w-5 h-5" />
  </button>

  {/* Existing sidebar content */}
</div>

// Add overlay for mobile
{isMobileMenuOpen && (
  <div
    className="md:hidden fixed inset-0 bg-black/50 z-30"
    onClick={() => setIsMobileMenuOpen(false)}
  />
)}
```

**Step 2: Update AppLayout to handle mobile padding**

Modify `src/layouts/AppLayout.astro`:
- Add padding-top on mobile to account for hamburger button
- Ensure main content area adjusts properly

```astro
<main class="flex-1 overflow-auto pt-16 md:pt-0">
  <div class="p-4 md:p-8">
    <slot />
  </div>
</main>
```

**Step 3: Test responsive behavior**

- Resize browser to <768px width
- Verify hamburger button appears
- Click to open sidebar
- Click overlay or close button to close
- Verify sidebar is always visible on desktop

**Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/layouts/AppLayout.astro
git commit -m "feat(ui): make sidebar mobile responsive with hamburger menu"
```

---

## Task 2: Mobile Responsive Tables

**Files:**
- Create: `src/components/ui/ResponsiveTable.tsx`
- Modify existing table components to use it

**Step 1: Create ResponsiveTable component**

Create `src/components/ui/ResponsiveTable.tsx`:

```typescript
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  hiddenOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  title?: string;
  emptyMessage?: string;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  title,
  emptyMessage = 'No data available',
}: ResponsiveTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={keyExtractor(row)}>
                {columns.map((col) => (
                  <TableCell key={col.key}>{col.cell(row)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((row) => {
          const id = keyExtractor(row);
          const isExpanded = expandedRows.has(id);
          const visibleColumns = columns.filter((c) => !c.hiddenOnMobile);
          const hiddenColumns = columns.filter((c) => c.hiddenOnMobile);

          return (
            <Card key={id} className="cursor-pointer" onClick={() => toggleRow(id)}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {visibleColumns.map((col) => (
                    <div key={col.key} className="flex justify-between">
                      <span className="text-muted-foreground text-sm">{col.header}</span>
                      <span>{col.cell(row)}</span>
                    </div>
                  ))}
                </div>

                {isExpanded && hiddenColumns.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {hiddenColumns.map((col) => (
                      <div key={col.key} className="flex justify-between">
                        <span className="text-muted-foreground text-sm">{col.header}</span>
                        <span>{col.cell(row)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {hiddenColumns.length > 0 && (
                  <div className="mt-2 flex justify-center">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ui/ResponsiveTable.tsx
git commit -m "feat(ui): add responsive table component with mobile card view"
```

---

## Task 3: PWA Manifest

**Files:**
- Create: `public/manifest.json`
- Modify: `src/layouts/AppLayout.astro`

**Step 1: Create manifest.json**

Create `public/manifest.json`:

```json
{
  "name": "Personal Finance",
  "short_name": "Finance",
  "description": "Self-hosted personal finance tracker with AI integration",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f172a",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

**Step 2: Create placeholder icons**

Create placeholder SVG icons that will be used as fallbacks:

```bash
mkdir -p public/icons
```

Create `public/icons/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0f172a" rx="128"/>
  <text x="256" y="320" font-size="240" text-anchor="middle" fill="white" font-family="system-ui">💰</text>
</svg>
```

**Step 3: Add manifest link to layout**

Modify `src/layouts/AppLayout.astro` - add to `<head>`:

```astro
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0f172a" />
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
```

**Step 4: Commit**

```bash
git add public/manifest.json public/icons/ src/layouts/AppLayout.astro
git commit -m "feat(pwa): add web app manifest and icons"
```

---

## Task 4: Service Worker for Offline Support

**Files:**
- Install: `vite-plugin-pwa`
- Modify: `astro.config.mjs`
- Create: `src/sw.ts` (custom service worker)

**Step 1: Install VitePWA**

Run:
```bash
npm install vite-plugin-pwa -D
```

**Step 2: Configure Astro with VitePWA**

Modify `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import VitePWA from 'vite-plugin-pwa';

export default defineConfig({
  // ... existing config
  vite: {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https://fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 5, // 5 minutes
                },
                networkTimeoutSeconds: 3,
              },
            },
          ],
        },
        manifest: false, // Using our own manifest
      }),
    ],
  },
});
```

**Step 3: Create offline fallback page**

Create `src/pages/offline.astro`:

```astro
---
import AuthLayout from '@/layouts/AuthLayout.astro';
---

<AuthLayout title="Offline | Personal Finance">
  <div class="text-center py-12">
    <div class="text-6xl mb-4">📡</div>
    <h1 class="text-2xl font-bold mb-2">You're Offline</h1>
    <p class="text-muted-foreground mb-6">
      It looks like you've lost your internet connection. Some features may be unavailable.
    </p>
    <button
      onclick="window.location.reload()"
      class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
    >
      Try Again
    </button>
  </div>
</AuthLayout>
```

**Step 4: Add offline indicator component**

Create `src/components/ui/OfflineIndicator.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">Offline</span>
    </div>
  );
}
```

**Step 5: Add offline indicator to layout**

Modify `src/layouts/AppLayout.astro`:

```astro
---
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
---

<!-- Add before closing body tag -->
<OfflineIndicator client:load />
```

**Step 6: Commit**

```bash
git add astro.config.mjs src/pages/offline.astro src/components/ui/OfflineIndicator.tsx
git commit -m "feat(pwa): add service worker with offline support"
```

---

## Task 5: Notification Schema

**Files:**
- Create: `src/lib/db/schema/notifications.ts`
- Modify: `src/lib/db/schema/index.ts`

**Step 1: Create notification schema**

Create `src/lib/db/schema/notifications.ts`:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { households } from './household';
import { users } from './user';

export const notificationTypes = [
  'bill_reminder',
  'goal_milestone',
  'budget_alert',
  'price_alert',
  'insurance_renewal',
  'system',
] as const;

export type NotificationType = typeof notificationTypes[number];

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  householdId: text('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: notificationTypes }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  actionUrl: text('action_url'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  readAt: integer('read_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
```

**Step 2: Export from schema index**

Modify `src/lib/db/schema/index.ts`:

```typescript
export {
  notifications,
  notificationTypes,
  type Notification,
  type NewNotification,
  type NotificationType,
} from './notifications';
```

**Step 3: Push schema**

Run:
```bash
npm run db:push
```

**Step 4: Commit**

```bash
git add src/lib/db/schema/notifications.ts src/lib/db/schema/index.ts
git commit -m "feat(db): add notification schema"
```

---

## Task 6: Notification API Routes

**Files:**
- Create: `src/pages/api/notifications.ts`
- Create: `src/pages/api/notifications/[id].ts`
- Create: `src/pages/api/notifications/mark-all-read.ts`

**Step 1: Create notifications list endpoint**

Create `src/pages/api/notifications.ts`:

```typescript
import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { json, unauthorized } from '@/lib/api/response';

export const GET: APIRoute = async ({ locals, url }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  const unreadOnly = url.searchParams.get('unread') === 'true';
  const limit = parseInt(url.searchParams.get('limit') || '50');

  let query = db.query.notifications.findMany({
    where: (n, { eq, and }) => {
      const conditions = [eq(n.householdId, user.householdId!)];
      if (unreadOnly) {
        conditions.push(eq(n.isRead, false));
      }
      return and(...conditions);
    },
    orderBy: [desc(notifications.createdAt)],
    limit,
  });

  const results = await query;
  return json(results);
};
```

**Step 2: Create single notification endpoint**

Create `src/pages/api/notifications/[id].ts`:

```typescript
import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { json, unauthorized, notFound } from '@/lib/api/response';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  const body = await request.json();
  const { isRead } = body;

  const notification = await db.query.notifications.findFirst({
    where: and(
      eq(notifications.id, params.id!),
      eq(notifications.householdId, user.householdId)
    ),
  });

  if (!notification) {
    return notFound('Notification not found');
  }

  await db.update(notifications)
    .set({
      isRead: isRead ?? notification.isRead,
      readAt: isRead ? new Date() : notification.readAt,
    })
    .where(eq(notifications.id, params.id!));

  return json({ success: true });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  await db.delete(notifications)
    .where(and(
      eq(notifications.id, params.id!),
      eq(notifications.householdId, user.householdId)
    ));

  return json({ success: true });
};
```

**Step 3: Create mark-all-read endpoint**

Create `src/pages/api/notifications/mark-all-read.ts`:

```typescript
import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { json, unauthorized } from '@/lib/api/response';

export const POST: APIRoute = async ({ locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  await db.update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(and(
      eq(notifications.householdId, user.householdId),
      eq(notifications.isRead, false)
    ));

  return json({ success: true });
};
```

**Step 4: Commit**

```bash
git add src/pages/api/notifications.ts src/pages/api/notifications/
git commit -m "feat(api): add notification endpoints"
```

---

## Task 7: Notifications UI Component

**Files:**
- Create: `src/components/notifications/NotificationBell.tsx`
- Create: `src/components/notifications/NotificationDropdown.tsx`

**Step 1: Create notification bell with unread count**

Create `src/components/notifications/NotificationBell.tsx`:

```typescript
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?unread=true');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notifications.length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Create notification dropdown content**

Create `src/components/notifications/NotificationDropdown.tsx`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Trash2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/db/schema';

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=20');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json() as Promise<Notification[]>;
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      if (!res.ok) throw new Error('Failed to mark as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete notification');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-3 pb-2 border-b">
        <h3 className="font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
          >
            <Check className="w-4 h-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      <ScrollArea className="h-64">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'p-3 hover:bg-muted/50 transition-colors',
                  !notification.isRead && 'bg-muted/30'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      !notification.isRead && 'text-primary'
                    )}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => markAsRead.mutate(notification.id)}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteNotification.mutate(notification.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
```

**Step 3: Add notification bell to header**

Modify `src/layouts/AppLayout.astro` to include the NotificationBell in the header area.

**Step 4: Commit**

```bash
git add src/components/notifications/
git commit -m "feat(ui): add notification bell and dropdown"
```

---

## Task 8: Data Export (JSON/CSV)

**Files:**
- Create: `src/pages/api/export/json.ts`
- Create: `src/pages/api/export/csv.ts`
- Create: `src/components/settings/DataExport.tsx`

**Step 1: Create JSON export endpoint**

Create `src/pages/api/export/json.ts`:

```typescript
import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { json, unauthorized } from '@/lib/api/response';

export const GET: APIRoute = async ({ locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  };

  // Export all household data
  const data = {
    exportedAt: new Date().toISOString(),
    household: await db.query.households.findFirst({
      where: (h, { eq }) => eq(h.id, user.householdId!),
    }),
    accounts: await db.query.accounts.findMany({
      where: (a, { eq }) => eq(a.householdId, user.householdId!),
    }),
    // Add other entities as needed
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
};
```

**Step 2: Create CSV export endpoint**

Create `src/pages/api/export/csv.ts`:

```typescript
import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { json, unauthorized } from '@/lib/api/response';

function convertToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(header => {
      const value = row[header];
      // Escape values containing commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export const GET: APIRoute = async ({ locals, url }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });

  if (!user?.householdId) {
    return unauthorized('User not associated with a household');
  }

  const type = url.searchParams.get('type') || 'accounts';

  let data: Record<string, any>[] = [];
  let filename = 'export.csv';

  switch (type) {
    case 'accounts':
      data = await db.query.accounts.findMany({
        where: (a, { eq }) => eq(a.householdId, user.householdId!),
      });
      filename = 'accounts.csv';
      break;
    // Add more export types as needed
  }

  const csv = convertToCSV(data);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
};
```

**Step 3: Create data export UI component**

Create `src/components/settings/DataExport.tsx`:

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';

export function DataExport() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/export/${format}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || `export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Data Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Export your data for backup or analysis.
        </p>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={isExporting}
            className="flex-1"
          >
            <FileJson className="w-4 h-4 mr-2" />
            Export as JSON
          </Button>

          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="flex-1"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export as CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Commit**

```bash
git add src/pages/api/export/ src/components/settings/DataExport.tsx
git commit -m "feat(export): add JSON and CSV data export"
```

---

## Task 9: Profile Page

**Files:**
- Create: `src/pages/profile.astro`
- Create: `src/components/profile/AccountSettings.tsx`
- Create: `src/components/profile/FinancialProfileSettings.tsx`

**Step 1: Create profile page**

Create `src/pages/profile.astro`:

```astro
---
import AppLayout from '@/layouts/AppLayout.astro';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { FinancialProfileSettings } from '@/components/profile/FinancialProfileSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const user = Astro.locals.user;
if (!user) {
  return Astro.redirect('/auth/login');
}
---

<AppLayout title="Profile | Personal Finance">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Profile Settings</h1>

    <Tabs defaultValue="account">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="financial">Financial Profile</TabsTrigger>
        <TabsTrigger value="household">Household</TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="mt-6">
        <AccountSettings client:load />
      </TabsContent>

      <TabsContent value="financial" className="mt-6">
        <FinancialProfileSettings client:load />
      </TabsContent>

      <TabsContent value="household" className="mt-6">
        <div class="text-center py-12 text-muted-foreground">
          Household management coming soon
        </div>
      </TabsContent>
    </Tabs>
  </div>
</AppLayout>
```

**Step 2: Create account settings component**

Create `src/components/profile/AccountSettings.tsx`:

```typescript
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth/client';

export function AccountSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;

    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      setMessage('Password updated successfully');
      e.currentTarget.reset();
    } catch (error) {
      setMessage('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
              />
            </div>
            {message && (
              <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/pages/profile.astro src/components/profile/
git commit -m "feat(profile): add profile page with account settings"
```

---

## Task 10: Settings Page

**Files:**
- Create: `src/pages/settings.astro`
- Create: `src/components/settings/SettingsLayout.tsx`

**Step 1: Create settings page**

Create `src/pages/settings.astro`:

```astro
---
import AppLayout from '@/layouts/AppLayout.astro';
import { SettingsLayout } from '@/components/settings/SettingsLayout';

const user = Astro.locals.user;
if (!user) {
  return Astro.redirect('/auth/login');
}
---

<AppLayout title="Settings | Personal Finance">
  <SettingsLayout client:load />
</AppLayout>
```

**Step 2: Create settings layout component**

Create `src/components/settings/SettingsLayout.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataExport } from './DataExport';
import { AIProviderSettings } from '../ai/AIProviderSettings';

export function SettingsLayout() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="grid gap-6">
        <AIProviderSettings />
        <DataExport />

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <div>
                <h4 className="font-medium text-destructive">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive">Delete</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/pages/settings.astro src/components/settings/SettingsLayout.tsx
git commit -m "feat(settings): add settings page with export and AI provider settings"
```

---

## Task 11: Dockerfile and Docker Compose

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

**Step 1: Create Dockerfile**

Create `Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4321/ || exit 1

# Start the application
CMD ["node", "./dist/server/entry.mjs"]
```

**Step 2: Create docker-compose.yml**

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4321:4321"
    environment:
      - NODE_ENV=production
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4321/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Step 3: Create .dockerignore**

Create `.dockerignore`:

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
.env.*.local
dist
data/*.db
data/*.db-*
```

**Step 4: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore
git commit -m "feat(docker): add Dockerfile and docker-compose configuration"
```

---

## Task 12: README

**Files:**
- Create: `README.md`

**Step 1: Create comprehensive README**

Create `README.md`:

```markdown
# Personal Finance

A self-hosted personal finance tracker with AI integration, built with Astro, React, and SQLite.

## Features

- **Multi-asset tracking**: Bank accounts, stocks, crypto, real estate, superannuation, personal assets
- **AI-powered insights**: Natural language queries, auto-categorization, budget suggestions
- **Transaction management**: Import from CSV, categorize, split transactions
- **Budgeting & goals**: Set budgets, track goals, get AI recommendations
- **PWA support**: Works offline, installable on mobile devices
- **Multi-currency**: Support for multiple currencies with exchange rate updates
- **Privacy-first**: Self-hosted, your data stays on your server

## Quick Start (Docker)

```bash
# Clone the repository
git clone <repo-url>
cd personal-finance

# Create environment file
cp .env.example .env
# Edit .env with your settings

# Start with Docker Compose
docker-compose up -d
```

The app will be available at http://localhost:4321

## Manual Setup

### Prerequisites

- Node.js 20+
- SQLite 3

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your settings

# Initialize database
npm run db:push

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BETTER_AUTH_SECRET` | Secret key for authentication | Yes |
| `ENCRYPTION_KEY` | Key for encrypting sensitive data | Yes |
| `DATABASE_URL` | SQLite database path | No (default: data/finance.db) |

## AI Provider Configuration

The app supports multiple AI providers:

- **OpenAI**: GPT-4, GPT-4o-mini
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus
- **Ollama**: Local models (Llama, Mistral, etc.)
- **Custom**: Any OpenAI-compatible API

Configure in Settings > AI Provider.

## Development

```bash
# Run development server
npm run dev

# Run database studio
npm run db:studio

# Type checking
npm run astro check
```

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README with setup instructions"
```

---

## Task 13: Build and Test

**Step 1: Run production build**

```bash
npm run build
```

**Step 2: Verify no errors**

Expected: Build completes successfully

**Step 3: Commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve build issues"
```

---

## Summary

Phase 8 implementation adds:

1. **Mobile Responsiveness**: Hamburger menu, responsive tables, mobile-optimized layouts
2. **PWA Features**: Manifest, service worker, offline support, installable app
3. **Notifications**: Database schema, API, UI component with unread badge
4. **Data Export**: JSON and CSV export functionality
5. **User Profile**: Account settings, password change
6. **Settings Page**: Centralized settings with AI provider and export
7. **Docker Support**: Dockerfile and docker-compose for easy deployment
8. **Documentation**: Comprehensive README

**Total Tasks**: 13 (consolidated from original 18 for efficiency)

**Key Features Delivered:**
- Full mobile responsiveness
- PWA with offline support
- Notification system
- Data portability (export)
- Production-ready deployment (Docker)
- User-friendly documentation
