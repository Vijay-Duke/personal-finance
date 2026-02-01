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
  ChevronRight,
  Menu,
  X,
  Upload,
  Repeat,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  count?: number;
}

interface NavGroup {
  name: string;
  items: NavItem[];
  addHref?: string;
}

// Account counts would typically come from a query, using placeholder for now
const getAccountCounts = () => ({
  bank: 0,
  realEstate: 0,
  stocks: 0,
  crypto: 0,
  superannuation: 0,
  personalAssets: 0,
  businessAssets: 0,
  debts: 0,
});

const navigation: (NavItem | NavGroup)[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: 'Assets',
    addHref: '/accounts/add',
    items: [
      { name: 'Bank Accounts', href: '/accounts/bank', icon: <Wallet className="h-5 w-5" /> },
      { name: 'Real Estate', href: '/accounts/real-estate', icon: <Building2 className="h-5 w-5" /> },
      { name: 'Stocks & ETFs', href: '/accounts/stocks', icon: <TrendingUp className="h-5 w-5" /> },
      { name: 'Crypto', href: '/accounts/crypto', icon: <Bitcoin className="h-5 w-5" /> },
      { name: 'Superannuation', href: '/accounts/superannuation', icon: <PiggyBank className="h-5 w-5" /> },
      { name: 'Personal Assets', href: '/accounts/personal-assets', icon: <Package className="h-5 w-5" /> },
      { name: 'Business Assets', href: '/accounts/business-assets', icon: <Briefcase className="h-5 w-5" /> },
    ],
  },
  {
    name: 'Liabilities',
    items: [
      { name: 'Debts', href: '/accounts/debts', icon: <CreditCard className="h-5 w-5" /> },
    ],
  },
  {
    name: 'Management',
    items: [
      { name: 'Cashflow', href: '/cashflow', icon: <ArrowLeftRight className="h-5 w-5" /> },
      { name: 'Budgets', href: '/budgets', icon: <Receipt className="h-5 w-5" /> },
      { name: 'Goals', href: '/goals', icon: <Target className="h-5 w-5" /> },
      { name: 'Recurring', href: '/recurring', icon: <Repeat className="h-5 w-5" /> },
      { name: 'Insurance', href: '/insurance', icon: <Shield className="h-5 w-5" /> },
      { name: 'Import', href: '/import', icon: <Upload className="h-5 w-5" /> },
    ],
  },
];

interface CountBadgeProps {
  count: number;
}

function CountBadge({ count }: CountBadgeProps) {
  if (count === 0) return null;
  return (
    <span className="count-badge ml-auto">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function NavGroupComponent({
  group,
  currentPath,
  counts,
}: {
  group: NavGroup;
  currentPath: string;
  counts: Record<string, number>;
}) {
  // Auto-expand if current path is in this group
  const isActiveInGroup = group.items.some((item) =>
    currentPath.startsWith(item.href)
  );
  const [isOpen, setIsOpen] = useState(isActiveInGroup);

  // Map href to count key
  const getCountForHref = (href: string): number => {
    const countMap: Record<string, keyof typeof counts> = {
      '/accounts/bank': 'bank',
      '/accounts/real-estate': 'realEstate',
      '/accounts/stocks': 'stocks',
      '/accounts/crypto': 'crypto',
      '/accounts/superannuation': 'superannuation',
      '/accounts/personal-assets': 'personalAssets',
      '/accounts/business-assets': 'businessAssets',
      '/accounts/debts': 'debts',
    };
    const key = countMap[href];
    return key ? counts[key] || 0 : 0;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-1 items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-text-muted hover:text-sidebar-text transition-colors min-touch-target"
          aria-expanded={isOpen}
        >
          <span>{group.name}</span>
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isOpen && 'rotate-90'
            )}
          />
        </button>
        {group.addHref && (
          <a
            href={group.addHref}
            className="p-2 text-sidebar-text-muted hover:text-primary-500 hover:bg-sidebar-hover rounded-lg transition-colors mr-1"
            title={`Add ${group.name.toLowerCase()}`}
          >
            <Plus className="h-4 w-4" />
          </a>
        )}
      </div>
      <div
        className={cn(
          'space-y-0.5 overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {group.items.map((item) => {
          const count = getCountForHref(item.href);
          const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');

          return (
            <a
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 min-touch-target',
                isActive
                  ? 'bg-sidebar-active text-white shadow-md'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:translate-x-0.5'
              )}
            >
              <span className={cn(
                'flex-shrink-0 transition-colors',
                isActive ? 'text-primary-300' : 'text-sidebar-text-muted'
              )}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.name}</span>
              <CountBadge count={count} />
            </a>
          );
        })}
      </div>
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const counts = getAccountCounts();

  // Close mobile menu when clicking a link
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl bg-bg-elevated text-text-primary shadow-lg lg:hidden btn-press min-touch-target"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-bg-base/80 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'sidebar flex flex-col transition-transform duration-300',
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0 open' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        {/* Logo & Close Button */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border-subtle">
          <a href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 shadow-md group-hover:shadow-glow transition-shadow">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-lg font-display font-semibold text-text-primary">Finance</span>
          </a>
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:bg-sidebar-hover hover:text-text-primary lg:hidden min-touch-target"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4" onClick={handleLinkClick}>
          {navigation.map((item) => {
            if (isNavGroup(item)) {
              return (
                <NavGroupComponent
                  key={item.name}
                  group={item}
                  currentPath={currentPath}
                  counts={counts}
                />
              );
            }
            const isActive = currentPath === item.href;
            return (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 min-touch-target',
                  isActive
                    ? 'bg-sidebar-active text-white shadow-md'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:translate-x-0.5'
                )}
              >
                <span className={cn(
                  'flex-shrink-0',
                  isActive ? 'text-primary-300' : 'text-sidebar-text-muted'
                )}>
                  {item.icon}
                </span>
                {item.name}
              </a>
            );
          })}
        </nav>

        {/* AI Assistant Quick Access */}
        <div className="px-3 py-2">
          <a
            href="/ai"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm bg-gradient-to-r from-primary-900/50 to-primary-800/30 border border-primary-700/30 text-primary-300 hover:from-primary-900/70 hover:to-primary-800/50 transition-all group"
          >
            <Sparkles className="h-5 w-5 text-primary-400 group-hover:animate-pulse" />
            <span className="font-medium">AI Assistant</span>
          </a>
        </div>

        {/* Settings & User */}
        <div className="border-t border-border-subtle p-3 space-y-2" onClick={handleLinkClick}>
          <a
            href="/settings"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 min-touch-target',
              currentPath.startsWith('/settings')
                ? 'bg-sidebar-active text-white'
                : 'text-sidebar-text hover:bg-sidebar-hover'
            )}
          >
            <Settings className="h-5 w-5 text-sidebar-text-muted" />
            Settings
          </a>

          {user && (
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-bg-surface/50">
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-medium text-white">
                  {user.name?.[0] || user.email[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {user.name || 'User'}
                </p>
                <p className="truncate text-xs text-text-muted">{user.email}</p>
              </div>
              <form action="/api/auth/sign-out" method="POST">
                <button
                  type="submit"
                  className="rounded-lg p-2 text-text-muted hover:bg-sidebar-hover hover:text-danger transition-colors min-touch-target"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
