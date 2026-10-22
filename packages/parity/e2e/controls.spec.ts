import { expect, test } from '@playwright/test';
import { openStory } from './story.ts';

test.describe('Listbox', () => {
    test('arrow keys move, Enter chooses, disabled options are skipped', async ({ page }) => {
        await openStory(page, 'forms-listbox--playground');
        const list = page.getByRole('listbox', { name: 'Services' });
        await expect(list.getByRole('option', { name: 'Hosting' })).toHaveAttribute('aria-selected', 'true');
        await list.getByRole('option', { name: 'Cloud & DevOps' }).click();
        await expect(page.getByText('Value: cloud')).toBeVisible();
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('Enter');
        await expect(page.getByText('Value: hosting')).toBeVisible();
        await expect(list.getByRole('option', { name: 'AI integration' })).toHaveAttribute('aria-disabled', 'true');
    });

    test('multiple: several options stay chosen', async ({ page }) => {
        await openStory(page, 'forms-listbox--multiple');
        const list = page.getByRole('listbox', { name: 'Services' });
        await expect(list).toHaveAttribute('aria-multiselectable', 'true');
        await list.getByRole('option', { name: 'Software & Web' }).click();
        await expect(page.getByText(/Value: (hosting, software|software, hosting)/)).toBeVisible();
    });
});

test.describe('SplitButton', () => {
    test('main action and a menu with the others', async ({ page }) => {
        await openStory(page, 'buttons-splitbutton--playground');
        await page.getByRole('button', { name: 'Send' }).click();
        await expect(page.getByText('Action: send')).toBeVisible();
        await page.getByRole('button', { name: 'More actions' }).click();
        await page.getByRole('menuitem', { name: 'Save as copy' }).click();
        await expect(page.getByText('Action: save-copy')).toBeVisible();
    });
});

test.describe('ConfirmPopup', () => {
    test('asks at the button; focus on cancel, Escape cancels and returns focus', async ({ page }) => {
        await openStory(page, 'overlays-confirmpopup--playground');
        // The popup has a "Delete" button too
        const trigger = page.getByRole('button', { name: 'Delete' }).first();
        await trigger.click();
        const popup = page.getByRole('alertdialog', { name: 'Really delete server web-01?' });
        await expect(popup).toBeVisible();
        await expect(popup.getByRole('button', { name: 'Cancel' })).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(page.getByText('Answer: canceled')).toBeVisible();
        await expect(trigger).toBeFocused();
        await trigger.click();
        await popup.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByText('Answer: deleted')).toBeVisible();
        await expect(popup).toBeHidden();
    });
});

test.describe('Toolbar', () => {
    test('one tab stop, arrow keys and Home/End move inside', async ({ page }) => {
        await openStory(page, 'layout-toolbar--playground');
        const toolbar = page.getByRole('toolbar', { name: 'Formatting' });
        await page.keyboard.press('Tab');
        await expect(toolbar.getByRole('button', { name: 'Bold' })).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect(toolbar.getByRole('button', { name: 'Italic' })).toBeFocused();
        await page.keyboard.press('End');
        await expect(toolbar.getByRole('button', { name: 'Right' })).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect(toolbar.getByRole('button', { name: 'Bold' })).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Tab');
        await expect(toolbar.getByRole('button', { name: 'Right' })).toBeFocused();
    });
});

test.describe('Panel', () => {
    test('toggleable: the heading button shows and hides the content', async ({ page }) => {
        await openStory(page, 'layout-panel--toggleable');
        const toggle = page.getByRole('button', { name: 'Contract details', exact: true });
        await expect(page.getByRole('heading', { level: 3, name: 'Contract details' })).toBeVisible();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(page.getByText(/24-month term/)).toBeHidden();
    });
});

test.describe('Fieldset', () => {
    test('names the group of fields and describes it', async ({ page }) => {
        await openStory(page, 'forms-fieldset--with-error');
        const group = page.getByRole('group', { name: 'Billing address' });
        await expect(group).toBeVisible();
        await expect(group).toHaveAccessibleDescription(/As it appears on the invoice/);
        await expect(group).toHaveAccessibleDescription(/Please enter the complete address/);
    });
});

test.describe('ToggleButton', () => {
    test('aria-pressed follows the state', async ({ page }) => {
        await openStory(page, 'buttons-togglebutton--playground');
        const toggle = page.getByRole('button', { name: 'Active only' });
        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByText('Pressed: yes')).toBeVisible();
    });
});

test.describe('Textarea', () => {
    test('autoResize grows with the text', async ({ page }) => {
        await openStory(page, 'forms-textarea--auto-resize');
        const area = page.getByRole('textbox', { name: 'Message' });
        const before = (await area.boundingBox())!.height;
        await area.click();
        await page.keyboard.press('End');
        await page.keyboard.type('\nLine 2\nLine 3\nLine 4');
        await expect.poll(async () => (await area.boundingBox())!.height).toBeGreaterThan(before + 40);
        const scroll = await area.evaluate((element) => element.scrollHeight - element.clientHeight);
        expect(scroll).toBeLessThanOrEqual(1);
    });

    test('defaultValue arrives without v-model; the counter counts it', async ({ page }) => {
        await openStory(page, 'forms-textarea--initial-value');
        const area = page.getByRole('textbox', { name: 'Comment' });
        await expect(area).toHaveValue('First draft');
        await expect(page.getByText('11 / 80')).toBeVisible();
        await area.click();
        await page.keyboard.press('End');
        await page.keyboard.type('!');
        await expect(area).toHaveValue('First draft!');
        await expect(page.getByText('12 / 80')).toBeVisible();
    });
});

test.describe('PasswordInput strength', () => {
    test('the meter follows the password and describes the field', async ({ page }) => {
        await openStory(page, 'forms-passwordinput--strength');
        const input = page.getByLabel('New password', { exact: true });
        await input.fill('abc');
        await expect(page.getByText('Password strength: Too short')).toBeVisible();
        await input.fill('Summer2026!House');
        await expect(page.getByText('Password strength: Strong')).toBeVisible();
        await expect(input).toHaveAccessibleDescription(/At least 12 characters.*Password strength: Strong/);
    });
});

test.describe('OverlayBadge', () => {
    test('screen readers get the label, not the number', async ({ page }) => {
        await openStory(page, 'data-overlaybadge--playground');
        await expect(page.getByText('3 unread messages')).toBeAttached();
        await expect(page.getByText('99+')).toHaveAttribute('aria-hidden', 'true');
    });
});

test.describe('Dialog service', () => {
    test('opens a component in a dialog and returns its result', async ({ page }) => {
        await openStory(page, 'overlays-dialogservice--playground');
        const trigger = page.getByRole('button', { name: 'Rename …' });
        await trigger.click();
        const dialog = page.getByRole('dialog', { name: 'Rename server' });
        await expect(dialog).toHaveAccessibleDescription('The name appears in all overviews.');
        await dialog.getByRole('textbox', { name: 'New name' }).fill('web-01-new');
        await dialog.getByRole('button', { name: 'Rename' }).click();
        await expect(dialog).toBeHidden();
        await expect(page.getByText('Name: web-01-new')).toBeVisible();
        await expect(trigger).toBeFocused();
        await trigger.click();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(page.getByText('Name: web-01-new')).toBeVisible();
    });
});
