import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFooter } from '@/components/ui/PageFooter';
import { SectionHeader } from '@/components/ui/SectionHeader';
import {
  Plus,
  Repeat,
  CalendarClock,
  Trash2,
  Pencil,
  Play,
  Pause,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightCircle,
  Building2,
} from 'lucide-react';

interface RecurringSchedule {
  id: string;
  accountId: string;
  accountName: string | null;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description: string | null;
  merchant: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  transferAccountId: string | null;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  month: number | null;
  startDate: string;
  endDate: string | null;
  nextOccurrence: string | null;
  isActive: boolean;
  autoCreate: boolean;
  occurrenceCount: number;
  lastOccurrence: string | null;
  createdAt: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
}

type TransactionType = 'income' | 'expense' | 'transfer';

interface FormData {
  accountId: string;
  type: TransactionType;
  amount: string;
  description: string;
  merchant: string;
  categoryId: string;
  frequency: string;
  dayOfWeek: number;
  dayOfMonth: number;
  month: number;
  startDate: string;
  endDate: string;
  autoCreate: boolean;
}

const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const daysOfWeek = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const selectClassName = "flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]";
const selectStyle = { backgroundColor: 'var(--color-input-bg)', borderColor: 'var(--color-input-border)', color: 'var(--color-text-primary)' };

export function RecurringTransactionsList() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<RecurringSchedule | null>(null);
  const [formData, setFormData] = useState<FormData>({
    accountId: '',
    type: 'expense',
    amount: '',
    description: '',
    merchant: '',
    categoryId: '',
    frequency: 'monthly',
    dayOfWeek: 0,
    dayOfMonth: 1,
    month: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    autoCreate: false,
  });

  // Fetch recurring schedules
  const { data: schedules = [], isLoading } = useQuery<RecurringSchedule[]>({
    queryKey: ['recurring-schedules'],
    queryFn: async () => {
      const res = await fetch('/api/recurring');
      if (!res.ok) throw new Error('Failed to fetch schedules');
      return res.json();
    },
  });

  // Fetch accounts
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/api/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount),
          dayOfWeek: data.frequency === 'weekly' ? data.dayOfWeek : null,
          dayOfMonth: ['monthly', 'quarterly', 'yearly'].includes(data.frequency) ? data.dayOfMonth : null,
          month: data.frequency === 'yearly' ? data.month : null,
          endDate: data.endDate || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create schedule');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/recurring/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update schedule');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete schedule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingSchedule(null);
    setFormData({
      accountId: '',
      type: 'expense',
      amount: '',
      description: '',
      merchant: '',
      categoryId: '',
      frequency: 'monthly',
      dayOfWeek: 0,
      dayOfMonth: 1,
      month: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      autoCreate: false,
    });
  };

  const handleEdit = (schedule: RecurringSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      accountId: schedule.accountId,
      type: schedule.type,
      amount: schedule.amount.toString(),
      description: schedule.description || '',
      merchant: schedule.merchant || '',
      categoryId: schedule.categoryId || '',
      frequency: schedule.frequency,
      dayOfWeek: schedule.dayOfWeek ?? 0,
      dayOfMonth: schedule.dayOfMonth ?? 1,
      month: schedule.month ?? 1,
      startDate: new Date(schedule.startDate).toISOString().split('T')[0],
      endDate: schedule.endDate ? new Date(schedule.endDate).toISOString().split('T')[0] : '',
      autoCreate: schedule.autoCreate,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingSchedule) {
      updateMutation.mutate({
        id: editingSchedule.id,
        data: {
          ...formData,
          amount: parseFloat(formData.amount),
          dayOfWeek: formData.frequency === 'weekly' ? formData.dayOfWeek : null,
          dayOfMonth: ['monthly', 'quarterly', 'yearly'].includes(formData.frequency) ? formData.dayOfMonth : null,
          month: formData.frequency === 'yearly' ? formData.month : null,
          endDate: formData.endDate || null,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleActive = (schedule: RecurringSchedule) => {
    updateMutation.mutate({
      id: schedule.id,
      data: { isActive: !schedule.isActive },
    });
  };

  const formatFrequency = (schedule: RecurringSchedule): string => {
    switch (schedule.frequency) {
      case 'daily':
        return 'Every day';
      case 'weekly':
        return `Every ${daysOfWeek[schedule.dayOfWeek ?? 0]}`;
      case 'biweekly':
        return 'Every 2 weeks';
      case 'monthly':
        return `Monthly on the ${schedule.dayOfMonth}${getOrdinalSuffix(schedule.dayOfMonth ?? 1)}`;
      case 'quarterly':
        return `Quarterly on the ${schedule.dayOfMonth}${getOrdinalSuffix(schedule.dayOfMonth ?? 1)}`;
      case 'yearly':
        return `Yearly on ${months[(schedule.month ?? 1) - 1]} ${schedule.dayOfMonth}`;
      default:
        return schedule.frequency;
    }
  };

  const getOrdinalSuffix = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowDownCircle className="h-4 w-4 text-[var(--color-success)]" />;
      case 'expense':
        return <ArrowUpCircle className="h-4 w-4 text-[var(--color-danger)]" />;
      case 'transfer':
        return <ArrowRightCircle className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const activeSchedules = schedules.filter(s => s.isActive);
  const inactiveSchedules = schedules.filter(s => !s.isActive);

  if (isLoading) {
    return (
      <div className="space-y-16">
        <PageHeader label="RECURRING" title="Scheduled Flow" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-36 rounded-[var(--radius-xl)] animate-[shimmer_1.8s_ease-in-out_infinite]"
              style={{ background: 'linear-gradient(90deg, var(--color-skeleton-bg) 25%, var(--color-skeleton-shine) 50%, var(--color-skeleton-bg) 75%)', backgroundSize: '200% 100%' }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Page Header */}
      <PageHeader label="RECURRING" title="Scheduled Flow">
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {activeSchedules.length} active schedule{activeSchedules.length !== 1 ? 's' : ''}
        </p>
      </PageHeader>

      {/* Section Header with Add Button */}
      <div className="flex items-end justify-between">
        <SectionHeader label="ACTIVE SCHEDULES" title="Overview" />
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-[18px] h-[18px]" /> Add Schedule
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            {editingSchedule ? 'Edit' : 'New'} Recurring Transaction
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Set up a recurring transaction schedule
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Account */}
              <div className="space-y-2">
                <Label htmlFor="accountId">Account</Label>
                <select
                  id="accountId"
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className={selectClassName}
                  style={selectStyle}
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                  className={selectClassName}
                  style={selectStyle}
                  required
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <select
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className={selectClassName}
                  style={selectStyle}
                >
                  <option value="">Select category</option>
                  {categories
                    .filter((c) => c.type === formData.type)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Monthly subscription"
                />
              </div>

              {/* Merchant */}
              <div className="space-y-2">
                <Label htmlFor="merchant">Merchant</Label>
                <Input
                  id="merchant"
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  placeholder="Netflix, etc."
                />
              </div>
            </div>

            {/* Frequency Section */}
            <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--color-border)' }}>
              <h4 className="font-medium mb-4 text-[var(--color-text-primary)]">Schedule</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <select
                    id="frequency"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className={selectClassName}
                    style={selectStyle}
                    required
                  >
                    {frequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day of Week (for weekly) */}
                {formData.frequency === 'weekly' && (
                  <div className="space-y-2">
                    <Label htmlFor="dayOfWeek">Day of Week</Label>
                    <select
                      id="dayOfWeek"
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                      className={selectClassName}
                      style={selectStyle}
                    >
                      {daysOfWeek.map((day, i) => (
                        <option key={i} value={i}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Day of Month (for monthly/quarterly/yearly) */}
                {['monthly', 'quarterly', 'yearly'].includes(formData.frequency) && (
                  <div className="space-y-2">
                    <Label htmlFor="dayOfMonth">Day of Month</Label>
                    <select
                      id="dayOfMonth"
                      value={formData.dayOfMonth}
                      onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                      className={selectClassName}
                      style={selectStyle}
                    >
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Month (for yearly) */}
                {formData.frequency === 'yearly' && (
                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <select
                      id="month"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                      className={selectClassName}
                      style={selectStyle}
                    >
                      {months.map((monthName, i) => (
                        <option key={i + 1} value={i + 1}>
                          {monthName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Auto-create checkbox */}
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="autoCreate"
                  checked={formData.autoCreate}
                  onChange={(e) => setFormData({ ...formData, autoCreate: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="autoCreate" className="font-normal">
                  Automatically create transactions when due
                </Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingSchedule ? 'Update' : 'Create'} Schedule
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Active Schedules */}
      {activeSchedules.length > 0 && (
        <div className="space-y-4">
          {activeSchedules.map((schedule) => (
            <Card
              key={schedule.id}
              className="flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-4">
                {getTypeIcon(schedule.type)}
                <div>
                  <div className="font-medium flex items-center gap-2 text-[var(--color-text-primary)]">
                    {schedule.description || schedule.merchant || 'Untitled'}
                    {schedule.categoryName && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: schedule.categoryColor
                            ? `${schedule.categoryColor}20`
                            : undefined,
                          color: schedule.categoryColor || undefined,
                        }}
                      >
                        {schedule.categoryName}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)] flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {schedule.accountName}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />
                      {formatFrequency(schedule)}
                    </span>
                  </div>
                  {schedule.nextOccurrence && (
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">
                      Next: {new Date(schedule.nextOccurrence).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div
                    className={`font-semibold ${
                      schedule.type === 'expense' ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'
                    }`}
                  >
                    {schedule.type === 'expense' ? '-' : '+'}
                    {schedule.currency} {schedule.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {schedule.occurrenceCount} occurrences
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleActive(schedule)}
                    title="Pause schedule"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(schedule)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Delete this recurring schedule?')) {
                        deleteMutation.mutate(schedule.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Inactive Schedules */}
      {inactiveSchedules.length > 0 && (
        <div className="space-y-4">
          <SectionHeader label="PAUSED" title="Inactive Schedules" />
          {inactiveSchedules.map((schedule) => (
            <Card
              key={schedule.id}
              className="flex items-center justify-between p-4 opacity-70"
            >
              <div className="flex items-center gap-4 opacity-60">
                {getTypeIcon(schedule.type)}
                <div>
                  <div className="font-medium text-[var(--color-text-primary)]">
                    {schedule.description || schedule.merchant || 'Untitled'}
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {formatFrequency(schedule)} &bull; {schedule.accountName}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right opacity-60">
                  <div className="font-semibold text-[var(--color-text-primary)]">
                    {schedule.currency} {schedule.amount.toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleActive(schedule)}
                    title="Resume schedule"
                  >
                    <Play className="h-4 w-4 text-[var(--color-success)]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Delete this recurring schedule?')) {
                        deleteMutation.mutate(schedule.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {schedules.length === 0 && (
        <div className="flex flex-col items-center py-16">
          <div className="mb-4 opacity-40" style={{ color: 'var(--color-text-muted)' }}>
            <Repeat className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">A clean slate</h3>
          <p className="mt-2 text-[15px] text-[var(--color-text-secondary)] max-w-[400px] text-center">
            Set up recurring transactions to automate your financial tracking.
          </p>
          <Button onClick={() => setShowForm(true)} className="mt-6 gap-2">
            <Plus className="w-[18px] h-[18px]" /> Add First Schedule
          </Button>
        </div>
      )}

      {/* Page Footer */}
      <PageFooter
        icon={<Repeat className="w-5 h-5" />}
        label="YOUR SCHEDULED FLOW"
        quote="Consistency is the hallmark of the unimaginative."
      />
    </div>
  );
}
