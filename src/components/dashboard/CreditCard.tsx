/**
 * Glassmorphism Credit Card Component
 *
 * A premium credit card visualization with:
 * - Glassmorphism effect
 * - Chip animation
 * - Hover tilt effect
 * - Shimmer animation
 * - Card number masking
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CreditCardProps {
  name: string;
  number: string;
  expiry: string;
  cvv?: string;
  type?: 'visa' | 'mastercard' | 'amex';
  color?: 'blue' | 'purple' | 'orange' | 'green' | 'dark';
  balance?: number;
}

const cardColors = {
  blue: 'from-blue-600 via-blue-500 to-indigo-600',
  purple: 'from-violet-600 via-purple-500 to-fuchsia-600',
  orange: 'from-orange-500 via-amber-500 to-yellow-500',
  green: 'from-emerald-600 via-teal-500 to-cyan-600',
  dark: 'from-slate-800 via-slate-700 to-slate-800',
};

export function CreditCard({
  name,
  number,
  expiry,
  type = 'visa',
  color = 'blue',
  balance,
}: CreditCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Mask card number except last 4 digits
  const maskedNumber = number.replace(/\d(?=\d{4})/g, '•');
  const formattedNumber = maskedNumber.replace(/(.{4})/g, '$1 ').trim();

  return (
    <motion.div
      className="relative w-full aspect-[1.586] max-w-sm mx-auto perspective-1000"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={cn(
          'relative w-full h-full rounded-2xl overflow-hidden',
          'bg-gradient-to-br shadow-2xl',
          cardColors[color]
        )}
        animate={{
          rotateY: isHovered ? 5 : 0,
          rotateX: isHovered ? -5 : 0,
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

        {/* Animated shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'linear',
          }}
        />

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 400 250">
            <defs>
              <pattern
                id="card-pattern"
                x="0"
                y="0"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="20" cy="20" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#card-pattern)" />
          </svg>
        </div>

        {/* Card content */}
        <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
          {/* Top row */}
          <div className="flex justify-between items-start">
            {/* Chip */}
            <motion.div
              className="w-12 h-9 rounded-lg bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 relative overflow-hidden"
              animate={isHovered ? { rotateY: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-5 border border-yellow-700/30 rounded" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-3 border border-yellow-700/30 rounded" />
              </div>
            </motion.div>

            {/* Contactless icon */}
            <Wifi className="w-6 h-6 text-white/80 rotate-90" />
          </div>

          {/* Card number */}
          <div className="space-y-1">
            <motion.p
              className="text-2xl font-mono tracking-wider text-white/90"
              animate={isHovered ? { opacity: [1, 0.7, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {formattedNumber}
            </motion.p>
          </div>

          {/* Bottom row */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wider mb-1">
                Card Holder
              </p>
              <p className="text-sm font-medium tracking-wide uppercase">
                {name}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-white/60 uppercase tracking-wider mb-1">
                Expires
              </p>
              <p className="text-sm font-medium">{expiry}</p>
            </div>

            {/* Card type logo */}
            <div className="absolute bottom-6 right-6">
              {type === 'visa' ? (
                <svg
                  className="w-12 h-8"
                  viewBox="0 0 48 32"
                  fill="none"
                >
                  <path
                    d="M18.6 24L15 8H19L22.6 24H18.6Z"
                    fill="white"
                    fillOpacity="0.9"
                  />
                  <path
                    d="M30.2 8.2C28.9 7.7 27.1 7.5 25.2 7.5C21.2 7.5 18.3 9.5 18.3 12.3C18.3 14.5 20.3 15.7 21.8 16.5C23.4 17.3 23.9 17.8 23.9 18.4C23.9 19.3 22.8 19.8 21.7 19.8C20.1 19.8 19.1 19.5 17.8 18.9L17.2 18.6L16.5 22.4C18 23.1 20 23.5 22.1 23.5C26.4 23.5 29.2 21.5 29.2 18.5C29.2 16.7 28 15.4 25.8 14.4C24.4 13.7 23.6 13.2 23.6 12.6C23.6 12 24.3 11.5 25.7 11.5C27 11.5 27.9 11.8 28.7 12.1L29.2 12.3L30.2 8.2Z"
                    fill="white"
                    fillOpacity="0.9"
                  />
                  <path
                    d="M42.5 8H39.3C38.4 8 37.7 8.2 37.3 9.2L30.5 24H34.8L35.7 21.5H41.3L41.9 24H45.5L42.5 8ZM36.8 18.5L39.1 12.5L40.3 18.5H36.8Z"
                    fill="white"
                    fillOpacity="0.9"
                  />
                  <path
                    d="M12.5 8L8.2 18.5L7.8 16.8C6.9 13.5 4.2 10 1 8.2L5.3 24H9.7L16.5 8H12.5Z"
                    fill="white"
                    fillOpacity="0.9"
                  />
                  <path
                    d="M5.5 8H0L0 8.2C4.2 9.3 7.1 12.2 8.1 15.8L7 9.2C6.8 8.3 6.2 8 5.5 8Z"
                    fill="white"
                    fillOpacity="0.9"
                  />
                </svg>
              ) : (
                <div className="flex items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-red-500/90" />
                  <div className="w-8 h-8 rounded-full bg-yellow-500/90 -ml-4" />
                </div>
              )}
            </div>
          </div>

          {/* Balance if provided */}
          {balance !== undefined && (
            <motion.div
              className="absolute top-6 right-6 text-right"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs text-white/60">Balance</p>
              <p className="text-lg font-bold">
                ${balance.toLocaleString()}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
