/**
 * CSV Import Parser
 * Parses CSV files from various bank formats and maps them to transactions.
 */

export interface ParsedTransaction {
  date: Date;
  amount: number;
  description: string;
  merchant?: string;
  type: 'income' | 'expense' | 'transfer';
  reference?: string;
  balance?: number;
  rawData: Record<string, string>;
}

export interface CSVParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
  detectedFormat?: string;
  headers: string[];
  totalRows: number;
}

export interface ColumnMapping {
  date: string;
  amount: string;
  description: string;
  merchant?: string;
  reference?: string;
  balance?: string;
  // For formats with separate debit/credit columns
  debit?: string;
  credit?: string;
}

/**
 * Parse a date string into a Date object
 */
function parseDate(dateStr: string, preferDayFirst = true): Date | null {
  if (!dateStr) return null;

  dateStr = dateStr.trim();

  // Try ISO format first
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  }

  // Try slash/dash separated
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const nums = parts.map(p => parseInt(p.trim()));

    // If first part is 4 digits, it's YYYY/MM/DD
    if (parts[0].length === 4) {
      return new Date(nums[0], nums[1] - 1, nums[2]);
    }

    // If last part is 4 digits, determine if DD/MM/YYYY or MM/DD/YYYY
    if (parts[2].length === 4) {
      if (preferDayFirst || nums[0] > 12) {
        // DD/MM/YYYY
        return new Date(nums[2], nums[1] - 1, nums[0]);
      } else {
        // MM/DD/YYYY
        return new Date(nums[2], nums[0] - 1, nums[1]);
      }
    }

    // 2-digit year
    const year = nums[2] < 100 ? (nums[2] > 50 ? 1900 + nums[2] : 2000 + nums[2]) : nums[2];
    if (preferDayFirst || nums[0] > 12) {
      return new Date(year, nums[1] - 1, nums[0]);
    } else {
      return new Date(year, nums[0] - 1, nums[1]);
    }
  }

  // Try native parsing as last resort
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parse a currency amount string into a number
 */
function parseAmount(amountStr: string): number | null {
  if (!amountStr) return null;

  // Remove currency symbols and whitespace
  let cleaned = amountStr.trim().replace(/[$€£¥₹AUD\s]/gi, '');

  // Handle parentheses for negative (accounting format)
  const isNegative = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isNegative) {
    cleaned = cleaned.slice(1, -1);
  }

  // Handle explicit negative sign
  const hasNegativeSign = cleaned.startsWith('-');
  if (hasNegativeSign) {
    cleaned = cleaned.slice(1);
  }

  // Determine decimal separator
  // If there's a comma after a period, comma is thousands separator
  // If there's a period after a comma, period is decimal separator
  const lastComma = cleaned.lastIndexOf(',');
  const lastPeriod = cleaned.lastIndexOf('.');

  if (lastComma > lastPeriod && lastComma > cleaned.length - 4) {
    // European format: 1.234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // US format: 1,234.56
    cleaned = cleaned.replace(/,/g, '');
  }

  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  return (isNegative || hasNegativeSign) ? -num : num;
}

/**
 * Parse CSV string into rows
 */
function parseCSVRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        if (char === '\r') i++;
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }

  // Don't forget the last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Auto-detect column mapping based on headers
 */
function detectColumnMapping(headers: string[]): ColumnMapping | null {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());

  const mapping: Partial<ColumnMapping> = {};

  // Date columns
  const datePatterns = ['date', 'transaction date', 'trans date', 'posted date', 'value date'];
  for (const pattern of datePatterns) {
    const idx = lowerHeaders.findIndex(h => h.includes(pattern));
    if (idx >= 0) {
      mapping.date = headers[idx];
      break;
    }
  }

  // Amount columns
  const amountPatterns = ['amount', 'value', 'sum', 'total'];
  for (const pattern of amountPatterns) {
    const idx = lowerHeaders.findIndex(h => h === pattern || h.includes(pattern));
    if (idx >= 0 && !lowerHeaders[idx].includes('balance')) {
      mapping.amount = headers[idx];
      break;
    }
  }

  // Debit/Credit columns (alternative to single amount)
  if (!mapping.amount) {
    const debitIdx = lowerHeaders.findIndex(h => h.includes('debit') || h === 'withdrawal' || h === 'dr');
    const creditIdx = lowerHeaders.findIndex(h => h.includes('credit') || h === 'deposit' || h === 'cr');
    if (debitIdx >= 0 && creditIdx >= 0) {
      mapping.debit = headers[debitIdx];
      mapping.credit = headers[creditIdx];
    }
  }

  // Description columns
  const descPatterns = ['description', 'narrative', 'details', 'memo', 'particulars', 'reference'];
  for (const pattern of descPatterns) {
    const idx = lowerHeaders.findIndex(h => h.includes(pattern));
    if (idx >= 0) {
      mapping.description = headers[idx];
      break;
    }
  }

  // Merchant/Payee
  const merchantPatterns = ['merchant', 'payee', 'vendor', 'name'];
  for (const pattern of merchantPatterns) {
    const idx = lowerHeaders.findIndex(h => h.includes(pattern));
    if (idx >= 0) {
      mapping.merchant = headers[idx];
      break;
    }
  }

  // Reference/Check number
  const refPatterns = ['reference', 'ref', 'check', 'cheque', 'transaction id'];
  for (const pattern of refPatterns) {
    const idx = lowerHeaders.findIndex(h => h.includes(pattern) && !h.includes('description'));
    if (idx >= 0) {
      mapping.reference = headers[idx];
      break;
    }
  }

  // Balance
  const balanceIdx = lowerHeaders.findIndex(h => h.includes('balance'));
  if (balanceIdx >= 0) {
    mapping.balance = headers[balanceIdx];
  }

  // Validate minimum required fields
  if (!mapping.date) return null;
  if (!mapping.amount && !(mapping.debit && mapping.credit)) return null;
  if (!mapping.description) {
    // Try to find any text column as fallback
    const textIdx = lowerHeaders.findIndex((h, i) =>
      i !== lowerHeaders.indexOf(mapping.date!) &&
      !h.includes('amount') && !h.includes('balance')
    );
    if (textIdx >= 0) {
      mapping.description = headers[textIdx];
    } else {
      return null;
    }
  }

  return mapping as ColumnMapping;
}

/**
 * Parse a CSV file with automatic format detection
 */
export function parseCSV(
  csvText: string,
  options: {
    mapping?: ColumnMapping;
    skipRows?: number;
    datePreferDayFirst?: boolean;
  } = {}
): CSVParseResult {
  const { skipRows = 0, datePreferDayFirst = true } = options;

  const rows = parseCSVRows(csvText);

  if (rows.length < 2) {
    return {
      success: false,
      transactions: [],
      errors: [{ row: 0, message: 'CSV file is empty or has no data rows' }],
      warnings: [],
      headers: [],
      totalRows: 0,
    };
  }

  // Skip initial rows if specified
  const dataRows = rows.slice(skipRows);
  const headers = dataRows[0];

  // Detect or use provided mapping
  const mapping = options.mapping || detectColumnMapping(headers);

  if (!mapping) {
    return {
      success: false,
      transactions: [],
      errors: [{ row: 0, message: 'Could not detect column mapping. Please specify manually.' }],
      warnings: [],
      headers,
      totalRows: dataRows.length - 1,
    };
  }

  const transactions: ParsedTransaction[] = [];
  const errors: { row: number; message: string }[] = [];
  const warnings: { row: number; message: string }[] = [];

  // Create header index map
  const headerIndex: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerIndex[h] = i;
  });

  // Parse data rows
  for (let i = 1; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = i + skipRows + 1;

    if (!row.some(cell => cell)) continue; // Skip empty rows

    const rawData: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rawData[h] = row[idx] || '';
    });

    // Parse date
    const dateStr = row[headerIndex[mapping.date]];
    const date = parseDate(dateStr, datePreferDayFirst);
    if (!date) {
      errors.push({ row: rowNum, message: `Invalid date: "${dateStr}"` });
      continue;
    }

    // Parse amount
    let amount: number;
    if (mapping.amount) {
      const amountVal = parseAmount(row[headerIndex[mapping.amount]]);
      if (amountVal === null) {
        errors.push({ row: rowNum, message: `Invalid amount: "${row[headerIndex[mapping.amount]]}"` });
        continue;
      }
      amount = amountVal;
    } else if (mapping.debit && mapping.credit) {
      const debit = parseAmount(row[headerIndex[mapping.debit]]) || 0;
      const credit = parseAmount(row[headerIndex[mapping.credit]]) || 0;
      amount = credit - debit;
    } else {
      errors.push({ row: rowNum, message: 'No amount column found' });
      continue;
    }

    // Parse description
    const description = row[headerIndex[mapping.description]] || '';

    // Parse optional fields
    const merchant = mapping.merchant ? row[headerIndex[mapping.merchant]] : undefined;
    const reference = mapping.reference ? row[headerIndex[mapping.reference]] : undefined;
    const balanceVal = mapping.balance ? parseAmount(row[headerIndex[mapping.balance]]) : undefined;

    // Determine transaction type
    const type: 'income' | 'expense' | 'transfer' = amount >= 0 ? 'income' : 'expense';

    transactions.push({
      date,
      amount: Math.abs(amount),
      description,
      merchant: merchant || undefined,
      type,
      reference: reference || undefined,
      balance: balanceVal ?? undefined,
      rawData,
    });
  }

  return {
    success: errors.length === 0,
    transactions,
    errors,
    warnings,
    headers,
    totalRows: dataRows.length - 1,
    detectedFormat: mapping.amount ? 'single-amount' : 'debit-credit',
  };
}

/**
 * Deduplicate transactions against existing ones
 */
export function deduplicateTransactions(
  newTransactions: ParsedTransaction[],
  existingTransactions: { date: Date; amount: number; description: string }[]
): { unique: ParsedTransaction[]; duplicates: ParsedTransaction[] } {
  const existingSet = new Set(
    existingTransactions.map(t =>
      `${t.date.toISOString().split('T')[0]}|${t.amount}|${t.description.toLowerCase().trim()}`
    )
  );

  const unique: ParsedTransaction[] = [];
  const duplicates: ParsedTransaction[] = [];

  for (const tx of newTransactions) {
    const key = `${tx.date.toISOString().split('T')[0]}|${tx.amount}|${tx.description.toLowerCase().trim()}`;
    if (existingSet.has(key)) {
      duplicates.push(tx);
    } else {
      unique.push(tx);
      existingSet.add(key); // Prevent duplicates within the import batch
    }
  }

  return { unique, duplicates };
}
