import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import {
  transactions,
  importBatches,
  accounts,
  categoryRules,
  type NewTransaction,
} from '../../../lib/db/schema';
import { eq, and, like, sql } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';
import { parseCSV, type ParsedTransaction } from '../../../lib/import/csv-parser';

/**
 * POST /api/import/csv
 * Import transactions from CSV.
 *
 * Body:
 * - csvContent: string (the CSV file content)
 * - accountId: string (target account)
 * - skipRows?: number (rows to skip at start)
 * - mapping?: ColumnMapping (custom column mapping)
 * - preview?: boolean (if true, only parse and return preview)
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();

    if (!body.csvContent) {
      return error('CSV content is required');
    }
    if (!body.accountId) {
      return error('Account ID is required');
    }

    // Verify account belongs to household
    const [account] = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.id, body.accountId),
          eq(accounts.householdId, session.user.householdId)
        )
      );

    if (!account) {
      return error('Account not found', 404);
    }

    // Parse CSV
    const parseResult = parseCSV(body.csvContent, {
      mapping: body.mapping,
      skipRows: body.skipRows || 0,
      datePreferDayFirst: body.datePreferDayFirst ?? true,
    });

    // If preview mode, return parsed data without importing
    if (body.preview) {
      return json({
        success: parseResult.success,
        headers: parseResult.headers,
        totalRows: parseResult.totalRows,
        parsedCount: parseResult.transactions.length,
        errors: parseResult.errors,
        warnings: parseResult.warnings,
        preview: parseResult.transactions.slice(0, 10).map(tx => ({
          date: tx.date.toISOString(),
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          merchant: tx.merchant,
        })),
      });
    }

    if (!parseResult.success && parseResult.transactions.length === 0) {
      return error('Failed to parse CSV: ' + parseResult.errors[0]?.message);
    }

    // Get category rules for auto-categorization
    const rules = await db
      .select()
      .from(categoryRules)
      .where(
        and(
          eq(categoryRules.householdId, session.user.householdId),
          eq(categoryRules.isActive, true)
        )
      )
      .orderBy(categoryRules.priority);

    // Create import batch
    const [batch] = await db.insert(importBatches).values({
      householdId: session.user.householdId,
      source: 'csv',
      fileName: body.fileName,
      accountId: body.accountId,
      totalRows: parseResult.totalRows,
      status: 'processing',
      createdBy: session.user.id,
    }).returning();

    // Import transactions
    let importedCount = 0;
    let skippedCount = 0;
    const importErrors: string[] = [];

    for (const tx of parseResult.transactions) {
      try {
        // Auto-categorize
        let categoryId: string | undefined;
        for (const rule of rules) {
          const fieldValue = rule.matchField === 'merchant'
            ? tx.merchant
            : tx.description;

          if (!fieldValue) continue;

          const testValue = rule.caseSensitive ? fieldValue : fieldValue.toLowerCase();
          const matchValue = rule.caseSensitive ? rule.matchValue : rule.matchValue.toLowerCase();

          let matches = false;
          switch (rule.matchType) {
            case 'contains':
              matches = testValue.includes(matchValue);
              break;
            case 'starts_with':
              matches = testValue.startsWith(matchValue);
              break;
            case 'ends_with':
              matches = testValue.endsWith(matchValue);
              break;
            case 'exact':
              matches = testValue === matchValue;
              break;
            case 'regex':
              try {
                const regex = new RegExp(rule.matchValue, rule.caseSensitive ? '' : 'i');
                matches = regex.test(fieldValue);
              } catch {
                // Invalid regex, skip
              }
              break;
          }

          if (matches) {
            categoryId = rule.categoryId;
            // Update rule stats
            await db
              .update(categoryRules)
              .set({
                matchCount: sql`${categoryRules.matchCount} + 1`,
                lastMatchedAt: new Date(),
              })
              .where(eq(categoryRules.id, rule.id));
            break;
          }
        }

        // Create unique external ID for deduplication
        const externalId = `csv_${batch.id}_${tx.date.toISOString()}_${tx.amount}_${tx.description?.slice(0, 50)}`;

        // Check for duplicates
        const [existing] = await db
          .select({ id: transactions.id })
          .from(transactions)
          .where(
            and(
              eq(transactions.accountId, body.accountId),
              eq(transactions.externalId, externalId)
            )
          )
          .limit(1);

        if (existing) {
          skippedCount++;
          continue;
        }

        // Create transaction
        const txData: NewTransaction = {
          householdId: session.user.householdId,
          accountId: body.accountId,
          type: tx.type,
          status: 'cleared',
          amount: tx.amount,
          currency: account.currency || 'USD',
          date: tx.date,
          description: tx.description,
          merchant: tx.merchant,
          categoryId,
          reference: tx.reference,
          importBatchId: batch.id,
          externalId,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        };

        await db.insert(transactions).values(txData);

        // Update account balance
        const balanceChange = tx.type === 'income' ? tx.amount : -tx.amount;
        await db
          .update(accounts)
          .set({
            currentBalance: sql`${accounts.currentBalance} + ${balanceChange}`,
            updatedAt: new Date(),
          })
          .where(eq(accounts.id, body.accountId));

        importedCount++;
      } catch (txError) {
        importErrors.push(`Row error: ${txError}`);
      }
    }

    // Update batch status
    await db
      .update(importBatches)
      .set({
        status: importErrors.length > 0 ? 'completed' : 'completed',
        importedCount,
        skippedCount,
        errorCount: parseResult.errors.length + importErrors.length,
        errorMessage: importErrors.length > 0 ? importErrors.join('; ') : undefined,
        completedAt: new Date(),
      })
      .where(eq(importBatches.id, batch.id));

    return created({
      batchId: batch.id,
      totalRows: parseResult.totalRows,
      imported: importedCount,
      skipped: skippedCount,
      errors: parseResult.errors.length + importErrors.length,
      parseErrors: parseResult.errors,
    });
  } catch (err) {
    console.error('Error importing CSV:', err);
    return error('Failed to import CSV', 500);
  }
};
