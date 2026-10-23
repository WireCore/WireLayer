import { expect, test, type Page } from '@playwright/test';
import { nextFrame, openStory } from './story.ts';

// The extended DataTable in the browser: filter menu, column menu and drag and drop, rows by keyboard,
// context menu, row editing, virtual scrolling with frozen rows, full screen and row height

const headers = (page: Page) =>
    page
        .getByRole('table')
        .getByRole('columnheader')
        .evaluateAll((cells) => cells.map((cell) => cell.textContent?.trim()).filter(Boolean));
const firstNames = (page: Page) =>
    page
        .getByRole('table')
        .locator('tbody tr[data-row-id]')
        .evaluateAll((rows) => rows.map((row) => (row as HTMLElement).dataset.rowId));

test.describe('DataTable filter menu', () => {
    test('a condition with a match mode filters; Escape closes the menu and returns the focus', async ({ page }) => {
        await openStory(page, 'data-datatable--filter-menu');
        const trigger = page.getByRole('button', { name: 'Filter for Cores' });
        await trigger.click();
        const menu = page.getByRole('dialog', { name: 'Filter for Cores' });
        await expect(menu).toBeVisible();
        await menu.getByRole('combobox', { name: 'Condition 1' }).click();
        await page.getByRole('option', { name: 'Greater than', exact: true }).click();
        // The condition list returns the focus to its field with a delay – wait for it, or it takes the focus back
        // from the value field and gets the Enter
        await expect(page.getByRole('listbox')).toBeHidden();
        await expect(menu.getByRole('combobox', { name: 'Condition 1' })).toBeFocused();
        const value = menu.getByRole('spinbutton', { name: 'Value 1' });
        await value.fill('8');
        await expect(value).toHaveValue('8');
        await value.press('Enter');
        await expect(menu).toBeHidden();
        await expect(page.getByRole('button', { name: 'Filter for Cores, active' })).toBeFocused();
        await expect(page.getByText('10 entries')).toBeAttached();
        const cores = await page.getByRole('table').locator('tbody tr[data-row-id] td:nth-child(4)').allTextContents();
        expect(cores.every((value) => value.trim() === '16')).toBe(true);

        await page.getByRole('button', { name: 'Filter for Cores, active' }).click();
        await expect(menu).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(menu).toBeHidden();
        await expect(page.getByRole('button', { name: 'Filter for Cores, active' })).toBeFocused();
    });

    test('Shift+click sorts by a second column and shows its level', async ({ page }) => {
        await openStory(page, 'data-datatable--filter-menu');
        const cores = page.getByRole('columnheader', { name: /Cores/ });
        await cores.getByRole('button', { name: /^Cores/ }).click({ modifiers: ['Shift'] });
        await expect(cores.getByRole('button', { name: /^Cores/ })).toContainText('2');
        await expect(page.getByRole('columnheader', { name: /Location/ })).toHaveAttribute('aria-sort', 'ascending');
    });
});

test.describe('DataTable columns', () => {
    test('the column menu moves a column with the keyboard and keeps the focus', async ({ page }) => {
        await openStory(page, 'data-datatable--filter-menu');
        const trigger = page.getByRole('button', { name: 'Options for Name' });
        await trigger.focus();
        await page.keyboard.press('Enter');
        const later = page.getByRole('menuitem', { name: 'Move one column forward' });
        await expect(later).toBeVisible();
        // Down through the menu to "Move one column forward"
        for (let step = 0; step < 10 && (await later.getAttribute('data-highlighted')) === null; step++) {
            await page.keyboard.press('ArrowDown');
            await nextFrame(page);
        }
        await page.keyboard.press('Enter');
        await expect
            .poll(() => headers(page))
            .toEqual([
                expect.stringContaining('Location'),
                expect.stringContaining('Name'),
                expect.stringContaining('System'),
                expect.stringContaining('Cores'),
                expect.stringContaining('Load'),
                expect.stringContaining('In service since'),
                expect.stringContaining('Online'),
            ]);
        await expect(page.getByRole('button', { name: 'Options for Name' })).toBeFocused();
    });

    test('drag and drop moves a column header', async ({ page }) => {
        await openStory(page, 'data-datatable--filter-menu');
        await page
            .getByRole('columnheader', { name: /^Cores/ })
            .dragTo(page.getByRole('columnheader', { name: /^Name/ }), { targetPosition: { x: 4, y: 10 } });
        await expect.poll(async () => (await headers(page))[0]).toContain('Cores');
    });
});

test.describe('DataTable rows', () => {
    test('arrow keys on the handle move a row; the focus stays on it', async ({ page }) => {
        await openStory(page, 'data-datatable--rows');
        await page.getByRole('button', { name: 'Move vm-0001' }).focus();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await expect
            .poll(() => firstNames(page))
            .toEqual(['vm-0002', 'vm-0003', 'vm-0001', 'vm-0004', 'vm-0005', 'vm-0006']);
        await expect(page.getByRole('button', { name: 'Move vm-0001' })).toBeFocused();
        await expect(page.getByRole('status').first()).toHaveText('vm-0001 is now at position 3 of 6');
    });

    test('the row actions open from the menu button and with Shift+F10', async ({ page }) => {
        await openStory(page, 'data-datatable--rows');
        await page.getByRole('button', { name: 'Actions for vm-0003' }).click();
        await page.getByRole('menuitem', { name: 'Create snapshot' }).click();
        await expect(page.getByText('Action: snapshot: vm-0003')).toBeVisible();
        await expect(page.getByRole('menu')).toBeHidden();
        await page.getByRole('button', { name: 'Move vm-0004' }).focus();
        await page.keyboard.press('Shift+F10');
        const restart = page
            .getByRole('menu', { name: 'Actions for vm-0004' })
            .getByRole('menuitem', { name: 'Restart' });
        await expect(restart).toBeVisible();
        await restart.click();
        await expect(page.getByText('Action: restart: vm-0004')).toBeVisible();
    });

    test('details open below the row', async ({ page }) => {
        await openStory(page, 'data-datatable--rows');
        const toggle = page.getByRole('button', { name: 'Details of vm-0002' });
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        const details = page.locator(`#${await toggle.getAttribute('aria-controls')}`);
        await expect(details).toContainText('Alpine 3.22');
    });
});

test.describe('DataTable row editing', () => {
    test('saves a row, an invalid value keeps it in editing', async ({ page }) => {
        await openStory(page, 'data-datatable--row-editing');
        await page.getByRole('button', { name: 'Edit vm-0001' }).click();
        const cores = page.getByRole('spinbutton', { name: 'Cores' });
        await expect(page.getByRole('textbox', { name: 'Name' })).toBeFocused();
        await cores.fill('0');
        await page.getByRole('button', { name: 'Save vm-0001' }).click();
        await expect(page.getByRole('alert')).toHaveText('At least 1 core');
        await cores.fill('12');
        await page.getByRole('button', { name: 'Save vm-0001' }).click();
        await expect(page.getByRole('button', { name: 'Edit vm-0001' })).toBeFocused();
        await expect(page.getByRole('row', { name: /vm-0001/ })).toContainText('12');
    });
});

test.describe('DataTable large', () => {
    test('renders only the visible rows, keeps the frozen row and loads more at the end', async ({ page }) => {
        await openStory(page, 'data-datatable--large');
        const rows = page.getByRole('table').locator('tbody tr[data-row-id]');
        expect(await rows.count()).toBeLessThan(40);
        const scroller = page.locator('[style*="max-height: 420px"]');
        await scroller.evaluate((element) => (element.scrollTop = 30_000));
        await expect(page.getByRole('row', { name: /vm-0730/ })).toBeVisible();
        // The frozen first row stays below the header
        await expect(page.getByRole('row', { name: /vm-0001/ }).first()).toBeInViewport();
        await scroller.evaluate((element) => (element.scrollTop = element.scrollHeight));
        await expect(page.getByText('3000 rows loaded')).toBeVisible();
    });

    test('row height menu and full screen (Escape leaves it)', async ({ page }) => {
        await openStory(page, 'data-datatable--large');
        const row = page.getByRole('row', { name: /vm-0002/ });
        const normal = (await row.boundingBox())!.height;
        await page.getByRole('button', { name: 'Row height' }).click();
        await page.getByRole('menuitemradio', { name: 'Compact' }).click();
        await expect.poll(async () => (await row.boundingBox())!.height).toBeLessThan(normal);

        await page.getByRole('button', { name: 'Full screen' }).click();
        const dialog = page.getByRole('dialog', { name: 'All machines' });
        await expect(dialog).toBeVisible();
        await expect(page.getByRole('button', { name: 'Exit full screen' })).toBeFocused();
        const viewport = page.viewportSize()!;
        const box = (await dialog.boundingBox())!;
        expect(box.width).toBe(viewport.width);
        // Everything else is inert: Tab stays inside the table
        for (let step = 0; step < 6; step++) await page.keyboard.press('Tab');
        expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
        await page.getByRole('button', { name: 'Exit full screen' }).focus();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(page.getByRole('button', { name: 'Full screen' })).toBeFocused();
    });
});

test.describe('DataTable as a grid (navigation="grid")', () => {
    const focusedRow = (page: Page) => page.locator('tr:has(> :is(td, th):focus)');

    test('one Tab stop; arrow keys, Home/End and Ctrl+Home/End move through virtual rows and pinned columns', async ({
        page,
    }) => {
        await openStory(page, 'data-datatable--keyboard');
        const grid = page.getByRole('grid', { name: 'Machines' });
        await page.keyboard.press('Tab');
        const corner = grid.locator('thead th').first();
        await expect(corner).toBeFocused();
        // Down into the frozen row, right to the name
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(':focus')).toContainText('vm-0001');
        await page.keyboard.press('ArrowDown');
        await expect(focusedRow(page)).toHaveAttribute('data-row-id', 'vm-0002');
        await page.keyboard.press('PageDown');
        await expect(focusedRow(page)).not.toHaveAttribute('data-row-id', 'vm-0002');
        // The last row of 2,000 – rendered by scrolling there
        await page.keyboard.press('Control+End');
        await expect(focusedRow(page)).toHaveAttribute('data-row-id', 'vm-2000');
        await expect(page.locator(':focus')).toContainText('Yes');
        await expect(page.locator(':focus')).toBeInViewport();
        // Back to the start of the row: the pinned name column stays visible while the rest scrolls sideways
        await page.keyboard.press('Home');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(':focus')).toContainText('vm-2000');
        await expect(page.locator(':focus')).toBeInViewport();
        await page.keyboard.press('Control+Home');
        await expect(corner).toBeFocused();
        // Only one cell is a Tab stop
        expect(await grid.locator('[tabindex="0"]').count()).toBe(1);
        await page.keyboard.press('Tab');
        expect(await grid.evaluate((element) => element.contains(document.activeElement))).toBe(false);
    });

    test('Enter edits a cell, Escape returns to it, Space selects the row', async ({ page }) => {
        await openStory(page, 'data-datatable--keyboard');
        await page.keyboard.press('Tab');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        const cell = page.locator(':focus');
        await expect(cell).toContainText('vm-0002');
        await page.keyboard.press('Enter');
        const input = page.getByRole('textbox', { name: 'Name', exact: true });
        await expect(input).toBeFocused();
        await input.fill('vm-0002-new');
        await page.keyboard.press('Enter');
        await expect(page.locator('td:focus')).toContainText('vm-0002-new');
        await page.keyboard.press('F2');
        await expect(input).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(page.locator('td:focus')).toContainText('vm-0002-new');
        await page.keyboard.press(' ');
        await expect(focusedRow(page)).toHaveAttribute('aria-selected', 'true');
        await expect(page.getByText('1 selected')).toBeVisible();
    });

    test('with groups: Enter on a group row opens and closes it', async ({ page }) => {
        await openStory(page, 'data-datatable--keyboard-grouped');
        await page.keyboard.press('Tab');
        await page.keyboard.press('ArrowDown');
        const toggle = page.locator(':focus button[aria-expanded]');
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await page.keyboard.press('Enter');
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(page.locator('td:focus')).toBeVisible();
        await page.keyboard.press('ArrowDown');
        await expect(page.locator(':focus')).toContainText('Nuremberg');
    });
});

test.describe('DataTable rows as links', () => {
    test('Ctrl+click on the link opens a new tab, a click on the row follows the link', async ({ page }) => {
        await openStory(page, 'data-datatable--row-links');
        const link = page.getByRole('link', { name: 'vm-0002' });
        await expect(link).toHaveAttribute('href', '#/machines/vm-0002');
        const [tab] = await Promise.all([
            page.context().waitForEvent('page'),
            link.click({ modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control'] }),
        ]);
        await expect.poll(() => tab.url()).toContain('#/machines/vm-0002');
        await tab.close();
        expect(page.url()).not.toContain('#/machines');
        await page
            .getByRole('row', { name: /vm-0003/ })
            .getByRole('cell')
            .nth(1)
            .click();
        await expect(page.getByText('Last opened: #/machines/vm-0003')).toBeVisible();
        await expect.poll(() => page.url()).toContain('#/machines/vm-0003');
    });
});

test.describe('DataTable virtual widths', () => {
    test('a double click on the resize handle fits the values of rows that are not rendered', async ({ page }) => {
        await openStory(page, 'data-datatable--virtual-width');
        const header = page.getByRole('columnheader', { name: /^Name/ });
        const before = (await header.boundingBox())!.width;
        await expect(page.getByText('vm-0500-reserve-datacenter-frankfurt')).toHaveCount(0);
        await page.getByRole('separator', { name: 'Width of Name' }).dblclick();
        await expect.poll(async () => (await header.boundingBox())!.width).toBeGreaterThan(before + 60);
        // Scrolled to the end, the long name fits on one line
        await page.getByRole('separator', { name: 'Width of Name' }).focus();
        const cell = page.getByRole('cell', { name: 'vm-0500-reserve-datacenter-frankfurt' });
        await page
            .getByRole('table', { name: 'Machines' })
            .evaluate((table) => table.parentElement!.scrollTo({ top: 1e6 }));
        await expect(cell).toBeVisible();
        expect(await cell.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    });
});
