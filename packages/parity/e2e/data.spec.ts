import { expect, test } from '@playwright/test';
import { openStory } from './story.js';

test.describe('DataTable', () => {
    test('sorts with the keyboard and reports it via aria-sort', async ({ page }) => {
        await openStory(page, 'data-datatable--playground');
        const header = page.getByRole('columnheader', { name: /Load/ });
        await page.getByRole('button', { name: 'Load' }).focus();
        await page.keyboard.press('Enter');
        await expect(header).toHaveAttribute('aria-sort', 'ascending');
        await expect(page.getByRole('row').nth(1)).toContainText('k8s-node-3');
        await page.keyboard.press('Enter');
        await expect(header).toHaveAttribute('aria-sort', 'descending');
        await expect(page.getByRole('row').nth(1)).toContainText('backup-02');
    });

    test('selects all rows of the page with Space', async ({ page }) => {
        await openStory(page, 'data-datatable--playground');
        await page.getByRole('checkbox', { name: 'Select all rows on this page' }).focus();
        await page.keyboard.press('Space');
        await expect(page.getByText('Selected: web-01, db-primary, k8s-node-3, backup-02')).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'Select web-01' })).toBeChecked();
    });
});

test.describe('VirtualSelect', () => {
    test('reaches the last of 10,000 options with End while rendering only a few', async ({ page }) => {
        await openStory(page, 'forms-virtualselect--playground');
        const trigger = page.getByRole('combobox', { name: /Customer/ });
        await trigger.focus();
        await page.keyboard.press('Enter');
        const listbox = page.getByRole('listbox');
        await expect(listbox).toBeVisible();
        expect(await listbox.getByRole('option').count()).toBeLessThan(60);
        await expect(listbox.getByRole('option').first()).toHaveAttribute('aria-setsize', '10000');

        await page.keyboard.press('End');
        const last = listbox.getByRole('option', { name: 'Customer 10000' });
        await expect(last).toHaveAttribute('data-highlighted', '');
        await expect(last).toBeInViewport();
        await expect(last).toHaveAttribute('aria-posinset', '10000');
        await page.keyboard.press('Enter');
        await expect(trigger).toHaveText('Customer 10000');
        await expect(trigger).toBeFocused();
    });

    test('endless list: reaching the end loads the next entries', async ({ page }) => {
        await openStory(page, 'forms-virtualselect--endless');
        await page.getByRole('combobox', { name: 'Customer' }).click();
        const listbox = page.getByRole('listbox');
        await expect(listbox.getByRole('option').first()).toHaveAttribute('aria-setsize', '50');
        await page.keyboard.press('End');
        await expect(listbox.getByRole('option').first()).toHaveAttribute('aria-setsize', '100');
    });

    test('data source: pages while scrolling, the search asks the server, the choice keeps its label', async ({
        page,
    }) => {
        await openStory(page, 'forms-virtualselect--from-server');
        const trigger = page.getByRole('combobox', { name: 'Customer' });
        await trigger.click();
        const listbox = page.getByRole('listbox');
        await expect(listbox.getByRole('option').first()).toHaveAttribute('aria-setsize', '50');
        // The search field keeps End for its caret – scroll the list instead
        await listbox.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
        await expect(listbox.getByRole('option').first()).toHaveAttribute('aria-setsize', '100');
        await page.getByRole('combobox', { name: 'Filter options' }).fill('09999');
        const option = listbox.getByRole('option', { name: 'Customer 09999' });
        await expect(option).toBeVisible();
        await option.click();
        await expect(trigger).toHaveText('Customer 09999');
    });
});

test.describe('TanStack Form', () => {
    test('shows errors on every invalid field after submit and sends once valid', async ({ page }) => {
        await openStory(page, 'forms-tanstack-form--playground');
        await page.getByRole('button', { name: 'Send request' }).click();
        await expect(page.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
        await expect(page.getByLabel('Email')).toHaveAccessibleDescription(/Enter a valid address/);
        await expect(page.getByText('Please agree')).toBeVisible();

        await page.getByLabel('Name').fill('Max Mustermann');
        await page.getByLabel('Email').fill('max@example.com');
        await page.getByRole('combobox', { name: 'Service' }).click();
        await page.getByRole('option', { name: 'Hosting' }).click();
        await page.getByText('I agree').click();
        await expect(page.getByRole('checkbox', { name: /I agree/ })).toBeChecked();
        await page.getByRole('button', { name: 'Send request' }).click();
        await expect(page.getByText('Sent: Max Mustermann <max@example.com>')).toBeVisible();
    });
});
