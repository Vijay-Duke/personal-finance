/**
 * Quick Add Floating Action Button (FAB)
 *
 * A floating action button in the bottom right corner that expands
to show quick add options:
 * - Add Transaction
 * - Add Asset (Account)
 * - Add Goal
 *
 * Features:
 * - Animated expansion/collapse
 * - Mobile-friendly positioning
 * - Hide on scroll down, show on scroll up
 * - Keyboard shortcut support (N)
 */

import React, { useState, useEffect } from 'react';
import { Plus, Receipt, Wallet, Target, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

export function QuickAddFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const actions: FABAction[] = [
    {
      id: 'transaction',
      label: 'Add Transaction',
      icon: <Receipt className="h-5 w-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('fab:add-transaction'));
        setIsOpen(false);
      },
    },
    {
      id: 'asset',
      label: 'Add Asset',
      icon: <Wallet className="h-5 w-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('fab:add-asset'));
        setIsOpen(false);
      },
    },
    {
      id: 'goal',
      label: 'Add Goal',
      icon: <Target className="h-5 w-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('fab:add-goal'));
        setIsOpen(false);
      },
    },
  ];

  // Handle scroll behavior - hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 100;

      if (currentScrollY < scrollThreshold) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
        // Scrolling down
        setIsVisible(false);
        setIsOpen(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Listen for keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // N key without modifiers
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if typing in an input
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          (e.target as HTMLElement)?.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.fab-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div
      className={cn(
        'fab-container fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3',
        'transition-transform duration-300 ease-out pointer-events-none',
        'lg:hidden', // Only show on mobile/tablet, hide on desktop
        !isVisible && 'translate-y-24'
      )}
    >
      {/* Action buttons */}
      <div
        className={cn(
          'flex flex-col items-end gap-3 transition-all duration-300 pointer-events-auto',
          isOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-10 pointer-events-none'
        )}
      >
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={cn(
              'flex items-center gap-3 group transition-all duration-300',
              isOpen ? 'translate-x-0' : 'translate-x-4'
            )}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
            }}
          >
            {/* Label */}
            <span
              className={cn(
                'px-3 py-1.5 text-sm font-medium text-white rounded-lg shadow-md',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                action.color
              )}
            >
              {action.label}
            </span>

            {/* Icon button */}
            <span
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-full shadow-lg',
                'text-white transition-transform duration-200 hover:scale-110',
                action.color
              )}
            >
              {action.icon}
            </span>
          </button>
        ))}
      </div>

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-center w-14 h-14 rounded-full shadow-xl',
          'bg-primary-500 text-white transition-all duration-300',
          'hover:bg-primary-600 hover:scale-105 active:scale-95 pointer-events-auto',
          isOpen && 'rotate-45 bg-primary-700'
        )}
        aria-label={isOpen ? 'Close menu' : 'Quick add'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </button>

      {/* Keyboard shortcut hint - only show briefly on first load, then hide */}
      {!isOpen && (
        <kbd className="hidden absolute -top-8 right-0 px-2 py-1 text-xs text-text-muted bg-card-bg rounded shadow border border-border animate-fade-out">
          N
        </kbd>
      )}
    </div>
  );
}

export default QuickAddFAB;
