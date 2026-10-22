import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { openStory } from './story.ts';

const dataRows = (page: import('@playwright/test').Page) =>
    page.getByRole('table', { name: 'Servers' }).locator('tbody tr');

test.describe('DataTable tools', () => {
    test('search and column filters narrow the rows and announce the count', async ({ page }) => {
        await openStory(page, 'data-datatable--tools');
        await page.getByRole('searchbox', { name: 'Search Servers' }).fill('frank');
        await expect(dataRows(page)).toHaveCount(3);
        await expect(page.getByRole('status')).toHaveText('3 entries');
        await page.getByRole('searchbox', { name: 'Search Servers' }).fill('');
        await page.getByRole('combobox', { name: 'Filter Location' }).click();
        await page.getByRole('option', { name: 'Vienna' }).click();
        await expect(dataRows(page)).toHaveCount(1);
        await expect(page.getByRole('status')).toHaveText('1 entry');
        await page.getByRole('textbox', { name: 'Filter Name' }).fill('web');
        await expect(dataRows(page)).toHaveText(/No entries/);
    });

    test('the column menu hides and shows columns', async ({ page }) => {
        await openStory(page, 'data-datatable--tools');
        await page.getByRole('button', { name: 'Columns' }).click();
        await page.getByRole('menuitemcheckbox', { name: 'Operating system' }).click();
        await expect(page.getByRole('columnheader', { name: 'Operating system' })).toHaveCount(0);
        await page.getByRole('menuitemcheckbox', { name: 'Operating system' }).click();
        await expect(page.getByRole('columnheader', { name: 'Operating system' })).toBeVisible();
    });

    test('exports the filtered rows of all pages as CSV', async ({ page }) => {
        await openStory(page, 'data-datatable--tools');
        await page.getByRole('searchbox', { name: 'Search Servers' }).fill('Nuremberg');
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.getByRole('button', { name: 'Export (CSV)' }).click(),
        ]);
        expect(download.suggestedFilename()).toBe('server.csv');
        const csv = await readFile((await download.path())!, 'utf8');
        expect(csv.split('\r\n')).toEqual([
            '﻿Name;Location;Operating system;Owner;Load',
            'k8s-node-3;Nuremberg;Talos 1.12;Platform;18',
            'backup-02;Nuremberg;Debian 12;Platform;96',
            'cache-01;Nuremberg;Alpine 3.22;Team Web;55',
        ]);
    });

    test('column widths change with the arrow keys on the header edge', async ({ page }) => {
        await openStory(page, 'data-datatable--tools');
        const handle = page.getByRole('separator', { name: 'Width of Name' });
        await expect(handle).toHaveAttribute('aria-valuenow', '160');
        await handle.focus();
        await page.keyboard.press('ArrowRight');
        await expect(handle).toHaveAttribute('aria-valuenow', '176');
        const header = page.getByRole('columnheader', { name: 'Name' });
        await expect.poll(async () => (await header.boundingBox())!.width).toBeCloseTo(176, 0);
    });

    test('the pinned column stays in place while scrolling sideways', async ({ page }) => {
        await page.setViewportSize({ width: 600, height: 700 });
        await openStory(page, 'data-datatable--tools');
        const cell = page.getByRole('button', { name: 'web-01, edit Name' });
        const before = (await cell.boundingBox())!.x;
        await page.getByRole('table', { name: 'Servers' }).evaluate((table) => (table.parentElement!.scrollLeft = 200));
        await expect.poll(async () => (await cell.boundingBox())!.x).toBeCloseTo(before, 0);
    });

    test('cells edit in place: Enter saves, Escape cancels, focus returns', async ({ page }) => {
        await openStory(page, 'data-datatable--tools');
        await page.getByRole('button', { name: 'web-01, edit Name' }).click();
        const input = page.getByRole('textbox', { name: 'Name', exact: true });
        await expect(input).toBeFocused();
        await input.fill('web-01-new');
        await page.keyboard.press('Enter');
        await expect(page.getByText('Last changed: web-01: name = web-01-new')).toBeVisible();
        const edited = page.getByRole('button', { name: 'web-01-new, edit Name' });
        await expect(edited).toBeFocused();
        await page.keyboard.press('Enter');
        await page.keyboard.type('discarded');
        await page.keyboard.press('Escape');
        await expect(edited).toBeFocused();
        await expect(page.getByText('Last changed: web-01: name = web-01-new')).toBeVisible();
    });

    test('groups open and close', async ({ page }) => {
        await openStory(page, 'data-datatable--grouped');
        const group = page.getByRole('button', { name: 'Location: Vienna, 1 entries' });
        await expect(group).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByRole('cell', { name: 'mail-01' })).toBeVisible();
        await group.click();
        await expect(group).toHaveAttribute('aria-expanded', 'false');
        await expect(page.getByRole('cell', { name: 'mail-01' })).toHaveCount(0);
    });
});

test.describe('DataTable custom filters', () => {
    const rows = (page: import('@playwright/test').Page) =>
        page.getByRole('table', { name: 'Services' }).locator('tbody tr[data-row-id]');

    test('a custom filter input, a range in the filter row and the filter row hidden', async ({ page }) => {
        await openStory(page, 'data-datatable--own-filters');
        await expect(rows(page)).toHaveCount(15);
        await page.getByText('Only Team Web').click();
        await expect(rows(page)).toHaveCount(5);
        await page.getByRole('spinbutton', { name: 'Filter Cost, From' }).fill('500');
        await page.keyboard.press('Tab');
        const costs = await rows(page).locator('td:nth-child(5)').allTextContents();
        expect(costs.length).toBeGreaterThan(0);
        expect(costs.every((cost) => Number(cost.replace(/\D/g, '')) >= 500)).toBe(true);
        // Hiding the filter row keeps the filters
        const toggle = page.getByRole('button', { name: 'Show filters' });
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await expect(page.getByRole('checkbox', { name: 'Only Team Web' })).toHaveCount(0);
        await expect(rows(page)).toHaveCount(costs.length);
        await toggle.click();
        await page.getByRole('textbox', { name: 'Filter Name' }).fill('xyz');
        await expect(page.getByText('No service matches the filters.')).toBeVisible();
    });

    test('a custom match mode for lists in the filter row', async ({ page }) => {
        await openStory(page, 'data-datatable--own-filters');
        await page.getByRole('combobox', { name: 'Filter Tags' }).click();
        await page.getByRole('option', { name: 'db', exact: true }).click();
        const tags = await rows(page).locator('td:nth-child(3)').allTextContents();
        expect(tags).toHaveLength(6);
        expect(tags.every((value) => value.split(', ').includes('db'))).toBe(true);
    });
});

test.describe('DataTable editors', () => {
    test('a select with grouped choices saves the value, a check asks the server', async ({ page }) => {
        await openStory(page, 'data-datatable--editors');
        await page.getByRole('button', { name: 'Frankfurt, edit Location' }).first().click();
        const select = page.getByRole('combobox', { name: 'Location' });
        await expect(select).toBeFocused();
        await select.click();
        await expect(page.getByRole('group', { name: 'Abroad' })).toBeVisible();
        await page.getByRole('option', { name: 'Vienna' }).click();
        await expect(
            page.getByRole('row', { name: /vm-0001/ }).getByRole('button', { name: 'Vienna, edit Location' })
        ).toBeFocused();

        await page.getByRole('button', { name: 'vm-0001, edit Name' }).click();
        const name = page.getByRole('textbox', { name: 'Name', exact: true });
        await name.fill('vm-0002');
        await page.keyboard.press('Enter');
        await expect(page.getByRole('alert')).toHaveText('This name is already taken');
        await expect(name).toBeFocused();
        await name.fill('vm-0099');
        await page.keyboard.press('Enter');
        await expect(page.getByRole('button', { name: 'vm-0099, edit Name' })).toBeFocused();
    });
});

test.describe('DataTable column widths', () => {
    test('a double click on the column edge fits the width to the content', async ({ page }) => {
        await openStory(page, 'data-datatable--status-bar');
        const handle = page.getByRole('separator', { name: 'Width of Name' });
        await expect(handle).toHaveAttribute('aria-valuenow', '150');
        await handle.dblclick();
        await expect.poll(async () => Number(await handle.getAttribute('aria-valuenow'))).toBeLessThan(150);
        await expect(page.getByText('3 selected')).toBeVisible();
        await expect(page.getByText(/Cores per machine: Total/)).toBeVisible();
    });
});
