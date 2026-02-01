/**
 * Dashboard E2E Tests
 * Tests main dashboard functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for navigation to dashboard
    await page.waitForURL('/');
  });

  test('should display dashboard with net worth', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText(/net worth/i)).toBeVisible();
  });

  test('should display asset summary cards', async ({ page }) => {
    await expect(page.getByText(/total assets/i)).toBeVisible();
    await expect(page.getByText(/total debts/i)).toBeVisible();
  });

  test('should navigate to accounts page', async ({ page }) => {
    await page.getByRole('link', { name: /accounts/i }).click();
    
    await expect(page).toHaveURL(/.*accounts.*/);
    await expect(page.getByRole('heading', { name: /accounts/i })).toBeVisible();
  });

  test('should navigate to cashflow page', async ({ page }) => {
    await page.getByRole('link', { name: /cashflow|transactions/i }).click();
    
    await expect(page).toHaveURL(/.*cashflow.*/);
    await expect(page.getByRole('heading', { name: /cashflow|transactions/i })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that mobile menu button is visible
    await expect(page.getByRole('button', { name: /menu|toggle/i })).toBeVisible();
  });
});
