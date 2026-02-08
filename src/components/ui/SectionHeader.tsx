import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface SectionHeaderProps {
  label?: string;
  title: string;
  meta?: string;
  divider?: boolean;
  className?: string;
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ label, title, meta, divider = false, className }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col", className)}>
        {/* Label row with optional meta */}
        {(label || meta) && (
          <div className="flex items-center justify-between">
            {label && (
              <span
                className={cn(
                  "text-xs font-medium uppercase tracking-[0.2em]",
                  "text-[var(--color-text-muted)]"
                )}
              >
                {label}
              </span>
            )}
            {meta && (
              <span
                className={cn(
                  "text-xs font-medium uppercase tracking-[0.2em]",
                  "text-[var(--color-text-muted)]",
                  !label && "ml-auto"
                )}
              >
                {meta}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h2
          className={cn(
            "mt-2 text-xl font-semibold leading-[1.3]",
            "text-[var(--color-text-primary)]"
          )}
        >
          {title}
        </h2>

        {/* Optional divider */}
        {divider && (
          <div
            className="mt-3 h-px w-full"
            style={{ backgroundColor: "var(--color-border)" }}
          />
        )}
      </div>
    );
  }
);
SectionHeader.displayName = "SectionHeader";

export { SectionHeader };
