import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTheme } from '@/components/theme/ThemeProvider';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes = [
  { value: 'light' as const, label: 'Light', icon: <Sun className="h-6 w-6" />, description: 'Clean and bright' },
  { value: 'dark' as const, label: 'Dark', icon: <Moon className="h-6 w-6" />, description: 'Easy on the eyes' },
  { value: 'system' as const, label: 'System', icon: <Monitor className="h-6 w-6" />, description: 'Match your device' },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <SectionHeader label="Settings" title="Appearance" />

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                  theme === t.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-border hover:border-border-subtle hover:bg-bg-surface'
                )}
              >
                <div className={cn(
                  'rounded-full p-2',
                  theme === t.value ? 'bg-primary-100' : 'bg-bg-surface'
                )}>
                  {t.icon}
                </div>
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs text-text-muted">{t.description}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
