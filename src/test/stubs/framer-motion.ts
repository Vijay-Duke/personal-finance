/**
 * Minimal framer-motion stub for tests
 * Provides no-op implementations of commonly used exports
 */
import React from 'react';

// Motion components - just render children
export const motion = new Proxy({}, {
  get: (_, tag: string) => {
    return React.forwardRef(({ children, ...props }: any, ref: any) => {
      // Filter out framer-motion specific props
      const {
        initial, animate, exit, variants, transition, whileHover, whileTap,
        whileFocus, whileDrag, whileInView, drag, dragConstraints,
        onAnimationComplete, onAnimationStart, layoutId, layout, ...rest
      } = props;
      return React.createElement(tag, { ...rest, ref }, children);
    });
  },
});

// AnimatePresence - just render children
export const AnimatePresence = ({ children }: { children: React.ReactNode }) => children;

// Hooks - return no-op values
export const useAnimation = () => ({
  start: () => Promise.resolve(),
  stop: () => {},
  set: () => {},
});

export const useMotionValue = (initial: number) => ({
  get: () => initial,
  set: () => {},
  on: () => () => {},
});

export const useTransform = () => ({
  get: () => 0,
  set: () => {},
  on: () => () => {},
});

export const useSpring = () => ({
  get: () => 0,
  set: () => {},
  on: () => () => {},
});

export const useInView = () => true;
export const useScroll = () => ({ scrollY: { get: () => 0 }, scrollX: { get: () => 0 } });
export const useDragControls = () => ({ start: () => {} });
export const useAnimationControls = useAnimation;

// Reorder components
export const Reorder = {
  Group: ({ children }: any) => children,
  Item: ({ children }: any) => children,
};

// LayoutGroup
export const LayoutGroup = ({ children }: { children: React.ReactNode }) => children;

// LazyMotion and domAnimation
export const LazyMotion = ({ children }: { children: React.ReactNode }) => children;
export const domAnimation = {};
export const domMax = {};

// m - same as motion
export const m = motion;

export default { motion, AnimatePresence };
