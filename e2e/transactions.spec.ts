/**
 * Transactions E2E Tests
 * Tests transaction management functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/');
    
    // Navigate to cashflow
    await page.goto('/cashflow');
  });

  test('should display transaction list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /cashflow/i })).toBeVisible();
    
    // Check for transaction table or list
    const transactionList = page.locator('table, [data-testid="transaction-list"]').first();
    await expect(transactionList).toBeVisible();
  });

  test('should filter transactions by date range', async ({ page }) => {
    // Open date filter
    await page.getByRole('button', { name: /filter|date range/i }).click();
    
    // Select date range
    await page.getByLabel(/start date/i).fill('2024-01-01');
    await page.getByLabel(/end date/i).fill('2024-01-31');
    
    // Apply filter
    await page.getByRole('button', { name: /apply|filter/i }).click();
    
    // Verify filtered results
    await expect(page.getByText(/january 2024/i)).toBeVisible();
  });

  test('should search transactions', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|find transactions/i);
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('grocery');
      await searchInput.press('Enter');
      
      // Verify search results
      await expect(page.getByText(/grocery/i).first()).toBeVisible();
    }
  });

  test('should open CSV import modal', async ({ page }) => {
    await page.getByRole('button', { name: /import|upload csv/i }).click();
    
    await expect(page.getByRole('heading', { name: /import|upload/i })).toBeVisible();
    await expect(page.getByLabel(/file|csv file/i)).toBeVisible();
  });
});
