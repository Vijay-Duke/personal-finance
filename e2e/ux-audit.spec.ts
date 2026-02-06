import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'ux-screenshots';

test.describe('UX Audit Screenshots', () => {

    test.beforeAll(async () => {
        // Ensure screenshot directory exists
        if (!fs.existsSync(SCREENSHOT_DIR)) {
            fs.mkdirSync(SCREENSHOT_DIR);
        }
    });

    test.setTimeout(120000); // Increase timeout to 2 minutes for full audit

    test('capture screenshots of all identified pages', async ({ page }) => {

        // Helper to take screenshot
        const takeScreenshot = async (name: string) => {
            console.log(`Taking screenshot: ${name}`);
            await page.waitForLoadState('networkidle');
            // Wait a bit for any animations
            await page.waitForTimeout(1000);
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
        };

        // 1. Landing / Public Page (Unauthenticated)
        await test.step('Landing Page', async () => {
            await page.goto('/');
            await takeScreenshot('01-landing-unauth');
        });

        // 2. Authentication - Sign Up
        await test.step('Sign Up Flow', async () => {
            await page.goto('/auth/signup');
            await takeScreenshot('02-signup-page');

            // Generate unique user to ensure successful "new user" flow every time
            const uniqueSuffix = Date.now().toString();
            await page.getByLabel('Full name').fill(`Audit User ${uniqueSuffix}`);
            await page.getByLabel('Email').fill(`audit_${uniqueSuffix}@example.com`);
            await page.getByLabel('Password', { exact: true }).fill('Password123!');
            await page.getByLabel('Confirm password').fill('Password123!');

            const submitBtn = page.getByRole('button', { name: /sign up|create account/i });
            if (await submitBtn.isVisible()) {
                await submitBtn.click();
                await page.waitForURL('**/*');
            }
        });

        // 3. Dashboard (Authenticated Index)
        await test.step('Dashboard', async () => {
            await page.goto('/');
            await takeScreenshot('03-dashboard');
        });

        // 4. Financial Management (Top Level)
        const mainPages = [
            { path: '/cashflow', name: '04-cashflow' },
            { path: '/budgets', name: '05-budgets' },
            { path: '/goals', name: '06-goals' },
            { path: '/recurring', name: '07-recurring' },
            { path: '/insurance', name: '08-insurance' },
            { path: '/import', name: '09-import' },
        ];

        for (const { path, name } of mainPages) {
            await test.step(name, async () => {
                await page.goto(path);
                await takeScreenshot(name);
            });
        }

        // 5. Assets & Accounts (Deep Dive)
        const accountPages = [
            { path: '/accounts', name: '10-accounts-index' },
            { path: '/accounts/bank', name: '11-accounts-bank' },
            { path: '/accounts/real-estate', name: '12-accounts-real-estate' },
            { path: '/accounts/stocks', name: '13-accounts-stocks' },
            { path: '/accounts/crypto', name: '14-accounts-crypto' },
            { path: '/accounts/superannuation', name: '15-accounts-superannuation' },
            { path: '/accounts/personal-assets', name: '16-accounts-personal' },
            { path: '/accounts/business-assets', name: '17-accounts-business' },
            { path: '/accounts/debts', name: '18-accounts-debts' },
            { path: '/accounts/add', name: '19-accounts-add' },
        ];

        for (const { path, name } of accountPages) {
            await test.step(name, async () => {
                await page.goto(path);
                await takeScreenshot(name);
            });
        }

        // 6. Settings & Utility
        const settingsPages = [
            { path: '/profile', name: '20-profile' },
            { path: '/settings', name: '21-settings-general' },
            { path: '/settings/ai', name: '22-settings-ai' },
            { path: '/settings/category-rules', name: '23-settings-categories' },
            { path: '/settings/data-sources', name: '24-settings-data-sources' },
            { path: '/offline', name: '25-offline-preview' },
        ];

        for (const { path, name } of settingsPages) {
            await test.step(name, async () => {
                await page.goto(path);
                await takeScreenshot(name);
            });
        }

    });
});
