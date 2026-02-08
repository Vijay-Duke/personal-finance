import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFooter } from '@/components/ui/PageFooter';
import { cn } from '@/lib/utils';
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
}

interface PreviewTransaction {
  date: string;
  amount: number;
  type: string;
  description: string;
  merchant?: string;
}

interface ParseError {
  row: number;
  message: string;
}

interface PreviewResult {
  success: boolean;
  headers: string[];
  totalRows: number;
  parsedCount: number;
  errors: ParseError[];
  warnings: ParseError[];
  preview: PreviewTransaction[];
}

interface ImportResult {
  batchId: string;
  totalRows: number;
  imported: number;
  skipped: number;
  errors: number;
  parseErrors: ParseError[];
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export function CSVImport() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [skipRows, setSkipRows] = useState<number>(0);
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const queryClient = useQueryClient();

  // Fetch accounts
  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await fetch('/api/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    },
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent,
          accountId,
          skipRows,
          preview: true,
          fileName,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to parse CSV');
      }
      return res.json() as Promise<PreviewResult>;
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setStep('preview');
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent,
          accountId,
          skipRows,
          preview: false,
          fileName,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to import CSV');
      }
      return res.json() as Promise<ImportResult>;
    },
    onSuccess: (data) => {
      setImportResult(data);
      setStep('complete');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string);
    };
    reader.readAsText(file);
  }, []);

  const handlePreview = () => {
    if (!csvContent || !accountId) return;
    previewMutation.mutate();
  };

  const handleImport = () => {
    setStep('importing');
    importMutation.mutate();
  };

  const handleReset = () => {
    setStep('upload');
    setCsvContent('');
    setFileName('');
    setAccountId('');
    setSkipRows(0);
    setPreviewData(null);
    setImportResult(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-16">
      <PageHeader label="IMPORT" title="Transaction Import" />

      <Card className="max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-2">
          <FileSpreadsheet className="h-5 w-5" style={{ color: '#5f8563' }} />
          Import Transactions from CSV
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Upload a CSV file from your bank to import transactions automatically.
        </p>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            {/* File Upload */}
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                csvContent ? '' : 'hover:border-[var(--color-primary)]'
              )}
              style={
                csvContent
                  ? {
                      borderColor: 'var(--color-success)',
                      backgroundColor: 'var(--color-success-light, rgba(95,133,99,0.1))',
                    }
                  : { borderColor: 'var(--color-border)' }
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {csvContent ? (
                <div className="space-y-2">
                  <Check className="h-12 w-12 text-[var(--color-success)] mx-auto" />
                  <p className="font-medium text-[var(--color-text-primary)]">{fileName}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {csvContent.split('\n').length} rows detected
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setCsvContent('')}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-[var(--color-text-muted)] mx-auto" />
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">Drop your CSV file here</p>
                    <p className="text-sm text-[var(--color-text-muted)]">or click to browse</p>
                  </div>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="max-w-xs mx-auto"
                  />
                </div>
              )}
            </div>

            {/* Account Selection */}
            <div className="space-y-2">
              <Label htmlFor="account">Import to Account</Label>
              <select
                id="account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="flex h-11 w-full rounded-[var(--radius-md)] border px-4 py-3 text-[15px] transition-colors focus:outline-none focus:ring-[3px]"
                style={{
                  backgroundColor: 'var(--color-input-bg)',
                  borderColor: 'var(--color-input-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="">Select account...</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Skip Rows */}
            <div className="space-y-2">
              <Label htmlFor="skipRows">Skip Header Rows</Label>
              <Input
                id="skipRows"
                type="number"
                min="0"
                value={skipRows}
                onChange={(e) => setSkipRows(parseInt(e.target.value) || 0)}
                className="max-w-[100px]"
              />
              <p className="text-xs text-[var(--color-text-muted)]">
                Skip additional rows at the start of the file (besides the header row)
              </p>
            </div>

            {/* Preview Button */}
            <Button
              onClick={handlePreview}
              disabled={!csvContent || !accountId || previewMutation.isPending}
              className="w-full"
            >
              {previewMutation.isPending ? (
                <span className="text-[var(--color-text-secondary)] animate-pulse">
                  Parsing...
                </span>
              ) : (
                <>
                  Preview Import
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            {previewMutation.error && (
              <div
                className="rounded-lg border p-4 text-sm text-[var(--color-danger)]"
                style={{
                  backgroundColor: 'var(--color-danger-light, rgba(176,112,96,0.1))',
                  borderColor: 'var(--color-danger)',
                }}
              >
                <AlertCircle className="h-4 w-4 inline mr-2" />
                {previewMutation.error.message}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && previewData && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-bg-surface)' }}
              >
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{previewData.totalRows}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Total Rows</p>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-success-light, rgba(95,133,99,0.1))' }}
              >
                <p className="text-2xl font-bold text-[var(--color-success)]">{previewData.parsedCount}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Valid</p>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-danger-light, rgba(176,112,96,0.1))' }}
              >
                <p className="text-2xl font-bold text-[var(--color-danger)]">{previewData.errors.length}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Errors</p>
              </div>
            </div>

            {/* Errors */}
            {previewData.errors.length > 0 && (
              <div
                className="rounded-lg border p-4"
                style={{
                  borderColor: 'var(--color-danger)',
                  backgroundColor: 'var(--color-danger-light, rgba(176,112,96,0.1))',
                }}
              >
                <p className="font-medium text-[var(--color-danger)] mb-2">Parse Errors</p>
                <ul className="text-sm text-[var(--color-danger)] space-y-1">
                  {previewData.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>Row {err.row}: {err.message}</li>
                  ))}
                  {previewData.errors.length > 5 && (
                    <li>...and {previewData.errors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview Table */}
            <div>
              <p className="font-medium text-[var(--color-text-primary)] mb-2">Preview (first 10 rows)</p>
              <div
                className="border rounded-lg overflow-hidden"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                      <th className="px-3 py-2 text-left text-[var(--color-text-secondary)]">Date</th>
                      <th className="px-3 py-2 text-left text-[var(--color-text-secondary)]">Description</th>
                      <th className="px-3 py-2 text-right text-[var(--color-text-secondary)]">Amount</th>
                    </tr>
                  </thead>
                  <tbody
                    className="divide-y"
                    style={{ '--tw-divide-color': 'var(--color-border-subtle)' } as React.CSSProperties}
                  >
                    {previewData.preview.map((tx, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-[var(--color-text-primary)]">{formatDate(tx.date)}</td>
                        <td className="px-3 py-2 truncate max-w-[200px] text-[var(--color-text-primary)]">
                          {tx.merchant || tx.description}
                        </td>
                        <td className={cn(
                          'px-3 py-2 text-right font-medium',
                          tx.type === 'income' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                        )}>
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={previewData.parsedCount === 0}
                className="flex-1"
              >
                Import {previewData.parsedCount} Transactions
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <div className="py-12 text-center">
            <div className="text-4xl mx-auto mb-4 animate-pulse text-[var(--color-text-muted)]">...</div>
            <p className="font-medium text-[var(--color-text-primary)]">Importing transactions...</p>
            <p className="text-sm text-[var(--color-text-secondary)]">This may take a moment</p>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && importResult && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <Check className="h-16 w-16 text-[var(--color-success)] mx-auto mb-4" />
              <p className="text-xl font-bold text-[var(--color-text-primary)]">Import Complete!</p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-success-light, rgba(95,133,99,0.1))' }}
              >
                <p className="text-2xl font-bold text-[var(--color-success)]">{importResult.imported}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Imported</p>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-warning-light, rgba(200,170,100,0.1))' }}
              >
                <p className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>{importResult.skipped}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Skipped (duplicates)</p>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-danger-light, rgba(176,112,96,0.1))' }}
              >
                <p className="text-2xl font-bold text-[var(--color-danger)]">{importResult.errors}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Errors</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Import Another
              </Button>
              <Button asChild className="flex-1">
                <a href="/cashflow">View Transactions</a>
              </Button>
            </div>
          </div>
        )}

        {importMutation.error && (
          <div
            className="mt-4 rounded-lg border p-4 text-sm text-[var(--color-danger)]"
            style={{
              backgroundColor: 'var(--color-danger-light, rgba(176,112,96,0.1))',
              borderColor: 'var(--color-danger)',
            }}
          >
            <AlertCircle className="h-4 w-4 inline mr-2" />
            {importMutation.error.message}
          </div>
        )}
      </Card>

      <PageFooter
        icon={<Upload className="w-5 h-5" />}
        label="TRANSACTION IMPORT"
        quote="Order is the shape upon which beauty depends."
      />
    </div>
  );
}
