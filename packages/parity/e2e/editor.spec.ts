import { expect, test } from '@playwright/test';
import { nextFrame, openStory } from './story.ts';

test.describe('Editor', () => {
    test('is a named multi-line textbox; shortcuts and toolbar buttons format, the HTML follows', async ({ page }) => {
        await openStory(page, 'forms-editor--playground');
        const textbox = page.getByRole('textbox', { name: 'Description' });
        await expect(textbox).toHaveAttribute('aria-multiline', 'true');
        await expect(textbox).toHaveAccessibleDescription(/keyboard shortcuts/);
        // Loading the content is no change
        await expect(page.locator('#storybook-root pre')).not.toContainText('<p></p>');
        await textbox.getByText('Go-live in March').click();
        // Keys only once the caret is in place – under load they ended up at the start of the document
        await expect.poll(() => page.evaluate(() => getSelection()?.anchorNode?.textContent)).toBe('Go-live in March');
        await nextFrame(page);
        await page.keyboard.press('End');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        await page.keyboard.press('ControlOrMeta+b');
        await page.keyboard.type('Budget');
        await expect(page.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByText('<p><strong>Budget</strong></p>')).toBeVisible();
        await page.getByRole('button', { name: 'Bold' }).click();
        await page.keyboard.type(' 40k');
        await expect(page.getByText('<p><strong>Budget</strong> 40k</p>')).toBeVisible();
    });

    test('the toolbar is one tab stop, arrow keys move inside it', async ({ page }) => {
        await openStory(page, 'forms-editor--playground');
        const toolbar = page.getByRole('toolbar', { name: 'Formatting' });
        await page.keyboard.press('Tab');
        await expect(toolbar.getByRole('button', { name: 'Bold' })).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect(toolbar.getByRole('button', { name: 'Italic' })).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        // Wraps around; undo/redo are disabled without history, so Table is the last enabled button
        await expect(toolbar.getByRole('button', { name: 'Table' })).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.getByRole('textbox', { name: 'Description' })).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(toolbar.getByRole('button', { name: 'Table' })).toBeFocused();
    });

    test('link: the address bar sets the link, Escape closes it and returns focus', async ({ page }) => {
        await openStory(page, 'forms-editor--playground');
        await page.getByRole('textbox', { name: 'Description' }).getByText('customer portal').dblclick();
        const link = page.getByRole('button', { name: 'Link' });
        await link.click();
        await expect(link).toHaveAttribute('aria-expanded', 'true');
        const address = page.getByRole('textbox', { name: 'Link address' });
        await expect(address).toBeFocused();
        await address.fill('https://wirecore.de');
        await page.keyboard.press('Enter');
        await expect(page.getByText('href="https://wirecore.de"')).toBeVisible();
        await link.click();
        await expect(address).toHaveValue('https://wirecore.de');
        await page.keyboard.press('Escape');
        await expect(address).toBeHidden();
        await expect(link).toBeFocused();
    });

    test('disabled: not editable, toolbar disabled', async ({ page }) => {
        await openStory(page, 'forms-editor--disabled');
        const textbox = page.getByRole('textbox', { name: 'Description' });
        await expect(textbox).toHaveAttribute('aria-disabled', 'true');
        await expect(textbox).toHaveAttribute('contenteditable', 'false');
        await expect(page.getByRole('button', { name: 'Bold' })).toBeDisabled();
    });

    test('task list: named checkboxes that tick off items', async ({ page }) => {
        await openStory(page, 'forms-editor--content');
        const open = page.getByRole('checkbox', { name: 'Load test with 500 users, open' });
        await expect(page.getByRole('checkbox', { name: 'Move the domain, done' })).toBeChecked();
        await open.check();
        await expect(page.getByRole('checkbox', { name: 'Load test with 500 users, done' })).toBeChecked();
        await expect(page.locator('#storybook-root pre')).toContainText(
            /data-checked="true"(?:(?!data-checked).)*Load test/
        );
    });

    test('table: the bar inserts a table and rows; Escape returns to the button', async ({ page }) => {
        await openStory(page, 'forms-editor--playground');
        await page.getByRole('textbox', { name: 'Description' }).getByText('Go-live in March').click();
        await page.keyboard.press('End');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        const button = page.getByRole('button', { name: 'Table', exact: true });
        await button.click();
        const bar = page.getByRole('group', { name: 'Edit table' });
        await expect(bar.getByRole('button', { name: 'Insert table' })).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('textbox', { name: 'Description' }).locator('table tr')).toHaveCount(3);
        await bar.getByRole('button', { name: 'Row below' }).click();
        await expect(page.getByRole('textbox', { name: 'Description' }).locator('table tr')).toHaveCount(4);
        await bar.getByRole('button', { name: 'Column after' }).focus();
        await page.keyboard.press('Escape');
        await expect(bar).toBeHidden();
        await expect(button).toBeFocused();
    });

    test('image: needs an address and an alternative text (or "decorative")', async ({ page }) => {
        await openStory(page, 'forms-editor--playground');
        await page.getByRole('textbox', { name: 'Description' }).getByText('customer portal').click();
        await page.getByRole('button', { name: 'Image' }).click();
        const insert = page.getByRole('button', { name: 'Insert' });
        await page.getByRole('textbox', { name: 'Image address' }).fill('https://wirecore.de/logo.png');
        await expect(insert).toBeDisabled();
        await page.getByRole('textbox', { name: 'Alternative text' }).fill('WireLayer logo');
        await insert.click();
        await expect(page.getByText('<img src="https://wirecore.de/logo.png" alt="WireLayer logo">')).toBeVisible();
        // Select the image, the image tool edits its alternative text
        await page.getByRole('img', { name: 'WireLayer logo' }).click();
        await page.getByRole('button', { name: 'Image' }).click();
        const alt = page.getByRole('textbox', { name: 'Alternative text' });
        await expect(alt).toBeFocused();
        await expect(alt).toHaveValue('WireLayer logo');
        await expect(page.getByRole('textbox', { name: 'Image address' })).toHaveValue('https://wirecore.de/logo.png');
        await alt.fill('Logo of WireLayer');
        await page.keyboard.press('Enter');
        await expect(page.getByText('<img src="https://wirecore.de/logo.png" alt="Logo of WireLayer">')).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Description' }).locator('img')).toHaveCount(1);
    });
});
