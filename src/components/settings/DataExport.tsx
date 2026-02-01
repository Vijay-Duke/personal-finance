import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Calendar,
  Filter,
  Check,
  AlertCircle,
} from 'lucide-react';

interface ExportOptions {
  includeTransactions: boolean;
  includeAccounts: boolean;
  includeCategories: boolean;
  includeTags: boolean;
  includeBudgets: boolean;
  includeGoals: boolean;
  includeInsurance: boolean;
  includeDataSources: boolean;
  includeAIProviders: boolean;
  startDate: string;
  endDate: string;
}

const initialOptions: ExportOptions = {
  includeTransactions: true,
  includeAccounts: true,
  includeCategories: true,
  includeTags: true,
  includeBudgets: true,
  includeGoals: true,
  includeInsurance: true,
  includeDataSources: false,
  includeAIProviders: false,
  startDate: '',
  endDate: '',
};

export function DataExport() {
  const [options, setOptions] = useState<ExportOptions>(initialOptions);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptionChange = (key: keyof ExportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    setExportSuccess(false);
    setError(null);
  };

  const handleDateChange = (key: 'startDate' | 'endDate', value: string) => {
    setOptions(prev => ({ ...prev, [key]: value }));
    setExportSuccess(false);
    setError(null);
  };

  const getSelectedTypes = (): string[] => {
    const types: string[] = [];
    if (options.includeTransactions) types.push('transactions');
    if (options.includeAccounts) types.push('accounts');
    if (options.includeCategories) types.push('categories');
    if (options.includeTags) types.push('tags');
    if (options.includeBudgets) types.push('budgets');
    if (options.includeGoals) types.push('goals');
    if (options.includeInsurance) types.push('insurance');
    if (options.includeDataSources) types.push('dataSources');
    if (options.includeAIProviders) types.push('aiProviders');
    return types;
  };

  const exportJSON = async () => {
    setIsExporting(true);
    setError(null);
    setExportSuccess(false);

    try {
      const types = getSelectedTypes();
      if (types.length === 0) {
        setError('Please select at least one data type to export');
        setIsExporting(false);
        return;
      }

      const params = new URLSearchParams();
      params.set('include', types.join(','));
      if (options.startDate) params.set('startDate', options.startDate);
      if (options.endDate) params.set('endDate', options.endDate);

      const response = await fetch(`/api/export/json?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export data');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finance-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const exportCSV = async (type: 'transactions' | 'accounts') => {
    setIsExporting(true);
    setError(null);
    setExportSuccess(false);

    try {
      const params = new URLSearchParams();
      params.set('type', type);
      if (options.startDate) params.set('startDate', options.startDate);
      if (options.endDate) params.set('endDate', options.endDate);

      const response = await fetch(`/api/export/csv?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export CSV');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const selectAll = () => {
    setOptions(prev => ({
      ...prev,
      includeTransactions: true,
      includeAccounts: true,
      includeCategories: true,
      includeTags: true,
      includeBudgets: true,
      includeGoals: true,
      includeInsurance: true,
      includeDataSources: true,
      includeAIProviders: true,
    }));
    setExportSuccess(false);
  };

  const selectNone = () => {
    setOptions(prev => ({
      ...prev,
      includeTransactions: false,
      includeAccounts: false,
      includeCategories: false,
      includeTags: false,
      includeBudgets: false,
      includeGoals: false,
      includeInsurance: false,
      includeDataSources: false,
      includeAIProviders: false,
    }));
    setExportSuccess(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Export
          </CardTitle>
          <CardDescription>
            Export your financial data for backup or analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Date Range (optional)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={options.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={options.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Data Types */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                Data to Include
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-primary hover:underline"
                >
                  Select All
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  onClick={selectNone}
                  className="text-xs text-primary hover:underline"
                >
                  None
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeTransactions}
                  onChange={() => handleOptionChange('includeTransactions')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Transactions</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeAccounts}
                  onChange={() => handleOptionChange('includeAccounts')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Accounts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeCategories}
                  onChange={() => handleOptionChange('includeCategories')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Categories</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeTags}
                  onChange={() => handleOptionChange('includeTags')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Tags</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeBudgets}
                  onChange={() => handleOptionChange('includeBudgets')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Budgets</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeGoals}
                  onChange={() => handleOptionChange('includeGoals')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Goals</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeInsurance}
                  onChange={() => handleOptionChange('includeInsurance')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Insurance</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeDataSources}
                  onChange={() => handleOptionChange('includeDataSources')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Data Sources</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeAIProviders}
                  onChange={() => handleOptionChange('includeAIProviders')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">AI Providers</span>
              </label>
            </div>
          </div>

          {/* Export Actions */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={exportJSON}
                disabled={isExporting || getSelectedTypes().length === 0}
                className="flex-1"
              >
                <FileJson className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export as JSON'}
              </Button>
              <Button
                onClick={() => exportCSV('transactions')}
                disabled={isExporting}
                variant="outline"
                className="flex-1"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Transactions CSV'}
              </Button>
            </div>

            <Button
              onClick={() => exportCSV('accounts')}
              disabled={isExporting}
              variant="outline"
              className="w-full"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Accounts CSV'}
            </Button>
          </div>

          {/* Status Messages */}
          {exportSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              <Check className="h-4 w-4" />
              Export completed successfully!
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>JSON Export:</strong> Complete data export including all selected types.
              Best for backups and data portability.
            </p>
            <p>
              <strong>CSV Export:</strong> Spreadsheet format for transactions or accounts.
              Best for analysis in Excel or Google Sheets.
            </p>
            <p>
              <strong>Note:</strong> AI provider API keys are not included in exports for security reasons.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
