import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Wallet,
  Target,
  RefreshCw,
  XCircle,
  BellRing,
  Info,
  X,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils/cn';
import type { Notification, NotificationType, NotificationPriority } from '@/lib/db/schema';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
}

// Icon mapping for notification types
const typeIcons: Record<NotificationType, typeof Bell> = {
  transaction_alert: Wallet,
  budget_warning: AlertTriangle,
  goal_milestone: Target,
  sync_complete: RefreshCw,
  sync_failed: XCircle,
  price_alert: TrendingUp,
  system: Info,
};

// Color mapping for priorities
const priorityColors: Record<NotificationPriority, string> = {
  urgent: 'border-l-danger bg-danger/5',
  high: 'border-l-warning bg-warning/5',
  normal: 'border-l-primary-600',
  low: 'border-l-gray-400',
};

// Priority badge colors
const priorityBadgeColors: Record<NotificationPriority, string> = {
  urgent: 'bg-danger text-white',
  high: 'bg-warning text-white',
  normal: 'bg-primary-100 text-primary-700',
  low: 'bg-gray-100 text-gray-600',
};

export function NotificationDropdown({ isOpen, onClose, unreadCount }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isOpen) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '20');
      if (filter === 'unread') {
        params.set('unreadOnly', 'true');
      }

      const response = await fetch(`/api/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, filter]);

  // Load notifications when opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date() } : n))
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
        );
        onClose(); // Close to refresh badge
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Format relative time
  const formatTime = (date: Date | string | number) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notificationDate.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.link) {
      window.location.href = notification.link;
    }

    onClose();
  };

  if (!isOpen) return null;

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const displayNotifications = filter === 'unread' ? unreadNotifications : notifications;

  return (
    <div
      ref={dropdownRef}
      className="fixed right-4 top-16 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-card-bg shadow-lg md:absolute md:right-0 md:top-full md:mt-2"
      role="menu"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-text-primary">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 gap-1 text-xs text-text-muted hover:text-text-primary"
              title="Mark all as read"
            >
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Mark all read</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-text-muted hover:text-text-primary"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium transition-colors',
            filter === 'all'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-text-muted hover:text-text-primary'
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium transition-colors',
            filter === 'unread'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-text-muted hover:text-text-primary'
          )}
        >
          Unread
          {unreadCount > 0 && (
            <span className="ml-1.5 rounded-full bg-primary-100 px-1.5 py-0.5 text-xs text-primary-700">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : displayNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-text-muted/50" />
            <p className="mt-3 text-text-muted">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            {filter === 'unread' && notifications.length > 0 && (
              <button
                onClick={() => setFilter('all')}
                className="mt-2 text-sm text-primary-600 hover:underline"
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayNotifications.map((notification) => {
              const Icon = typeIcons[notification.type] || Bell;
              const isUnread = !notification.isRead;

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'group relative border-l-4 p-4 transition-colors hover:bg-content-bg',
                    priorityColors[notification.priority],
                    isUnread && 'bg-content-bg/50'
                  )}
                >
                  {/* Priority badge */}
                  <span
                    className={cn(
                      'absolute right-3 top-3 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                      priorityBadgeColors[notification.priority]
                    )}
                  >
                    {notification.priority}
                  </span>

                  <div className="flex gap-3 pr-16">
                    {/* Icon */}
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        isUnread ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm',
                          isUnread ? 'font-semibold text-text-primary' : 'text-text-primary'
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-sm text-text-muted line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">{formatTime(notification.createdAt)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="h-7 w-7 text-text-muted hover:text-primary-600"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="h-7 w-7 text-text-muted hover:text-danger"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Click handler for the whole item */}
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="absolute inset-0 z-0"
                    aria-label={`${notification.title}: ${notification.message}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2">
        <a
          href="/notifications"
          className="block text-center text-sm text-primary-600 hover:underline"
          onClick={onClose}
        >
          View all notifications
        </a>
      </div>
    </div>
  );
}
