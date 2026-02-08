import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { StatusDot } from "./StatusDot";

export interface PageHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
  status?: {
    text: string;
    variant: "success" | "warning" | "danger" | "info";
  };
  className?: string;
  children?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ label, title, subtitle, status, className, children }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col items-center text-center", className)}>
        {/* Overline label */}
        <span className="section-label">{label}</span>

        {/* Serif title */}
        <h1 className="page-title mt-2">{title}</h1>

        {/* Optional subtitle */}
        {subtitle && (
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {subtitle}
          </p>
        )}

        {/* Status indicator */}
        {status && (
          <div className="mt-3 flex items-center gap-2">
            <StatusDot variant={status.variant} />
            <span className="text-sm text-[var(--color-text-secondary)]">
              {status.text}
            </span>
          </div>
        )}

        {/* Children (e.g., circular visualization) */}
        {children && <div className="mt-12">{children}</div>}
      </div>
    );
  }
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
