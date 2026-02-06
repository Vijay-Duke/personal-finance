/**
 * Theme Toggle Button
 *
 * A button that toggles between light and dark themes.
 * Shows sun icon in dark mode (click to go light)
 * Shows moon icon in light mode (click to go dark)
 */

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ThemeToggleProps {
  variant?: 'icon' | 'button' | 'dropdown';
  className?: string;
}

type Theme = 'light' | 'dark' | 'system';

export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  // Local state to avoid SSR issues
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage and document attribute
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) {
      setThemeState(stored);
    } else {
      setThemeState('system');
    }

    // Get current resolved theme from document
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null;
    if (currentTheme) {
      setResolvedTheme(currentTheme);
    } else {
      // Default to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(prefersDark ? 'dark' : 'light');
    }

    setMounted(true);
  }, []);

  // Listen for theme changes
  useEffect(() => {
    if (!mounted) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
          if (newTheme) {
            setResolvedTheme(newTheme);
          }
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [mounted]);

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
    setResolvedTheme(newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    let resolved: 'light' | 'dark';

    if (newTheme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = newTheme;
    }

    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
    setResolvedTheme(resolved);
  };

  // Prevent hydration mismatch - render a placeholder during SSR
  if (!mounted) {
    return (
      <div className={cn(
        'inline-flex items-center justify-center w-10 h-10 rounded-lg',
        'bg-transparent text-text-secondary',
        className
      )}>
        <Sun className="h-5 w-5 opacity-50" />
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={cn('flex flex-col gap-1 p-1', className)}>
        <ThemeOption
          active={theme === 'light'}
          onClick={() => setTheme('light')}
          icon={<Sun className="h-4 w-4" />}
          label="Light"
        />
        <ThemeOption
          active={theme === 'dark'}
          onClick={() => setTheme('dark')}
          icon={<Moon className="h-4 w-4" />}
          label="Dark"
        />
        <ThemeOption
          active={theme === 'system'}
          onClick={() => setTheme('system')}
          icon={<Monitor className="h-4 w-4" />}
          label="System"
        />
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 rounded-lg',
          'text-sm font-medium',
          'bg-bg-surface text-text-secondary',
          'hover:bg-border hover:text-text-primary',
          'transition-all duration-200',
          className
        )}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {resolvedTheme === 'dark' ? (
          <>
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </>
        ) : (
          <>
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </>
        )}
      </button>
    );
  }

  // Icon variant (default)
  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center',
        'w-10 h-10 rounded-lg',
        'bg-transparent text-text-secondary',
        'hover:bg-bg-surface hover:text-text-primary',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        className
      )}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}

function ThemeOption({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
        'transition-colors duration-150',
        active
          ? 'bg-primary-500/10 text-primary-500'
          : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
      )}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
      )}
    </button>
  );
}
