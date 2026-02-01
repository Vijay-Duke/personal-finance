/**
 * Authentication E2E Tests
 * Tests user login, registration, and session management
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('link', { name: /sign up|register|create account/i }).click();
    
    await expect(page).toHaveURL(/.*register|signup.*/);
    await expect(page.getByRole('heading', { name: /sign up|create account/i })).toBeVisible();
  });
});
