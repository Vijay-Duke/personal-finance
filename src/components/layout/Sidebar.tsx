import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  Wallet,
  Building2,
  TrendingUp,
  Bitcoin,
  PiggyBank,
  Package,
  Briefcase,
  CreditCard,
  ArrowLeftRight,
  Target,
  Shield,
  Receipt,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface NavGroup {
  name: string;
  items: NavItem[];
}

const navigation: (NavItem | NavGroup)[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: 'Assets',
    items: [
      { name: 'Bank Accounts', href: '/bank-accounts', icon: <Wallet className="h-5 w-5" /> },
      { name: 'Real Estate', href: '/real-estate', icon: <Building2 className="h-5 w-5" /> },
      { name: 'Stocks & ETFs', href: '/stocks', icon: <TrendingUp className="h-5 w-5" /> },
      { name: 'Crypto', href: '/crypto', icon: <Bitcoin className="h-5 w-5" /> },
      { name: 'Superannuation', href: '/super', icon: <PiggyBank className="h-5 w-5" /> },
      { name: 'Personal Assets', href: '/personal-assets', icon: <Package className="h-5 w-5" /> },
      { name: 'Business Assets', href: '/business-assets', icon: <Briefcase className="h-5 w-5" /> },
    ],
  },
  {
    name: 'Liabilities',
    items: [
      { name: 'Debts', href: '/debts', icon: <CreditCard className="h-5 w-5" /> },
    ],
  },
  {
    name: 'Management',
    items: [
      { name: 'Cashflow', href: '/cashflow', icon: <ArrowLeftRight className="h-5 w-5" /> },
      { name: 'Budgets', href: '/budgets', icon: <Receipt className="h-5 w-5" /> },
      { name: 'Goals', href: '/goals', icon: <Target className="h-5 w-5" /> },
      { name: 'Insurance', href: '/insurance', icon: <Shield className="h-5 w-5" /> },
    ],
  },
];

function NavGroupComponent({ group, currentPath }: { group: NavGroup; currentPath: string }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-text-muted"
      >
        {group.name}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen ? 'rotate-0' : '-rotate-90'
          )}
        />
      </button>
      {isOpen && (
        <div className="space-y-1">
          {group.items.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                currentPath === item.href
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-text hover:bg-sidebar-hover'
              )}
            >
              {item.icon}
              {item.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return 'items' in item;
}

interface SidebarProps {
  currentPath: string;
  user?: {
    name?: string | null;
    email: string;
    image?: string | null;
  };
}

export function Sidebar({ currentPath, user }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col bg-sidebar-bg">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-lg font-semibold text-white">Finance</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          if (isNavGroup(item)) {
            return <NavGroupComponent key={item.name} group={item} currentPath={currentPath} />;
          }
          return (
            <a
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                currentPath === item.href
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-text hover:bg-sidebar-hover'
              )}
            >
              {item.icon}
              {item.name}
            </a>
          );
        })}
      </nav>

      {/* Settings & User */}
      <div className="border-t border-sidebar-hover p-3">
        <a
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            currentPath === '/settings'
              ? 'bg-sidebar-active text-white'
              : 'text-sidebar-text hover:bg-sidebar-hover'
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </a>

        {user && (
          <div className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-medium text-white">
              {user.name?.[0] || user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-white">{user.name || 'User'}</p>
              <p className="truncate text-xs text-sidebar-text-muted">{user.email}</p>
            </div>
            <form action="/api/auth/sign-out" method="POST">
              <button
                type="submit"
                className="rounded p-1 text-sidebar-text-muted hover:bg-sidebar-hover hover:text-white"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}
