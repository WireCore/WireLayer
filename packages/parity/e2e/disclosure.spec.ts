import { expect, test } from '@playwright/test';
import { focusWithin, openStory } from './story.ts';

test.describe('Accordion', () => {
    test('toggles with Enter, reports aria-expanded and skips disabled items', async ({ page }) => {
        await openStory(page, 'layout-accordion--playground');
        const software = page.getByRole('button', { name: 'Software & Web' });
        const hosting = page.getByRole('button', { name: 'Managed Hosting' });
        await expect(page.getByRole('heading', { level: 3, name: 'Software & Web' })).toBeVisible();
        await expect(software).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByText(/Web applications, websites/)).toBeVisible();

        await software.focus();
        await page.keyboard.press('ArrowDown');
        await expect(hosting).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(hosting).toHaveAttribute('aria-expanded', 'true');
        await expect(software).toHaveAttribute('aria-expanded', 'false');
        await expect(page.getByText(/German data centers/)).toBeVisible();
        await page.keyboard.press('Enter');
        await expect(hosting).toHaveAttribute('aria-expanded', 'false');
        await expect(page.getByRole('button', { name: /Support/ })).toBeDisabled();
    });
});

test.describe('Popover', () => {
    test('opens as a named dialog, closes with Escape and returns focus', async ({ page }) => {
        await openStory(page, 'overlays-popover--playground');
        const trigger = page.getByRole('button', { name: 'Details for web-01' });
        await trigger.click();
        const popover = page.getByRole('dialog', { name: 'web-01' });
        await expect(popover).toBeVisible();
        await expect(popover).toHaveAccessibleDescription(/Frankfurt/);
        await expect(popover.getByRole('button', { name: 'Close', exact: true }).first()).toBeVisible();
        await focusWithin(popover);
        await page.keyboard.press('Escape');
        await expect(popover).toBeHidden();
        await expect(trigger).toBeFocused();
    });

    test('closes from its own button, which keeps its visible name', async ({ page }) => {
        await openStory(page, 'overlays-popover--playground');
        await page.getByRole('button', { name: 'Details for web-01' }).click();
        const close = page.getByRole('dialog').getByRole('button', { name: 'Close' }).filter({ hasText: 'Close' });
        await close.click();
        await expect(page.getByRole('dialog')).toBeHidden();
    });
});

test.describe('Drawer', () => {
    test('is a modal dialog that traps focus and returns it on Escape', async ({ page }) => {
        await openStory(page, 'overlays-drawer--playground');
        const trigger = page.getByRole('button', { name: 'Filter' });
        await trigger.click();
        const drawer = page.getByRole('dialog', { name: 'Filter' });
        await expect(drawer).toBeVisible();
        await expect(drawer).toHaveAttribute('aria-modal', 'true');
        for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
        await expect(drawer.locator(':focus')).toHaveCount(1);
        await page.keyboard.press('Escape');
        await expect(drawer).toBeHidden();
        await expect(trigger).toBeFocused();
    });
});

test.describe('Confirm', () => {
    test('focuses the safe choice, resolves with the answer and returns focus', async ({ page }) => {
        await openStory(page, 'overlays-confirm--playground');
        const trigger = page.getByRole('button', { name: 'Delete server' });
        await trigger.click();
        const dialog = page.getByRole('alertdialog', { name: 'Delete server?' });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(page.getByText('Canceled')).toBeVisible();
        await expect(trigger).toBeFocused();

        await trigger.click();
        await dialog.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByText('Deleted')).toBeVisible();
        await expect(trigger).toBeFocused();
    });
});
