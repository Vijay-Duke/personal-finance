import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<Omit<Toast, 'id'>>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Global event emitter for cross-island communication in Astro
const toastEventTarget = typeof window !== 'undefined'
  ? (window as any).__toastEventTarget || ((window as any).__toastEventTarget = new EventTarget())
  : null;

// Global toast function for use outside React components
export const globalToast = {
  show: (toast: Omit<Toast, 'id'>): string => {
    const id = Math.random().toString(36).slice(2, 11);
    if (toastEventTarget) {
      toastEventTarget.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'add', toast: { ...toast, id } }
      }));
    }
    return id;
  },
  success: (title: string, description?: string) => globalToast.show({ type: 'success', title, description }),
  error: (title: string, description?: string) => globalToast.show({ type: 'error', title, description }),
  warning: (title: string, description?: string) => globalToast.show({ type: 'warning', title, description }),
  info: (title: string, description?: string) => globalToast.show({ type: 'info', title, description }),
  loading: (title: string, description?: string) => globalToast.show({ type: 'loading', title, description, duration: 0 }),
  dismiss: (id: string) => {
    if (toastEventTarget) {
      toastEventTarget.dispatchEvent(new CustomEvent('toast', { detail: { type: 'remove', id } }));
    }
  },
  update: (id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    if (toastEventTarget) {
      toastEventTarget.dispatchEvent(new CustomEvent('toast', { detail: { type: 'update', id, updates } }));
    }
  },
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

// Toast container
function ToastContainer() {
  const context = useContext(ToastContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !context) return null;

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none"
      aria-label="Notifications"
    >
      {context.toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem
            toast={toast}
            onDismiss={() => context.removeToast(toast.id)}
          />
        </div>
      ))}
    </div>,
    document.body
  );
}

// Toast provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = (toast as any).id || Math.random().toString(36).slice(2, 11);
    const newToast: Toast = {
      id,
      duration: toast.type === 'loading' ? 0 : 5000,
      dismissible: true,
      ...toast,
    };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  // Listen for global toast events (for cross-island communication in Astro)
  useEffect(() => {
    if (!toastEventTarget) return;

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

    toastEventTarget.addEventListener('toast', handleToastEvent);
    return () => toastEventTarget.removeEventListener('toast', handleToastEvent);
  }, [addToast, removeToast, updateToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const toast = useCallback(
    (options: Omit<Toast, 'id'>) => {
      return context.addToast(options);
    },
    [context]
  );

  const success = useCallback(
    (title: string, description?: string) => {
      return context.addToast({ type: 'success', title, description });
    },
    [context]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      return context.addToast({ type: 'error', title, description });
    },
    [context]
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      return context.addToast({ type: 'warning', title, description });
    },
    [context]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      return context.addToast({ type: 'info', title, description });
    },
    [context]
  );

  const loading = useCallback(
    (title: string, description?: string) => {
      return context.addToast({ type: 'loading', title, description, duration: 0 });
    },
    [context]
  );

  const dismiss = useCallback(
    (id: string) => {
      context.removeToast(id);
    },
    [context]
  );

  const update = useCallback(
    (id: string, updates: Partial<Omit<Toast, 'id'>>) => {
      context.updateToast(id, updates);
    },
    [context]
  );

  // Promise helper for async operations
  const promise = useCallback(
    async <T,>(
      promiseFn: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: Error) => string);
      }
    ): Promise<T> => {
      const id = loading(options.loading);
      try {
        const result = await promiseFn;
        const successMsg = typeof options.success === 'function'
          ? options.success(result)
          : options.success;
        context.updateToast(id, { type: 'success', title: successMsg, duration: 5000 });
        return result;
      } catch (err) {
        const errorMsg = typeof options.error === 'function'
          ? options.error(err as Error)
          : options.error;
        context.updateToast(id, { type: 'error', title: errorMsg, duration: 5000 });
        throw err;
      }
    },
    [context, loading]
  );

  return {
    toast,
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    update,
    promise,
  };
}

// Export for direct use
export { ToastContext };
