import * as React from "react";
import { cn } from "@/lib/utils/cn";

const SIZES = {
  sm: { diameter: 80, stroke: 3 },
  md: { diameter: 120, stroke: 3 },
  lg: { diameter: 160, stroke: 4 },
  xl: { diameter: 200, stroke: 4 },
  hero: { diameter: 240, stroke: 4 },
} as const;

export interface CircularProgressProps {
  value: number;
  size?: keyof typeof SIZES;
  strokeWidth?: number;
  trackColor?: string;
  fillColor?: string;
  showValue?: boolean;
  label?: string;
  icon?: React.ReactNode;
  animated?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  (
    {
      value,
      size = "lg",
      strokeWidth,
      trackColor,
      fillColor,
      showValue = false,
      label,
      icon,
      animated = true,
      className,
      children,
    },
    ref
  ) => {
    const { diameter, stroke: defaultStroke } = SIZES[size];
    const sw = strokeWidth ?? defaultStroke;
    const radius = (diameter - sw) / 2;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.min(100, Math.max(0, value));
    const offset = circumference - (clamped / 100) * circumference;

    const [mounted, setMounted] = React.useState(!animated);
    React.useEffect(() => {
      if (animated) {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
      }
    }, [animated]);

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-center justify-center", className)}
        style={{ width: diameter, height: diameter }}
      >
        <svg
          width={diameter}
          height={diameter}
          viewBox={`0 0 ${diameter} ${diameter}`}
          className="progress-ring"
        >
          {/* Track */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke={trackColor || "var(--color-border-subtle)"}
            strokeWidth={sw}
          />
          {/* Fill */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke={fillColor || "var(--color-primary-300)"}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? offset : circumference}
            className="progress-ring-circle"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children ?? (
            <>
              {icon && (
                <div className="mb-1 text-[var(--color-text-muted)]">{icon}</div>
              )}
              {showValue && (
                <span
                  className="font-display tabular-nums text-[var(--color-text-primary)]"
                  style={{
                    fontSize: diameter >= 200 ? "2rem" : diameter >= 120 ? "1.5rem" : "1.25rem",
                    fontWeight: 400,
                    lineHeight: 1.15,
                  }}
                >
                  {Math.round(clamped)}%
                </span>
              )}
              {label && (
                <span
                  className="text-[var(--color-text-muted)]"
                  style={{ fontSize: diameter >= 160 ? "0.8125rem" : "0.6875rem" }}
                >
                  {label}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);
CircularProgress.displayName = "CircularProgress";

export { CircularProgress };
