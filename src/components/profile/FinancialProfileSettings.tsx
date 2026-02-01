import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Calendar,
  PiggyBank,
  Check,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

interface FinancialProfile {
  id: string;
  userId: string;
  dateOfBirth: string | null;
  targetRetirementAge: number;
  lifeExpectancy: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  expectedAnnualReturn: number;
  annualIncome: number | null;
  incomeFrequency: 'weekly' | 'fortnightly' | 'monthly' | 'yearly';
  taxBracket: number | null;
  estimatedMonthlyExpense: number | null;
  essentialMonthlyExpense: number | null;
  superContributionRate: number;
  additionalSuperContribution: number;
  country: string;
  createdAt: string;
  updatedAt: string;
}

const riskOptions = [
  { value: 'conservative', label: 'Conservative', description: 'Prioritize capital preservation over growth' },
  { value: 'moderate', label: 'Moderate', description: 'Balance between growth and stability' },
  { value: 'aggressive', label: 'Aggressive', description: 'Maximize growth potential with higher risk' },
] as const;

const incomeFrequencies = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

export function FinancialProfileSettings() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<FinancialProfile>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch financial profile
  const { data: profile, isLoading } = useQuery<FinancialProfile>({
    queryKey: ['financial-profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/financial-profile');
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch financial profile');
      }
      return response.json();
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<FinancialProfile>) => {
      const method = profile ? 'PUT' : 'POST';
      const response = await fetch('/api/user/financial-profile', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-profile'] });
      setIsEditing(false);
      showSuccess('Financial profile saved successfully');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        targetRetirementAge: profile.targetRetirementAge,
        lifeExpectancy: profile.lifeExpectancy,
        riskTolerance: profile.riskTolerance,
        expectedAnnualReturn: profile.expectedAnnualReturn ? profile.expectedAnnualReturn * 100 : 7,
        annualIncome: profile.annualIncome,
        incomeFrequency: profile.incomeFrequency,
        taxBracket: profile.taxBracket ? profile.taxBracket * 100 : null,
        estimatedMonthlyExpense: profile.estimatedMonthlyExpense,
        essentialMonthlyExpense: profile.essentialMonthlyExpense,
        superContributionRate: profile.superContributionRate ? profile.superContributionRate * 100 : 11.5,
        additionalSuperContribution: profile.additionalSuperContribution ? profile.additionalSuperContribution * 100 : 0,
        country: profile.country || 'AU',
      });
    } else {
      setFormData({
        targetRetirementAge: 65,
        lifeExpectancy: 85,
        riskTolerance: 'moderate',
        expectedAnnualReturn: 7,
        incomeFrequency: 'monthly',
        superContributionRate: 11.5,
        additionalSuperContribution: 0,
        country: 'AU',
      });
    }
  }, [profile]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleInputChange = (field: keyof FinancialProfile, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMessage(null);
  };

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      expectedAnnualReturn: formData.expectedAnnualReturn ? (formData.expectedAnnualReturn as number) / 100 : undefined,
      taxBracket: formData.taxBracket ? (formData.taxBracket as number) / 100 : undefined,
      superContributionRate: formData.superContributionRate ? (formData.superContributionRate as number) / 100 : undefined,
      additionalSuperContribution: formData.additionalSuperContribution ? (formData.additionalSuperContribution as number) / 100 : undefined,
    };
    saveMutation.mutate(dataToSave);
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'Not set';
    return `${(value * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Financial Profile
        </CardTitle>
        <CardDescription>
          Configure your financial details for retirement planning and AI insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            <Check className="h-4 w-4" />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        {!profile && !isEditing && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            <Info className="h-4 w-4" />
            You haven't set up your financial profile yet. This information helps with retirement projections and AI-powered insights.
          </div>
        )}

        {isEditing ? (
          <div className="space-y-6">
            {/* Demographics */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Demographics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetRetirementAge">Target Retirement Age</Label>
                  <Input
                    id="targetRetirementAge"
                    type="number"
                    value={formData.targetRetirementAge || ''}
                    onChange={(e) => handleInputChange('targetRetirementAge', parseInt(e.target.value))}
                    min="40"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lifeExpectancy">Life Expectancy</Label>
                  <Input
                    id="lifeExpectancy"
                    type="number"
                    value={formData.lifeExpectancy || ''}
                    onChange={(e) => handleInputChange('lifeExpectancy', parseInt(e.target.value))}
                    min="60"
                    max="120"
                  />
                </div>
              </div>
            </div>

            {/* Investment Profile */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Investment Profile
              </h3>
              <div className="space-y-3">
                <Label>Risk Tolerance</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {riskOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.riskTolerance === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="riskTolerance"
                        value={option.value}
                        checked={formData.riskTolerance === option.value}
                        onChange={(e) => handleInputChange('riskTolerance', e.target.value)}
                        className="sr-only"
                      />
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedAnnualReturn">
                  Expected Annual Return (%)
                </Label>
                <Input
                  id="expectedAnnualReturn"
                  type="number"
                  step="0.1"
                  value={formData.expectedAnnualReturn || ''}
                  onChange={(e) => handleInputChange('expectedAnnualReturn', parseFloat(e.target.value))}
                  min="0"
                  max="50"
                />
                <p className="text-xs text-muted-foreground">
                  Default is 7% based on historical market averages
                </p>
              </div>
            </div>

            {/* Income */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Income Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annualIncome">Annual Income</Label>
                  <Input
                    id="annualIncome"
                    type="number"
                    value={formData.annualIncome || ''}
                    onChange={(e) => handleInputChange('annualIncome', parseFloat(e.target.value))}
                    placeholder="0.00"
                    min="0"
                    step="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incomeFrequency">Income Frequency</Label>
                  <select
                    id="incomeFrequency"
                    value={formData.incomeFrequency || 'monthly'}
                    onChange={(e) => handleInputChange('incomeFrequency', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {incomeFrequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxBracket">Tax Bracket (%)</Label>
                  <Input
                    id="taxBracket"
                    type="number"
                    value={formData.taxBracket || ''}
                    onChange={(e) => handleInputChange('taxBracket', parseFloat(e.target.value))}
                    placeholder="e.g., 32 for 32%"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    value={formData.country || 'AU'}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="AU">Australia</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="NZ">New Zealand</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Monthly Expenses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedMonthlyExpense">Estimated Total Expenses</Label>
                  <Input
                    id="estimatedMonthlyExpense"
                    type="number"
                    value={formData.estimatedMonthlyExpense || ''}
                    onChange={(e) => handleInputChange('estimatedMonthlyExpense', parseFloat(e.target.value))}
                    placeholder="0.00"
                    min="0"
                    step="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="essentialMonthlyExpense">Essential Expenses Only</Label>
                  <Input
                    id="essentialMonthlyExpense"
                    type="number"
                    value={formData.essentialMonthlyExpense || ''}
                    onChange={(e) => handleInputChange('essentialMonthlyExpense', parseFloat(e.target.value))}
                    placeholder="0.00"
                    min="0"
                    step="10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for runway calculations
                  </p>
                </div>
              </div>
            </div>

            {/* Superannuation */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <PiggyBank className="h-4 w-4" />
                Retirement Contributions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="superContributionRate">Employer Contribution Rate (%)</Label>
                  <Input
                    id="superContributionRate"
                    type="number"
                    value={formData.superContributionRate || ''}
                    onChange={(e) => handleInputChange('superContributionRate', parseFloat(e.target.value))}
                    placeholder="11.5"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Australian Superannuation (default 11.5%)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additionalSuperContribution">Additional Contribution Rate (%)</Label>
                  <Input
                    id="additionalSuperContribution"
                    type="number"
                    value={formData.additionalSuperContribution || ''}
                    onChange={(e) => handleInputChange('additionalSuperContribution', parseFloat(e.target.value))}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Salary sacrifice or personal contributions
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setErrorMessage(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Demographics
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Date of Birth</dt>
                    <dd>{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not set'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Target Retirement</dt>
                    <dd>Age {profile?.targetRetirementAge || 65}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Life Expectancy</dt>
                    <dd>Age {profile?.lifeExpectancy || 85}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Investment Profile
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Risk Tolerance</dt>
                    <dd className="capitalize">{profile?.riskTolerance || 'Moderate'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Expected Return</dt>
                    <dd>{formatPercent(profile?.expectedAnnualReturn)}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Income
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Annual Income</dt>
                    <dd>{formatCurrency(profile?.annualIncome)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Frequency</dt>
                    <dd className="capitalize">{profile?.incomeFrequency || 'Monthly'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tax Bracket</dt>
                    <dd>{formatPercent(profile?.taxBracket)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Country</dt>
                    <dd>{profile?.country || 'AU'}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Monthly Expenses
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Estimated Total</dt>
                    <dd>{formatCurrency(profile?.estimatedMonthlyExpense)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Essential Only</dt>
                    <dd>{formatCurrency(profile?.essentialMonthlyExpense)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {profile?.country === 'AU' && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium flex items-center gap-2">
                  <PiggyBank className="h-4 w-4" />
                  Superannuation
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Employer Contribution</dt>
                    <dd>{formatPercent(profile?.superContributionRate)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Additional Contribution</dt>
                    <dd>{formatPercent(profile?.additionalSuperContribution)}</dd>
                  </div>
                </dl>
              </div>
            )}

            <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
              Edit Financial Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
