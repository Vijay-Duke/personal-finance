import { Card } from '@/components/ui/card';
import type { ReactNode } from 'react';

interface AdminStatCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
}

export function AdminStatCard({ icon, label, value }: AdminStatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </Card>
  );
}
