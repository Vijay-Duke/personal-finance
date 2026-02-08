import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface PageFooterProps {
  quote?: string;
  icon?: React.ReactNode;
  label?: string;
  userName?: string;
  userInitials?: string;
  className?: string;
}

const PageFooter = React.forwardRef<HTMLDivElement, PageFooterProps>(
  ({ quote, icon, label, userName, userInitials, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-16 flex flex-col items-center text-center", className)}
      >
        {/* Decorative divider */}
        <div className="divider-decorative mb-8" />

        {/* Optional icon in circle */}
        {icon && (
          <div
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            {icon}
          </div>
        )}

        {/* Optional label */}
        {label && <span className="section-label">{label}</span>}

        {/* Optional quote */}
        {quote && (
          <p className="insight-quote mx-auto mt-4 max-w-[480px]">
            &ldquo;{quote}&rdquo;
          </p>
        )}

        {/* Optional user avatar */}
        {(userName || userInitials) && (
          <div className="mt-6 flex flex-col items-center gap-2">
            {userInitials && (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border text-xs font-medium"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  backgroundColor: "var(--color-bg-surface)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {userInitials}
              </div>
            )}
            {userName && (
              <span className="section-label">{userName}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);
PageFooter.displayName = "PageFooter";

export { PageFooter };
