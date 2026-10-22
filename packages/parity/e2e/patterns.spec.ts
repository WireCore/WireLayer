import { expect, test } from '@playwright/test';
import { openStory } from './story.ts';

// Keyboard in the browser: landmarks with F6, shortcuts and their dialog, inline editing, the condition builder and
// the popover of an overflow list – against the Vue and the React Storybook

test.describe('LandmarkNavigation', () => {
    test('F6 moves through header, search, navigation, main area and aside; Shift+F6 goes back', async ({ page }) => {
        await openStory(page, 'utilities-landmarknavigation--playground');
        await page.keyboard.press('F6');
        await expect(page.getByRole('banner')).toBeFocused();
        await page.keyboard.press('F6');
        await expect(page.getByRole('search', { name: 'Search' })).toBeFocused();
        await page.keyboard.press('F6');
        await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeFocused();
        await page.keyboard.press('F6');
        await expect(page.getByRole('main')).toBeFocused();
        // Tab continues inside the landmark
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: 'Save' })).toBeFocused();
        await page.keyboard.press('F6');
        await expect(page.getByRole('complementary')).toBeFocused();
        await page.keyboard.press('F6');
        await expect(page.getByRole('banner')).toBeFocused();
        await page.keyboard.press('Shift+F6');
        await expect(page.getByRole('complementary')).toBeFocused();
    });

    test('the skip links come first and jump', async ({ page }) => {
        await openStory(page, 'utilities-landmarknavigation--playground');
        await page.keyboard.press('Tab');
        await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
        await page.keyboard.press('Tab');
        const search = page.getByRole('link', { name: 'Skip to search' });
        await expect(search).toBeFocused();
        await expect(search).toBeVisible();
    });
});

test.describe('Hotkeys', () => {
    test('shortcuts and sequences run; plain keys type inside a field; "?" opens the overview', async ({ page }) => {
        await openStory(page, 'utilities-hotkeysdialog--playground');
        const log = page.getByText(/^Last:/);
        await page.keyboard.press('Control+s');
        await expect(log).toHaveText('Last: Saved');
        await page.keyboard.press('g');
        await page.keyboard.press('i');
        await expect(log).toHaveText('Last: Go to inbox');

        const note = page.getByRole('textbox', { name: 'Note' });
        await note.click();
        await page.keyboard.type('gd?');
        await expect(note).toHaveValue('gd?');
        await expect(log).toHaveText('Last: Go to inbox');
        await expect(page.getByRole('dialog')).toHaveCount(0);

        await note.blur();
        await page.keyboard.press('?');
        const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('heading', { name: 'Document' })).toBeVisible();
        const save = dialog.locator('div', { has: page.getByText('Save', { exact: true }) }).last();
        await expect(save.locator('kbd kbd')).toHaveText(['Ctrl', 'S']);
        await expect(dialog.getByText('Go to inbox')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
    });
});

test.describe('InlineEdit', () => {
    test('Enter edits and saves, Escape cancels; the focus returns to the text', async ({ page }) => {
        await openStory(page, 'forms-inlineedit--playground');
        const display = page.getByRole('button', { name: /Edit Project name/ });
        await display.focus();
        await page.keyboard.press('Enter');
        const input = page.getByRole('textbox', { name: 'Project name' });
        await expect(input).toBeFocused();
        await expect(input).toHaveValue('Customer portal');
        await input.fill('Customer portal 2');
        await page.keyboard.press('Enter');
        await expect(page.getByText('Saved: Customer portal 2')).toBeVisible();
        await expect(page.getByRole('button', { name: /^Customer portal 2 Edit Project name$/ })).toBeFocused();

        await page.keyboard.press('Enter');
        await expect(input).toBeFocused();
        await input.fill('Discarded');
        await page.keyboard.press('Escape');
        await expect(page.getByRole('button', { name: /^Customer portal 2 Edit Project name$/ })).toBeFocused();
        await expect(page.getByText('Saved: Customer portal 2')).toBeVisible();
    });

    test('popover mode: the editor opens next to the value, Escape returns to it', async ({ page }) => {
        await openStory(page, 'forms-inlineedit--popover');
        const display = page.getByRole('button', { name: /Edit Owner/ });
        await display.focus();
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', { name: 'Edit Owner' });
        await expect(dialog).toBeVisible();
        const input = dialog.getByRole('textbox', { name: 'Owner' });
        await expect(input).toBeFocused();
        await input.fill('Ben Ott');
        await page.keyboard.press('Enter');
        await expect(dialog).toBeHidden();
        await expect(page.getByRole('button', { name: /^Ben Ott Edit Owner$/ })).toBeFocused();
    });
});

test.describe('ConditionBuilder', () => {
    test('a rule is added, filled and removed with the keyboard; the focus moves along', async ({ page }) => {
        await openStory(page, 'blocks-conditionbuilder--playground');
        const add = page.getByRole('button', { name: 'Add condition' }).first();
        await add.focus();
        await page.keyboard.press('Enter');
        const rule = page.getByRole('group', { name: 'Condition 3' });
        await expect(rule.getByRole('combobox', { name: 'Field' })).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(rule.getByRole('combobox', { name: 'Operator' })).toBeFocused();
        await page.keyboard.press('Tab');
        const value = rule.getByRole('textbox', { name: 'Value' });
        await expect(value).toBeFocused();
        await page.keyboard.type('web');
        await expect(page.getByText(/"value": "web"/)).toBeAttached();
        await page.keyboard.press('Tab');
        await expect(rule.getByRole('button', { name: 'Remove condition 3' })).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(rule).toHaveCount(0);
        await expect(add).toBeFocused();
    });

    test('as the editor of the DataTable advanced filter: the toolbar button opens it, changes filter the rows', async ({
        page,
    }) => {
        await openStory(page, 'blocks-conditionbuilder--in-data-table');
        const table = page.getByRole('table', { name: 'Machines' });
        await expect(table.getByRole('row', { name: /vm-0002/ })).toHaveCount(0);
        const toggle = page.getByRole('button', { name: 'Advanced filter' });
        await toggle.focus();
        await page.keyboard.press('Enter');
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        const builder = page.getByRole('group', { name: 'Advanced filter' });
        await builder.getByRole('button', { name: 'Remove condition 1' }).click();
        // vm-0002 has a load of 37%
        await expect(table.getByRole('row', { name: /vm-0002/ })).toHaveCount(1);
    });
});

test.describe('OverflowList', () => {
    test('"+N" opens a popover with the hidden items; Escape returns to the button', async ({ page }) => {
        await openStory(page, 'data-overflowlist--max-visible');
        const more = page.getByRole('button', { name: '+6 more' });
        await more.focus();
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', { name: 'More items' });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('listitem')).toHaveText([
            'Next.js',
            'Tailwind',
            'TypeScript',
            'Docker',
            'Kubernetes',
            'PostgreSQL',
        ]);
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(more).toBeFocused();
    });
});

// In narrow cards the price used to sit on top of the title ("Enterprise" / "on request")
test.describe('Selection cards', () => {
    for (const id of ['forms-radiocard--playground', 'forms-checkboxcard--grid'])
        test(`${id}: title and price never overlap`, async ({ page }) => {
            await page.setViewportSize({ width: 900, height: 600 });
            await openStory(page, id);
            const pairs = await page.evaluate(() =>
                [...document.querySelectorAll('[id$="price"]')].map((price) => {
                    const title = price.parentElement!.firstElementChild!;
                    const a = title.getBoundingClientRect();
                    const b = price.getBoundingClientRect();
                    return { title: title.textContent, apart: a.right <= b.left + 1 || a.bottom <= b.top + 1 };
                })
            );
            expect(pairs.length).toBeGreaterThan(1);
            for (const pair of pairs) expect(pair.apart, `${pair.title}`).toBe(true);
        });
});
