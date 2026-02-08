import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface StatusDotProps {
  variant: "success" | "warning" | "danger" | "info";
  size?: number;
  className?: string;
}

const variantColorMap: Record<StatusDotProps["variant"], string> = {
  success: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]",
  danger: "bg-[var(--color-danger)]",
  info: "bg-[var(--color-info)]",
};

const variantLabelMap: Record<StatusDotProps["variant"], string> = {
  success: "Status: balanced",
  warning: "Status: attention",
  danger: "Status: critical",
  info: "Status: informational",
};

const StatusDot = React.forwardRef<HTMLDivElement, StatusDotProps>(
  ({ variant, size = 8, className }, ref) => {
    return (
      <div
        ref={ref}
        role="img"
        aria-label={variantLabelMap[variant]}
        className={cn("shrink-0 rounded-full", variantColorMap[variant], className)}
        style={{ width: size, height: size }}
      />
    );
  }
);
StatusDot.displayName = "StatusDot";

export { StatusDot };
