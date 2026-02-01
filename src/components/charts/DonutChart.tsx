import { useMemo } from 'react';

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

export function DonutChart({
  segments,
  size = 200,
  strokeWidth = 24,
  centerLabel,
  centerValue,
}: DonutChartProps) {
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
      return {
        ...segment,
        color: segment.color || COLORS[index % COLORS.length],
        percent,
        startPercent,
        strokeDasharray: `${percent * circumference} ${circumference}`,
        strokeDashoffset: -startPercent * circumference,
      };
    });
  }, [segments, total, circumference]);

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

  return (
    <div className="relative" style={{ width: size, height: size }}>
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
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={segment.strokeDasharray}
            strokeDashoffset={segment.strokeDashoffset}
            strokeLinecap="butt"
            className="transition-all duration-500"
            style={{
              transformOrigin: 'center',
            }}
          />
        ))}
      </svg>
      {/* Center text */}
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span className="text-xl font-bold text-text-primary">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="text-xs text-text-muted">{centerLabel}</span>
          )}
        </div>
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
