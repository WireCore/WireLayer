import { expect, test, type Page } from '@playwright/test';
import { openStory } from './story.ts';

// DataTable like a spreadsheet: ranges, the clipboard, collected changes with undo, rows between groups, find

const grid = (page: Page) => page.getByRole('grid', { name: 'Machines' });
const row = (page: Page, name: string) => grid(page).getByRole('row', { name: new RegExp(name) });

test.describe('DataTable spreadsheet', () => {
    test.beforeEach(async ({ context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    });

    test('marks a range with Shift+click and Shift+arrow keys, copies it with Ctrl+C', async ({ page }) => {
        await openStory(page, 'data-datatable--spreadsheet');
        await row(page, 'vm-0001').getByRole('gridcell').first().click();
        await row(page, 'vm-0002')
            .getByRole('gridcell', { name: /Load|%/ })
            .first()
            .click({ modifiers: ['Shift'] });
        await expect(page.getByText('Marked: 8 cells (vm-0001 to vm-0002)')).toBeVisible();
        await page.keyboard.press('Shift+ArrowDown');
        await expect(page.getByText('Marked: 12 cells (vm-0001 to vm-0003)')).toBeVisible();
        await expect(grid(page).locator('td[aria-selected="true"]')).toHaveCount(12);
        await page.keyboard.press('ControlOrMeta+c');
        const copied = await page.evaluate(() => navigator.clipboard.readText());
        expect(copied.split('\r\n')).toHaveLength(3);
        expect(copied.split('\r\n')[0]!.split('\t')).toEqual(['vm-0001', 'Frankfurt', '2', '0%']);
        await expect(page.getByRole('status').first()).toHaveText('12 cells copied');
    });

    test('pastes from Excel into editable cells, checks them and undoes it with Ctrl+Z', async ({ page }) => {
        await openStory(page, 'data-datatable--spreadsheet');
        // To the cores of vm-0001 with the keyboard (a click would start editing)
        await row(page, 'vm-0001').getByRole('gridcell').first().click();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.evaluate(() => navigator.clipboard.writeText('16\n500\n32'));
        await page.keyboard.press('ControlOrMeta+v');
        await expect(row(page, 'vm-0001').getByRole('button', { name: '16, edit Cores' })).toBeVisible();
        await expect(row(page, 'vm-0003').getByRole('button', { name: '32, edit Cores' })).toBeVisible();
        // 500 is too many: the cell keeps its value, the story lists the problem
        await expect(row(page, 'vm-0002').getByRole('button', { name: '4, edit Cores' })).toBeVisible();
        await expect(page.getByText('vm-0002, cores: Between 1 and 128')).toBeVisible();
        await page.keyboard.press('ControlOrMeta+z');
        await expect(row(page, 'vm-0001').getByRole('button', { name: '2, edit Cores' })).toBeVisible();
        await expect(row(page, 'vm-0003').getByRole('button', { name: '8, edit Cores' })).toBeVisible();
        await page.keyboard.press('ControlOrMeta+y');
        await expect(row(page, 'vm-0001').getByRole('button', { name: '16, edit Cores' })).toBeVisible();
    });

    test('collects changes until saved or discarded, with undo', async ({ page }) => {
        await openStory(page, 'data-datatable--batch');
        await expect(page.getByText('0 changes')).toBeVisible();
        await row(page, 'vm-0001').getByRole('button', { name: '2, edit Cores' }).click();
        await page.getByRole('spinbutton', { name: 'Cores' }).fill('64');
        await page.keyboard.press('Enter');
        const changed = row(page, 'vm-0001').getByRole('button', { name: '64, edit Cores, changed' });
        await expect(changed).toBeVisible();
        await expect(page.getByText('1 change', { exact: true })).toBeVisible();
        await page.keyboard.press('ControlOrMeta+z');
        await expect(row(page, 'vm-0001').getByRole('button', { name: '2, edit Cores' })).toBeVisible();
        await page.getByRole('button', { name: 'Redo' }).click();
        await expect(changed).toBeVisible();
        await page.getByRole('button', { name: 'Save' }).click();
        await expect(page.getByText('Saved: vm-0001')).toBeVisible();
        await expect(row(page, 'vm-0001').getByRole('button', { name: '64, edit Cores' })).toBeVisible();
        await expect(page.getByText('0 changes')).toBeVisible();

        await row(page, 'vm-0002').getByRole('button', { name: '4, edit Cores' }).click();
        await page.getByRole('spinbutton', { name: 'Cores' }).fill('8');
        await page.keyboard.press('Enter');
        await expect(page.getByText('1 change', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Discard' }).click();
        await expect(row(page, 'vm-0002').getByRole('button', { name: '4, edit Cores' })).toBeVisible();
        await expect(page.getByText('Saved: vm-0001')).toBeVisible();
    });
});

test.describe('DataTable rows between groups', () => {
    test('the arrow keys on the handle move a row into the next group, announced', async ({ page }) => {
        await openStory(page, 'data-datatable--move-rows');
        const table = page.getByRole('table', { name: 'Machines by location' });
        const handle = table.getByRole('button', { name: 'Move vm-0005' });
        await handle.focus();
        await page.keyboard.press('ArrowDown');
        await expect(table.getByRole('button', { name: 'Location: Nuremberg, 3 entries' })).toBeVisible();
        await expect(table.getByRole('button', { name: 'Location: Frankfurt, 1 entries' })).toBeVisible();
        await expect(table.getByRole('button', { name: 'Move vm-0005' })).toBeFocused();
        await expect(page.getByRole('status').first()).toHaveText(
            'vm-0005 is now in Location: Nuremberg, position 1 of 3'
        );
        await page.keyboard.press('ArrowUp');
        await expect(table.getByRole('button', { name: 'Location: Frankfurt, 2 entries' })).toBeVisible();
    });

    test('a tree row moves into the row above and out again', async ({ page }) => {
        await openStory(page, 'data-datatable--move-rows');
        const tree = page.getByRole('table', { name: 'Files' });
        await tree.getByRole('button', { name: 'Move Notes.txt' }).focus();
        await page.keyboard.press('ArrowRight');
        const status = page.getByRole('status').filter({ hasText: 'Notes.txt moved' });
        await expect(status).toHaveText('Notes.txt moved into Projects, position 3 of 3');
        await expect(tree.getByRole('button', { name: 'Move Notes.txt' })).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(status).toHaveText('Notes.txt moved, position 2 of 2');
    });
});

test.describe('DataTable find', () => {
    test('finds text in rows not rendered yet and marks the match', async ({ page }) => {
        await openStory(page, 'data-datatable--find');
        await page.getByRole('button', { name: 'Find in table' }).click();
        const field = page.getByRole('searchbox', { name: 'Find in table' });
        await expect(field).toBeFocused();
        await field.fill('vm-1999');
        await expect(page.getByText('Match 1 of 1')).toBeVisible();
        await expect(page.getByRole('table', { name: 'Machines' }).getByText('vm-1999')).toBeInViewport();
        await field.fill('Vienna');
        await expect(page.getByText('Match 1 of 500')).toBeVisible();
        await page.keyboard.press('Shift+Enter');
        await expect(page.getByText('Match 500 of 500')).toBeVisible();
        await expect(page.getByRole('row', { name: /vm-1999/ })).toBeInViewport();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('button', { name: 'Find in table' })).toBeFocused();
    });
});
