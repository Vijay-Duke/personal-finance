import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

export interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
}

export function OfflineIndicator({
  className,
  showWhenOnline = false,
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = React.useState(true);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    setIsVisible(!navigator.onLine || showWhenOnline);

    const handleOnline = () => {
      setIsOnline(true);
      // Keep visible briefly to show "back online" state
      if (!showWhenOnline) {
        setTimeout(() => setIsVisible(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [showWhenOnline]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300",
        isOnline
          ? "bg-success/10 border-success/20 text-success"
          : "bg-warning/10 border-warning/20 text-warning",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {isOnline ? (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        )}
      </div>

      {/* Status Text */}
      <div className="flex-1 text-sm font-medium">
        {isOnline ? (
          <span>Back online</span>
        ) : (
          <div className="flex flex-col">
            <span>You're offline</span>
            <span className="text-xs opacity-80">
              Some features may be unavailable
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!isOnline && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-8 px-2 text-xs"
          >
            <svg
              className="h-3.5 w-3.5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Retry
          </Button>
        )}

        {/* Dismiss button */}
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-black/5 rounded transition-colors"
          aria-label="Dismiss"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Hook for checking online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = React.useState(true);
  const [wasOffline, setWasOffline] = React.useState(false);

  React.useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

// Hook for syncing when back online
export function useSyncWhenOnline(syncFunction: () => void | Promise<void>) {
  const { isOnline, wasOffline } = useOnlineStatus();

  React.useEffect(() => {
    if (isOnline && wasOffline) {
      // We were offline and now we're back
      syncFunction();
    }
  }, [isOnline, wasOffline, syncFunction]);
}

export default OfflineIndicator;
