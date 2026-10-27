import { expect, test, type Locator } from '@playwright/test';
import { openStory } from './story.js';

// Controls with an own id, named by a native <label for>: Ark finds its parts by their ids – the popups have to open
// at their field (not at the top left of the page) and the keyboard has to work as before.

/** The popup sits at the field: below it (or above, when there is no room) and starting at its start */
async function expectAtField(popup: Locator, field: Locator) {
    const box = (await popup.boundingBox())!;
    const anchor = (await field.boundingBox())!;
    const gap = Math.min(Math.abs(box.y - (anchor.y + anchor.height)), Math.abs(box.y + box.height - anchor.y));
    expect(gap, JSON.stringify({ box, anchor })).toBeLessThan(12);
    expect(Math.abs(box.x - anchor.x), JSON.stringify({ box, anchor })).toBeLessThan(12);
}

test.describe('Native labels', () => {
    test.beforeEach(async ({ page }) => {
        await openStory(page, 'forms-field--native-labels');
    });

    test('Select opens at its trigger and chooses with the keyboard', async ({ page }) => {
        const trigger = page.getByRole('combobox', { name: 'Service', exact: true });
        await trigger.focus();
        await page.keyboard.press('ArrowDown');
        const list = page.getByRole('listbox');
        await expect(list).toBeVisible();
        await expectAtField(list, trigger);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await expect(list).toBeHidden();
        await expect(trigger).toBeFocused();
        await expect(trigger).toHaveText(/Hosting/);
    });

    test('MultiSelect opens at its trigger', async ({ page }) => {
        const trigger = page.getByRole('combobox', { name: 'Services', exact: true });
        await trigger.click();
        const list = page.getByRole('listbox');
        await expect(list).toBeVisible();
        await expectAtField(list, trigger);
        await page.keyboard.press('Escape');
        await expect(trigger).toBeFocused();
    });

    test('Combobox lists the matches below the field and takes one with Enter', async ({ page }) => {
        const input = page.getByRole('combobox', { name: 'Search a service' });
        await input.fill('Host');
        const list = page.getByRole('listbox');
        await expect(list).toBeVisible();
        await expectAtField(list, input.locator('xpath=..'));
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await expect(input).toHaveValue('Hosting');
    });

    test('NumberInput steps with the arrow keys', async ({ page }) => {
        const input = page.getByRole('spinbutton', { name: 'Seats' });
        await input.focus();
        await page.keyboard.press('ArrowUp');
        await expect(input).toHaveValue('4');
    });

    test('TreeSelect and ColorPicker open at their button', async ({ page }) => {
        const folder = page.getByRole('button', { name: 'Folder', exact: true });
        await expect(folder).toHaveAccessibleDescription('Select');
        await folder.click();
        const tree = page.getByRole('tree');
        await expect(tree).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(folder).toBeFocused();
        const colour = page.getByRole('button', { name: 'Accent colour', exact: true });
        await expect(colour).toHaveAccessibleDescription('#1E66F5');
        await colour.click();
        const panel = page.getByRole('dialog');
        await expect(panel).toBeVisible();
        await expectAtField(panel, colour);
    });

    test('a click on the label checks the box', async ({ page }) => {
        await page.getByText('I accept the terms').click();
        await expect(page.getByRole('checkbox', { name: 'I accept the terms' })).toBeChecked();
    });
});
