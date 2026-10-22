import { expect, test } from '@playwright/test';
import { openStory } from '../story.ts';

// Data, hierarchy and complex components of @wirecore/wirelayer-native (RN part 3) in the browser (react-native-web)

test.describe('DataTable', () => {
    test('a header sorts the table; the sort state is part of its name', async ({ page }) => {
        await openStory(page, 'data-datatable--playground');
        const table = page.getByRole('table', { name: 'Customers' });
        await expect(table).toBeVisible();
        await table.getByRole('button', { name: 'Customer', exact: true }).click();
        await expect(table.getByRole('button', { name: 'Customer, sort level 1, ascending' })).toBeVisible();
        await expect(table.getByRole('row').nth(1)).toContainText('Brandt Motors');
        await table.getByRole('button', { name: 'Customer, sort level 1, ascending' }).click();
        await expect(table.getByRole('button', { name: 'Customer, sort level 1, descending' })).toBeVisible();
    });

    test('cards per row, sorted in the sheet', async ({ page }) => {
        await openStory(page, 'data-datatable--cards');
        await expect(page.getByRole('table')).toHaveCount(0);
        const cards = page.getByRole('group', { name: 'Customers', exact: true });
        await expect(cards.getByRole('group', { name: 'Lindner Bakery', exact: true })).toBeVisible();
        await expect(cards.getByRole('group', { name: 'Lindner Bakery', exact: true })).toContainText('Revenue');
        await page.getByRole('button', { name: 'Sort', exact: true }).click();
        const sheet = page.getByRole('dialog', { name: 'Sort' });
        await sheet.getByRole('radio', { name: 'Revenue' }).click();
        await sheet.getByRole('radio', { name: 'Sort descending' }).click();
        await sheet.getByRole('button', { name: 'Close' }).click();
        await expect(sheet).toBeHidden();
        await expect(cards.getByRole('group').first()).toHaveAccessibleName('Wagner Carpentry 22');
    });

    test('checkboxes select rows; cancelled customers cannot be selected', async ({ page }) => {
        await openStory(page, 'data-datatable--selection');
        await expect(page.getByRole('checkbox', { name: 'Select Miller & Sons' })).toBeChecked();
        await page.getByRole('checkbox', { name: 'Select Lindner Bakery' }).click();
        await expect(page.getByRole('checkbox', { name: 'Select Lindner Bakery' })).toBeChecked();
        await expect(page.getByText(/^Selected: .*k-001/)).toBeVisible();
        await page.getByRole('checkbox', { name: 'Select Miller & Sons' }).click();
        await expect(page.getByText('Selected: k-001', { exact: true })).toBeVisible();
    });
});

test.describe('Tree', () => {
    test('loads children when a branch opens; a failed branch loads again', async ({ page }) => {
        await openStory(page, 'data-tree--lazy-loading');
        await page.getByRole('button', { name: 'Projects' }).click();
        await expect(page.getByRole('button', { name: 'Projects' })).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByText('Projects: 3 items loaded')).toBeAttached();
        await expect(page.getByRole('radio', { name: 'Project plan.pdf' })).toBeVisible();
        await page.getByRole('button', { name: 'Archive' }).click();
        const retry = page.getByRole('button', { name: 'Loading failed – try again' });
        await expect(retry).toBeVisible();
        await expect(page.getByText('Archive could not be loaded')).toBeAttached();
        await retry.click();
        await expect(page.getByRole('radio', { name: '2025' })).toBeVisible();
        await expect(retry).toHaveCount(0);
    });
});

test.describe('Kanban', () => {
    test('a card moves to another column through its action sheet', async ({ page }) => {
        await openStory(page, 'data-kanban--playground');
        await page.getByRole('button', { name: 'Move Login page' }).click();
        const sheet = page.getByRole('dialog', { name: 'Move Login page' });
        await expect(sheet.getByRole('radio', { checked: true })).toHaveCount(1);
        await sheet.getByRole('radio', { name: 'Move to “Review”' }).click();
        await expect(sheet).toBeHidden();
        await expect(page.getByText(/^Login page: \w+ \(\d+\) → review \(\d+\)$/)).toBeVisible();
        await expect(page.getByRole('status').filter({ hasText: 'Login page in Review' })).toBeAttached();
        await expect(page.getByRole('button', { name: 'Move Login page' })).toBeFocused();
    });
});

test.describe('Chat', () => {
    test('sending shows the message, the answer streams and can be stopped', async ({ page }) => {
        await openStory(page, 'data-chat--playground');
        const send = page.getByRole('button', { name: 'Send' });
        await expect(send).toBeDisabled();
        await page.getByRole('textbox', { name: 'Message' }).fill('Why does the export fail?');
        await send.click();
        const log = page.getByRole('log', { name: 'Messages' });
        await expect(log.getByText('Why does the export fail?')).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Message' })).toHaveValue('');
        await expect(page.getByRole('button', { name: 'Stop reply' })).toBeVisible();
        await expect(log).toHaveAttribute('aria-busy', 'true');
        await expect(page.getByRole('button', { name: 'Send' })).toBeVisible({ timeout: 10000 });
        await expect(log.getByText(/The export fails because a column contains formulas/)).toBeVisible();
        await expect(page.getByRole('status').filter({ hasText: /^Assistant: The export fails/ })).toBeAttached();
    });
});

test.describe('Scheduler', () => {
    test('the agenda lists the events per day; an event opens its details', async ({ page }) => {
        // The web names events by their visible text (time, title); iOS and Android read 'title, time'
        await openStory(page, 'data-scheduler--playground');
        await expect(page.getByRole('heading', { name: 'Wednesday, October 21, 2026' })).toBeVisible();
        await expect(page.getByRole('button', { name: /^09:00\sAM–10:00\sAM Team meeting/ })).toBeVisible();
        await expect(page.getByRole('button', { name: /Release 2\.4/ })).toHaveCount(0);
        await page.getByRole('button', { name: /^09:00\sAM–10:00\sAM Team meeting/ }).click();
        const details = page.getByRole('dialog', { name: 'Team meeting' });
        await expect(details.getByText('Wednesday, October 21, 2026, 09:00 AM–10:00 AM')).toBeVisible();
        await details.getByRole('button', { name: 'Close' }).click();
        await expect(details).toBeHidden();
    });

    test('the month shows the events of the chosen day below the grid', async ({ page }) => {
        await openStory(page, 'data-scheduler--month');
        const month = page.getByRole('radiogroup', { name: 'October 2026' });
        await expect(month.getByRole('radio', { name: 'Wednesday, October 21, 2026, 5 events' })).toBeChecked();
        await expect(
            page.getByRole('button', { name: /03:00\sPM–04:00\sPM Weekly sync.*Recurring event/ })
        ).toBeVisible();
        await month.getByRole('radio', { name: 'Thursday, October 22, 2026, 2 events' }).click();
        await expect(month.getByRole('radio', { name: 'Thursday, October 22, 2026, 2 events' })).toBeChecked();
        await expect(page.getByRole('heading', { name: 'Thursday, October 22, 2026' })).toBeVisible();
        await expect(page.getByRole('button', { name: /Sprint review/ })).toBeVisible();
        await expect(page.getByRole('button', { name: /Weekly sync/ })).toHaveCount(0);
    });
});
