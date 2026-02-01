import { useState } from 'react';
import {
  Home,
  Wallet,
  Plus,
  Receipt,
  Settings,
  X,
  ArrowLeftRight,
  PiggyBank,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  currentPath: string;
}

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/accounts', icon: Wallet, label: 'Accounts' },
  { href: '#fab', icon: Plus, label: 'Add', isFab: true },
  { href: '/cashflow', icon: Receipt, label: 'Cashflow' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const fabActions = [
  { href: '/transactions?action=add', icon: ArrowLeftRight, label: 'Transaction', color: 'bg-primary-600' },
  { href: '/budgets?action=add', icon: PiggyBank, label: 'Budget', color: 'bg-info-bg' },
  { href: '/goals?action=add', icon: Target, label: 'Goal', color: 'bg-success-bg' },
];

export function BottomNav({ currentPath }: BottomNavProps) {
  const [fabOpen, setFabOpen] = useState(false);

  const handleFabClick = () => {
    setFabOpen(!fabOpen);
  };

  return (
    <>
      {/* FAB Action Menu Overlay */}
      {fabOpen && (
        <div
          className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* FAB Action Items */}
      <div
        className={cn(
          'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 items-center transition-all duration-300 lg:hidden',
          fabOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {fabActions.map((action, index) => (
          <a
            key={action.href}
            href={action.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-full shadow-lg transition-all',
              action.color,
              'hover:scale-105 active:scale-95'
            )}
            style={{
              transitionDelay: fabOpen ? `${index * 50}ms` : '0ms',
            }}
            onClick={() => setFabOpen(false)}
          >
            <action.icon className="w-5 h-5 text-text-primary" />
            <span className="text-sm font-medium text-text-primary">
              {action.label}
            </span>
          </a>
        ))}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navItems.map((item) => {
          const isActive = !item.isFab && (
            item.href === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.href)
          );

          if (item.isFab) {
            return (
              <button
                key={item.href}
                onClick={handleFabClick}
                className={cn(
                  'bottom-nav-fab btn-press',
                  fabOpen && 'rotate-45'
                )}
                aria-label={fabOpen ? 'Close menu' : 'Quick add'}
                aria-expanded={fabOpen}
              >
                {fabOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Plus className="w-6 h-6" />
                )}
              </button>
            );
          }

          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'bottom-nav-item',
                isActive && 'active'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
