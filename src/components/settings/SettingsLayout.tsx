import { useState } from 'react';
import { DataExport } from './DataExport';
import { CategoryRulesManager } from './CategoryRulesManager';
import { CategoriesManager } from './CategoriesManager';
import { AIProviderSettings } from '../ai/AIProviderSettings';
import { ApiKeysSettings } from './ApiKeysSettings';
import { HouseholdManagement } from '../household/HouseholdManagement';
import { NotificationsSettings } from './NotificationsSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { SecuritySettings } from './SecuritySettings';
import { DataManagementSettings } from './DataManagementSettings';
import {
  Download,
  Tags,
  Tag,
  Bot,
  Bell,
  Palette,
  Shield,
  Database,
  ChevronRight,
  Key,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';

type SettingsSection = 'household' | 'export' | 'categories-manage' | 'categories' | 'ai' | 'api-keys' | 'notifications' | 'appearance' | 'security' | 'data';

interface SettingsItem {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
  description: string;
  component: React.ReactNode;
}

const settingsItems: SettingsItem[] = [
  {
    id: 'household',
    label: 'Household',
    icon: <Users className="h-5 w-5" />,
    description: 'Manage household members and invites',
    component: <HouseholdManagement />,
  },
  {
    id: 'export',
    label: 'Data Export',
    icon: <Download className="h-5 w-5" />,
    description: 'Export your data in JSON or CSV format',
    component: <DataExport />,
  },
  {
    id: 'categories-manage',
    label: 'Categories',
    icon: <Tag className="h-5 w-5" />,
    description: 'Manage transaction categories',
    component: <CategoriesManager />,
  },
  {
    id: 'categories',
    label: 'Category Rules',
    icon: <Tags className="h-5 w-5" />,
    description: 'Manage auto-categorization rules',
    component: <CategoryRulesManager />,
  },
  {
    id: 'ai',
    label: 'AI Providers',
    icon: <Bot className="h-5 w-5" />,
    description: 'Configure AI integration settings',
    component: <AIProviderSettings />,
  },
  {
    id: 'api-keys',
    label: 'API Keys',
    icon: <Key className="h-5 w-5" />,
    description: 'Manage programmatic API access',
    component: <ApiKeysSettings />,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell className="h-5 w-5" />,
    description: 'Manage notification preferences',
    component: <NotificationsSettings />,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: <Palette className="h-5 w-5" />,
    description: 'Customize the look and feel',
    component: <AppearanceSettings />,
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield className="h-5 w-5" />,
    description: 'Security and privacy settings',
    component: <SecuritySettings />,
  },
  {
    id: 'data',
    label: 'Data Management',
    icon: <Database className="h-5 w-5" />,
    description: 'Manage your data and storage',
    component: <DataManagementSettings />,
  },
];

export function SettingsLayout() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('household');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeItem = settingsItems.find(item => item.id === activeSection);

  return (
    <div className="space-y-16">
      <PageHeader label="SETTINGS" title="Preferences" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile Menu Toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between p-4 rounded-lg border"
            style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-3">
              {activeItem?.icon}
              <span className="font-medium text-[var(--color-text-primary)]">{activeItem?.label}</span>
            </div>
            <ChevronRight
              className={cn(
                'h-5 w-5 transition-transform text-[var(--color-text-muted)]',
                isMobileMenuOpen ? 'rotate-90' : ''
              )}
            />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav
          className={cn(
            'lg:w-64 flex-shrink-0 space-y-1',
            isMobileMenuOpen ? 'block' : 'hidden lg:block'
          )}
        >
          {settingsItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                activeSection === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-[var(--color-bg-surface)]'
              )}
            >
              {item.icon}
              <div className="flex-1 min-w-0">
                <div className="font-medium">{item.label}</div>
                <div
                  className={cn(
                    'text-xs truncate',
                    activeSection === item.id
                      ? 'text-primary-foreground/80'
                      : 'text-[var(--color-text-muted)]'
                  )}
                >
                  {item.description}
                </div>
              </div>
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="lg:hidden mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-[var(--color-text-primary)]">
              {activeItem?.icon}
              {activeItem?.label}
            </h2>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">
              {activeItem?.description}
            </p>
          </div>
          {activeItem?.component}
        </div>
      </div>
    </div>
  );
}
