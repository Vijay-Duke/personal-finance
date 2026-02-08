import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useApiQuery, queryKeys } from '@/hooks/useApi';
import {
  UserPlus,
  UserMinus,
  UserX,
  ShieldCheck,
  Mail,
  MailX,
  Settings,
  ArrowRightLeft,
  Activity,
} from 'lucide-react';

interface ActivityEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  createdAt: string;
  userId: string;
  userName: string | null;
  userEmail: string;
}

const actionConfig: Record<string, { icon: React.ReactNode; label: (entry: ActivityEntry) => string }> = {
  member_joined: {
    icon: <UserPlus className="h-4 w-4 text-success" />,
    label: (e) => `${actorName(e)} joined the household`,
  },
  member_left: {
    icon: <UserMinus className="h-4 w-4 text-warning" />,
    label: (e) => `${actorName(e)} left the household`,
  },
  member_removed: {
    icon: <UserX className="h-4 w-4 text-danger" />,
    label: (e) => {
      const d = parseDetails(e.details);
      return `${actorName(e)} removed ${d?.memberName || d?.memberEmail || 'a member'}`;
    },
  },
  role_changed: {
    icon: <ShieldCheck className="h-4 w-4 text-primary-500" />,
    label: (e) => {
      const d = parseDetails(e.details);
      return `${actorName(e)} changed ${d?.memberName || 'a member'}'s role to ${d?.newRole || 'unknown'}`;
    },
  },
  invite_created: {
    icon: <Mail className="h-4 w-4 text-primary-500" />,
    label: (e) => `${actorName(e)} created an invite code`,
  },
  invite_revoked: {
    icon: <MailX className="h-4 w-4 text-warning" />,
    label: (e) => `${actorName(e)} revoked an invite code`,
  },
  household_updated: {
    icon: <Settings className="h-4 w-4 text-text-muted" />,
    label: (e) => `${actorName(e)} updated household settings`,
  },
  ownership_transferred: {
    icon: <ArrowRightLeft className="h-4 w-4 text-primary-500" />,
    label: (e) => {
      const d = parseDetails(e.details);
      return `${actorName(e)} transferred ownership to ${d?.toUserName || 'another member'}`;
    },
  },
};

function actorName(e: ActivityEntry): string {
  return e.userName || e.userEmail?.split('@')[0] || 'Someone';
}

function parseDetails(details: string | null): Record<string, unknown> | null {
  if (!details) return null;
  try {
    return JSON.parse(details);
  } catch {
    return null;
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function HouseholdActivity() {
  const { data: entries, isLoading } = useApiQuery<ActivityEntry[]>(
    queryKeys.householdActivity,
    '/api/household/activity?limit=20'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 rounded bg-bg-surface" />
            ))}
          </div>
        ) : !entries?.length ? (
          <p className="text-sm text-text-muted text-center py-4">No activity yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const config = actionConfig[entry.action] || {
                icon: <Activity className="h-4 w-4 text-text-muted" />,
                label: () => entry.action,
              };
              return (
                <div key={entry.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 flex-shrink-0">{config.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary">{config.label(entry)}</p>
                    <p className="text-xs text-text-muted">{formatRelativeTime(entry.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
