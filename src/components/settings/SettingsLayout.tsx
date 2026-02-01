import { useState } from 'react';
import { DataExport } from './DataExport';
import { CategoryRulesManager } from './CategoryRulesManager';
import { AIProviderSettings } from '../ai/AIProviderSettings';
import { ApiKeysSettings } from './ApiKeysSettings';
import {
  Download,
  Tags,
  Bot,
  Bell,
  Palette,
  Shield,
  Database,
  ChevronRight,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsSection = 'export' | 'categories' | 'ai' | 'api-keys' | 'notifications' | 'appearance' | 'security' | 'data';

interface SettingsItem {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
  description: string;
  component: React.ReactNode;
}

const settingsItems: SettingsItem[] = [
  {
    id: 'export',
    label: 'Data Export',
    icon: <Download className="h-5 w-5" />,
    description: 'Export your data in JSON or CSV format',
    component: <DataExport />,
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

// Placeholder components for settings sections
function NotificationsSettings() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 text-muted-foreground">
        <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <h3 className="text-lg font-medium">Notification Preferences</h3>
        <p className="mt-1">Notification settings will be available in a future update.</p>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 text-muted-foreground">
        <Palette className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <h3 className="text-lg font-medium">Appearance Settings</h3>
        <p className="mt-1">Theme and appearance customization coming soon.</p>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 text-muted-foreground">
        <Shield className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <h3 className="text-lg font-medium">Security Settings</h3>
        <p className="mt-1">Additional security settings will be available in a future update.</p>
      </div>
    </div>
  );
}

function DataManagementSettings() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 text-muted-foreground">
        <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <h3 className="text-lg font-medium">Data Management</h3>
        <p className="mt-1">Advanced data management features coming soon.</p>
      </div>
    </div>
  );
}

export function SettingsLayout() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('export');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeItem = settingsItems.find(item => item.id === activeSection);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full flex items-center justify-between p-4 bg-card rounded-lg border"
        >
          <div className="flex items-center gap-3">
            {activeItem?.icon}
            <span className="font-medium">{activeItem?.label}</span>
          </div>
          <ChevronRight
            className={cn(
              'h-5 w-5 transition-transform',
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
                : 'hover:bg-muted'
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
                    : 'text-muted-foreground'
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
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {activeItem?.icon}
            {activeItem?.label}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {activeItem?.description}
          </p>
        </div>
        {activeItem?.component}
      </div>
    </div>
  );
}
