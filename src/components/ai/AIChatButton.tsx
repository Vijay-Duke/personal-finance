import { useState } from 'react';
import { Button } from '../ui/button';
import { AIChatPanel } from './AIChatPanel';
import { MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AIChatButtonProps {
  variant?: 'default' | 'icon' | 'pill';
  className?: string;
}

export function AIChatButton({ variant = 'pill', className }: AIChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === 'pill' && (
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className={cn(
            'gap-2 border-border hover:bg-content-bg transition-all',
            className
          )}
        >
          <Sparkles className="h-4 w-4 text-primary-600" />
          <span>Ask AI</span>
        </Button>
      )}

      {variant === 'icon' && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className={cn(
            'text-text-muted hover:text-primary-600 hover:bg-primary-100',
            className
          )}
          title="Ask AI"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}

      {variant === 'default' && (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn('gap-2', className)}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Chat with AI</span>
        </Button>
      )}

      <AIChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
