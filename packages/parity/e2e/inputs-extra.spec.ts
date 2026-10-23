import { expect, test } from '@playwright/test';
import { nextFrame, openStory } from './story.ts';

test.describe('PinInput', () => {
    test('is a named group of boxes; typing moves on, pasting fills all', async ({ page }) => {
        await openStory(page, 'forms-pininput--playground');
        const group = page.getByRole('group', { name: 'Verification code' });
        await expect(group.getByRole('textbox')).toHaveCount(6);
        await expect(group.getByRole('textbox', { name: 'Digit 1 of 6' })).toHaveAttribute(
            'autocomplete',
            'one-time-code'
        );
        await group.getByRole('textbox', { name: 'Digit 1 of 6' }).click();
        await page.keyboard.type('123');
        await expect(group.getByRole('textbox', { name: 'Digit 4 of 6' })).toBeFocused();
        await page.keyboard.type('456');
        await expect(page.getByText('Complete: 123456')).toBeVisible();
    });
});

test.describe('Rating', () => {
    test('is a radio group of stars, arrow keys change the rating', async ({ page }) => {
        await openStory(page, 'forms-rating--playground');
        const group = page.getByRole('radiogroup', { name: 'How satisfied are you?' });
        await expect(group.getByRole('radio')).toHaveCount(5);
        await expect(group.getByRole('radio', { name: '4 stars' })).toBeChecked();
        await group.getByRole('radio', { name: '4 stars' }).focus();
        await page.keyboard.press('ArrowLeft');
        await expect(page.getByText('Value: 3')).toBeVisible();
        await group.getByRole('radio', { name: '1 star' }).click();
        await expect(page.getByText('Value: 1')).toBeVisible();
    });
});

test.describe('Knob', () => {
    test('is a slider: arrow keys, Page Up, Home/End, formatted value', async ({ page }) => {
        await openStory(page, 'forms-knob--playground');
        const knob = page.getByRole('slider', { name: 'Volume' });
        await expect(knob).toHaveAttribute('aria-valuetext', '40%');
        await knob.focus();
        await page.keyboard.press('ArrowUp');
        await expect(knob).toHaveAttribute('aria-valuenow', '41');
        await page.keyboard.press('PageUp');
        await expect(knob).toHaveAttribute('aria-valuenow', '51');
        await page.keyboard.press('End');
        await expect(knob).toHaveAttribute('aria-valuetext', '100%');
        await page.keyboard.press('Home');
        await expect(knob).toHaveAttribute('aria-valuenow', '0');
    });

    test('follows the pointer around the ring', async ({ page }) => {
        await openStory(page, 'forms-knob--playground');
        const knob = page.getByRole('slider', { name: 'Volume' });
        const box = (await knob.boundingBox())!;
        // Straight up is the middle of the 270° dial
        await page.mouse.click(box.x + box.width / 2, box.y + 2);
        await expect(knob).toHaveAttribute('aria-valuenow', '50');
    });
});

test.describe('ColorPicker', () => {
    test('names the trigger with label and value, takes a preset and a hex value', async ({ page }) => {
        await openStory(page, 'forms-colorpicker--playground');
        const trigger = page.getByRole('button', { name: 'Accent color #1E66F5' });
        await trigger.click();
        await expect(page.getByRole('slider', { name: 'Hue' })).toBeVisible();
        await page.getByRole('button', { name: 'Choose #16a34a' }).click();
        await expect(page.getByText('Value: #16A34A')).toBeVisible();
        const hex = page.getByRole('textbox', { name: 'Hex value' });
        // Vue writes the preset into the field asynchronously – typing before would be overwritten
        await expect(hex).toHaveValue(/16a34a/i);
        await expect(page.getByRole('button', { name: 'Accent color #16A34A' })).toBeAttached();
        await nextFrame(page);
        await hex.fill('#7c3aed');
        await hex.press('Enter');
        await expect(page.getByText('Value: #7C3AED')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('button', { name: 'Accent color #7C3AED' })).toBeFocused();
    });
});

test.describe('MaskInput', () => {
    test('adds the separators while typing digits only', async ({ page }) => {
        await openStory(page, 'forms-maskinput--playground');
        const input = page.getByRole('textbox', { name: 'IBAN' });
        await expect(input).toHaveAttribute('placeholder', 'DE__ ____ ____ ____ ____ __');
        await expect(input).toHaveAttribute('inputmode', 'numeric');
        await input.pressSequentially('8937040044');
        await expect(input).toHaveValue('DE89 3704 0044');
        await input.press('Backspace');
        await expect(input).toHaveValue('DE89 3704 004');
        await expect(page.getByText('Digits: 893704004')).toBeVisible();
    });
});
