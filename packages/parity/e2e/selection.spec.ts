import { expect, test } from '@playwright/test';
import { openStory } from './story.js';

test.describe('Checkbox', () => {
    test('is reachable with Tab, shows a focus ring and toggles with Space', async ({ page }) => {
        await openStory(page, 'forms-checkbox--playground');
        const checkbox = page.getByRole('checkbox');
        await page.keyboard.press('Tab');
        await expect(checkbox).toBeFocused();
        await expect(page.locator('[data-part=control]')).toHaveCSS('outline-style', 'solid');
        await page.keyboard.press('Space');
        await expect(checkbox).toBeChecked();
        await page.keyboard.press('Space');
        await expect(checkbox).not.toBeChecked();
    });
});

test.describe('Switch', () => {
    test('is a focusable switch that toggles with Space', async ({ page }) => {
        await openStory(page, 'forms-switch--playground');
        const toggle = page.getByRole('switch', { name: 'Monitoring alerts' });
        await page.keyboard.press('Tab');
        await expect(toggle).toBeFocused();
        await expect(page.locator('[data-part=control]')).toHaveCSS('outline-style', 'solid');
        await page.keyboard.press('Space');
        await expect(toggle).toBeChecked();
    });
});

test.describe('RadioGroup', () => {
    test('focuses the selected radio and moves with the arrow keys, skipping disabled ones', async ({ page }) => {
        await openStory(page, 'forms-radiogroup--playground');
        await page.keyboard.press('Tab');
        await expect(page.getByRole('radio', { name: 'Mid-sized' })).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('radio', { name: 'Enterprise' })).toBeChecked();
        await page.keyboard.press('ArrowRight');
        // "Public sector" is disabled – the selection wraps to the first radio
        await expect(page.getByRole('radio', { name: 'Startup' })).toBeChecked();
        await expect(page.getByRole('radio', { name: 'Startup' })).toBeFocused();
    });
});

test.describe('ChipGroup', () => {
    test('is one tab stop, arrow keys move between chips, Space toggles', async ({ page }) => {
        await openStory(page, 'forms-chipgroup--playground');
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: 'Software & Web' })).toBeFocused();
        await page.keyboard.press('ArrowRight');
        const ai = page.getByRole('button', { name: 'AI & LLM' });
        await expect(ai).toBeFocused();
        await expect(ai).toHaveAttribute('aria-pressed', 'false');
        await page.keyboard.press('Space');
        await expect(ai).toHaveAttribute('aria-pressed', 'true');
        // Tab leaves the group instead of walking through every chip
        await page.keyboard.press('Tab');
        await expect(page.getByRole('group', { name: 'Services' }).locator(':focus')).toHaveCount(0);
    });
});

test.describe('SegmentedControl', () => {
    test('focuses the selected segment and selects with the arrow keys', async ({ page }) => {
        await openStory(page, 'buttons-segmentedcontrol--playground');
        await page.keyboard.press('Tab');
        await expect(page.getByRole('radio', { name: 'List' })).toBeFocused();
        await expect(page.locator('[data-part=item][data-state=checked]')).toHaveCSS('outline-style', 'solid');
        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('radio', { name: 'Grid' })).toBeChecked();
        await expect(page.getByRole('radiogroup', { name: 'View' })).toBeVisible();
    });
});

test.describe('Select', () => {
    test('opens with the search field focused, filters accent-blind and takes the first match with Enter', async ({
        page,
    }) => {
        await openStory(page, 'forms-select--with-search');
        const trigger = page.getByRole('combobox', { name: 'Service' });
        await page.keyboard.press('Tab');
        await expect(trigger).toBeFocused();
        await page.keyboard.press('Enter');
        const search = page.getByRole('combobox', { name: 'Filter options' });
        await expect(search).toBeFocused();
        // Space is typed into the field (not taken as "choose")
        await page.keyboard.type('nu rn');
        await expect(search).toHaveValue('nu rn');
        await expect(page.getByText('No results')).toBeVisible();
        // Accent-blind: "nü" finds "Nuremberg"
        await search.fill('nü');
        await expect(page.getByRole('option')).toHaveText(['Nuremberg']);
        await expect(page.getByRole('option', { name: 'Nuremberg' })).toHaveAttribute('data-highlighted', '');
        await page.keyboard.press('Enter');
        await expect(trigger).toHaveText('Nuremberg');
        await expect(trigger).toBeFocused();
        // Opened again, the search starts empty
        await page.keyboard.press('Enter');
        await expect(search).toHaveValue('');
        await expect(page.getByRole('group', { name: 'Data centers' })).toBeVisible();
    });

    test('loads the next page from the "server" when the list is scrolled to its end', async ({ page }) => {
        await openStory(page, 'forms-select--server-data');
        await page.getByRole('combobox', { name: 'Customer' }).click();
        const listbox = page.getByRole('listbox');
        await expect(listbox.getByRole('option')).toHaveCount(20);
        await listbox.getByRole('option', { name: 'Customer 020' }).scrollIntoViewIfNeeded();
        await expect(listbox.getByRole('option')).toHaveCount(40);
        // Server-side search: the text goes to the server, the result replaces the items
        await page.getByRole('combobox', { name: 'Filter options' }).fill('Customer 12');
        await expect(listbox.getByRole('option', { name: 'Customer 120' })).toBeVisible();
        await expect(listbox.getByRole('option')).toHaveCount(10);
    });

    test('clears with Backspace on the field', async ({ page }) => {
        await openStory(page, 'forms-select--clearable');
        const trigger = page.getByRole('combobox', { name: 'Service' });
        await expect(trigger).toHaveText('Hosting');
        await page.keyboard.press('Tab');
        await expect(trigger).toBeFocused();
        // The clear button is no tab stop
        await expect(page.getByRole('button', { name: 'Clear selection' })).toHaveAttribute('tabindex', '-1');
        await page.keyboard.press('Backspace');
        await expect(trigger).toHaveText('Select');
    });
});

test.describe('MultiSelect chips', () => {
    test('Backspace removes the last chip, the remove buttons are named', async ({ page }) => {
        await openStory(page, 'forms-multiselect--chips');
        const trigger = page.getByRole('combobox', { name: 'Services' });
        await page.keyboard.press('Tab');
        await expect(trigger).toBeFocused();
        await page.keyboard.press('Backspace');
        await expect(page.getByText('Selection: web')).toBeVisible();
        await expect(page.getByRole('status')).toHaveText('Cloud & DevOps removed');
        await page.getByRole('button', { name: 'Remove Software & Web' }).click();
        await expect(page.getByText('Selection: –')).toBeVisible();
    });

    test('"select all" and the maximum work with the keyboard', async ({ page }) => {
        await openStory(page, 'forms-multiselect--select-all');
        await page.getByRole('combobox', { name: 'Services' }).focus();
        await page.keyboard.press('Enter');
        // The list has the focus; Shift+Tab reaches "select all"
        await page.keyboard.press('Shift+Tab');
        const all = page.getByRole('checkbox', { name: 'Select all' });
        await expect(all).toBeFocused();
        await page.keyboard.press('Space');
        await expect(all).toHaveAttribute('aria-checked', 'mixed');
        await expect(page.getByRole('status')).toHaveText('At most 3 can be selected');
        await expect(page.getByRole('option', { name: 'Frankfurt' })).toHaveAttribute('aria-disabled', 'true');
    });
});

test.describe('TagsInput suggestions', () => {
    test('arrow keys pick a suggestion, Enter adds it, free text still works', async ({ page }) => {
        await openStory(page, 'forms-tagsinput--suggestions');
        const input = page.getByRole('combobox', { name: 'Technologies' });
        await input.pressSequentially('do');
        await expect(page.getByRole('option')).toHaveText(['docker']);
        await page.keyboard.press('ArrowDown');
        await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
        await page.keyboard.press('Enter');
        await expect(page.getByText('Value: linux, docker')).toBeVisible();
        await input.pressSequentially('terraform');
        await page.keyboard.press('Enter');
        await expect(page.getByText('Value: linux, docker, terraform')).toBeVisible();
    });
});

test.describe('Select with a data source', () => {
    test('the preselected value gets its label by key; the search asks the server', async ({ page }) => {
        await openStory(page, 'forms-select--with-data-source');
        const trigger = page.getByRole('combobox', { name: 'Customer' });
        await expect(trigger).toContainText('Customer 250');
        await trigger.click();
        await expect(page.getByRole('option', { name: 'Customer 001' })).toBeVisible();
        await page.getByRole('combobox', { name: 'Filter options' }).fill('499');
        await expect(page.getByRole('option')).toHaveCount(1);
        await page.getByRole('option', { name: 'Customer 499' }).click();
        await expect(page.getByText('Value: 499')).toBeVisible();
    });
});
