import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Edit2,
  Target,
  CheckCircle2,
  PauseCircle,
  Trophy,
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
  color: '#3b82f6',
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

const goalTypeIcons: Record<string, typeof Target> = {
  savings: Target,
  debt_payoff: DollarSign,
  emergency_fund: Target,
  investment: Target,
  purchase: Target,
  retirement: Trophy,
  custom: Target,
};

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
];

export function GoalsList() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showContribution, setShowContribution] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const queryClient = useQueryClient();

  // Fetch goals
  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await fetch('/api/goals');
      if (!res.ok) throw new Error('Failed to fetch goals');
      return res.json();
    },
  });

  // Create mutation
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

  // Update mutation
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

  // Add contribution mutation
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

  // Delete mutation
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
      color: goal.color || '#3b82f6',
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
    if (!dateStr) return 'No target date';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Group goals by status
  const activeGoals = goals?.filter(g => g.status === 'active') || [];
  const completedGoals = goals?.filter(g => g.status === 'completed') || [];
  const pausedGoals = goals?.filter(g => g.status === 'paused') || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Financial Goals</h2>
          <p className="text-sm text-muted-foreground">
            Track progress toward your savings and financial targets
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Goal' : 'Create Goal'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Goal Name *</Label>
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
                  <Label htmlFor="type">Goal Type</Label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {Object.entries(goalTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount *</Label>
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
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          formData.color === color ? "border-foreground scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={cancelEdit}>
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

      {/* Goals List */}
      {!goals || goals.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Target className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No goals yet</p>
              <p className="text-sm mt-1">Create your first financial goal to start tracking</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Active Goals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
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
            </div>
          )}

          {/* Paused Goals */}
          {pausedGoals.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Paused Goals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pausedGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
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
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Completed Goals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onDelete={() => {
                      if (confirm('Delete this goal?')) deleteMutation.mutate(goal.id);
                    }}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
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
  formatDate: (date: string | null) => string;
}

function GoalCard({
  goal,
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
  const Icon = goalTypeIcons[goal.type] || Target;
  const isCompleted = goal.status === 'completed';
  const isPaused = goal.status === 'paused';

  return (
    <Card className={cn(isCompleted && "bg-green-50 border-green-200", isPaused && "opacity-60")}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${goal.color || '#3b82f6'}20` }}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : isPaused ? (
              <PauseCircle className="h-6 w-6 text-muted-foreground" />
            ) : (
              <Icon className="h-6 w-6" style={{ color: goal.color || '#3b82f6' }} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold truncate">{goal.name}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                {goalTypeLabels[goal.type]}
              </span>
            </div>

            {goal.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{goal.description}</p>
            )}

            {/* Progress */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-sm">
                <span>{formatCurrency(goal.currentAmount)}</span>
                <span className="text-muted-foreground">{formatCurrency(goal.targetAmount)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isCompleted ? "bg-green-500" : ""
                  )}
                  style={{
                    width: `${Math.min(100, goal.progress)}%`,
                    backgroundColor: isCompleted ? undefined : (goal.color || '#3b82f6'),
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{goal.progress.toFixed(0)}% complete</span>
                {!isCompleted && <span>{formatCurrency(goal.remaining)} to go</span>}
              </div>
            </div>

            {/* Target Date */}
            {goal.targetDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                <Calendar className="h-3 w-3" />
                <span>Target: {formatDate(goal.targetDate)}</span>
              </div>
            )}

            {/* Contribution Form */}
            {showContribution && (
              <div className="flex gap-2 mb-3">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount?.(e.target.value)}
                  className="h-8"
                />
                <Button size="sm" onClick={onSubmitContribution}>Add</Button>
                <Button size="sm" variant="outline" onClick={onCancelContribution}>Cancel</Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {!isCompleted && !isPaused && onAddContribution && (
                <Button size="sm" variant="outline" onClick={onAddContribution}>
                  <DollarSign className="h-3 w-3 mr-1" />
                  Add
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
                <Button size="sm" variant="ghost" className="text-red-500" onClick={onDelete}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
