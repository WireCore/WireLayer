import { expect, test } from '@playwright/test';
import { openStory } from './story.ts';

test.describe('NumberInput', () => {
    test('steps with arrow keys and buttons and keeps a typed decimal', async ({ page }) => {
        await openStory(page, 'forms-numberinput--playground');
        const input = page.getByRole('spinbutton', { name: 'Number of servers' });
        await expect(input).toHaveValue('8');
        await input.press('ArrowUp');
        await expect(input).toHaveValue('9');
        await page.getByRole('button', { name: 'Decrease' }).click();
        await expect(input).toHaveValue('8');
        await input.fill('');
        await input.pressSequentially('12.5');
        await expect(input).toHaveValue('12.5');
        await input.press('Tab');
        await expect(input).toHaveValue('12.5');
    });

    test('takes "." and "," as decimal separator, blocks what is not allowed and reads pasted numbers', async ({
        page,
    }) => {
        await openStory(page, 'forms-numberinput--options');
        const price = page.getByRole('spinbutton', { name: 'Price' });
        await expect(price).toHaveValue('12.50');
        await price.fill('');
        // "," types the decimal separator of the locale (en-US: ".")
        await price.pressSequentially('3,7');
        await expect(price).toHaveValue('3.7');
        // A second separator and the minus key (allowNegative=false) are blocked
        await price.press(',');
        await price.press('-');
        await expect(price).toHaveValue('3.7');
        await price.press('Tab');
        await expect(price).toHaveValue('3.70');

        const pieces = page.getByRole('spinbutton', { name: 'Pieces' });
        await pieces.fill('');
        await pieces.pressSequentially('7.5');
        await expect(pieces).toHaveValue('75');

        // Pasting a number in German notation replaces the whole value
        await price.focus();
        await price.press('ControlOrMeta+a');
        await page.evaluate(() => {
            const input = document.activeElement as HTMLInputElement;
            const data = new DataTransfer();
            data.setData('text', '1.234,5');
            input.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
        });
        await price.press('Tab');
        await expect(price).toHaveValue('1,234.50');
    });

    test('stacked buttons and the field without buttons still step with the keyboard', async ({ page }) => {
        await openStory(page, 'forms-numberinput--options');
        const size = page.getByRole('spinbutton', { name: 'Font size' });
        await page.getByRole('button', { name: 'Increase' }).first().click();
        await expect(size).toHaveValue('13');
        const count = page.getByRole('spinbutton', { name: 'Quantity (no buttons)' });
        await count.focus();
        await count.press('ArrowUp');
        await expect(count).toHaveValue('4');
    });

    test('formats currency for the locale', async ({ page }) => {
        await openStory(page, 'forms-numberinput--formats');
        // en-US puts the currency sign first, without a space
        await expect(page.getByRole('spinbutton', { name: 'Budget' })).toHaveValue('€12,500.00');
        await expect(page.getByRole('spinbutton', { name: 'Weight (kg)' })).toHaveValue('2.5');
    });
});

test.describe('PasswordInput', () => {
    test('shows and hides the password with a named toggle', async ({ page }) => {
        await openStory(page, 'forms-passwordinput--playground');
        const input = page.getByLabel('New password');
        await input.fill('secret');
        await expect(input).toHaveAttribute('type', 'password');
        await page.getByRole('button', { name: 'Show password' }).click();
        await expect(input).toHaveAttribute('type', 'text');
        await expect(page.getByRole('button', { name: 'Hide password' })).toBeVisible();
    });
});

test.describe('Slider', () => {
    test('moves with arrow keys and announces the formatted value', async ({ page }) => {
        await openStory(page, 'forms-slider--playground');
        const thumb = page.getByRole('slider', { name: 'Utilization limit' });
        await thumb.focus();
        await page.keyboard.press('ArrowRight');
        await expect(thumb).toHaveAttribute('aria-valuenow', '75');
        await expect(thumb).toHaveAttribute('aria-valuetext', '75%');
        await page.keyboard.press('Home');
        await expect(thumb).toHaveAttribute('aria-valuenow', '0');
    });

    test('names both thumbs of a range slider', async ({ page }) => {
        await openStory(page, 'forms-slider--range');
        await expect(page.getByRole('slider', { name: 'Price Minimum' })).toHaveAttribute('aria-valuetext', '€200');
        await expect(page.getByRole('slider', { name: 'Price Maximum' })).toHaveAttribute('aria-valuetext', '€800');
    });
});

test.describe('MultiSelect', () => {
    test('toggles several options with the keyboard while the list stays open', async ({ page }) => {
        await openStory(page, 'forms-multiselect--playground');
        const trigger = page.getByRole('combobox', { name: 'Services' });
        await trigger.focus();
        await page.keyboard.press('Enter');
        const listbox = page.getByRole('listbox');
        await expect(listbox).toBeVisible();
        await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await expect(listbox).toBeVisible();
        await expect(page.getByRole('option', { name: 'Managed Hosting' })).toHaveAttribute('aria-selected', 'true');
        await expect(trigger).toHaveText('3 selected');
        await page.keyboard.press('Escape');
        await expect(listbox).toBeHidden();
        await expect(page.getByText('Selection: web, cloud, hosting')).toBeVisible();
    });
});

test.describe('Combobox', () => {
    test('filters while typing and takes an option with Enter', async ({ page }) => {
        await openStory(page, 'forms-combobox--playground');
        const input = page.getByRole('combobox', { name: 'Location' });
        await input.pressSequentially('nu');
        await expect(page.getByRole('option')).toHaveText(['Nuremberg']);
        await input.press('ArrowDown');
        await input.press('Enter');
        await expect(input).toHaveValue('Nuremberg');
        await expect(page.getByText('Value: nuremberg')).toBeVisible();
        await input.fill('xyz');
        await expect(page.getByText('No results')).toBeVisible();
    });

    test('takes own text as the value (allowCustomValue) on Enter and when leaving the field', async ({ page }) => {
        await openStory(page, 'forms-combobox--custom-value');
        const input = page.getByRole('combobox', { name: 'Location' });
        await input.pressSequentially('Potsdam');
        await page.keyboard.press('Enter');
        await expect(page.getByText('Value: Potsdam')).toBeVisible();
        await input.fill('Bonn');
        await page.keyboard.press('Tab');
        await expect(page.getByText('Value: Bonn')).toBeVisible();
        await expect(input).toHaveValue('Bonn');
    });
});

test.describe('DatePicker', () => {
    test('takes the digits in one go – the separators come by themselves', async ({ page }) => {
        await openStory(page, 'forms-datepicker--playground');
        const group = page.getByRole('group', { name: 'Maintenance date' });
        await expect(group).toHaveAccessibleDescription('Weekdays only');
        // en-US: month/day/year
        await expect(group.getByRole('spinbutton')).toHaveText(['10', '20', '2026']);
        await page.getByRole('button', { name: 'Clear date' }).click();
        await expect(group.getByRole('spinbutton')).toHaveText(['mm', 'dd', 'yyyy']);
        await group.getByRole('spinbutton', { name: 'Month' }).click();
        await page.keyboard.type('11032026');
        await expect(group.getByRole('spinbutton')).toHaveText(['11', '03', '2026']);
        await expect(page.getByText('Value: 2026-11-03')).toBeVisible();
        // Arrow keys change the focused part
        await group.getByRole('spinbutton', { name: 'Month' }).focus();
        await page.keyboard.press('ArrowUp');
        await expect(page.getByText('Value: 2026-12-03')).toBeVisible();
    });

    test('picks a day with the keyboard and skips unavailable weekends', async ({ page }) => {
        await openStory(page, 'forms-datepicker--playground');
        await page.getByRole('button', { name: 'Open calendar' }).click();
        const calendar = page.getByRole('application', { name: 'Calendar' });
        await expect(calendar).toBeVisible();
        await expect(page.locator(':focus')).toHaveAccessibleName('Selected: Tuesday, October 20, 2026');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        await expect(page.getByText('Value: 2026-10-21')).toBeVisible();
        await expect(page.getByRole('group', { name: 'Maintenance date' }).getByRole('spinbutton')).toHaveText([
            '10',
            '21',
            '2026',
        ]);
        await page.getByRole('button', { name: 'Open calendar' }).click();
        await expect(page.getByRole('button', { name: /Unavailable: Saturday, October 24, 2026/ })).toBeVisible();
    });
});

test.describe('FileUpload', () => {
    test('lists accepted files with a remove button and announces rejected ones', async ({ page }) => {
        await openStory(page, 'forms-fileupload--playground');
        const input = page.locator('input[type=file]');
        await input.setInputFiles([
            { name: 'quote.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7') },
            { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('Hello') },
        ]);
        await expect(page.getByText('quote.pdf')).toBeVisible();
        await expect(page.getByRole('alert')).toHaveText(/notes\.txt: File type not allowed/);
        await page.getByRole('button', { name: 'Remove quote.pdf' }).click();
        await expect(page.getByText('quote.pdf')).toBeHidden();
        await expect(page.getByRole('button', { name: 'Choose files' })).toBeVisible();
    });
});

test('NumberInput does not regroup the number while typing', async ({ page }) => {
    await openStory(page, 'forms-numberinput--formats');
    const input = page.getByRole('spinbutton', { name: 'Weight (kg)' });
    await input.fill('');
    await input.pressSequentially('1234');
    await expect(input).toHaveValue('1234');
    await input.press('Tab');
    await expect(input).toHaveValue('1,234');
});
