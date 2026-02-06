import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface DonutChartSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutChartSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
  formatValue?: (value: number) => string;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
];

// Glassmorphism tooltip component
function ChartTooltip({
  label,
  value,
  percentage,
  color,
  position,
}: {
  label: string;
  value: string;
  percentage: string;
  color: string;
  position: { x: number; y: number };
}) {
  return (
    <div
      className="absolute z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-bg-elevated/90 backdrop-blur-md border border-border/50 rounded-xl px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-text-primary">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-text-primary">{value}</span>
          <span className="text-xs text-text-muted">{percentage}</span>
        </div>
      </div>
      {/* Arrow */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-bg-elevated/90 border-r border-b border-border/50 transform rotate-45" />
    </div>
  );
}

export function DonutChart({
  segments,
  size = 200,
  strokeWidth = 24,
  centerLabel,
  centerValue,
  formatValue = (v) => v.toLocaleString(),
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const total = useMemo(
    () => segments.reduce((sum, seg) => sum + seg.value, 0),
    [segments]
  );

  const segmentsWithAngles = useMemo(() => {
    let cumulativePercent = 0;
    return segments.map((segment, index) => {
      const percent = total > 0 ? segment.value / total : 0;
      const startPercent = cumulativePercent;
      cumulativePercent += percent;
      // Calculate center angle for tooltip positioning
      const midAngle = (startPercent + percent / 2) * 2 * Math.PI - Math.PI / 2;
      return {
        ...segment,
        color: segment.color || COLORS[index % COLORS.length],
        percent,
        startPercent,
        strokeDasharray: `${percent * circumference} ${circumference}`,
        strokeDashoffset: -startPercent * circumference,
        midAngle,
      };
    });
  }, [segments, total, circumference]);

  const handleMouseMove = (_e: React.MouseEvent, index: number, midAngle: number) => {
    // Position tooltip near the segment
    const tooltipRadius = radius + strokeWidth;
    const x = center + Math.cos(midAngle) * tooltipRadius * 0.8;
    const y = center + Math.sin(midAngle) * tooltipRadius * 0.8;
    setTooltipPos({ x, y });
    setHoveredIndex(index);
  };

  if (segments.length === 0 || total === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <div className="text-center text-text-muted">
          <svg
            className="mx-auto h-12 w-12 text-text-muted/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
            />
          </svg>
          <p className="mt-2 text-sm">No data</p>
        </div>
      </div>
    );
  }

  const hoveredSegment = hoveredIndex !== null ? segmentsWithAngles[hoveredIndex] : null;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* SVG Gradients */}
      <svg width="0" height="0" className="absolute">
        <defs>
          {segmentsWithAngles.map((segment, index) => (
            <linearGradient
              key={`gradient-${index}`}
              id={`donut-gradient-${index}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={segment.color} stopOpacity="1" />
              <stop offset="100%" stopColor={segment.color} stopOpacity="0.7" />
            </linearGradient>
          ))}
        </defs>
      </svg>

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-content-bg"
        />
        {/* Segments */}
        {segmentsWithAngles.map((segment, index) => (
          <circle
            key={segment.label}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#donut-gradient-${index})`}
            strokeWidth={hoveredIndex === index ? strokeWidth + 4 : strokeWidth}
            strokeDasharray={segment.strokeDasharray}
            strokeDashoffset={segment.strokeDashoffset}
            strokeLinecap="butt"
            className={cn(
              "transition-[stroke-width,filter] duration-300 cursor-pointer",
              hoveredIndex === index ? "filter drop-shadow-lg" : ""
            )}
            style={{
              transformOrigin: 'center',
            }}
            onMouseEnter={(e) => handleMouseMove(e, index, segment.midAngle)}
            onMouseMove={(e) => handleMouseMove(e, index, segment.midAngle)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}
      </svg>

      {/* Center text */}
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hoveredSegment ? (
            <>
              <span className="text-lg font-bold text-text-primary transition-opacity max-w-[70%] text-center leading-tight">
                {(hoveredSegment.percent * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-text-muted truncate max-w-[80%] text-center">
                {hoveredSegment.label}
              </span>
            </>
          ) : (
            <>
              {centerValue && (
                <span className="text-lg font-bold text-text-primary max-w-[70%] text-center leading-tight">
                  {centerValue}
                </span>
              )}
              {centerLabel && (
                <span className="text-xs text-text-muted">{centerLabel}</span>
              )}
            </>
          )}
        </div>
      )}

      {/* Tooltip */}
      {hoveredSegment && (
        <ChartTooltip
          label={hoveredSegment.label}
          value={formatValue(hoveredSegment.value)}
          percentage={`${(hoveredSegment.percent * 100).toFixed(1)}%`}
          color={hoveredSegment.color}
          position={tooltipPos}
        />
      )}
    </div>
  );
}

interface DonutChartLegendProps {
  segments: DonutChartSegment[];
  total: number;
  formatValue?: (value: number) => string;
}

export function DonutChartLegend({
  segments,
  total,
  formatValue = (v) => v.toLocaleString(),
}: DonutChartLegendProps) {
  return (
    <div className="space-y-2">
      {segments.map((segment, index) => {
        const percent = total > 0 ? (segment.value / total) * 100 : 0;
        const color = segment.color || COLORS[index % COLORS.length];
        return (
          <div key={segment.label} className="flex items-center gap-3">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary truncate">
                  {segment.label}
                </span>
                <span className="text-sm text-text-muted ml-2">
                  {percent.toFixed(1)}%
                </span>
              </div>
              <span className="text-xs text-text-muted">
                {formatValue(segment.value)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
