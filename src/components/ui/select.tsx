import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronDown } from "lucide-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  hint?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, hint, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-9 w-full appearance-none rounded-md border bg-card-bg px-3 py-1 pr-8 text-sm shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-danger focus-visible:ring-danger"
              : "border-border",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        {hint && !error && (
          <p className="mt-1 text-xs text-text-muted">{hint}</p>
        )}
        {error && (
          <p className="mt-1 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
