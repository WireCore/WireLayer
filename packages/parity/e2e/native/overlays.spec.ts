import { expect, test } from '@playwright/test';
import { openStory } from '../story.ts';

// Feedback and overlays of @wirecore/wirelayer-native (RN part 2) in the browser (react-native-web)

test.describe('Toast', () => {
    test('toast.promise shows loading, then success or error; toast.dismiss() closes all', async ({ page }) => {
        await openStory(page, 'overlays-toast--with-promise');
        const region = page.getByRole('region', { name: 'Notifications' });
        await page.getByRole('button', { name: 'Export' }).click();
        await expect(region.getByText('Export running …')).toBeVisible();
        await expect(region.getByText('Export finished')).toBeVisible();
        await expect(region.getByText('128 invoices')).toBeVisible();
        await expect(region.getByText('Export running …')).toHaveCount(0);

        await page.getByRole('button', { name: 'Simulate error' }).click();
        await page.getByRole('button', { name: 'Export' }).click();
        await expect(region.getByRole('alert').filter({ hasText: 'Export failed' })).toBeVisible();
        await expect(region.getByText('Timeout')).toBeVisible();

        await page.getByRole('button', { name: 'Close all' }).click();
        await expect(region.getByRole('status')).toHaveCount(0);
        await expect(region.getByRole('alert')).toHaveCount(0);
    });
});

test.describe('confirm() and prompt()', () => {
    test('confirm: alertdialog with the focus on Cancel, Escape answers no, the button yes', async ({ page }) => {
        await openStory(page, 'overlays-confirm--playground');
        await page.getByRole('button', { name: 'Delete', exact: true }).click();
        const dialog = page.getByRole('alertdialog', { name: 'Delete server?' });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(page.getByText('Answer: canceled')).toBeVisible();

        await page.getByRole('button', { name: 'Delete', exact: true }).click();
        await dialog.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByText('Answer: deleted')).toBeVisible();
    });

    test('typeToConfirm: only the typed name confirms', async ({ page }) => {
        await openStory(page, 'overlays-confirm--playground');
        await page.getByRole('button', { name: 'Confirm by typing' }).click();
        const dialog = page.getByRole('alertdialog', { name: 'Archive project?' });
        const field = dialog.getByRole('textbox', { name: 'Type “customer-portal” to confirm' });
        await expect(field).toBeFocused();
        await field.fill('customer');
        await dialog.getByRole('button', { name: 'Archive' }).click();
        await expect(dialog.getByText('The text does not match')).toBeVisible();
        await expect(dialog).toBeVisible();
        await field.fill('customer-portal');
        await dialog.getByRole('button', { name: 'Archive' }).click();
        await expect(page.getByText('Answer: archived')).toBeVisible();
    });

    test('prompt: the value with Enter, validation before', async ({ page }) => {
        await openStory(page, 'overlays-confirm--playground');
        await page.getByRole('button', { name: 'Rename' }).click();
        const dialog = page.getByRole('alertdialog', { name: 'Rename server' });
        const field = dialog.getByRole('textbox', { name: 'New name' });
        await expect(field).toHaveValue('web-01');
        await field.fill('');
        await field.press('Enter');
        await expect(dialog.getByText('Please enter a name')).toBeVisible();
        await field.fill('web-02');
        await field.press('Enter');
        await expect(dialog).toBeHidden();
        await expect(page.getByText('Answer: new name: web-02')).toBeVisible();
    });
});

test.describe('openDialog', () => {
    test('resolves with the value of close(), undefined when dismissed', async ({ page }) => {
        await openStory(page, 'overlays-dialogservice--playground');
        await page.getByRole('button', { name: 'Open dialog' }).click();
        const dialog = page.getByRole('dialog', { name: 'Rename server' });
        await dialog.getByRole('textbox', { name: 'Name' }).fill('db-01');
        await dialog.getByRole('button', { name: 'Save' }).click();
        await expect(page.getByText('Result: db-01')).toBeVisible();
        await page.getByRole('button', { name: 'Open dialog' }).click();
        await page.keyboard.press('Escape');
        await expect(page.getByText('Result: canceled')).toBeVisible();
    });
});

test.describe('Menu', () => {
    test('checkbox and radio items switch in the open sheet and report their changes', async ({ page }) => {
        await openStory(page, 'overlays-menu--checkbox-and-radio');
        await page.getByRole('button', { name: 'View' }).click();
        const sheet = page.getByRole('dialog', { name: 'View' });
        const columns = sheet.getByRole('group', { name: 'Columns' });
        await expect(columns.getByRole('checkbox', { name: 'Status' })).toBeChecked();
        await expect(columns.getByRole('checkbox', { name: 'Modified' })).not.toBeChecked();
        await columns.getByRole('checkbox', { name: 'Modified' }).click();
        await columns.getByRole('checkbox', { name: 'Status' }).click();
        await expect(columns.getByRole('checkbox', { name: 'Modified' })).toBeChecked();
        await expect(columns.getByRole('checkbox', { name: 'Status' })).not.toBeChecked();
        const sort = sheet.getByRole('radiogroup', { name: 'Sort order' });
        await sort.getByRole('radio', { name: 'Date' }).click();
        await expect(sort.getByRole('radio', { name: 'Date' })).toBeChecked();
        await expect(sort.getByRole('radio', { name: 'Name' })).not.toBeChecked();
        await expect(sheet).toBeVisible();
        await expect(page.getByText('Columns: owner, updated · Sort order: date')).toBeVisible();
        // The state stays when the menu opens again
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: 'View' }).click();
        await expect(sheet.getByRole('checkbox', { name: 'Modified' })).toBeChecked();
    });

    test('submenus open in the same sheet; Back goes up', async ({ page }) => {
        await openStory(page, 'overlays-menu--submenus');
        await page.getByRole('button', { name: 'File' }).click();
        await expect(page.getByRole('dialog', { name: 'Quote.pdf' })).toBeVisible();
        await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeFocused();
        await page.getByRole('menuitem', { name: 'Move to' }).click();
        const level = page.getByRole('dialog', { name: 'Move to' });
        await expect(level.getByRole('menuitem', { name: 'Back' })).toBeFocused();
        await level.getByRole('menuitem', { name: 'Team' }).click();
        await page.getByRole('dialog', { name: 'Team' }).getByRole('menuitem', { name: 'Back' }).click();
        await expect(page.getByRole('dialog', { name: 'Move to' })).toBeVisible();
        await page.getByRole('menuitem', { name: 'Team' }).click();
        await page.getByRole('menuitem', { name: 'Sales' }).click();
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(page.getByText('Selected: move-sales')).toBeVisible();
    });
});

test.describe('ContextMenu', () => {
    test('Shift+F10 on the area opens its actions', async ({ page }) => {
        await openStory(page, 'overlays-contextmenu--playground');
        await page.getByRole('button', { name: /Quote\.pdf/ }).focus();
        await page.keyboard.press('Shift+F10');
        const sheet = page.getByRole('dialog', { name: 'Actions for Quote.pdf' });
        await expect(sheet).toBeVisible();
        await sheet.getByRole('menuitem', { name: 'Copy link' }).click();
        await expect(page.getByText('Selected: copy')).toBeVisible();
    });
});

test.describe('Toggletip', () => {
    test('the explanation appears in a live region, the focus stays on the button', async ({ page }) => {
        await openStory(page, 'forms-toggletip--playground');
        const button = page.getByRole('button', { name: 'More information about Cost center' });
        await button.click();
        await expect(button).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByRole('status')).toContainText('The cost center is on your order');
        await expect(button).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('status')).toHaveText('');
    });
});
