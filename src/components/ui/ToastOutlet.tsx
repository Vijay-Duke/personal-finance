import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Toast, ToastType } from './toast';

// Get or create the global event target
const getToastEventTarget = () => {
  if (typeof window === 'undefined') return null;
  return (window as any).__toastEventTarget || ((window as any).__toastEventTarget = new EventTarget());
};

// Toast icons with animations
const ToastIcon = ({ type }: { type: ToastType }) => {
  const icons = {
    success: (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-success-bg">
        <CheckCircle className="w-4 h-4 text-success" />
      </div>
    ),
    error: (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-danger-bg animate-shake">
        <AlertCircle className="w-4 h-4 text-danger" />
      </div>
    ),
    warning: (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-warning-bg">
        <AlertTriangle className="w-4 h-4 text-warning" />
      </div>
    ),
    info: (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-info-bg">
        <Info className="w-4 h-4 text-info" />
      </div>
    ),
    loading: (
      <div className="flex items-center justify-center w-6 h-6">
        <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
      </div>
    ),
  };
  return icons[type];
};

// Individual toast component
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onDismiss, 200);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-xl',
        'bg-bg-elevated border border-border shadow-lg',
        'min-w-[320px] max-w-[420px]',
        isExiting ? 'toast-exit' : 'toast-enter'
      )}
    >
      <ToastIcon type={toast.type} />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary text-sm">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-1 text-sm text-text-muted">
            {toast.description}
          </p>
        )}
      </div>

      {toast.dismissible !== false && toast.type !== 'loading' && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors min-touch-target flex items-center justify-center"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Standalone toast outlet for Astro's island architecture.
 * This component listens for global toast events and renders them.
 * Use this as an independent React island in your layout.
 *
 * Usage in Astro:
 * ```astro
 * <ToastOutlet client:load />
 * ```
 */
export function ToastOutlet() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  const addToast = useCallback((toast: Toast) => {
    const newToast: Toast = {
      duration: toast.type === 'loading' ? 0 : 5000,
      dismissible: true,
      ...toast,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  useEffect(() => {
    setMounted(true);
    const eventTarget = getToastEventTarget();
    if (!eventTarget) return;

    const handleToastEvent = (event: CustomEvent) => {
      const { type, toast, id, updates } = event.detail;
      if (type === 'add' && toast) {
        addToast(toast);
      } else if (type === 'remove' && id) {
        removeToast(id);
      } else if (type === 'update' && id && updates) {
        updateToast(id, updates);
      }
    };

    eventTarget.addEventListener('toast', handleToastEvent);
    return () => eventTarget.removeEventListener('toast', handleToastEvent);
  }, [addToast, removeToast, updateToast]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>,
    document.body
  );
}
