/**
 * Lottie Animation Component
 *
 * Wrapper for lottie-react with:
 * - Fallback for SSR
 * - Theme-aware animations
 * - Loading states
 */

import { useEffect, useState } from 'react';
import Lottie, { type LottieComponentProps } from 'lottie-react';
import { cn } from '@/lib/utils/cn';

interface LottieAnimationProps extends Omit<LottieComponentProps, 'animationData'> {
  animationData: object;
  className?: string;
  fallback?: React.ReactNode;
}

export function LottieAnimation({
  animationData,
  className,
  fallback,
  ...props
}: LottieAnimationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        {fallback || (
          <div className="w-16 h-16 rounded-full border-2 border-border border-t-primary-500 animate-spin" />
        )}
      </div>
    );
  }

  return (
    <Lottie
      animationData={animationData}
      className={className}
      {...props}
    />
  );
}

// Pre-defined animation data for common states
export const EmptyStateAnimation = {
  // Simple pulsing dots animation
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: "Empty State",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 1, k: [
          { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [30] },
          { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 30, s: [100] },
          { t: 60, s: [30] }
        ]},
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [
          { i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] }, o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] }, t: 0, s: [80, 80, 100] },
          { i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] }, o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] }, t: 30, s: [100, 100, 100] },
          { t: 60, s: [80, 80, 100] }
        ]}
      },
      ao: 0,
      shapes: [{
        ty: "gr",
        it: [
          {
            d: 1,
            ty: "el",
            s: { a: 0, k: [60, 60] },
            p: { a: 0, k: [0, 0] },
            nm: "Ellipse Path 1"
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.941, 0.353, 0.271, 1] },
            o: { a: 0, k: 100 },
            r: 1,
            bm: 0,
            nm: "Fill 1"
          }
        ],
        nm: "Ellipse 1"
      }],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0
    }
  ]
};

export const LoadingAnimation = {
  // Rotating spinner
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "Loading",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Spinner",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [
          { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [0] },
          { t: 60, s: [360] }
        ]},
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [{
        ty: "gr",
        it: [
          {
            ty: "rc",
            d: 1,
            s: { a: 0, k: [8, 20] },
            p: { a: 0, k: [0, -25] },
            r: { a: 0, k: 4 },
            nm: "Rect 1"
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.941, 0.353, 0.271, 1] },
            o: { a: 0, k: 100 },
            r: 1,
            bm: 0,
            nm: "Fill 1"
          }
        ],
        nm: "Rect Group"
      }],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0
    }
  ]
};
