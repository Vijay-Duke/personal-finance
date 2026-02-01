import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { NotificationDropdown } from './NotificationDropdown';
import { cn } from '@/lib/utils/cn';

interface UnreadCount {
  total: number;
  byPriority: {
    urgent: number;
    high: number;
    normal: number;
    low: number;
  };
}

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<UnreadCount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Refresh count when dropdown closes
  const handleClose = useCallback(() => {
    setIsOpen(false);
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Determine badge color based on priority
  const getBadgeColor = () => {
    if (!unreadCount) return 'bg-gray-500';
    if (unreadCount.byPriority.urgent > 0) return 'bg-danger';
    if (unreadCount.byPriority.high > 0) return 'bg-warning';
    return 'bg-primary-600';
  };

  const hasUnread = unreadCount && unreadCount.total > 0;

  return (
    <>
      <div className={cn('relative', className)}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'relative text-text-muted hover:text-text-primary hover:bg-content-bg',
            isOpen && 'bg-content-bg text-text-primary'
          )}
          aria-label={`Notifications ${hasUnread ? `(${unreadCount.total} unread)` : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Bell className="h-5 w-5" />

          {/* Notification badge */}
          {hasUnread && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-medium text-white',
                getBadgeColor()
              )}
            >
              {unreadCount.total > 99 ? '99+' : unreadCount.total}
            </span>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
          )}
        </Button>
      </div>

      <NotificationDropdown
        isOpen={isOpen}
        onClose={handleClose}
        unreadCount={unreadCount?.total || 0}
      />
    </>
  );
}
