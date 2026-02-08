import {
  Home,
  Wallet,
  ArrowLeftRight,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  currentPath: string;
}

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/accounts', icon: Wallet, label: 'Accounts' },
  { href: '/cashflow', icon: ArrowLeftRight, label: 'Cashflow' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav({ currentPath }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {navItems.map((item) => {
        const isActive =
          item.href === '/'
            ? currentPath === '/'
            : currentPath.startsWith(item.href);

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
  );
}
