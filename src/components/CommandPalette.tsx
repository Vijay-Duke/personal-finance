/**
 * Command Palette Component
 *
 * A searchable command palette triggered by Cmd+K (or Ctrl+K).
 * Provides quick navigation and actions throughout the app.
 *
 * Features:
 * - Quick navigation to pages
 * - Common actions (new transaction, refresh prices, etc.)
 * - Fuzzy search matching
 * - Keyboard navigation (arrow keys, enter, escape)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Home,
  Wallet,
  PiggyBank,
  Target,
  Shield,
  TrendingUp,
  Settings,
  User,
  Plus,
  RefreshCw,
  CreditCard,
  Building2,
  Bitcoin,
  Landmark,
  Briefcase,
  Car,
  Receipt,
  Bot,
  Bell,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'Navigation' | 'Actions' | 'Accounts' | 'Settings';
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build command list
  const getCommands = useCallback((): CommandItem[] => {
    const commands: CommandItem[] = [
      // Navigation
      {
        id: 'nav-dashboard',
        title: 'Dashboard',
        description: 'Go to dashboard overview',
        icon: <Home className="h-4 w-4" />,
        shortcut: '⌘G',
        action: () => window.location.href = '/',
        category: 'Navigation',
      },
      {
        id: 'nav-cashflow',
        title: 'Cashflow & Transactions',
        description: 'View transactions and cashflow',
        icon: <Receipt className="h-4 w-4" />,
        shortcut: '⌘T',
        action: () => window.location.href = '/cashflow',
        category: 'Navigation',
      },
      {
        id: 'nav-accounts',
        title: 'All Accounts',
        description: 'View all accounts',
        icon: <Wallet className="h-4 w-4" />,
        shortcut: '⌘A',
        action: () => window.location.href = '/accounts',
        category: 'Navigation',
      },
      {
        id: 'nav-budgets',
        title: 'Budgets',
        description: 'Manage your budgets',
        icon: <PiggyBank className="h-4 w-4" />,
        action: () => window.location.href = '/budgets',
        category: 'Navigation',
      },
      {
        id: 'nav-goals',
        title: 'Goals',
        description: 'Track savings goals',
        icon: <Target className="h-4 w-4" />,
        action: () => window.location.href = '/goals',
        category: 'Navigation',
      },
      {
        id: 'nav-insurance',
        title: 'Insurance',
        description: 'Manage insurance policies',
        icon: <Shield className="h-4 w-4" />,
        action: () => window.location.href = '/insurance',
        category: 'Navigation',
      },
      {
        id: 'nav-ai',
        title: 'AI Assistant',
        description: 'Chat with AI financial assistant',
        icon: <Bot className="h-4 w-4" />,
        action: () => window.dispatchEvent(new CustomEvent('ai:open-chat')),
        category: 'Navigation',
      },

      // Account types
      {
        id: 'nav-bank-accounts',
        title: 'Bank Accounts',
        description: 'Checking and savings accounts',
        icon: <Landmark className="h-4 w-4" />,
        action: () => window.location.href = '/accounts/bank',
        category: 'Accounts',
      },
      {
        id: 'nav-stocks',
        title: 'Stocks & ETFs',
        description: 'Stock market investments',
        icon: <TrendingUp className="h-4 w-4" />,
        action: () => window.location.href = '/accounts/stocks',
        category: 'Accounts',
      },
      {
        id: 'nav-crypto',
        title: 'Cryptocurrency',
        description: 'Crypto holdings',
        icon: <Bitcoin className="h-4 w-4" />,
        action: () => window.location.href = '/accounts/crypto',
        category: 'Accounts',
      },
      {
        id: 'nav-real-estate',
        title: 'Real Estate',
        description: 'Property investments',
        icon: <Building2 className="h-4 w-4" />,
        action: () => window.location.href = '/accounts/real-estate',
        category: 'Accounts',
      },
      {
        id: 'nav-super',
        title: 'Superannuation',
        description: 'Retirement accounts',
        icon: <Briefcase className="h-4 w-4" />,
        action: () => window.location.href = '/accounts/superannuation',
        category: 'Accounts',
      },
      {
        id: 'nav-debts',
        title: 'Debts & Loans',
        description: 'Mortgages, credit cards, loans',
        icon: <CreditCard className="h-4 w-4" />,
        action: () => window.location.href = '/accounts/debts',
        category: 'Accounts',
      },
      {
        id: 'nav-personal-assets',
        title: 'Personal Assets',
        description: 'Vehicles, jewelry, valuables',
        icon: <Car className="h-4 w-4" />,
        action: () => window.location.href = '/accounts/personal-assets',
        category: 'Accounts',
      },

      // Actions
      {
        id: 'action-new-transaction',
        title: 'New Transaction',
        description: 'Add a new transaction',
        icon: <Plus className="h-4 w-4" />,
        shortcut: '⌘N',
        action: () => window.dispatchEvent(new CustomEvent('shortcut:new-transaction')),
        category: 'Actions',
      },
      {
        id: 'action-refresh-prices',
        title: 'Refresh Prices',
        description: 'Update stock and crypto prices',
        icon: <RefreshCw className="h-4 w-4" />,
        shortcut: '⌘R',
        action: () => window.dispatchEvent(new CustomEvent('shortcut:refresh-prices')),
        category: 'Actions',
      },
      {
        id: 'action-notifications',
        title: 'Notifications',
        description: 'View notifications',
        icon: <Bell className="h-4 w-4" />,
        action: () => window.dispatchEvent(new CustomEvent('notifications:open')),
        category: 'Actions',
      },

      // Settings
      {
        id: 'settings-profile',
        title: 'Profile',
        description: 'Manage your profile',
        icon: <User className="h-4 w-4" />,
        action: () => window.location.href = '/profile',
        category: 'Settings',
      },
      {
        id: 'settings-general',
        title: 'Settings',
        description: 'App settings and preferences',
        icon: <Settings className="h-4 w-4" />,
        action: () => window.location.href = '/settings',
        category: 'Settings',
      },
    ];

    return commands;
  }, []);

  // Filter commands based on search
  const filteredCommands = React.useMemo(() => {
    const commands = getCommands();
    if (!search.trim()) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(searchLower) ||
        cmd.description?.toLowerCase().includes(searchLower) ||
        cmd.category.toLowerCase().includes(searchLower)
    );
  }, [search, getCommands]);

  // Group commands by category
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('shortcut:command-palette', () => setIsOpen(true));

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('shortcut:command-palette', () => setIsOpen(true));
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredCommands.length - 1)
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const command = filteredCommands[selectedIndex];
        if (command) {
          command.action();
          setIsOpen(false);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [filteredCommands, selectedIndex]
  );

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex];
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[20vh]"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-card-bg border border-border rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center px-4 border-b border-border">
          <Search className="h-5 w-5 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="flex-1 px-4 py-4 outline-none bg-transparent text-text-primary placeholder:text-text-muted"
          />
          <kbd className="hidden sm:inline-block px-2 py-1 bg-content-bg rounded text-xs text-text-muted border border-border">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto py-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-muted">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {category}
                </div>
                {commands.map((command) => {
                  const globalIndex = filteredCommands.findIndex(
                    (c) => c.id === command.id
                  );
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <button
                      key={command.id}
                      onClick={() => {
                        command.action();
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={cn(
                        'w-full px-4 py-3 flex items-center gap-3 text-left transition-colors',
                        isSelected
                          ? 'bg-primary-600/10 text-primary-400'
                          : 'text-text-primary hover:bg-content-bg'
                      )}
                    >
                      <span
                        className={cn(
                          'p-2 rounded',
                          isSelected ? 'bg-primary-600/20' : 'bg-content-bg'
                        )}
                      >
                        {command.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{command.title}</div>
                        {command.description && (
                          <div
                            className={cn(
                              'text-sm truncate',
                              isSelected ? 'text-primary-400' : 'text-text-muted'
                            )}
                          >
                            {command.description}
                          </div>
                        )}
                      </div>
                      {command.shortcut && (
                        <kbd
                          className={cn(
                            'px-2 py-1 rounded text-xs border border-border',
                            isSelected
                              ? 'bg-primary-600/20 text-primary-400'
                              : 'bg-content-bg text-text-muted'
                          )}
                        >
                          {command.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-content-bg border-t border-border flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card-bg rounded border border-border">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-card-bg rounded border border-border">↓</kbd>
              <span className="ml-1">to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card-bg rounded border border-border">↵</kbd>
              <span className="ml-1">to select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="h-3 w-3" />
            <span>K</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
