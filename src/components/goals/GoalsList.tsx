/**
 * Zen Finance Goals — "Financial Goals"
 * Circular progress rings, zen language, breathing layout.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, type Variants } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CircularProgress } from '../ui/CircularProgress';
import { PageHeader } from '../ui/PageHeader';
import { SectionHeader } from '../ui/SectionHeader';
import { InsightQuote } from '../ui/InsightQuote';
import { PageFooter } from '../ui/PageFooter';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Edit2,
  Leaf,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  startDate: string | null;
  targetDate: string | null;
  completedDate: string | null;
  monthlyContribution: number | null;
  priority: number;
  icon: string | null;
  color: string | null;
  progress: number;
  remaining: number;
}

interface FormData {
  name: string;
  description: string;
  type: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  monthlyContribution: string;
  priority: string;
  color: string;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  type: 'savings',
  targetAmount: '',
  currentAmount: '0',
  targetDate: '',
  monthlyContribution: '',
  priority: '5',
  color: '#5f8563',
};

const goalTypeLabels: Record<string, string> = {
  savings: 'Savings',
  debt_payoff: 'Debt Payoff',
  emergency_fund: 'Emergency Fund',
  investment: 'Investment',
  purchase: 'Purchase',
  retirement: 'Retirement',
  custom: 'Custom',
};

// Zen status words
const statusWord = (progress: number): string => {
  if (progress >= 100) return 'Achieved';
  if (progress >= 75) return 'Blooming';
  if (progress >= 50) return 'Flowing';
  if (progress >= 25) return 'Growing';
  return 'Beginning';
};

const ZEN_COLORS = [
  '#5f8563', '#7c9f80', '#a3bea6', '#8b9dc3', '#a78bfa',
  '#d4a574', '#c4956a', '#818cf8', '#6b8e6b', '#4a6b4e',
];

const gentle: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export function GoalsList() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showContribution, setShowContribution] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await fetch('/api/goals');
      if (!res.ok) throw new Error('Failed to fetch goals');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || undefined,
          type: data.type,
          targetAmount: parseFloat(data.targetAmount),
          currentAmount: parseFloat(data.currentAmount) || 0,
          targetDate: data.targetDate || undefined,
          monthlyContribution: data.monthlyContribution ? parseFloat(data.monthlyContribution) : undefined,
          priority: parseInt(data.priority),
          color: data.color,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create goal');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowForm(false);
      setFormData(initialFormData);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData & { status: string }> }) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          type: data.type,
          status: data.status,
          targetAmount: data.targetAmount ? parseFloat(data.targetAmount) : undefined,
          currentAmount: data.currentAmount ? parseFloat(data.currentAmount) : undefined,
          targetDate: data.targetDate || undefined,
          monthlyContribution: data.monthlyContribution ? parseFloat(data.monthlyContribution) : undefined,
          priority: data.priority ? parseInt(data.priority) : undefined,
          color: data.color,
        }),
      });
      if (!res.ok) throw new Error('Failed to update goal');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setEditingId(null);
      setShowForm(false);
      setFormData(initialFormData);
    },
  });

  const contributionMutation = useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string; amount: number }) => {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error('Failed to add contribution');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowContribution(null);
      setContributionAmount('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete goal');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (goal: Goal) => {
    setFormData({
      name: goal.name,
      description: goal.description || '',
      type: goal.type,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : '',
      monthlyContribution: goal.monthlyContribution ? String(goal.monthlyContribution) : '',
      priority: String(goal.priority),
      color: goal.color || '#5f8563',
    });
    setEditingId(goal.id);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData(initialFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const activeGoals = goals?.filter(g => g.status === 'active') || [];
  const completedGoals = goals?.filter(g => g.status === 'completed') || [];
  const pausedGoals = goals?.filter(g => g.status === 'paused') || [];

  if (isLoading) {
    return (
      <div className="space-y-16">
        <PageHeader label="FINANCIAL GOALS" title="Set Your Path" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-36 rounded-[var(--radius-xl)] animate-[shimmer_1.8s_ease-in-out_infinite]"
              style={{
                background: 'linear-gradient(90deg, var(--color-skeleton-bg) 25%, var(--color-skeleton-shine) 50%, var(--color-skeleton-bg) 75%)',
                backgroundSize: '200% 100%',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero */}
      <PageHeader
        label="FINANCIAL GOALS"
        title="Set Your Path"
        subtitle="Track your goals with clarity and purpose."
      />

      {/* Add Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowForm(true)}
          disabled={showForm}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          + New Goal
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>
              {editingId ? 'Edit Goal' : 'Add a New Goal'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Emergency Fund"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="flex h-11 w-full rounded-[var(--radius-lg)] border border-border bg-card-bg px-3 py-2 text-sm text-text-primary transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    {Object.entries(goalTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount</Label>
                  <Input
                    id="targetAmount"
                    name="targetAmount"
                    type="number"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={handleInputChange}
                    placeholder="10000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentAmount">Current Amount</Label>
                  <Input
                    id="currentAmount"
                    name="currentAmount"
                    type="number"
                    step="0.01"
                    value={formData.currentAmount}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Input
                    id="targetDate"
                    name="targetDate"
                    type="date"
                    value={formData.targetDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyContribution">Monthly Contribution</Label>
                  <Input
                    id="monthlyContribution"
                    name="monthlyContribution"
                    type="number"
                    step="0.01"
                    value={formData.monthlyContribution}
                    onChange={handleInputChange}
                    placeholder="500"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="What's this goal for?"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {ZEN_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 transition-all",
                          formData.color === color ? "border-text-primary scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!goals || goals.length === 0) && !showForm && (
        <div className="flex flex-col items-center text-center py-8">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border">
            <Leaf className="h-6 w-6 text-primary-400" />
          </div>
          <p className="text-text-secondary text-sm">No goals set yet</p>
          <p className="text-text-muted text-xs mt-1 mb-4">Create your first goal to begin tracking</p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            + Create Your First Goal
          </Button>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <section>
          <SectionHeader title="Growing" meta={`${activeGoals.length} active`} />
          <div className="mt-8 space-y-6">
            {activeGoals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={index}
                onEdit={() => startEdit(goal)}
                onDelete={() => {
                  if (confirm('Delete this goal?')) deleteMutation.mutate(goal.id);
                }}
                onAddContribution={() => setShowContribution(goal.id)}
                onPause={() => updateMutation.mutate({ id: goal.id, data: { status: 'paused' } })}
                showContribution={showContribution === goal.id}
                contributionAmount={contributionAmount}
                setContributionAmount={setContributionAmount}
                onSubmitContribution={() => {
                  if (contributionAmount) {
                    contributionMutation.mutate({
                      goalId: goal.id,
                      amount: parseFloat(contributionAmount),
                    });
                  }
                }}
                onCancelContribution={() => {
                  setShowContribution(null);
                  setContributionAmount('');
                }}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        </section>
      )}

      {/* Paused Goals */}
      {pausedGoals.length > 0 && (
        <section>
          <SectionHeader title="Resting" meta={`${pausedGoals.length} paused`} />
          <div className="mt-8 space-y-6">
            {pausedGoals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={index}
                onEdit={() => startEdit(goal)}
                onDelete={() => {
                  if (confirm('Delete this goal?')) deleteMutation.mutate(goal.id);
                }}
                onResume={() => updateMutation.mutate({ id: goal.id, data: { status: 'active' } })}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <section>
          <SectionHeader title="Achieved" meta={`${completedGoals.length} complete`} />
          <div className="mt-8 space-y-6">
            {completedGoals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={index}
                onDelete={() => {
                  if (confirm('Delete this goal?')) deleteMutation.mutate(goal.id);
                }}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        </section>
      )}

      {/* Inspirational Quote */}
      {goals && goals.length > 0 && (
        <InsightQuote
          label="REFLECTION"
          quote="The journey of a thousand miles begins with a single step."
        />
      )}

      {/* Footer */}
      <PageFooter
        icon={<Leaf className="h-5 w-5" />}
        label="YOUR GOALS"
      />
    </div>
  );
}

// ─── Goal Card ──────────────────────────────────────────────────

interface GoalCardProps {
  goal: Goal;
  index: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddContribution?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  showContribution?: boolean;
  contributionAmount?: string;
  setContributionAmount?: (value: string) => void;
  onSubmitContribution?: () => void;
  onCancelContribution?: () => void;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: string | null) => string | null;
}

function GoalCard({
  goal,
  index,
  onEdit,
  onDelete,
  onAddContribution,
  onPause,
  onResume,
  showContribution,
  contributionAmount,
  setContributionAmount,
  onSubmitContribution,
  onCancelContribution,
  formatCurrency,
  formatDate,
}: GoalCardProps) {
  const isCompleted = goal.status === 'completed';
  const isPaused = goal.status === 'paused';
  const color = goal.color || '#5f8563';
  const status = statusWord(goal.progress);

  return (
    <motion.div
      custom={index}
      variants={gentle}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={cn(
        'rounded-[var(--radius-xl)] border border-border bg-card-bg p-6',
        'transition-shadow duration-300 hover:shadow-lg',
        isPaused && 'opacity-70'
      )}
    >
      <div className="flex gap-5">
        {/* Circular Progress */}
        <div className="flex-shrink-0">
          <CircularProgress
            value={Math.min(goal.progress, 100)}
            size="md"
            strokeWidth={3}
            fillColor={isCompleted ? 'var(--color-success)' : color}
            trackColor="var(--color-border)"
            showValue
            animated
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-base font-medium text-text-primary">{goal.name}</h4>
              <span className="text-xs text-text-muted uppercase tracking-[0.1em]">{status}</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-bg-surface text-text-muted flex-shrink-0">
              {goalTypeLabels[goal.type]}
            </span>
          </div>

          {goal.description && (
            <p className="mt-2 text-sm text-text-secondary line-clamp-1">{goal.description}</p>
          )}

          {/* Progress numbers */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-sm font-medium text-text-primary tabular-nums">
              {formatCurrency(goal.currentAmount)}
            </span>
            <span className="text-xs text-text-muted">of</span>
            <span className="text-sm text-text-secondary tabular-nums">
              {formatCurrency(goal.targetAmount)}
            </span>
          </div>

          {/* Target Date */}
          {goal.targetDate && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(goal.targetDate)}</span>
            </div>
          )}

          {/* Contribution Form */}
          {showContribution && (
            <div className="mt-3 flex gap-2">
              <Input
                type="number"
                placeholder="Amount"
                value={contributionAmount}
                onChange={(e) => setContributionAmount?.(e.target.value)}
                className="h-9"
              />
              <Button size="sm" onClick={onSubmitContribution}>Add</Button>
              <Button size="sm" variant="ghost" onClick={onCancelContribution}>Cancel</Button>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            {!isCompleted && !isPaused && onAddContribution && (
              <Button size="sm" variant="outline" onClick={onAddContribution}>
                <DollarSign className="h-3 w-3 mr-1" />
                Contribute
              </Button>
            )}
            {isPaused && onResume && (
              <Button size="sm" variant="outline" onClick={onResume}>
                Resume
              </Button>
            )}
            {!isCompleted && !isPaused && onPause && (
              <Button size="sm" variant="ghost" onClick={onPause}>
                Pause
              </Button>
            )}
            {onEdit && !isCompleted && (
              <Button size="sm" variant="ghost" onClick={onEdit}>
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="ghost" className="text-danger" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
