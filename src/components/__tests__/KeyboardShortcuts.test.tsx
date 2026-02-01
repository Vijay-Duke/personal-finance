/**
 * Keyboard Shortcuts Component Tests
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  KeyboardShortcutsProvider, 
  useKeyboardShortcuts,
  useShortcut,
  useGlobalShortcuts 
} from '../KeyboardShortcuts';

// Test component that uses the context
function TestComponent() {
  const { showHelp, setShowHelp } = useKeyboardShortcuts();
  
  useGlobalShortcuts();
  
  return (
    <div>
      <button onClick={() => setShowHelp(true)}>Show Help</button>
      {showHelp && <div data-testid="help-modal">Help Modal</div>}
    </div>
  );
}

function CustomShortcutComponent() {
  const [pressed, setPressed] = React.useState(false);
  
  useShortcut('x', () => setPressed(true), ['ctrl']);
  
  return <div data-testid="pressed">{pressed ? 'Pressed' : 'Not Pressed'}</div>;
}

describe('KeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('KeyboardShortcutsProvider', () => {
    it('should provide shortcuts context', () => {
      render(
        <KeyboardShortcutsProvider>
          <TestComponent />
        </KeyboardShortcutsProvider>
      );

      expect(screen.getByText('Show Help')).toBeInTheDocument();
    });

    it('should show help modal when triggered', () => {
      render(
        <KeyboardShortcutsProvider>
          <TestComponent />
        </KeyboardShortcutsProvider>
      );

      fireEvent.click(screen.getByText('Show Help'));
      
      expect(screen.getByTestId('help-modal')).toBeInTheDocument();
    });

    it('should show help modal on ? key press', () => {
      render(
        <KeyboardShortcutsProvider>
          <TestComponent />
        </KeyboardShortcutsProvider>
      );

      fireEvent.keyDown(window, { key: '?' });
      
      expect(screen.getByTestId('help-modal')).toBeInTheDocument();
    });

    it('should close help modal on Escape key', () => {
      render(
        <KeyboardShortcutsProvider>
          <TestComponent />
        </KeyboardShortcutsProvider>
      );

      // Open help
      fireEvent.keyDown(window, { key: '?' });
      expect(screen.getByTestId('help-modal')).toBeInTheDocument();
      
      // Close with Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByTestId('help-modal')).not.toBeInTheDocument();
    });
  });

  describe('useShortcut', () => {
    it('should trigger custom shortcut', () => {
      render(
        <KeyboardShortcutsProvider>
          <CustomShortcutComponent />
        </KeyboardShortcutsProvider>
      );

      expect(screen.getByTestId('pressed')).toHaveTextContent('Not Pressed');

      fireEvent.keyDown(window, { key: 'x', ctrlKey: true });

      expect(screen.getByTestId('pressed')).toHaveTextContent('Pressed');
    });
  });

  describe('Global Shortcuts', () => {
    it('should navigate to dashboard on Cmd+G', () => {
      const originalLocation = window.location;
      // @ts-ignore
      delete window.location;
      window.location = { href: '' } as any;

      render(
        <KeyboardShortcutsProvider>
          <TestComponent />
        </KeyboardShortcutsProvider>
      );

      fireEvent.keyDown(window, { key: 'g', metaKey: true });

      expect(window.location.href).toBe('/');

      // @ts-expect-error Restoring original window.location
      window.location = originalLocation;
    });

    it('should not trigger shortcuts when typing in input', () => {
      const originalLocation = window.location;
      // @ts-ignore
      delete window.location;
      window.location = { href: '/current' } as any;

      render(
        <KeyboardShortcutsProvider>
          <div>
            <input data-testid="input" />
            <TestComponent />
          </div>
        </KeyboardShortcutsProvider>
      );

      const input = screen.getByTestId('input');
      input.focus();

      fireEvent.keyDown(input, { key: 'g', metaKey: true });

      // Should not navigate (input focused)
      expect(window.location.href).toBe('/current');

      // @ts-expect-error Restoring original window.location
      window.location = originalLocation;
    });

    it('should trigger command palette event on Cmd+K', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      render(
        <KeyboardShortcutsProvider>
          <TestComponent />
        </KeyboardShortcutsProvider>
      );

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'shortcut:command-palette' })
      );
    });

    it('should trigger new transaction event on Cmd+N', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      render(
        <KeyboardShortcutsProvider>
          <TestComponent />
        </KeyboardShortcutsProvider>
      );

      fireEvent.keyDown(window, { key: 'n', metaKey: true });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'shortcut:new-transaction' })
      );
    });

    it('should focus search on / key', () => {
      const input = document.createElement('input');
      input.setAttribute('data-search-input', '');
      document.body.appendChild(input);
      
      const focusSpy = vi.spyOn(input, 'focus');

      render(
        <KeyboardShortcutsProvider>
          <TestComponent />
        </KeyboardShortcutsProvider>
      );

      fireEvent.keyDown(window, { key: '/' });

      expect(focusSpy).toHaveBeenCalled();

      document.body.removeChild(input);
    });
  });
});
