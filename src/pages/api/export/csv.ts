import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import {
  transactions,
  accounts,
  categories,
  tags,
  transactionTags,
} from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { error, unauthorized } from '../../../lib/api/response';

/**
 * Convert array of objects to CSV string
 */
function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, newline, or quote
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * GET /api/export/csv
 * Export data as CSV files (zipped or individual).
 *
 * Query params:
 * - type: Type of data to export (transactions, accounts, all)
 * - startDate: Filter transactions from date (ISO string)
 * - endDate: Filter transactions to date (ISO string)
 * - accountId: Filter transactions by account
 * - format: Output format (csv, zip) - default: csv
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const type = url.searchParams.get('type') || 'transactions';
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const accountId = url.searchParams.get('accountId');

  const householdId = session.user.householdId;

  try {
    // Export transactions
    if (type === 'transactions' || type === 'all') {
      const conditions = [eq(transactions.householdId, householdId)];

      if (startDate) {
        conditions.push(eq(transactions.date, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(eq(transactions.date, new Date(endDate)));
      }
      if (accountId) {
        conditions.push(eq(transactions.accountId, accountId));
      }

      const transactionsData = await db
        .select({
          id: transactions.id,
          accountId: transactions.accountId,
          accountName: accounts.name,
          type: transactions.type,
          status: transactions.status,
          amount: transactions.amount,
          currency: transactions.currency,
          date: transactions.date,
          description: transactions.description,
          merchant: transactions.merchant,
          merchantCategory: transactions.merchantCategory,
          categoryId: transactions.categoryId,
          categoryName: categories.name,
          notes: transactions.notes,
          reference: transactions.reference,
          location: transactions.location,
          createdAt: transactions.createdAt,
        })
        .from(transactions)
        .leftJoin(accounts, eq(transactions.accountId, accounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(...conditions))
        .orderBy(desc(transactions.date));

      // Get tags for transactions
      const transactionIds = transactionsData.map(t => t.id);
      let transactionTagsMap: Record<string, string> = {};

      if (transactionIds.length > 0) {
        const allTransactionTags = await db
          .select({
            transactionId: transactionTags.transactionId,
            tagName: tags.name,
          })
          .from(transactionTags)
          .leftJoin(tags, eq(transactionTags.tagId, tags.id))
          .where(eq(transactionTags.householdId, householdId));

        const tagsByTransaction = allTransactionTags.reduce((acc, tt) => {
          if (!acc[tt.transactionId]) acc[tt.transactionId] = [];
          if (tt.tagName) acc[tt.transactionId].push(tt.tagName);
          return acc;
        }, {} as Record<string, string[]>);

        transactionTagsMap = Object.entries(tagsByTransaction).reduce((acc, [id, tagList]) => {
          acc[id] = tagList.join('; ');
          return acc;
        }, {} as Record<string, string>);
      }

      // Format for CSV
      const csvData = transactionsData.map(t => ({
        Date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
        Account: t.accountName || t.accountId,
        Type: t.type,
        Description: t.description || '',
        Merchant: t.merchant || '',
        Category: t.categoryName || '',
        Amount: t.amount,
        Currency: t.currency,
        Status: t.status,
        Tags: transactionTagsMap[t.id] || '',
        Notes: t.notes || '',
        Reference: t.reference || '',
        Location: t.location || '',
        'Merchant Category': t.merchantCategory || '',
      }));

      const csv = toCSV(csvData);
      const filename = `transactions-${new Date().toISOString().split('T')[0]}.csv`;

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Export accounts
    if (type === 'accounts') {
      const accountsData = await db
        .select({
          id: accounts.id,
          name: accounts.name,
          type: accounts.type,
          subtype: accounts.subtype,
          currency: accounts.currency,
          currentBalance: accounts.currentBalance,
          institution: accounts.institution,
          accountNumber: accounts.accountNumber,
          isActive: accounts.isActive,
          createdAt: accounts.createdAt,
        })
        .from(accounts)
        .where(eq(accounts.householdId, householdId));

      const csvData = accountsData.map(a => ({
        Name: a.name,
        Type: a.type,
        Subtype: a.subtype || '',
        Institution: a.institution || '',
        'Account Number': a.accountNumber || '',
        'Current Balance': a.currentBalance,
        Currency: a.currency,
        Active: a.isActive ? 'Yes' : 'No',
        'Created At': a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '',
      }));

      const csv = toCSV(csvData);
      const filename = `accounts-${new Date().toISOString().split('T')[0]}.csv`;

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return error('Invalid export type. Use: transactions, accounts, or all');
  } catch (err) {
    console.error('Error exporting CSV:', err);
    return error('Failed to export CSV', 500);
  }
};
