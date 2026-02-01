/**
 * Keyboard Shortcuts Provider
 * Adds keyboard navigation and shortcuts throughout the app
 */

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';

export interface Shortcut {
  key: string;
  modifiers?: ('ctrl' | 'meta' | 'alt' | 'shift')[];
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

interface KeyboardShortcutsContextType {
  shortcuts: Shortcut[];
  registerShortcut: (shortcut: Shortcut) => void;
  unregisterShortcut: (key: string) => void;
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null);

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutsProvider');
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  const registerShortcut = useCallback((shortcut: Shortcut) => {
    setShortcuts(prev => {
      // Replace existing shortcut with same key
      const filtered = prev.filter(s => s.key !== shortcut.key);
      return [...filtered, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts(prev => prev.filter(s => s.key !== key));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.isContentEditable
      ) {
        // Allow Escape and Cmd/Ctrl+K even in inputs
        if (event.key !== 'Escape' && !(event.metaKey || event.ctrlKey) && event.key !== 'k') {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
        
        const matchesModifiers = (shortcut.modifiers || []).every(mod => {
          switch (mod) {
            case 'ctrl': return event.ctrlKey;
            case 'meta': return event.metaKey;
            case 'alt': return event.altKey;
            case 'shift': return event.shiftKey;
            default: return false;
          }
        });

        if (matchesKey && matchesModifiers) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return (
    <KeyboardShortcutsContext.Provider
      value={{ shortcuts, registerShortcut, unregisterShortcut, showHelp, setShowHelp }}
    >
      {children}
      {showHelp && <ShortcutsHelpModal onClose={() => setShowHelp(false)} shortcuts={shortcuts} />}
    </KeyboardShortcutsContext.Provider>
  );
}

/**
 * Global shortcuts hook - registers common app shortcuts
 */
export function useGlobalShortcuts() {
  const { registerShortcut, setShowHelp } = useKeyboardShortcuts();

  useEffect(() => {
    // Navigation shortcuts
    registerShortcut({
      key: 'g',
      modifiers: ['meta'],
      description: 'Go to Dashboard',
      action: () => window.location.href = '/',
    });

    registerShortcut({
      key: 't',
      modifiers: ['meta'],
      description: 'Go to Transactions',
      action: () => window.location.href = '/cashflow',
    });

    registerShortcut({
      key: 'a',
      modifiers: ['meta'],
      description: 'Go to Accounts',
      action: () => window.location.href = '/accounts',
    });

    // Action shortcuts
    registerShortcut({
      key: 'n',
      modifiers: ['meta'],
      description: 'New Transaction',
      action: () => {
        // Dispatch custom event for components to listen to
        window.dispatchEvent(new CustomEvent('shortcut:new-transaction'));
      },
    });

    registerShortcut({
      key: 'k',
      modifiers: ['meta'],
      description: 'Open Command Palette',
      action: () => {
        window.dispatchEvent(new CustomEvent('shortcut:command-palette'));
      },
    });

    registerShortcut({
      key: '/',
      description: 'Focus Search',
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLElement;
        searchInput?.focus();
      },
    });

    // Help shortcut
    registerShortcut({
      key: '?',
      description: 'Show Keyboard Shortcuts',
      action: () => setShowHelp(true),
    });

    registerShortcut({
      key: 'Escape',
      description: 'Close Modal / Cancel',
      action: () => {
        setShowHelp(false);
        window.dispatchEvent(new CustomEvent('shortcut:escape'));
      },
    });

    // Refresh data
    registerShortcut({
      key: 'r',
      modifiers: ['meta'],
      description: 'Refresh Prices',
      action: () => {
        window.dispatchEvent(new CustomEvent('shortcut:refresh-prices'));
      },
    });
  }, [registerShortcut, setShowHelp]);
}

/**
 * Shortcuts Help Modal
 */
function ShortcutsHelpModal({ onClose, shortcuts }: { onClose: () => void; shortcuts: Shortcut[] }) {
  // Group shortcuts by category
  const navigation = shortcuts.filter(s => 
    s.description.includes('Go to') || s.key === 'k'
  );
  
  const actions = shortcuts.filter(s => 
    s.description.includes('New') || 
    s.description.includes('Refresh') ||
    s.description.includes('Search')
  );
  
  const other = shortcuts.filter(s => 
    !navigation.includes(s) && !actions.includes(s)
  );

  const formatShortcut = (s: Shortcut) => {
    const mods = (s.modifiers || []).map(m => {
      if (m === 'meta') return /mac/i.test(navigator.userAgent) ? '⌘' : 'Ctrl';
      if (m === 'ctrl') return 'Ctrl';
      if (m === 'alt') return 'Alt';
      if (m === 'shift') return 'Shift';
      return m;
    });
    return [...mods, s.key.toUpperCase()].join(' + ');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {navigation.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Navigation</h3>
              <div className="space-y-1">
                {navigation.map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span className="text-gray-700">{s.description}</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {formatShortcut(s)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {actions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Actions</h3>
              <div className="space-y-1">
                {actions.map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span className="text-gray-700">{s.description}</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {formatShortcut(s)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {other.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">General</h3>
              <div className="space-y-1">
                {other.map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span className="text-gray-700">{s.description}</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {formatShortcut(s)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-sm text-gray-500 text-center">
          Press <kbd className="px-1 bg-gray-100 rounded">?</kbd> anytime to show this help
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to listen for specific shortcuts in components
 */
export function useShortcut(key: string, action: () => void, modifiers?: ('ctrl' | 'meta' | 'alt' | 'shift')[]) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    const shortcutKey = `${modifiers?.join('-') || ''}${key}`;
    registerShortcut({
      key,
      modifiers,
      description: '',
      action,
    });

    return () => unregisterShortcut(shortcutKey);
  }, [key, action, modifiers, registerShortcut, unregisterShortcut]);
}

export default KeyboardShortcutsProvider;
