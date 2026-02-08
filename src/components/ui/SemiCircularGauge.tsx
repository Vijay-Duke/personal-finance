import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface SemiCircularGaugeProps {
  value: number;
  width?: number;
  strokeWidth?: number;
  trackColor?: string;
  fillColor?: string;
  animated?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const SemiCircularGauge = React.forwardRef<HTMLDivElement, SemiCircularGaugeProps>(
  (
    {
      value,
      width = 280,
      strokeWidth = 4,
      trackColor,
      fillColor,
      animated = true,
      children,
      className,
    },
    ref
  ) => {
    const height = width / 2 + strokeWidth;
    const radius = (width - strokeWidth * 2) / 2;
    const cx = width / 2;
    const cy = width / 2;

    // Arc from left to right (180 degrees)
    const arcLength = Math.PI * radius;
    const clamped = Math.min(100, Math.max(0, value));
    const offset = arcLength - (clamped / 100) * arcLength;

    const [mounted, setMounted] = React.useState(!animated);
    React.useEffect(() => {
      if (animated) {
        const id = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(id);
      }
    }, [animated]);

    // Semi-circle arc path (left to right)
    const d = `M ${strokeWidth} ${cy} A ${radius} ${radius} 0 0 1 ${width - strokeWidth} ${cy}`;

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-end justify-center", className)}
        style={{ width, height }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          {/* Track */}
          <path
            d={d}
            fill="none"
            stroke={trackColor || "var(--color-border-subtle)"}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d={d}
            fill="none"
            stroke={fillColor || "var(--color-primary-300)"}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={mounted ? offset : arcLength}
            style={{
              transition: `stroke-dashoffset 1000ms cubic-bezier(0.45, 0.05, 0.55, 0.95)`,
            }}
          />
        </svg>

        {/* Center content */}
        {children && (
          <div
            className="absolute flex flex-col items-center justify-center"
            style={{ bottom: 0, left: "50%", transform: "translateX(-50%)", paddingBottom: 8 }}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);
SemiCircularGauge.displayName = "SemiCircularGauge";

export { SemiCircularGauge };
