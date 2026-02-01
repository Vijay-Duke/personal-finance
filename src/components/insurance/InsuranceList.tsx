import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Plus,
  Trash2,
  Edit2,
  Shield,
  Heart,
  Home,
  Car,
  Umbrella,
  Briefcase,
  PawPrint,
  Plane,
  User,
  AlertCircle,
} from 'lucide-react';

interface InsurancePolicy {
  id: string;
  name: string;
  type: string;
  status: string;
  policyNumber: string | null;
  provider: string;
  coverageAmount: number | null;
  deductible: number | null;
  currency: string;
  premiumAmount: number;
  premiumFrequency: string;
  nextPremiumDate: string | null;
  startDate: string | null;
  endDate: string | null;
  renewalDate: string | null;
  agentName: string | null;
  agentPhone: string | null;
  agentEmail: string | null;
  notes: string | null;
  annualPremium: number;
}

interface FormData {
  name: string;
  type: string;
  provider: string;
  policyNumber: string;
  coverageAmount: string;
  deductible: string;
  premiumAmount: string;
  premiumFrequency: string;
  startDate: string;
  renewalDate: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  notes: string;
}

const initialFormData: FormData = {
  name: '',
  type: 'home',
  provider: '',
  policyNumber: '',
  coverageAmount: '',
  deductible: '',
  premiumAmount: '',
  premiumFrequency: 'monthly',
  startDate: '',
  renewalDate: '',
  agentName: '',
  agentPhone: '',
  agentEmail: '',
  notes: '',
};

const insuranceTypeLabels: Record<string, string> = {
  life: 'Life Insurance',
  health: 'Health Insurance',
  home: 'Home Insurance',
  auto: 'Auto Insurance',
  renters: 'Renters Insurance',
  umbrella: 'Umbrella Policy',
  disability: 'Disability Insurance',
  pet: 'Pet Insurance',
  travel: 'Travel Insurance',
  business: 'Business Insurance',
  other: 'Other',
};

const insuranceTypeIcons: Record<string, typeof Shield> = {
  life: Heart,
  health: Heart,
  home: Home,
  auto: Car,
  renters: Home,
  umbrella: Umbrella,
  disability: User,
  pet: PawPrint,
  travel: Plane,
  business: Briefcase,
  other: Shield,
};

const premiumFrequencyLabels: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annual: 'Semi-Annual',
  annual: 'Annual',
};

export function InsuranceList() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const queryClient = useQueryClient();

  // Fetch policies
  const { data: policies, isLoading } = useQuery<InsurancePolicy[]>({
    queryKey: ['insurance'],
    queryFn: async () => {
      const res = await fetch('/api/insurance');
      if (!res.ok) throw new Error('Failed to fetch policies');
      return res.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          provider: data.provider,
          policyNumber: data.policyNumber || undefined,
          coverageAmount: data.coverageAmount ? parseFloat(data.coverageAmount) : undefined,
          deductible: data.deductible ? parseFloat(data.deductible) : undefined,
          premiumAmount: parseFloat(data.premiumAmount),
          premiumFrequency: data.premiumFrequency,
          startDate: data.startDate || undefined,
          renewalDate: data.renewalDate || undefined,
          agentName: data.agentName || undefined,
          agentPhone: data.agentPhone || undefined,
          agentEmail: data.agentEmail || undefined,
          notes: data.notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create policy');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] });
      setShowForm(false);
      setFormData(initialFormData);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> }) => {
      const res = await fetch(`/api/insurance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          provider: data.provider,
          policyNumber: data.policyNumber,
          coverageAmount: data.coverageAmount ? parseFloat(data.coverageAmount) : null,
          deductible: data.deductible ? parseFloat(data.deductible) : null,
          premiumAmount: data.premiumAmount ? parseFloat(data.premiumAmount) : undefined,
          premiumFrequency: data.premiumFrequency,
          startDate: data.startDate || null,
          renewalDate: data.renewalDate || null,
          agentName: data.agentName,
          agentPhone: data.agentPhone,
          agentEmail: data.agentEmail,
          notes: data.notes,
        }),
      });
      if (!res.ok) throw new Error('Failed to update policy');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] });
      setEditingId(null);
      setShowForm(false);
      setFormData(initialFormData);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/insurance/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete policy');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] });
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

  const startEdit = (policy: InsurancePolicy) => {
    setFormData({
      name: policy.name,
      type: policy.type,
      provider: policy.provider,
      policyNumber: policy.policyNumber || '',
      coverageAmount: policy.coverageAmount ? String(policy.coverageAmount) : '',
      deductible: policy.deductible ? String(policy.deductible) : '',
      premiumAmount: String(policy.premiumAmount),
      premiumFrequency: policy.premiumFrequency,
      startDate: policy.startDate ? policy.startDate.split('T')[0] : '',
      renewalDate: policy.renewalDate ? policy.renewalDate.split('T')[0] : '',
      agentName: policy.agentName || '',
      agentPhone: policy.agentPhone || '',
      agentEmail: policy.agentEmail || '',
      notes: policy.notes || '',
    });
    setEditingId(policy.id);
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

  // Calculate totals
  const totals = useMemo(() => {
    if (!policies) return { annual: 0, monthly: 0 };
    const annual = policies.reduce((sum, p) => sum + p.annualPremium, 0);
    return { annual, monthly: annual / 12 };
  }, [policies]);

  // Group by type
  const groupedPolicies = useMemo(() => {
    if (!policies) return new Map();
    const groups = new Map<string, InsurancePolicy[]>();
    policies.forEach(policy => {
      const type = policy.type;
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type)!.push(policy);
    });
    return groups;
  }, [policies]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(totals.annual)}</div>
            <div className="text-sm text-muted-foreground">Total Annual Premiums</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(totals.monthly)}</div>
            <div className="text-sm text-muted-foreground">Average Monthly Cost</div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Insurance Policies</h2>
          <p className="text-sm text-muted-foreground">
            Manage all your insurance coverage in one place
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Policy
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Policy' : 'Add Insurance Policy'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Policy Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Home Insurance"
                    required
                  />
                </div>

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
                    {Object.entries(insuranceTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">Provider *</Label>
                  <Input
                    id="provider"
                    name="provider"
                    value={formData.provider}
                    onChange={handleInputChange}
                    placeholder="e.g., State Farm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Policy Number</Label>
                  <Input
                    id="policyNumber"
                    name="policyNumber"
                    value={formData.policyNumber}
                    onChange={handleInputChange}
                    placeholder="ABC123456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="premiumAmount">Premium Amount *</Label>
                  <Input
                    id="premiumAmount"
                    name="premiumAmount"
                    type="number"
                    step="0.01"
                    value={formData.premiumAmount}
                    onChange={handleInputChange}
                    placeholder="150"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="premiumFrequency">Premium Frequency</Label>
                  <select
                    id="premiumFrequency"
                    name="premiumFrequency"
                    value={formData.premiumFrequency}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {Object.entries(premiumFrequencyLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverageAmount">Coverage Amount</Label>
                  <Input
                    id="coverageAmount"
                    name="coverageAmount"
                    type="number"
                    value={formData.coverageAmount}
                    onChange={handleInputChange}
                    placeholder="500000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deductible">Deductible</Label>
                  <Input
                    id="deductible"
                    name="deductible"
                    type="number"
                    value={formData.deductible}
                    onChange={handleInputChange}
                    placeholder="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="renewalDate">Renewal Date</Label>
                  <Input
                    id="renewalDate"
                    name="renewalDate"
                    type="date"
                    value={formData.renewalDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentName">Agent Name</Label>
                  <Input
                    id="agentName"
                    name="agentName"
                    value={formData.agentName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentPhone">Agent Phone</Label>
                  <Input
                    id="agentPhone"
                    name="agentPhone"
                    value={formData.agentPhone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentEmail">Agent Email</Label>
                  <Input
                    id="agentEmail"
                    name="agentEmail"
                    type="email"
                    value={formData.agentEmail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Policies List */}
      {!policies || policies.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No insurance policies</p>
              <p className="text-sm mt-1">Add your insurance policies to track coverage and premiums</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedPolicies.entries()).map(([type, typePolicies]) => {
            const Icon = insuranceTypeIcons[type] || Shield;
            return (
              <div key={type} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {insuranceTypeLabels[type] || type}
                </h3>
                <div className="space-y-3">
                  {typePolicies.map((policy: InsurancePolicy) => (
                    <Card key={policy.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{policy.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {policy.provider}
                                </span>
                              </div>
                              <span className="font-medium">
                                {formatCurrency(policy.premiumAmount)}/{policy.premiumFrequency.replace('_', '-')}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              {policy.coverageAmount && (
                                <span>Coverage: {formatCurrency(policy.coverageAmount)}</span>
                              )}
                              {policy.deductible && (
                                <span>Deductible: {formatCurrency(policy.deductible)}</span>
                              )}
                              {policy.policyNumber && (
                                <span>Policy #: {policy.policyNumber}</span>
                              )}
                              {policy.renewalDate && (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Renews: {new Date(policy.renewalDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEdit(policy)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => {
                                if (confirm('Delete this policy?')) {
                                  deleteMutation.mutate(policy.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
