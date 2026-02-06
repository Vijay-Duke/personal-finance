import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Edit2,
  Tag,
  Briefcase,
  TrendingUp,
  Gift,
  DollarSign,
  Home,
  Zap,
  ShoppingCart,
  Car,
  HeartPulse,
  Shield,
  Utensils,
  Film,
  ShoppingBag,
  Plane,
  Repeat,
  Sparkles,
  CreditCard,
  PiggyBank,
  BarChart2,
  HelpCircle,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  sortOrder: number;
}

interface FormData {
  name: string;
  type: string;
  icon: string;
  color: string;
}

const initialFormData: FormData = {
  name: '',
  type: 'expense',
  icon: 'tag',
  color: '#6b7280',
};

// Preset colors for category selection
const presetColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

// Icon options with their Lucide components
const iconOptions = [
  { name: 'tag', Icon: Tag },
  { name: 'briefcase', Icon: Briefcase },
  { name: 'trending-up', Icon: TrendingUp },
  { name: 'gift', Icon: Gift },
  { name: 'dollar-sign', Icon: DollarSign },
  { name: 'home', Icon: Home },
  { name: 'zap', Icon: Zap },
  { name: 'shopping-cart', Icon: ShoppingCart },
  { name: 'car', Icon: Car },
  { name: 'heart-pulse', Icon: HeartPulse },
  { name: 'shield', Icon: Shield },
  { name: 'utensils', Icon: Utensils },
  { name: 'film', Icon: Film },
  { name: 'shopping-bag', Icon: ShoppingBag },
  { name: 'plane', Icon: Plane },
  { name: 'repeat', Icon: Repeat },
  { name: 'sparkles', Icon: Sparkles },
  { name: 'credit-card', Icon: CreditCard },
  { name: 'piggy-bank', Icon: PiggyBank },
  { name: 'bar-chart-2', Icon: BarChart2 },
  { name: 'help-circle', Icon: HelpCircle },
];

// Map icon names to components for rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {};
iconOptions.forEach(({ name, Icon }) => {
  iconMap[name] = Icon;
});

export function CategoriesManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories?flat=true');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          icon: data.icon,
          color: data.color,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create category');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowForm(false);
      setFormData(initialFormData);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          icon: data.icon,
          color: data.color,
        }),
      });
      if (!res.ok) throw new Error('Failed to update category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingId(null);
      setShowForm(false);
      setFormData(initialFormData);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete category');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
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

  const startEdit = (category: Category) => {
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon || 'tag',
      color: category.color || '#6b7280',
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData(initialFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Group categories by type
  const groupedCategories = useMemo(() => {
    if (!categories) return { income: [], expense: [], transfer: [] };
    return {
      income: categories.filter(c => c.type === 'income'),
      expense: categories.filter(c => c.type === 'expense'),
      transfer: categories.filter(c => c.type === 'transfer'),
    };
  }, [categories]);

  const renderIcon = (iconName: string | null, className?: string) => {
    const IconComponent = iconMap[iconName || 'tag'] || Tag;
    return <IconComponent className={className} />;
  };

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
          <h2 className="text-lg font-semibold">Transaction Categories</h2>
          <p className="text-sm text-muted-foreground">
            Organize how you categorize your transactions
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Category' : 'Create Category'}</CardTitle>
            <CardDescription>
              {editingId ? 'Update category details' : 'Add a new transaction category'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Groceries"
                    required
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>

                {/* Color Picker */}
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {presetColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        aria-label={`Select color ${color}`}
                        aria-pressed={formData.color === color}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                          formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon Picker */}
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex gap-2 flex-wrap">
                    {iconOptions.slice(0, 12).map(({ name, Icon }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon: name }))}
                        aria-label={`Select ${name} icon`}
                        aria-pressed={formData.icon === name}
                        className={cn(
                          'w-8 h-8 rounded-md border flex items-center justify-center transition-colors hover:bg-muted',
                          formData.icon === name
                            ? 'border-foreground bg-muted'
                            : 'border-input'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingId
                      ? 'Update'
                      : 'Create'}
                </Button>
              </div>
              {(createMutation.error || updateMutation.error) && (
                <p className="text-red-600 text-sm">
                  {(createMutation.error || updateMutation.error)?.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      {categories && categories.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No categories yet</p>
              <p className="text-sm mt-1">
                Create categories to organize your transactions
              </p>
              <Button onClick={() => setShowForm(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Income Categories */}
          {groupedCategories.income.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Income
                  <span className="text-muted-foreground font-normal text-sm">
                    ({groupedCategories.income.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {groupedCategories.income.map(category => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      renderIcon={renderIcon}
                      onEdit={startEdit}
                      onDelete={(id) => {
                        if (confirm('Delete this category? This cannot be undone.')) {
                          deleteMutation.mutate(id);
                        }
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expense Categories */}
          {groupedCategories.expense.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-red-500" />
                  Expense
                  <span className="text-muted-foreground font-normal text-sm">
                    ({groupedCategories.expense.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {groupedCategories.expense.map(category => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      renderIcon={renderIcon}
                      onEdit={startEdit}
                      onDelete={(id) => {
                        if (confirm('Delete this category? This cannot be undone.')) {
                          deleteMutation.mutate(id);
                        }
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transfer Categories */}
          {groupedCategories.transfer.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-blue-500" />
                  Transfer
                  <span className="text-muted-foreground font-normal text-sm">
                    ({groupedCategories.transfer.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {groupedCategories.transfer.map(category => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      renderIcon={renderIcon}
                      onEdit={startEdit}
                      onDelete={(id) => {
                        if (confirm('Delete this category? This cannot be undone.')) {
                          deleteMutation.mutate(id);
                        }
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Separate component for category row
function CategoryRow({
  category,
  renderIcon,
  onEdit,
  onDelete,
}: {
  category: Category;
  renderIcon: (icon: string | null, className?: string) => React.ReactNode;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {/* Color & Icon */}
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center"
        style={{ backgroundColor: category.color || '#6b7280' }}
      >
        {renderIcon(category.icon, 'h-4 w-4 text-white')}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="font-medium">{category.name}</span>
        {category.isSystem && (
          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
            System
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(category)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        {!category.isSystem && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600"
            onClick={() => onDelete(category.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
