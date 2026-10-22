import { expect, test } from '@playwright/test';
import { openStory } from '../story.ts';

// React Native components in the browser (react-native-web): roles and states reach the DOM as ARIA

test.describe('Checkbox', () => {
    test('toggles with Space and reports aria-checked', async ({ page }) => {
        await openStory(page, 'forms-checkbox--playground');
        const checkbox = page.getByRole('checkbox', { name: 'Subscribe to newsletter' });
        await page.keyboard.press('Tab');
        await expect(checkbox).toBeFocused();
        await page.keyboard.press('Space');
        await expect(checkbox).toBeChecked();
        await checkbox.click();
        await expect(checkbox).not.toBeChecked();
    });
});

test.describe('Switch', () => {
    test('is a switch named by its label and toggles with Space and Enter', async ({ page }) => {
        await openStory(page, 'forms-switch--playground');
        const control = page.getByRole('switch', { name: /Notifications/ });
        await expect(control).toBeChecked();
        await control.press('Space');
        await expect(control).not.toBeChecked();
        await control.press('Enter');
        await expect(control).toBeChecked();
    });
});

test.describe('Tabs', () => {
    test('selects a tab and shows its panel', async ({ page }) => {
        await openStory(page, 'navigation-tabs--playground');
        await expect(page.getByRole('tab', { name: 'Software' })).toHaveAttribute('aria-selected', 'true');
        await page.getByRole('tab', { name: 'Hosting' }).click();
        await expect(page.getByRole('tab', { name: 'Hosting' })).toHaveAttribute('aria-selected', 'true');
        await expect(page.getByRole('tabpanel')).toHaveText(/data centers/);
    });
});

test.describe('Field', () => {
    test('labels the input and announces the error', async ({ page }) => {
        await openStory(page, 'forms-field--validation');
        const input = page.getByRole('textbox', { name: 'Email' });
        await expect(input).toHaveAttribute('aria-invalid', 'true');
        await expect(input).toHaveAccessibleDescription('Please enter a valid address');
        await input.fill('max@company.com');
        await expect(input).not.toHaveAttribute('aria-invalid', 'true');
        await expect(page.getByRole('alert')).toHaveCount(0);
    });
});

test.describe('Dialog', () => {
    test('opens as a named modal dialog and closes with Escape and the close button', async ({ page }) => {
        await openStory(page, 'overlays-dialog--confirm');
        await page.getByRole('button', { name: 'Delete server' }).click();
        const dialog = page.getByRole('alertdialog', { name: 'Delete server?' });
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAccessibleDescription(/permanently removed/);
        // Focus moves into the dialog (with animations: once it has faded in)
        await expect(dialog.locator(':focus')).toHaveCount(1);
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();

        await page.getByRole('button', { name: 'Delete server' }).click();
        await page.getByRole('button', { name: 'Close' }).click();
        await expect(dialog).toBeHidden();
    });
});

test.describe('Button', () => {
    test('shows the focus ring for keyboard focus', async ({ page }) => {
        await openStory(page, 'buttons-button--playground');
        await page.keyboard.press('Tab');
        const button = page.getByRole('button', { name: 'Start project' });
        await expect(button).toBeFocused();
        await expect(button).toHaveCSS('outline-style', 'solid');
    });
});
