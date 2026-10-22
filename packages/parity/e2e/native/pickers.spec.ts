import { expect, test } from '@playwright/test';
import { openStory } from '../story.ts';

test.describe('Select', () => {
    test('opens a sheet of radio options, focuses the checked one and names the trigger with the value', async ({
        page,
    }) => {
        await openStory(page, 'forms-select--playground');
        const trigger = page.getByRole('button', { name: 'Service: Managed Hosting' });
        await trigger.click();
        const sheet = page.getByRole('dialog', { name: 'Service' });
        await expect(sheet).toBeVisible();
        await expect(sheet.getByRole('radio', { name: 'Managed Hosting' })).toBeFocused();
        await expect(sheet.getByRole('radio', { name: 'Managed Hosting' })).toBeChecked();
        await expect(sheet.getByRole('radio', { name: 'Hardware' })).toBeDisabled();
        await sheet.getByRole('radio', { name: 'Cloud & DevOps' }).click();
        await expect(sheet).toBeHidden();
        await expect(page.getByRole('button', { name: 'Service: Cloud & DevOps' })).toBeVisible();
        await expect(page.getByText('Value: cloud')).toBeVisible();
    });

    test('closes with Escape', async ({ page }) => {
        await openStory(page, 'forms-select--playground');
        await page.getByRole('button', { name: /^Service:/ }).click();
        // react-native-web wraps every modal in an unnamed dialog of its own
        const sheet = page.getByRole('dialog', { name: 'Service' });
        await expect(sheet).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(sheet).toBeHidden();
    });
});

test.describe('RadioGroup', () => {
    test('is a named radio group, Space chooses', async ({ page }) => {
        await openStory(page, 'forms-radiogroup--playground');
        const group = page.getByRole('radiogroup', { name: 'Company size' });
        await expect(group.getByRole('radio', { name: 'Mid-sized' })).toBeChecked();
        await group.getByRole('radio', { name: 'Enterprise' }).focus();
        await page.keyboard.press('Space');
        await expect(group.getByRole('radio', { name: 'Enterprise' })).toBeChecked();
        await expect(group.getByRole('radio', { name: 'Mid-sized' })).not.toBeChecked();
    });
});

test.describe('Menu', () => {
    test('opens the actions in a sheet with focus on the first one', async ({ page }) => {
        await openStory(page, 'overlays-menu--playground');
        await page.getByRole('button', { name: 'Actions for web-01' }).click();
        const menu = page.getByRole('menu', { name: 'web-01' });
        await expect(menu).toBeVisible();
        await expect(menu.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
        await menu.getByRole('menuitem', { name: 'Delete' }).click();
        await expect(menu).toBeHidden();
        await expect(page.getByText('Selected: delete')).toBeVisible();
    });
});

test.describe('Toast', () => {
    test('announces toasts in a live region; the action dismisses it', async ({ page }) => {
        await openStory(page, 'overlays-toast--playground');
        const region = page.getByRole('region', { name: 'Notifications' });
        await expect(region).toHaveAttribute('aria-live', 'polite');
        await page.getByRole('button', { name: 'Error' }).click();
        await expect(region.getByRole('alert')).toHaveText(/Connection lost/);
        await page.getByRole('button', { name: 'Success with action' }).click();
        await expect(region.getByRole('status')).toHaveText(/Deployment complete/);
        await region.getByRole('button', { name: 'Open' }).click();
        await expect(region.getByRole('status')).toHaveCount(0);
        await region.getByRole('button', { name: 'Close' }).click();
        await expect(region.getByRole('alert')).toHaveCount(0);
    });
});

test.describe('Tooltip', () => {
    test('describes its trigger, shows on focus and hides with Escape', async ({ page }) => {
        await openStory(page, 'overlays-tooltip--playground');
        const trigger = page.getByRole('button', { name: 'Copy' });
        await expect(trigger).toHaveAccessibleDescription('Copy configuration');
        await expect(page.getByRole('tooltip')).toBeHidden();
        await trigger.focus();
        await expect(page.getByRole('tooltip')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('tooltip')).toBeHidden();
    });
});
