import { cn } from '@/lib/utils';
import { Button } from './button';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  type: 'transactions' | 'accounts' | 'budgets' | 'goals' | 'categories' | 'generic';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

// Custom SVG illustrations for each empty state
const illustrations = {
  // Wallet with moth flying out - humorous take on empty wallet
  transactions: (
    <svg
      viewBox="0 0 200 200"
      className="w-32 h-32 text-text-muted"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Wallet body */}
      <rect
        x="40"
        y="80"
        width="120"
        height="80"
        rx="8"
        className="fill-bg-surface stroke-border"
        strokeWidth="2"
      />
      {/* Wallet flap */}
      <path
        d="M40 95 C40 85 50 75 60 75 L140 75 C150 75 160 85 160 95"
        className="stroke-border"
        strokeWidth="2"
        fill="none"
      />
      {/* Wallet clasp */}
      <circle cx="100" cy="90" r="6" className="fill-primary-600" />
      {/* Card slots */}
      <rect x="50" y="105" width="40" height="8" rx="2" className="fill-border" />
      <rect x="50" y="120" width="30" height="8" rx="2" className="fill-border" />
      {/* Moth body */}
      <ellipse cx="130" cy="50" rx="6" ry="10" className="fill-text-muted" />
      {/* Moth wings - animated */}
      <path
        d="M130 50 Q115 35 105 45 Q115 50 130 50"
        className="fill-text-muted opacity-60"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 130 50; 15 130 50; 0 130 50"
          dur="0.5s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d="M130 50 Q145 35 155 45 Q145 50 130 50"
        className="fill-text-muted opacity-60"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 130 50; -15 130 50; 0 130 50"
          dur="0.5s"
          repeatCount="indefinite"
        />
      </path>
      {/* Moth antennae */}
      <path d="M127 42 Q125 35 120 32" className="stroke-text-muted" strokeWidth="1.5" fill="none" />
      <path d="M133 42 Q135 35 140 32" className="stroke-text-muted" strokeWidth="1.5" fill="none" />
      {/* Dust particles */}
      <circle cx="115" cy="60" r="1.5" className="fill-text-muted opacity-40">
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="145" cy="55" r="1" className="fill-text-muted opacity-30">
        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  ),

  // Piggy bank waiting to be filled
  accounts: (
    <svg
      viewBox="0 0 200 200"
      className="w-32 h-32 text-text-muted"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Piggy body */}
      <ellipse cx="100" cy="110" rx="55" ry="45" className="fill-bg-surface stroke-border" strokeWidth="2" />
      {/* Piggy head */}
      <circle cx="145" cy="95" r="25" className="fill-bg-surface stroke-border" strokeWidth="2" />
      {/* Snout */}
      <ellipse cx="165" cy="100" rx="10" ry="8" className="fill-primary-900 stroke-border" strokeWidth="2" />
      <circle cx="162" cy="98" r="2" className="fill-border" />
      <circle cx="168" cy="98" r="2" className="fill-border" />
      {/* Eye */}
      <circle cx="140" cy="88" r="4" className="fill-text-primary" />
      <circle cx="141" cy="87" r="1.5" className="fill-bg-surface" />
      {/* Ear */}
      <ellipse cx="135" cy="72" rx="8" ry="12" className="fill-bg-surface stroke-border" strokeWidth="2" />
      {/* Legs */}
      <rect x="60" y="140" width="12" height="20" rx="4" className="fill-bg-surface stroke-border" strokeWidth="2" />
      <rect x="85" y="145" width="12" height="15" rx="4" className="fill-bg-surface stroke-border" strokeWidth="2" />
      <rect x="110" y="145" width="12" height="15" rx="4" className="fill-bg-surface stroke-border" strokeWidth="2" />
      <rect x="135" y="140" width="12" height="20" rx="4" className="fill-bg-surface stroke-border" strokeWidth="2" />
      {/* Tail */}
      <path
        d="M45 105 Q35 100 38 90 Q42 95 45 100"
        className="stroke-border"
        strokeWidth="2"
        fill="none"
      />
      {/* Coin slot */}
      <rect x="90" y="68" width="25" height="4" rx="2" className="fill-primary-600" />
      {/* Coin hovering - animated */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -5; 0 0"
          dur="1.5s"
          repeatCount="indefinite"
        />
        <ellipse cx="102" cy="55" rx="10" ry="3" className="fill-primary-500 opacity-40" />
        <circle cx="102" cy="50" r="12" className="fill-primary-500 stroke-primary-600" strokeWidth="2" />
        <text x="102" y="54" textAnchor="middle" className="fill-primary-900 text-xs font-bold">$</text>
      </g>
    </svg>
  ),

  // Roadmap with "You are here" marker
  budgets: (
    <svg
      viewBox="0 0 200 200"
      className="w-32 h-32 text-text-muted"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Road */}
      <path
        d="M30 170 Q60 150 80 130 Q100 110 100 90 Q100 70 120 60 Q140 50 170 30"
        className="stroke-border"
        strokeWidth="20"
        strokeLinecap="round"
        fill="none"
      />
      {/* Road center line */}
      <path
        d="M30 170 Q60 150 80 130 Q100 110 100 90 Q100 70 120 60 Q140 50 170 30"
        className="stroke-primary-600"
        strokeWidth="2"
        strokeDasharray="8 8"
        fill="none"
      />
      {/* You are here marker */}
      <g transform="translate(78, 105)">
        <circle cx="0" cy="0" r="16" className="fill-primary-600">
          <animate attributeName="r" values="14;18;14" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="0" cy="0" r="8" className="fill-bg-elevated" />
        <circle cx="0" cy="0" r="4" className="fill-primary-500" />
      </g>
      {/* Flag at destination */}
      <g transform="translate(165, 25)">
        <line x1="0" y1="0" x2="0" y2="30" className="stroke-text-muted" strokeWidth="2" />
        <path d="M0 0 L20 7 L0 14 Z" className="fill-success" />
      </g>
      {/* Milestone markers */}
      <circle cx="50" cy="155" r="5" className="fill-success" />
      <circle cx="100" cy="90" r="5" className="fill-border" />
      <circle cx="135" cy="55" r="5" className="fill-border" />
    </svg>
  ),

  // Mountain peak with flag
  goals: (
    <svg
      viewBox="0 0 200 200"
      className="w-32 h-32 text-text-muted"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background mountains */}
      <path
        d="M0 170 L40 100 L80 140 L100 90 L140 130 L180 80 L200 120 L200 200 L0 200 Z"
        className="fill-bg-surface"
      />
      {/* Main mountain */}
      <path
        d="M50 180 L100 50 L150 180 Z"
        className="fill-border stroke-text-muted"
        strokeWidth="2"
      />
      {/* Snow cap */}
      <path
        d="M85 85 L100 50 L115 85 L105 80 L100 90 L95 80 Z"
        className="fill-text-primary"
      />
      {/* Flag pole */}
      <line x1="100" y1="50" x2="100" y2="25" className="stroke-text-primary" strokeWidth="2" />
      {/* Flag with animation */}
      <path
        d="M100 25 Q115 28 110 35 Q105 42 100 40 Z"
        className="fill-primary-500"
      >
        <animate
          attributeName="d"
          values="M100 25 Q115 28 110 35 Q105 42 100 40 Z;M100 25 Q120 30 115 35 Q108 40 100 40 Z;M100 25 Q115 28 110 35 Q105 42 100 40 Z"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
      {/* Stars around peak */}
      <g className="fill-primary-400">
        <circle cx="80" cy="35" r="2">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="125" cy="40" r="1.5">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="55" r="1.5">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
      {/* Clouds */}
      <g className="fill-bg-elevated opacity-80">
        <ellipse cx="40" cy="70" rx="20" ry="10" />
        <ellipse cx="55" cy="65" rx="15" ry="8" />
        <ellipse cx="160" cy="55" rx="18" ry="9" />
        <ellipse cx="175" cy="50" rx="12" ry="6" />
      </g>
    </svg>
  ),

  // Tag organization
  categories: (
    <svg
      viewBox="0 0 200 200"
      className="w-32 h-32 text-text-muted"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Folder base */}
      <rect x="30" y="70" width="140" height="100" rx="8" className="fill-bg-surface stroke-border" strokeWidth="2" />
      {/* Folder tab */}
      <path
        d="M30 78 L30 65 Q30 58 37 58 L70 58 L85 70 L163 70 Q170 70 170 77 L170 78"
        className="fill-bg-surface stroke-border"
        strokeWidth="2"
      />
      {/* Tags */}
      <g transform="translate(55, 95)">
        <rect x="0" y="0" width="50" height="25" rx="4" className="fill-primary-600" />
        <circle cx="8" cy="12.5" r="3" className="fill-bg-elevated" />
      </g>
      <g transform="translate(75, 115)">
        <rect x="0" y="0" width="60" height="25" rx="4" className="fill-info-bg stroke-info" strokeWidth="1" />
        <circle cx="8" cy="12.5" r="3" className="fill-bg-elevated" />
      </g>
      <g transform="translate(60, 135)">
        <rect x="0" y="0" width="45" height="25" rx="4" className="fill-success-bg stroke-success" strokeWidth="1" />
        <circle cx="8" cy="12.5" r="3" className="fill-bg-elevated" />
      </g>
      {/* Question marks */}
      <text x="80" y="112" className="fill-text-inverse text-xs font-bold">?</text>
      <text x="105" y="132" className="fill-info text-xs font-bold">?</text>
      <text x="82" y="152" className="fill-success text-xs font-bold">?</text>
      {/* Floating question */}
      <text x="140" cy="55" className="fill-text-muted text-2xl">
        <tspan>?</tspan>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </text>
    </svg>
  ),

  // Generic empty state
  generic: (
    <svg
      viewBox="0 0 200 200"
      className="w-32 h-32 text-text-muted"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Box */}
      <rect x="50" y="60" width="100" height="100" rx="8" className="fill-bg-surface stroke-border" strokeWidth="2" />
      {/* Box opening */}
      <path
        d="M50 80 L50 60 Q50 50 60 50 L140 50 Q150 50 150 60 L150 80"
        className="fill-bg-surface stroke-border"
        strokeWidth="2"
      />
      {/* Dashed lines inside box */}
      <line x1="70" y1="100" x2="130" y2="100" className="stroke-border" strokeWidth="2" strokeDasharray="4 4" />
      <line x1="70" y1="120" x2="110" y2="120" className="stroke-border" strokeWidth="2" strokeDasharray="4 4" />
      <line x1="70" y1="140" x2="120" y2="140" className="stroke-border" strokeWidth="2" strokeDasharray="4 4" />
      {/* Sparkles */}
      <g className="fill-primary-500">
        <path d="M45 70 L47 65 L49 70 L54 72 L49 74 L47 79 L45 74 L40 72 Z">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
        </path>
        <path d="M155 85 L156.5 81 L158 85 L162 86.5 L158 88 L156.5 92 L155 88 L151 86.5 Z" transform="scale(0.8)">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  ),
};

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('empty-state', className)}>
      <div className="empty-state-icon">
        {illustrations[type]}
      </div>
      <h3 className="text-xl font-display font-semibold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-text-muted text-sm max-w-md mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="gap-2">
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Preset empty states for common use cases
export const EmptyTransactions = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    type="transactions"
    title="No transactions yet"
    description="Start tracking your finances by adding your first transaction. You can also import transactions from your bank."
    actionLabel="Add Transaction"
    onAction={onAdd}
  />
);

export const EmptyAccounts = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    type="accounts"
    title="No accounts found"
    description="Add your first account to start tracking your net worth and managing your finances."
    actionLabel="Add Account"
    onAction={onAdd}
  />
);

export const EmptyBudgets = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    type="budgets"
    title="No budgets set up"
    description="Create budgets to track your spending and stay on top of your financial goals."
    actionLabel="Create Budget"
    onAction={onAdd}
  />
);

export const EmptyGoals = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    type="goals"
    title="No goals yet"
    description="Set financial goals to track your progress towards major milestones like saving for a house or retirement."
    actionLabel="Create Goal"
    onAction={onAdd}
  />
);
