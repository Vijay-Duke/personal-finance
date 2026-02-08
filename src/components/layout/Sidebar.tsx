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
  FolderOpen,
  ShieldCheck,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { signOut } from '@/lib/auth/client';
import { useFocusTrap } from '@/hooks/useFocusTrap';

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
    name: 'Home',
    href: '/',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: 'Accounts',
    href: '/accounts',
    icon: <FolderOpen className="h-5 w-5" />,
  },
  {
    name: 'Assets',
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

function NavGroupComponent({
  group,
  currentPath,
  onLinkClick,
}: {
  group: NavGroup;
  currentPath: string;
  onLinkClick: () => void;
}) {
  const isActiveInGroup = group.items.some((item) =>
    currentPath.startsWith(item.href)
  );
  const [isOpen, setIsOpen] = useState(isActiveInGroup);

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium uppercase tracking-[0.15em] text-text-muted hover:text-text-secondary transition-colors rounded-lg"
        aria-expanded={isOpen}
      >
        <span>{group.name}</span>
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            isOpen && 'rotate-90'
          )}
        />
      </button>
      <div
        className={cn(
          'space-y-0.5 overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {group.items.map((item) => {
          const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
          return (
            <a
              key={item.name}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
              )}
            >
              <span className={cn(
                'flex-shrink-0',
                isActive ? 'text-primary-500' : 'text-text-muted'
              )}>
                {item.icon}
              </span>
              <span className="truncate">{item.name}</span>
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
    role?: string;
  };
}

export function Sidebar({ currentPath, user }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const focusTrapRef = useFocusTrap(isOpen);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Menu Button — top-left of top bar */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-3.5 z-40 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-bg-overlay backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Panel (left side) */}
      <aside
        ref={focusTrapRef}
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] flex flex-col',
          'bg-card-bg border-r border-border shadow-xl',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          <span className="text-sm font-medium text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>Navigation</span>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            if (isNavGroup(item)) {
              return (
                <NavGroupComponent
                  key={item.name}
                  group={item}
                  currentPath={currentPath}
                  onLinkClick={handleLinkClick}
                />
              );
            }
            const isActive = currentPath === item.href;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200',
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
                )}
              >
                <span className={cn(
                  'flex-shrink-0',
                  isActive ? 'text-primary-500' : 'text-text-muted'
                )}>
                  {item.icon}
                </span>
                {item.name}
              </a>
            );
          })}
        </nav>

        {/* Admin, Settings & User */}
        <div className="border-t border-border p-3 space-y-2">
          {user?.role === 'super_admin' && (
            <a
              href="/admin"
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200',
                currentPath.startsWith('/admin')
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
              )}
            >
              <ShieldCheck className="h-5 w-5 text-text-muted" />
              Admin
            </a>
          )}
          <a
            href="/settings"
            onClick={handleLinkClick}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200',
              currentPath.startsWith('/settings')
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
            )}
          >
            <Settings className="h-5 w-5 text-text-muted" />
            Settings
          </a>

          {user && (
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                  {user.name?.[0] || user.email[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {user.name || 'User'}
                </p>
                <p className="truncate text-xs text-text-muted">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  window.location.href = '/auth/login';
                }}
                className="rounded-lg p-2 text-text-muted hover:bg-bg-surface hover:text-danger transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
